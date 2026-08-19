"""
Vercel Serverless Function: AI 기름 추천 API
POST /api/recommend
요청: { "dishName": "요리명" }
응답: { "recommendedOil", "reason", "improvedRecipe" }
"""

import json
import os
import re
import traceback
from http.server import BaseHTTPRequestHandler

import google.generativeai as genai

# 클라이언트에 보여줄 공통 에러 메시지
ERROR_MSG_GENERIC = "잠시 후 다시 시도해주세요"


class GeminiAPIError(Exception):
    """Gemini API 호출 실패 시 사용하는 커스텀 예외"""


def parse_gemini_json(text: str) -> dict:
    """Gemini 응답 텍스트에서 JSON을 추출·파싱합니다."""
    cleaned = text.strip()
    # 마크다운 코드 블록(```json ... ```)이 포함된 경우 제거
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def build_prompt(dish_name: str) -> str:
    """Gemini에게 보낼 프롬프트 — 반드시 JSON만 반환하도록 지시합니다."""
    return f"""당신은 한국 참기름·들기름 전문가입니다.
사용자가 만들 요리는 "{dish_name}"입니다.

이 요리에 더 어울리는 기름을 "참기름" 또는 "들기름" 중 하나로 추천하고,
추천 이유와 그 기름을 활용한 개선 레시피/팁을 작성해 주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 설명, 인사말, 마크다운은 절대 포함하지 마세요.
{{
  "recommendedOil": "참기름" 또는 "들기름" 중 정확히 하나,
  "reason": "왜 이 기름을 추천하는지 1~2문장으로 설명",
  "improvedRecipe": "그 기름을 활용해 요리를 더 맛있게 만드는 2~3단계 레시피/팁"
}}"""


def generate_recommendation(dish_name: str) -> dict:
    """Gemini API를 호출해 기름 추천 결과를 생성합니다."""
    api_key = os.environ.get("GEMINI_API_KEY")

    # [디버깅] 키가 실제로 읽히는지, 길이만 로그에 남깁니다 (키 값 자체는 노출 안 함)
    print(f"[DEBUG] GEMINI_API_KEY present: {bool(api_key)}, length: {len(api_key) if api_key else 0}")

    if not api_key:
        raise GeminiAPIError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )

    try:
        response = model.generate_content(build_prompt(dish_name))
    except Exception as exc:
        # [디버깅] 실제 예외 내용을 로그에 전부 남깁니다
        print(f"[DEBUG] Gemini API call failed: {type(exc).__name__}: {exc}")
        print(traceback.format_exc())
        raise GeminiAPIError(str(exc)) from exc

    if not response or not response.text:
        raise GeminiAPIError("Gemini API가 빈 응답을 반환했습니다.")

    parsed = parse_gemini_json(response.text)

    # 필수 필드 검증
    required_keys = ("recommendedOil", "reason", "improvedRecipe")
    for key in required_keys:
        if key not in parsed or not str(parsed[key]).strip():
            raise ValueError(f"응답에 '{key}' 필드가 없거나 비어 있습니다.")

    recommended_oil = str(parsed["recommendedOil"]).strip()
    if recommended_oil not in ("참기름", "들기름"):
        raise ValueError(f"recommendedOil 값이 올바르지 않습니다: {recommended_oil}")

    return {
        "recommendedOil": recommended_oil,
        "reason": str(parsed["reason"]).strip(),
        "improvedRecipe": str(parsed["improvedRecipe"]).strip(),
    }


class handler(BaseHTTPRequestHandler):
    """Vercel이 호출하는 HTTP 핸들러 클래스"""

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            body = json.loads(raw_body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
            self._send_json(400, {"error": "요리명을 입력해주세요 🙂"})
            return

        dish_name = (body.get("dishName") or "").strip()
        if not dish_name:
            self._send_json(400, {"error": "요리명을 입력해주세요 🙂"})
            return

        try:
            result = generate_recommendation(dish_name)
            self._send_json(200, result)
        except GeminiAPIError as exc:
            # [디버깅] 어떤 이유로 GeminiAPIError가 발생했는지 로그에 남깁니다
            print(f"[DEBUG] GeminiAPIError: {exc}")
            self._send_json(500, {"error": ERROR_MSG_GENERIC})
        except Exception as exc:
            # [디버깅] 예상 못한 오류도 전체 내용을 로그에 남깁니다
            print(f"[DEBUG] Unexpected error: {type(exc).__name__}: {exc}")
            print(traceback.format_exc())
            self._send_json(500, {"error": ERROR_MSG_GENERIC})

    def _send_json(self, status_code: int, data: dict):
        """JSON 응답을 클라이언트에 전송합니다."""
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
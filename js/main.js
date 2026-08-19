/**
 * 참기름들 사이트 메인 JavaScript
 * - 모바일 메뉴 열기/닫기
 * - 네비게이션 스크롤 & 활성 링크 표시
 * - AI 추천 폼 → /api/recommend API 연동
 * - 문의 폼 기본 처리
 */

// DOM이 완전히 로드된 후에 코드를 실행합니다
document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initSmoothNav();
  initScrollSpy();
  initAiForm();
  initContactForm();
});

/* ============================================
   모바일 햄버거 메뉴
   ============================================ */
function initMobileNav() {
  const toggleBtn = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");

  if (!toggleBtn || !nav) return;

  // 햄버거 버튼 클릭 시 메뉴 열기/닫기
  toggleBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggleBtn.classList.toggle("is-open", isOpen);
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    toggleBtn.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
  });

  // 메뉴 링크를 클릭하면 모바일에서 메뉴를 자동으로 닫습니다
  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggleBtn.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "메뉴 열기");
    });
  });
}

/* ============================================
   네비게이션: 섹션 링크 클릭 시 부드럽게 이동
   (html { scroll-behavior: smooth } 와 함께 동작)
   ============================================ */
function initSmoothNav() {
  document.querySelectorAll('.nav-link, a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");

      // href가 "#"만 있거나 외부 링크면 기본 동작 유지
      if (!targetId || targetId === "#" || !targetId.startsWith("#")) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ============================================
   스크롤 스파이: 현재 보이는 섹션에 맞게
   네비게이션 링크에 active 클래스를 붙입니다
   ============================================ */
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if (sections.length === 0 || navLinks.length === 0) return;

  // 스크롤할 때마다 어떤 섹션이 화면에 있는지 확인
  const onScroll = () => {
    let currentId = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        currentId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // 페이지 로드 시에도 한 번 실행
}

/* ============================================
   AI 추천 폼 — /api/recommend 백엔드 연동
   ============================================ */
function initAiForm() {
  const form = document.getElementById("aiForm");
  const resultBox = document.getElementById("aiResult");
  const placeholder = document.getElementById("aiPlaceholder");
  const submitBtn = form?.querySelector('button[type="submit"]');

  // 결과를 표시할 DOM 요소들
  const resultOil = document.getElementById("resultOil");
  const resultReason = document.getElementById("resultReason");
  const resultRecipe = document.getElementById("resultRecipe");

  if (!form || !resultBox || !placeholder) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // 페이지 새로고침 방지

    const dishName = document.getElementById("dishName").value.trim();
    if (!dishName) return;

    // 로딩 상태: 결과 영역 숨기고 로딩 메시지 표시
    resultBox.hidden = true;
    placeholder.hidden = false;
    placeholder.innerHTML = '<p class="ai-loading">참기름 궁합을 확인하고 있어요...</p>';

    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishName }),
      });

      const data = await response.json();

      // 서버가 에러 응답(400, 500 등)을 보낸 경우
      if (!response.ok) {
        placeholder.innerHTML = `<p class="ai-error">${data.error || "잠시 후 다시 시도해주세요"}</p>`;
        return;
      }

      // 정상 응답: API에서 받은 데이터를 화면에 표시
      resultOil.textContent = data.recommendedOil;
      resultReason.textContent = data.reason;
      resultRecipe.textContent = data.improvedRecipe;

      placeholder.hidden = true;
      resultBox.hidden = false;
    } catch {
      // fetch 자체 실패 (네트워크 오류 등)
      placeholder.innerHTML = '<p class="ai-error">잠시 후 다시 시도해주세요</p>';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ============================================
   문의 폼 기본 처리
   (구글 시트 연동 & 연락처 실시간 자동 하이픈)
   ============================================ */
function initContactForm() {
  const form = document.getElementById("contactForm");
  const phoneInput = document.getElementById("contactPhone");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) return;

  // 1. 입력창에 숫자를 적을 때 자동으로 하이픈(-)을 붙여줍니다.
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      // 숫자만 남기기
      const val = e.target.value.replace(/[^0-9]/g, "");
      let formatted = "";

      if (val.length < 4) {
        formatted = val;
      } else if (val.length < 7) {
        formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
      } else if (val.length < 11) {
        formatted = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`;
      } else {
        // 11자리(010-1234-5678) 형태
        formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
      }

      e.target.value = formatted;
    });
  }

  // 2. 폼 제출 처리
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const message = document.getElementById("contactMessage").value.trim();

    if (submitBtn) submitBtn.disabled = true;

    try {
      const scriptURL = "https://script.google.com/macros/s/AKfycbz7RiyrRWficB_Hv52Ka9W8KlaInM6RjO_SFL9k0XsyIa1Vj5g4BKlktn3XUrn8djvM/exec";

      await fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ name, phone, message }),
      });

      alert(`${name}님, 문의가 성공적으로 접수되었습니다!`);
      form.reset();
    } catch (error) {
      alert("전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
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
   (구글 스프레드시트 연동 완료)
   ============================================ */
function initContactForm() {
  const form = document.getElementById("contactForm");
  // 전송 버튼을 찾아 중복 클릭을 방지하기 위한 변수입니다.
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    // 데이터가 넘어가는 동안 버튼을 비활성화해서 여러 번 눌리는 것을 막습니다.
    if (submitBtn) submitBtn.disabled = true;

    try {
      // 알려주신 구글 Apps Script 웹 앱 URL입니다.
      const scriptURL = "https://script.google.com/macros/s/AKfycbz7RiyrRWficB_Hv52Ka9W8KlaInM6RjO_SFL9k0XsyIa1Vj5g4BKlktn3XUrn8djvM/exec";

      // fetch 함수를 이용해 서버로 데이터를 쏩니다.
      await fetch(scriptURL, {
        method: "POST",
        // 브라우저 보안 에러를 피하기 위해 내용물을 텍스트 형태로 보냅니다.S
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ name, phone, message }),
      });

      // 성공적으로 보내지면 안내 메시지를 띄우고 폼 칸을 비웁니다.
      alert(`${name}님, 문의가 성공적으로 접수되었습니다!`);
      form.reset();
    } catch (error) {
      alert("전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      // 처리가 끝나면 다시 버튼을 누를 수 있게 돌려놓습니다.
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
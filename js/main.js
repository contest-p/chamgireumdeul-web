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
   (서버 연동 전: 제출 시 확인 메시지만 표시)
   ============================================ */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    // 실제 서비스에서는 여기서 fetch()로 서버에 전송합니다
    alert(`${name}님, 문의가 접수되었습니다.\n연락처: ${phone}\n\n(현재는 프론트엔드 UI만 구현된 상태입니다.)`);

    form.reset();
  });
}

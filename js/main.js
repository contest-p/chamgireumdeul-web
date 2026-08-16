/**
 * 참기름들 사이트 메인 JavaScript
 * - 모바일 메뉴 열기/닫기
 * - 네비게이션 스크롤 & 활성 링크 표시
 * - AI 추천 폼 UI (API 연동 전 임시 동작)
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
   AI 추천 폼 (UI만 — API 연동은 추후)
   ============================================ */
function initAiForm() {
  const form = document.getElementById("aiForm");
  const resultBox = document.getElementById("aiResult");
  const placeholder = document.getElementById("aiPlaceholder");

  // 결과를 표시할 DOM 요소들
  const resultOil = document.getElementById("resultOil");
  const resultReason = document.getElementById("resultReason");
  const resultRecipe = document.getElementById("resultRecipe");

  if (!form || !resultBox || !placeholder) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // 페이지 새로고침 방지

    const dishName = document.getElementById("dishName").value.trim();
    if (!dishName) return;

    // ----- 아래는 API 연동 전 임시(목업) 데이터입니다 -----
    // 나중에 fetch() 등으로 서버 API를 호출하고
    // 응답 JSON을 아래 변수들에 넣으면 됩니다.

    const mockData = getMockRecommendation(dishName);

    // [API 연동 예정] 추천 기름 — response.recommendedOil
    resultOil.textContent = mockData.recommendedOil;

    // [API 연동 예정] 추천 이유 — response.reason
    resultReason.textContent = mockData.reason;

    // [API 연동 예정] 개선 레시피 — response.improvedRecipe
    resultRecipe.textContent = mockData.improvedRecipe;

    // 결과 영역을 보이고, 안내 문구는 숨깁니다
    placeholder.hidden = true;
    resultBox.hidden = false;
  });
}

/**
 * API 연동 전 UI 확인용 임시 추천 데이터
 * @param {string} dishName - 사용자가 입력한 요리명
 * @returns {{ recommendedOil: string, reason: string, improvedRecipe: string }}
 */
function getMockRecommendation(dishName) {
  return {
    recommendedOil: "저온압착 참기름",
    reason: `「${dishName}」은 고소한 향이 어울리는 요리입니다. 저온압착 참기름은 영양과 향을 살려 마무리에 뿌리기 좋습니다.`,
    improvedRecipe: `1. ${dishName}을(를) 평소대로 준비합니다.\n2. 완성 직전 저온압착 참기름 1~2스푼을 둘러 고소함을 더합니다.\n3. 참기름 향이 날아가지 않도록 불을 끈 뒤 첨가하세요.`,
  };
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

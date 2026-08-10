(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.getElementById("navbar");
  const onScroll = () => navbar.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  function closeMenu() {
    navLinks.classList.remove("is-open");
    document.body.style.overflow = "";
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    document.body.style.overflow = open ? "hidden" : "";
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Hero data-viz bar entrance ---------- */
  const barsWrap = document.getElementById("dataviz-bars");
  if (barsWrap) {
    if (reduceMotion) {
      barsWrap.classList.add("animate");
    } else {
      requestAnimationFrame(() => {
        setTimeout(() => barsWrap.classList.add("animate"), 250);
      });
    }
  }

  /* ---------- Subtle mouse-follow depth on hero portrait (desktop only) ---------- */
  const portraitCard = document.getElementById("portraitCard");
  if (portraitCard && !isTouch && !reduceMotion && window.innerWidth > 760) {
    const MAX_ROTATE = 3; // degrees
    const MAX_TRANSLATE = 4; // px
    let raf = null;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    const heroVisual = portraitCard.closest(".hero-visual");

    heroVisual.addEventListener("mousemove", (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = px;
      targetY = py;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    heroVisual.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    });

    function tick() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      const rotateY = currentX * MAX_ROTATE * 2;
      const rotateX = -currentY * MAX_ROTATE * 2;
      const translateX = currentX * MAX_TRANSLATE * 2;
      const translateY = currentY * MAX_TRANSLATE * 2;

      portraitCard.style.transform =
        `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px)`;

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }
  }

  /* ---------- Experience "View Details" toggles ---------- */
  document.querySelectorAll(".exp-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.dataset.toggle;
      const panel = document.getElementById(targetId);
      if (!panel) return;
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      const label = toggle.querySelector("span:first-child");
      if (label) label.textContent = isOpen ? "Hide Details" : "View Details";
    });
  });

  /* ---------- Project filters ---------- */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");

      const filter = button.dataset.filter;
      projectCards.forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---------- Project case-study toggles ---------- */
  document.querySelectorAll(".project-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.dataset.toggle;
      const panel = document.getElementById(targetId);
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });

  /* ---------- Experience → Project scroll + highlight ---------- */
  document.querySelectorAll(".exp-action").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTo;
      const target = document.getElementById(targetId);
      if (!target) return;

      // make sure the card is visible even if a project filter is currently hiding it
      const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (target.classList.contains("is-hidden") && allFilterBtn) {
        allFilterBtn.click();
      }

      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

      target.classList.remove("is-highlighted");
      void target.offsetWidth; // restart animation if clicked twice
      target.classList.add("is-highlighted");
      setTimeout(() => target.classList.remove("is-highlighted"), 1700);
    });
  });

  /* ---------- Contact form (Formspree submit) ---------- */
  const contactForm = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  const submitBtn = contactForm?.querySelector('button[type="submit"]');
  const submitBtnDefaultHTML = submitBtn ? submitBtn.innerHTML : "";

  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const endpoint = contactForm.getAttribute("action");
    if (!endpoint || endpoint === "#") {
      if (formNote) {
        formNote.textContent = "This form isn't connected yet. Add your Formspree endpoint to the form's action attribute.";
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>Sending…</span>";
    }
    if (formNote) formNote.textContent = "";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        contactForm.reset();
        if (formNote) formNote.textContent = "Thanks — your message has been sent. I'll get back to you soon.";
      } else {
        const data = await response.json().catch(() => null);
        const message = data?.errors?.map((err) => err.message).join(", ");
        if (formNote) formNote.textContent = message || "Something went wrong sending your message. Please try again or email me directly.";
      }
    } catch (err) {
      if (formNote) formNote.textContent = "Network error — please try again or email me directly.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtnDefaultHTML;
      }
    }
  });

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

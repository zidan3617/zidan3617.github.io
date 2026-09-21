"use strict";

/* Progressive enhancement: text, photographs, and links work without JS. */
(() => {
  const doc = document;
  const menu = doc.querySelector(".menu-toggle");
  const nav = doc.querySelector("#primary-nav");
  const mobile = window.matchMedia("(max-width: 980px)");

  function closeMenu() {
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
  }
  if (menu && nav) {
    menu.hidden = false;
    menu.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menu.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      if (mobile.matches) closeMenu();
    }));
    doc.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menu.focus();
      }
    });
    doc.addEventListener("click", event => {
      if (mobile.matches && !event.target.closest(".site-header")) closeMenu();
    });
    mobile.addEventListener("change", closeMenu);
  }

  /* Manual photo carousels; no automatic cycling or hidden content dependency. */
  doc.querySelectorAll(".media-gallery").forEach(gallery => {
    const slides = Array.from(gallery.querySelectorAll(".media-slide"));
    const controls = gallery.querySelector(".carousel-controls");
    if (slides.length < 2 || !controls) return;
    let index = 0;
    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== index; });
      controls.querySelector(".slide-count").textContent = `${index + 1} / ${slides.length}`;
    }
    controls.querySelector("[data-prev]").addEventListener("click", () => show(index - 1));
    controls.querySelector("[data-next]").addEventListener("click", () => show(index + 1));
    controls.hidden = false;
    show(0);
  });

  /* Native dialog traps focus and supports Escape. Images are never cropped here. */
  const dialog = doc.querySelector("#photo-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    const allImageLinks = Array.from(doc.querySelectorAll("a[data-lightbox]"));
    const image = dialog.querySelector("#dialog-image");
    const caption = dialog.querySelector("#dialog-caption");
    const counter = dialog.querySelector("#dialog-counter");
    const previous = dialog.querySelector(".dialog-prev");
    const next = dialog.querySelector(".dialog-next");
    let currentGroup = [];
    let currentIndex = 0;
    let returnFocus = null;

    function showImage(nextIndex) {
      currentIndex = (nextIndex + currentGroup.length) % currentGroup.length;
      const link = currentGroup[currentIndex];
      image.src = link.getAttribute("href");
      image.alt = link.querySelector("img")?.alt || "Portfolio photograph";
      caption.textContent = link.dataset.caption || image.alt;
      counter.textContent = `${currentIndex + 1} / ${currentGroup.length}`;
      previous.disabled = next.disabled = currentGroup.length === 1;
    }
    allImageLinks.forEach(link => link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      currentGroup = allImageLinks.filter(item => item.dataset.lightbox === link.dataset.lightbox);
      returnFocus = link;
      showImage(currentGroup.indexOf(link));
      dialog.showModal();
      doc.body.classList.add("dialog-open");
      dialog.querySelector(".dialog-close").focus();
    }));
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    previous.addEventListener("click", () => showImage(currentIndex - 1));
    next.addEventListener("click", () => showImage(currentIndex + 1));
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("keydown", event => {
      if (event.key === "ArrowRight") { event.preventDefault(); showImage(currentIndex + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); showImage(currentIndex - 1); }
    });
    dialog.addEventListener("close", () => {
      doc.body.classList.remove("dialog-open");
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  }

  /* Animate only when visible, honor reduced motion, and preserve manual pauses. */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  doc.querySelectorAll("video[data-loop-video]").forEach(video => {
    video.muted = true;
    let manuallyPaused = false;
    let autoPausePending = false;
    let visible = false;
    function pauseAutomatically() {
      if (!video.paused) { autoPausePending = true; video.pause(); }
    }
    function updatePlayback() {
      if (!visible || doc.hidden) { pauseAutomatically(); return; }
      if (!reducedMotion.matches && !manuallyPaused) {
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === "function") playAttempt.catch(() => {});
      }
    }
    video.addEventListener("pause", () => {
      if (autoPausePending) { autoPausePending = false; return; }
      if (visible && !doc.hidden) manuallyPaused = true;
    });
    video.addEventListener("play", () => { manuallyPaused = false; });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        updatePlayback();
      }, { threshold: .35 });
      observer.observe(video);
    }
    doc.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) pauseAutomatically();
      else updatePlayback();
    });
  });

  /* Each HTML page declares its current navigation link with aria-current. */
  doc.documentElement.classList.add("js");
})();

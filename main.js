(() => {
  const stage = document.getElementById("islandStage");
  const avatar = document.getElementById("avatar");
  const bubble = document.getElementById("aboutBubble");
  if (!stage || !avatar || !bubble) return;

  const player = { x: 53, y: 56, targetX: 53, targetY: 56, direction: "down", lastX: 53, lastY: 56 };
  const limits = { minX: 24, maxX: 76, minY: 40, maxY: 72 };
  let animationFrame = 0;
  let movingTimer = 0;

  function placePrompt() {
    const x = Math.max(15, Math.min(85, player.x));
    const y = Math.max(23, Math.min(86, player.y - 7));
    bubble.style.left = x + "%";
    bubble.style.top = y + "%";
  }

  function setPointerTarget(event) {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    player.targetX = Math.max(limits.minX, Math.min(limits.maxX, x));
    player.targetY = Math.max(limits.minY, Math.min(limits.maxY, y));
    placePrompt();

    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    if (Math.abs(dx) > Math.abs(dy)) player.direction = dx < 0 ? "left" : "right";
    else player.direction = dy < 0 ? "up" : "down";

    avatar.classList.remove("dir-down", "dir-left", "dir-right", "dir-up");
    avatar.classList.add("dir-" + player.direction);
    avatar.classList.add("walking");
    window.clearTimeout(movingTimer);
    movingTimer = window.setTimeout(() => avatar.classList.remove("walking"), 180);
    if (!animationFrame) animationFrame = window.requestAnimationFrame(moveAvatar);
  }

  function moveAvatar() {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    player.x += dx * 0.075;
    player.y += dy * 0.075;
    avatar.style.left = player.x + "%";
    avatar.style.top = player.y + "%";
    placePrompt();

    if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
      avatar.style.left = player.targetX + "%";
      avatar.style.top = player.targetY + "%";
      animationFrame = 0;
      return;
    }
    animationFrame = window.requestAnimationFrame(moveAvatar);
  }

  stage.addEventListener("pointermove", setPointerTarget);
  stage.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse") setPointerTarget(event);
  });
  placePrompt();
})();

(() => {
  const carousel = document.getElementById("featuredCarousel");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll("[data-featured-slide]")];
  const dots = carousel.querySelector(".featured-dots");
  const previous = carousel.querySelector("[data-featured-prev]");
  const next = carousel.querySelector("[data-featured-next]");
  if (slides.length < 2 || !dots || !previous || !next) return;

  const interval = 3000;
  let active = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
  let timer = 0;
  let paused = false;
  const indicators = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "featured-dot";
    dot.setAttribute("aria-label", `Show featured project ${index + 1} of ${slides.length}`);
    dot.setAttribute("aria-pressed", String(index === active));
    dot.addEventListener("click", () => show(index));
    dots.append(dot);
    return dot;
  });

  function armTimer() {
    window.clearTimeout(timer);
    if (!paused && !document.hidden) timer = window.setTimeout(shuffle, interval);
  }

  function show(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const selected = i === active;
      slide.classList.toggle("is-active", selected);
      slide.setAttribute("aria-hidden", String(!selected));
      slide.tabIndex = selected ? 0 : -1;
      indicators[i].setAttribute("aria-pressed", String(selected));
    });
    armTimer();
  }

  function shuffle() {
    show((active + 1) % slides.length);
  }

  previous.addEventListener("click", () => show(active - 1));
  next.addEventListener("click", () => show(active + 1));
  carousel.addEventListener("pointerenter", () => { paused = true; window.clearTimeout(timer); });
  carousel.addEventListener("pointerleave", () => { paused = false; armTimer(); });
  carousel.addEventListener("focusin", () => { paused = true; window.clearTimeout(timer); });
  carousel.addEventListener("focusout", event => {
    if (!carousel.contains(event.relatedTarget)) { paused = false; armTimer(); }
  });
  document.addEventListener("visibilitychange", armTimer);
  show(active);
})();


(() => {
  const dialog = document.getElementById("galleryDialog");
  const content = document.getElementById("galleryDialogContent");
  if (!dialog || !content) return;
  const closeButton = dialog.querySelector("[data-gallery-close]");
  let openingEntry = null;

  function closeGallery() {
    if (dialog.open) dialog.close();
    content.replaceChildren();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }
  function openGallery(entry) {
    if (!entry) return;
    const template = entry.querySelector("template.gallery-detail");
    if (!template) return;
    openingEntry = entry;
    content.replaceChildren(template.content.cloneNode(true));
    const profileArt = entry.querySelector(".experience-pixel-art");
    const modalArtPlaceholder = content.querySelector(".gallery-modal-image");
    if (profileArt && modalArtPlaceholder) {
      const modalArt = profileArt.cloneNode(true);
      modalArt.classList.add("experience-modal-art");
      modalArt.setAttribute("role", "img");
      modalArt.setAttribute("aria-label", profileArt.getAttribute("aria-label") || "Experience artwork");
      modalArtPlaceholder.replaceWith(modalArt);
    }
    content.querySelectorAll("video").forEach(video => { video.muted = true; video.defaultMuted = true; video.volume = 0; });
    content.querySelectorAll(".trash-royale-gallery img, .project-photo-gallery img, .about-modal-gallery img").forEach(image => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-photo-trigger";
      button.setAttribute("aria-label", `Open image: ${image.alt || "Project image"}`);
      image.replaceWith(button);
      button.append(image);
      const sparkle = document.createElement("span");
      sparkle.className = "gallery-photo-sparkle";
      sparkle.setAttribute("aria-hidden", "true");
      sparkle.textContent = "✦";
      button.append(sparkle);
    });
    content.querySelectorAll(".about-modal-gallery video").forEach(video => {
      const wrapper = document.createElement("div");
      wrapper.className = "gallery-video-wrap";
      video.replaceWith(wrapper);
      wrapper.append(video);
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "gallery-video-expand";
      expand.dataset.mediaExpand = "true";
      expand.setAttribute("aria-label", "Open video in larger viewer");
      expand.textContent = "↗";
      wrapper.append(expand);
    });
    if (!dialog.open) dialog.showModal();
    if (entry.id) history.replaceState(null, "", location.pathname + location.search + "#" + entry.id);
  }
  document.querySelectorAll("[data-gallery-trigger]").forEach(button => {
    button.addEventListener("click", () => openGallery(button.closest(".gallery-entry")));
  });
  closeButton?.addEventListener("click", closeGallery);
  dialog.addEventListener("click", event => { if (event.target === dialog) closeGallery(); });
  dialog.addEventListener("close", () => {
    content.replaceChildren();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  });
  const initialId = decodeURIComponent(location.hash.slice(1));
  if (initialId) {
    const entry = document.getElementById(initialId);
    if (entry?.matches(".gallery-entry")) openGallery(entry);
  }
})();


(() => {
  const galleryDialog = document.getElementById("galleryDialog");
  const galleryContent = document.getElementById("galleryDialogContent");
  const viewer = document.getElementById("projectImageViewer");
  if (!galleryDialog || !galleryContent || !viewer) return;

  const figure = viewer.querySelector("figure");
  const viewerImage = figure.querySelector("img");
  let viewerVideo = figure.querySelector("video");
  if (!viewerVideo) {
    viewerVideo = document.createElement("video");
    viewerVideo.controls = true;
    viewerVideo.muted = true;
    viewerVideo.playsInline = true;
    viewerVideo.preload = "metadata";
    viewerVideo.hidden = true;
    figure.insertBefore(viewerVideo, figure.querySelector("figcaption"));
  }
  const caption = figure.querySelector("figcaption");
  const closeButton = viewer.querySelector("[data-image-close]");
  const previousButton = viewer.querySelector("[data-image-prev]");
  const nextButton = viewer.querySelector("[data-image-next]");
  let media = [];
  let activeIndex = 0;
  let opener = null;

  function showMedia(index) {
    if (!media.length) return;
    activeIndex = (index + media.length) % media.length;
    const item = media[activeIndex];
    if (item.tagName === "VIDEO") {
      viewerImage.hidden = true;
      viewerVideo.hidden = false;
      viewerVideo.pause();
      viewerVideo.removeAttribute("src");
      viewerVideo.replaceChildren();
      const src = item.currentSrc || item.querySelector("source")?.src || item.src;
      if (src) viewerVideo.src = src;
      if (item.poster) viewerVideo.poster = item.poster;
      viewerVideo.muted = true;
      viewerVideo.defaultMuted = true;
      viewerVideo.volume = 0;
      viewerVideo.load();
    } else {
      viewerVideo.pause();
      viewerVideo.hidden = true;
      viewerImage.hidden = false;
      viewerImage.src = item.currentSrc || item.src;
      viewerImage.alt = item.alt || "Photo";
    }
    caption.textContent = item.alt || (item.tagName === "VIDEO" ? "Video" : "");
    previousButton.disabled = media.length < 2;
    nextButton.disabled = media.length < 2;
  }

  function closeViewer() { if (viewer.open) viewer.close(); }
  function openMedia(item) {
    if (!item) return;
    const gallery = item.closest(".trash-royale-gallery, .project-photo-gallery, .about-modal-gallery");
    if (!gallery) return;
    media = Array.from(gallery.querySelectorAll("img,video"));
    opener = item.closest("button, .gallery-video-wrap") || item;
    showMedia(media.indexOf(item));
    if (!viewer.open) viewer.showModal();
  }

  galleryContent.addEventListener("click", event => {
    const trigger = event.target.closest(".gallery-photo-trigger");
    if (trigger) openMedia(trigger.querySelector("img"));
    const expand = event.target.closest("[data-media-expand]");
    if (expand) openMedia(expand.closest(".gallery-video-wrap")?.querySelector("video"));
  });
  closeButton?.addEventListener("click", closeViewer);
  previousButton?.addEventListener("click", () => showMedia(activeIndex - 1));
  nextButton?.addEventListener("click", () => showMedia(activeIndex + 1));
  viewer.addEventListener("click", event => { if (event.target === viewer) closeViewer(); });
  viewer.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showMedia(activeIndex - 1);
    if (event.key === "ArrowRight") showMedia(activeIndex + 1);
  });
  viewer.addEventListener("close", () => {
    viewerVideo.pause();
    viewerVideo.removeAttribute("src");
    viewerVideo.load();
    opener?.focus();
    opener = null;
  });
})();

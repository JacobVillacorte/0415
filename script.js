const config = window.ANNIVERSARY_CONFIG || {};

const partnerNameEl = document.getElementById("partnerName");
const heroMessageEl = document.getElementById("heroMessage");
const favoriteLineEl = document.getElementById("favoriteLine");
const daysTogetherEl = document.getElementById("daysTogether");
const countdownEl = document.getElementById("countdown");
const timelineListEl = document.getElementById("timelineList");
const memoryWishEl = document.getElementById("memoryWish");
const photoGridEl = document.getElementById("photoGrid");
const reasonTextEl = document.getElementById("reasonText");
const reasonIndexEl = document.getElementById("reasonIndex");
const reasonCardEl = document.getElementById("reasonCard");
const reasonMediaEl = document.getElementById("reasonMedia");
const reasonGifEl = document.getElementById("reasonGif");
const modal = document.getElementById("surpriseModal");
const letterTitleEl = document.getElementById("letterTitle");
const letterBodyEl = document.getElementById("letterBody");

const screenDeckEl = document.getElementById("screenDeck");
const prevScreenBtn = document.getElementById("prevScreenBtn");
const nextScreenBtn = document.getElementById("nextScreenBtn");
const screenDotsEl = document.getElementById("screenDots");
const screenCountEl = document.getElementById("screenCount");

const openModalBtn = document.getElementById("playSurpriseBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const nextReasonBtn = document.getElementById("nextReasonBtn");
const prevReasonBtn = document.getElementById("prevReasonBtn");
const spawnHeartsBtn = document.getElementById("spawnHeartsBtn");
const musicToggleBtn = document.getElementById("musicToggle");
const portraitLinkEl = document.querySelector(".portrait-link");

const bgMusic = document.getElementById("bgMusic");
const musicSource = document.getElementById("musicSource");

const canvas = document.getElementById("heartsCanvas");
const ctx = canvas.getContext("2d");

let reasonCursor = 0;
let hearts = [];
let currentScreen = 0;
let currentSongIndex = 0;
let startX = 0;
let startY = 0;
let hasTouchStart = false;
let scrollRaf = 0;

const screens = Array.from(document.querySelectorAll(".screen"));
let screenDots = [];

function applyConfig() {
  partnerNameEl.textContent = config.partnerName || "My Love";
  heroMessageEl.textContent = config.heroMessage || "Another year, another chapter, same heartbeat.";
  favoriteLineEl.textContent = config.favoriteLine || "You still give me butterflies.";
  letterTitleEl.textContent = config.letterTitle || "To the one who changed everything";
  memoryWishEl.textContent =
    config.memoryWish ||
    "I love every sponty trip and date with you, and I am hoping we can take more pictures and make more memories soon.";
  letterBodyEl.textContent =
    config.letterBody ||
    "Thank you for being my calm and my chaos, my comfort and my courage. Happy anniversary.";
}

function renderTimeline() {
  const timeline = Array.isArray(config.timeline) ? config.timeline : [];
  timelineListEl.innerHTML = "";

  timeline.forEach((event) => {
    const item = document.createElement("article");
    item.innerHTML = `
      <p class="timeline-date">${event.date || ""}</p>
      <h3 class="timeline-title">${event.title || "Memory"}</h3>
      <p class="timeline-detail">${event.detail || ""}</p>
    `;
    timelineListEl.appendChild(item);
  });
}

function renderReason() {
  const reasons = Array.isArray(config.reasons) && config.reasons.length
    ? config.reasons
    : ["You make ordinary moments feel cinematic."];

  if (reasonCursor < 0) {
    reasonCursor = reasons.length - 1;
  }

  reasonCursor = reasonCursor % reasons.length;
  const activeReason = reasons[reasonCursor] || "";
  reasonIndexEl.textContent = String(reasonCursor + 1);
  reasonTextEl.textContent = activeReason;

  if (reasonMediaEl && reasonGifEl) {
    const isDeliciousReason = /delicious/i.test(activeReason);
    reasonMediaEl.hidden = !isDeliciousReason;

    if (isDeliciousReason) {
      reasonGifEl.src = "https://tenor.com/embed/6113775";
    } else if (reasonGifEl.src) {
      reasonGifEl.removeAttribute("src");
    }
  }
}

function renderPhotos() {
  const photos = Array.isArray(config.photos) ? config.photos : [];
  photoGridEl.innerHTML = "";

  if (!photos.length) {
    const empty = document.createElement("p");
    empty.className = "photo-empty";
    empty.textContent = "Add photos in config.js to show your memory gallery.";
    photoGridEl.appendChild(empty);
    return;
  }

  photos.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const image = document.createElement("img");
    image.src = photo.url;
    image.alt = photo.alt || `Memory photo ${index + 1}`;
    image.loading = "lazy";

    card.appendChild(image);
    photoGridEl.appendChild(card);
  });
}

function parseStartDate() {
  return new Date(config.relationshipStart || "2021-04-14T00:00:00");
}

function getNextAnniversary(now) {
  const fallback = "04-14";
  const mmdd = String(config.anniversaryDay || fallback).split("-");
  const month = Number(mmdd[0]) - 1;
  const day = Number(mmdd[1]);

  const next = new Date(now.getFullYear(), month, day);
  if (next < now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

function updateTimeStats() {
  const now = new Date();
  const relationshipStart = parseStartDate();

  const msTogether = Math.max(0, now - relationshipStart);
  const togetherDays = Math.floor(msTogether / (1000 * 60 * 60 * 24));
  daysTogetherEl.textContent = `${togetherDays} days`;

  const next = getNextAnniversary(now);
  const diff = Math.max(0, next - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  countdownEl.textContent = `${days}d ${hours}h ${mins}m`;
}

function goToScreen(index) {
  const bounded = Math.max(0, Math.min(index, screens.length - 1));
  setScreenState(bounded);
  screens[currentScreen].scrollIntoView({ behavior: "smooth", block: "start" });
}

function setScreenState(index) {
  currentScreen = index;

  screens.forEach((screen, idx) => {
    screen.classList.toggle("active", idx === currentScreen);
  });

  screenDots.forEach((dot, idx) => {
    dot.classList.toggle("active", idx === currentScreen);
  });

  prevScreenBtn.disabled = currentScreen === 0;
  nextScreenBtn.disabled = currentScreen === screens.length - 1;
  screenCountEl.textContent = `${currentScreen + 1} / ${screens.length}`;
}

function syncScreenToScroll() {
  const viewportCenter = window.scrollY + window.innerHeight / 2;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  screens.forEach((screen, index) => {
    const screenCenter = screen.offsetTop + screen.offsetHeight / 2;
    const distance = Math.abs(screenCenter - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  if (nearestIndex !== currentScreen) {
    setScreenState(nearestIndex);
  }
}

function setupScreens() {
  screenDotsEl.innerHTML = "";

  screenDots = screens.map((_screen, index) => {
    const dot = document.createElement("button");
    dot.className = "screen-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to screen ${index + 1}`);
    dot.addEventListener("click", () => goToScreen(index));
    screenDotsEl.appendChild(dot);
    return dot;
  });

  prevScreenBtn.addEventListener("click", () => goToScreen(currentScreen - 1));
  nextScreenBtn.addEventListener("click", () => goToScreen(currentScreen + 1));

  window.addEventListener("scroll", () => {
    if (scrollRaf) {
      return;
    }

    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      syncScreenToScroll();
    });
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      goToScreen(currentScreen - 1);
    }
    if (event.key === "ArrowRight") {
      goToScreen(currentScreen + 1);
    }
  });

  screenDeckEl.addEventListener(
    "touchstart",
    (event) => {
      if (!event.touches.length) {
        return;
      }
      hasTouchStart = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    },
    { passive: true }
  );

  screenDeckEl.addEventListener(
    "touchend",
    (event) => {
      if (!hasTouchStart || !event.changedTouches.length) {
        return;
      }

      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      hasTouchStart = false;
      if (Math.abs(deltaX) < 45 || Math.abs(deltaY) > 60) {
        return;
      }

      if (deltaX < 0) {
        goToScreen(currentScreen + 1);
      } else {
        goToScreen(currentScreen - 1);
      }
    },
    { passive: true }
  );

  setScreenState(0);
}

function setupMusic() {
  const musicConfig = config.music || {};
  const songs = Array.isArray(musicConfig.songs) ? musicConfig.songs : [];

  if (!musicConfig.enabled || !songs.length) {
    musicToggleBtn.style.display = "none";
    return;
  }

  bgMusic.volume = typeof musicConfig.volume === "number" ? musicConfig.volume : 0.55;

  function persistMusicState() {
    try {
      sessionStorage.setItem(
        "anniversaryMusicState",
        JSON.stringify({
          currentSongIndex,
          isPlaying: !bgMusic.paused,
          updatedAt: Date.now()
        })
      );
    } catch (_err) {
      // Ignore storage failures.
    }
  }

  currentSongIndex = Math.min(
    Math.max(Number(musicConfig.defaultSongIndex || 0), 0),
    songs.length - 1
  );

  function loadSong(index) {
    const selectedSong = songs[index];
    if (!selectedSong) return;

    currentSongIndex = index;
    musicSource.src = selectedSong.url;
    bgMusic.load();
    persistMusicState();
  }

  function getRandomSongIndex() {
    if (songs.length <= 1) {
      return 0;
    }

    let nextIndex = Math.floor(Math.random() * songs.length);
    while (nextIndex === currentSongIndex) {
      nextIndex = Math.floor(Math.random() * songs.length);
    }
    return nextIndex;
  }

  loadSong(currentSongIndex);

  musicToggleBtn.textContent = "Play random song";
  musicToggleBtn.addEventListener("click", async () => {
    if (bgMusic.paused) {
      loadSong(getRandomSongIndex());
      try {
        await bgMusic.play();
        musicToggleBtn.textContent = "Pause song";
        persistMusicState();
      } catch (_err) {
        musicToggleBtn.textContent = "Tap again to play";
      }
    } else {
      bgMusic.pause();
      musicToggleBtn.textContent = "Play random song";
      persistMusicState();
    }
  });

  if (portraitLinkEl) {
    portraitLinkEl.addEventListener("click", () => {
      persistMusicState();
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createHeart() {
  return {
    x: Math.random() * canvas.width,
    y: canvas.height + 20,
    speedY: 0.7 + Math.random() * 1.8,
    drift: -0.6 + Math.random() * 1.2,
    size: 7 + Math.random() * 9,
    alpha: 0.7 + Math.random() * 0.3
  };
}

function spawnHearts(count = 22) {
  for (let i = 0; i < count; i += 1) {
    hearts.push(createHeart());
  }
}

function drawHeart(x, y, size, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.fillStyle = `rgba(201, 73, 47, ${alpha})`;

  ctx.beginPath();
  ctx.moveTo(10, 18);
  ctx.bezierCurveTo(10, 18, 0, 11, 0, 6);
  ctx.bezierCurveTo(0, 2.5, 2.5, 0, 6, 0);
  ctx.bezierCurveTo(8, 0, 10, 1.2, 10, 3.3);
  ctx.bezierCurveTo(10, 1.2, 12, 0, 14, 0);
  ctx.bezierCurveTo(17.5, 0, 20, 2.5, 20, 6);
  ctx.bezierCurveTo(20, 11, 10, 18, 10, 18);
  ctx.fill();
  ctx.restore();
}

function animateHearts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  hearts = hearts.filter((heart) => heart.y > -30);
  hearts.forEach((heart) => {
    heart.y -= heart.speedY;
    heart.x += heart.drift;
    drawHeart(heart.x, heart.y, heart.size, heart.alpha);
  });

  requestAnimationFrame(animateHearts);
}

function wireEvents() {
  openModalBtn.addEventListener("click", () => modal.showModal());
  closeModalBtn.addEventListener("click", () => modal.close());

  nextReasonBtn.addEventListener("click", () => {
    reasonCursor += 1;
    renderReason();
    reasonCardEl.animate(
      [
        { transform: "rotateY(0deg)", opacity: 0.6 },
        { transform: "rotateY(7deg)", opacity: 1 },
        { transform: "rotateY(0deg)", opacity: 1 }
      ],
      { duration: 380, easing: "ease" }
    );
  });

  prevReasonBtn.addEventListener("click", () => {
    reasonCursor -= 1;
    renderReason();
    reasonCardEl.animate(
      [
        { transform: "rotateY(0deg)", opacity: 0.6 },
        { transform: "rotateY(-7deg)", opacity: 1 },
        { transform: "rotateY(0deg)", opacity: 1 }
      ],
      { duration: 380, easing: "ease" }
    );
  });

  spawnHeartsBtn.addEventListener("click", () => spawnHearts(40));
  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.close();
    }
  });
}

function init() {
  applyConfig();
  renderTimeline();
  renderPhotos();
  renderReason();
  updateTimeStats();
  setupScreens();
  setupMusic();
  wireEvents();

  resizeCanvas();
  animateHearts();

  setInterval(updateTimeStats, 60 * 1000);
}

init();

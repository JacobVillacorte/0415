const config = window.ANNIVERSARY_CONFIG || {};

const partnerNameEl = document.getElementById("partnerName");
const heroMessageEl = document.getElementById("heroMessage");
const favoriteLineEl = document.getElementById("favoriteLine");
const daysTogetherEl = document.getElementById("daysTogether");
const countdownEl = document.getElementById("countdown");
const timelineListEl = document.getElementById("timelineList");
const reasonTextEl = document.getElementById("reasonText");
const reasonIndexEl = document.getElementById("reasonIndex");
const reasonCardEl = document.getElementById("reasonCard");
const modal = document.getElementById("surpriseModal");
const letterTitleEl = document.getElementById("letterTitle");
const letterBodyEl = document.getElementById("letterBody");

const openModalBtn = document.getElementById("playSurpriseBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const nextReasonBtn = document.getElementById("nextReasonBtn");
const prevReasonBtn = document.getElementById("prevReasonBtn");
const spawnHeartsBtn = document.getElementById("spawnHeartsBtn");
const musicToggleBtn = document.getElementById("musicToggle");

const bgMusic = document.getElementById("bgMusic");
const musicSource = document.getElementById("musicSource");

const canvas = document.getElementById("heartsCanvas");
const ctx = canvas.getContext("2d");

let reasonCursor = 0;
let hearts = [];

function applyConfig() {
  partnerNameEl.textContent = config.partnerName || "My Love";
  heroMessageEl.textContent = config.heroMessage || "Another year, another chapter, same heartbeat.";
  favoriteLineEl.textContent = config.favoriteLine || "You still give me butterflies.";
  letterTitleEl.textContent = config.letterTitle || "To the one who changed everything";
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
  reasonIndexEl.textContent = String(reasonCursor + 1);
  reasonTextEl.textContent = reasons[reasonCursor];
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

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function setupMusic() {
  const musicConfig = config.music || {};
  if (!musicConfig.enabled || !musicConfig.url) {
    musicToggleBtn.style.display = "none";
    return;
  }

  musicSource.src = musicConfig.url;
  bgMusic.volume = typeof musicConfig.volume === "number" ? musicConfig.volume : 0.55;
  bgMusic.load();

  musicToggleBtn.textContent = "Play our song";
  musicToggleBtn.addEventListener("click", async () => {
    if (bgMusic.paused) {
      try {
        await bgMusic.play();
        musicToggleBtn.textContent = "Pause our song";
      } catch (_err) {
        musicToggleBtn.textContent = "Tap again to play";
      }
    } else {
      bgMusic.pause();
      musicToggleBtn.textContent = "Play our song";
    }
  });
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
  renderReason();
  updateTimeStats();
  setupReveal();
  setupMusic();
  wireEvents();

  resizeCanvas();
  animateHearts();

  setInterval(updateTimeStats, 60 * 1000);
}

init();

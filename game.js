// =====================================================
//  SPACE GOOSE 🪿  —  De Anza Game Dev Club
//  Press SPACE (or click / tap) to jump. Double jump!
// =====================================================

// ---------- 🎮 CHANGE ME! (good first commits) ----------
const CONFIG = {
  jumpForce: 10,        // how strong the jump is (try 13... or 9000 😂)
  gravity: 0.5,         // how fast the goose falls
  maxJumps: 2,          // 2 = double jump, 3 = triple jump
  speed: 6,             // how fast rocks move
  gooseColor: "#FFF4E0" // your favorite color, like "#FF4FA3"
};

// ---------- 🏆 CREDITS: add your name at the end! ----------
const CREDITS = [
  "Ilgiz",
];

// =====================================================
//  Game code below. Read it, break it, fix it, commit it!
// =====================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 70;

let state = "start"; // "start" | "play" | "over"
let goose, rocks, stars, frame, score, best, spawnTimer;

try { best = Number(localStorage.getItem("spaceGooseBest")) || 0; } catch (e) { best = 0; }

function reset() {
  goose = { x: 110, y: GROUND_Y - 44, w: 54, h: 44, vy: 0, jumpsLeft: CONFIG.maxJumps };
  rocks = [];
  frame = 0;
  score = 0;
  spawnTimer = 60;
  if (!stars) {
    stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * (GROUND_Y - 20),
      s: Math.random() * 2 + 0.5,
    }));
  }
}

// ---------- 🔊 HONK ----------
let audio = null;
function honk() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(420, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, audio.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.15);
  } catch (e) { /* no sound, no problem */ }
}

// ---------- 🕹 INPUT ----------
function jump() {
  if (state === "start" || state === "over") {
    reset();
    state = "play";
    return;
  }
  if (goose.jumpsLeft > 0) {
    goose.vy = -CONFIG.jumpForce;
    goose.jumpsLeft--;
    honk();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    e.preventDefault();
    jump();
  }
});
canvas.addEventListener("pointerdown", jump);

// ---------- ⚙️ UPDATE ----------
function update() {
  if (state !== "play") return;
  frame++;
  score = Math.floor(frame / 6);
  const speed = CONFIG.speed + score / 150;

  // goose physics
  goose.vy += CONFIG.gravity;
  goose.y += goose.vy;
  if (goose.y >= GROUND_Y - goose.h) {
    goose.y = GROUND_Y - goose.h;
    goose.vy = 0;
    goose.jumpsLeft = CONFIG.maxJumps;
  }

  // spawn space rocks
  spawnTimer--;
  if (spawnTimer <= 0) {
    const h = 30 + Math.random() * 45;
    rocks.push({ x: W + 20, w: 34 + Math.random() * 26, h });
    spawnTimer = 55 + Math.random() * 70 - Math.min(score / 20, 25);
  }

  // move rocks + check hits
  for (const r of rocks) {
    r.x -= speed;
    const hit =
      goose.x + 8 < r.x + r.w &&
      goose.x + goose.w - 8 > r.x &&
      goose.y + goose.h - 6 > GROUND_Y - r.h;
    if (hit) gameOver();
  }
  rocks = rocks.filter((r) => r.x + r.w > -20);

  // scroll stars
  for (const s of stars) {
    s.x -= s.s * 0.6;
    if (s.x < 0) s.x = W;
  }
}

function gameOver() {
  state = "over";
  if (score > best) {
    best = score;
    try { localStorage.setItem("spaceGooseBest", String(best)); } catch (e) {}
  }
}

// ---------- 🎨 DRAW ----------
function drawGoose() {
  const { x, y, w, h } = goose;
  const flap = state === "play" && goose.vy !== 0 ? Math.sin(frame / 3) * 6 : 0;
  ctx.save();
  ctx.translate(x, y);
  // body
  ctx.fillStyle = CONFIG.gooseColor;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.62, w / 2, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  // neck + head
  ctx.fillRect(w * 0.72, h * 0.05, 10, h * 0.5);
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.08, 10, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = "#FF8A3D";
  ctx.beginPath();
  ctx.moveTo(w * 0.95, h * 0.02);
  ctx.lineTo(w * 1.18, h * 0.1);
  ctx.lineTo(w * 0.95, h * 0.16);
  ctx.fill();
  // eye
  ctx.fillStyle = "#1B1035";
  ctx.beginPath();
  ctx.arc(w * 0.86, h * 0.04, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // wing
  ctx.fillStyle = "#C9BFE8";
  ctx.beginPath();
  ctx.ellipse(w * 0.4, h * 0.55 - flap, w * 0.25, h * 0.16, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // feet
  ctx.fillStyle = "#FF8A3D";
  ctx.fillRect(w * 0.3, h - 4, 8, 4);
  ctx.fillRect(w * 0.55, h - 4, 8, 4);
  ctx.restore();
}

function drawRock(r) {
  const top = GROUND_Y - r.h;
  ctx.fillStyle = "#9B6BFF";
  ctx.beginPath();
  ctx.roundRect(r.x, top, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = "#6A2FD6";
  ctx.beginPath();
  ctx.arc(r.x + r.w * 0.35, top + r.h * 0.35, 5, 0, Math.PI * 2);
  ctx.arc(r.x + r.w * 0.65, top + r.h * 0.7, 4, 0, Math.PI * 2);
  ctx.fill();
}

function text(str, x, y, size, color, align = "center") {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

function draw() {
  // space background
  ctx.fillStyle = "#1B1035";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#E9E1FF";
  for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s);

  // ground
  ctx.fillStyle = "#2A1A52";
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = "#B6FF3B";
  ctx.fillRect(0, GROUND_Y, W, 4);

  for (const r of rocks) drawRock(r);
  drawGoose();

  // HUD
  text(`SCORE ${score}`, 20, 34, 16, "#B6FF3B", "left");
  text(`BEST ${best}`, W - 20, 34, 16, "#FF4FA3", "right");
  const hearts = "♥".repeat(Math.max(goose.jumpsLeft, 0));
  text(`JUMPS ${hearts}`, 20, 60, 12, "#FFD23F", "left");

  if (state === "start") {
    text("SPACE GOOSE", W / 2, 150, 32, "#FFF4E0");
    text("PRESS SPACE TO START", W / 2, 200, 14, "#3BE8FF");
    text("double jump to dodge the rocks!", W / 2, 230, 10, "#C9BFE8");
  }
  if (state === "over") {
    text("GAME OVER", W / 2, 140, 32, "#FF4FA3");
    text(`SCORE ${score}`, W / 2, 180, 16, "#FFF4E0");
    text("PRESS SPACE TO RETRY", W / 2, 215, 12, "#3BE8FF");
    text("MADE BY: " + CREDITS.join(", "), W / 2, 255, 10, "#B6FF3B");
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();

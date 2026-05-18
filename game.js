// ── DATA ──────────────────────────────────────────────────────────────────────
const PACKETS = [
  { label: "FULL NAME 👤",       correct: "KEEP_PRIVATE", explanation: "Only share your full name with people you know in real life." },
  { label: "FAVORITE COLOR 🎨",  correct: "SHARE",        explanation: "Colors are fun and totally safe to share!" },
  { label: "HOME ADDRESS 🏠",     correct: "KEEP_PRIVATE", explanation: "Never share where you live with strangers online." },
  { label: "SCHOOL NAME 🏫",      correct: "SHARE",        explanation: "Usually okay in general — but be careful who you tell." },
  { label: "PASSWORD 🔑",         correct: "KEEP_PRIVATE", explanation: "Passwords should ALWAYS be kept secret — even from friends!" },
  { label: "PET'S NAME 🐶",       correct: "SHARE",        explanation: "Fun and safe to share — everyone loves pets!" },
  { label: "BIRTHDAY (FULL) 🎂", correct: "KEEP_PRIVATE", explanation: "Full birthdays can be used to steal your identity." },
  { label: "USERNAME 👾",         correct: "SHARE",        explanation: "Usernames are made to be shared online!" },
  { label: "PHONE NUMBER 📱",     correct: "KEEP_PRIVATE", explanation: "Keep your number private to avoid spam and strangers." },
  { label: "HOBBY ⚽",            correct: "SHARE",        explanation: "Hobbies are great to share and talk about!" },
];

const TOTAL_TIME      = 60;    // seconds
const PACKET_DURATION = 6000;  // ms to cross the belt

// ── STATE ──────────────────────────────────────────────────────────────────────
let s = {};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resetState() {
  s = {
    packetIdx:    0,
    score:        0,
    streak:       0,
    timeLeft:     TOTAL_TIME,
    progress:     0,       // 0 → 1
    decided:      false,
    history:      [],
    rafId:        null,
    timerId:      null,
    startTime:    null,
    toastTimer:   null,
    queue:        shuffle(PACKETS),
  };
}

// ── DOM ────────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const screenHome    = $("screen-home");
const screenGame    = $("screen-game");
const screenResults = $("screen-results");

const hudScore   = $("hud-score");
const hudStreak  = $("hud-streak");
const hudNum     = $("hud-num");
const hudTime    = $("hud-time");
const timerFill  = $("timer-fill");
const dotsEl     = $("dots");
const beltEl     = $("belt");
const packetEl   = $("packet");
const packetLbl  = $("packet-label");
const toast      = $("toast");
const toastTitle = $("toast-title");
const toastBody  = $("toast-body");
const hintEl     = $("hint");
const finalScore = $("final-score");
const resultsList= $("results-list");

$("btn-start")  .addEventListener("click", startGame);
$("btn-again")  .addEventListener("click", startGame);
$("btn-share")  .addEventListener("click", () => decide("SHARE"));
$("btn-private").addEventListener("click", () => decide("KEEP_PRIVATE"));

document.addEventListener("keydown", e => {
  if (!screenGame.classList.contains("active")) return;
  if (e.key === "ArrowLeft")  decide("SHARE");
  if (e.key === "ArrowRight") decide("KEEP_PRIVATE");
});

// ── SCREENS ────────────────────────────────────────────────────────────────────
function show(el) {
  [screenHome, screenGame, screenResults].forEach(s => s.classList.remove("active"));
  el.classList.add("active");
}

// ── START ──────────────────────────────────────────────────────────────────────
function startGame() {
  resetState();
  buildDots();
  updateHUD();
  show(screenGame);
  startTimer();
  nextPacket();
}

// ── DOTS ───────────────────────────────────────────────────────────────────────
function buildDots() {
  dotsEl.innerHTML = "";
  s.queue.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.id = "dot" + i;
    dotsEl.appendChild(d);
  });
}

function refreshDots() {
  s.queue.forEach((_, i) => {
    const d = $("dot" + i);
    if (!d) return;
    d.className = "dot" + (i < s.packetIdx ? " done" : i === s.packetIdx ? " active" : "");
  });
}

// ── TIMER ──────────────────────────────────────────────────────────────────────
function startTimer() {
  s.timerId = setInterval(() => {
    s.timeLeft = Math.max(0, s.timeLeft - 1);
    updateHUD();
    if (s.timeLeft === 0) endGame();
  }, 1000);
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function updateHUD() {
  hudScore.textContent  = s.score + " XP";
  hudStreak.textContent = s.streak + (s.streak >= 3 ? " 🔥" : "");
  hudNum.textContent    = `Packet ${Math.min(s.packetIdx + 1, s.queue.length)} of ${s.queue.length}`;
  hudTime.textContent   = s.timeLeft + "s left";
  hudTime.classList.toggle("urgent", s.timeLeft <= 15);

  const pct = (s.timeLeft / TOTAL_TIME) * 100;
  timerFill.style.width      = pct + "%";
  timerFill.style.background = pct > 50 ? "#00e5a0" : pct > 20 ? "#f7a825" : "#ff4444";
}

// ── PACKET ────────────────────────────────────────────────────────────────────
function nextPacket() {
  if (s.packetIdx >= s.queue.length) { endGame(); return; }

  s.decided   = false;
  s.progress  = 0;
  s.startTime = performance.now();

  const p = s.queue[s.packetIdx];
  packetLbl.textContent = p.label;
  packetEl.className    = "packet";          // reset classes
  setPacketX(0);
  refreshDots();
  setHint("Packet is loading onto the belt...");

  cancelAnimationFrame(s.rafId);
  s.rafId = requestAnimationFrame(tick);
}

function tick(now) {
  if (s.decided) return;

  const elapsed = now - s.startTime;
  s.progress    = Math.min(elapsed / PACKET_DURATION, 1);

  setPacketX(s.progress);

  // Glow once it's fully on the belt
  if (s.progress > 0.12) {
    packetEl.classList.add("glow");
    setHint("Decide before it reaches the end!");
  }

  if (s.progress >= 1) {
    decide(null);
    return;
  }

  s.rafId = requestAnimationFrame(tick);
}

// Place the packet along the belt.
// progress 0 = just off the right edge, progress 1 = just past the left edge.
function setPacketX(progress) {
  const beltW  = beltEl.offsetWidth  || 820;
  const cardW  = packetEl.offsetWidth || 185;
  // Start: left = beltW (hidden on right), End: left = -cardW (hidden on left)
  const leftPx = beltW - progress * (beltW + cardW);
  packetEl.style.left = leftPx + "px";
}

// ── DECISION ──────────────────────────────────────────────────────────────────
function decide(action) {
  if (s.decided) return;
  // Ignore button presses before the packet has entered the belt
  if (action !== null && s.progress < 0.12) return;

  cancelAnimationFrame(s.rafId);
  s.decided = true;

  const packet    = s.queue[s.packetIdx];
  const isCorrect = action !== null && action === packet.correct;

  s.history.push({ packet, action, isCorrect });

  packetEl.classList.remove("glow");
  packetEl.classList.add("gone");

  if (action === null) {
    s.score  -= 5;
    s.streak  = 0;
    showToast("missed", "Too slow!", "Oops — the packet slipped away. -5 XP");
  } else if (isCorrect) {
    s.score += 10;
    s.streak += 1;
    if (s.streak % 5 === 0) {
      s.score += 20;
      showToast("bonus", "Streak Bonus! +20 XP!", packet.explanation);
    } else {
      showToast("correct", "Great job! +10 XP", packet.explanation);
    }
  } else {
    s.score  -= 5;
    s.streak  = 0;
    showToast("wrong", "Not quite! -5 XP", packet.explanation);
  }

  updateHUD();
  setHint("Next packet incoming...");

  setTimeout(() => {
    s.packetIdx++;
    if (s.packetIdx >= s.queue.length) {
      endGame();
    } else {
      nextPacket();
    }
  }, 650);
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(type, title, body) {
  clearTimeout(s.toastTimer);
  toast.className      = "toast " + type;
  toastTitle.textContent = title;
  toastBody.textContent  = body;
  s.toastTimer = setTimeout(() => { toast.className = "toast hidden"; }, 2500);
}

function setHint(msg) { hintEl.textContent = msg; }

// ── END ───────────────────────────────────────────────────────────────────────
function endGame() {
  clearInterval(s.timerId);
  cancelAnimationFrame(s.rafId);
  setTimeout(() => {
    buildResults();
    show(screenResults);
  }, 700);
}

function buildResults() {
  finalScore.textContent = s.score + " XP";
  resultsList.innerHTML  = "";

  s.history.forEach(({ packet, action, isCorrect }) => {
    const type   = action === null ? "missed" : isCorrect ? "correct" : "wrong";
    const icon   = type === "correct" ? "✅" : type === "wrong" ? "❌" : "⏱️";
    const xpText = type === "correct" ? "+10 XP"  : type === "wrong" ? "-5 XP" : "Missed";
    const ans    = packet.correct === "SHARE" ? "SHARE" : "KEEP PRIVATE";

    const row = document.createElement("div");
    row.className = "r-row " + type;
    row.innerHTML = `
      <span class="r-icon">${icon}</span>
      <div class="r-info">
        <div class="r-name">${packet.label}</div>
        <div class="r-exp">Answer: <strong>${ans}</strong> — ${packet.explanation}</div>
      </div>
      <span class="r-xp">${xpText}</span>
    `;
    resultsList.appendChild(row);
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
resetState();
show(screenHome);
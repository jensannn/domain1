// ═══════════════════════════════════════════════════
// CYBER TANOD: BARANGAY DEFENSE FORCE
// Pure Vanilla JavaScript Game Engine
// ═══════════════════════════════════════════════════

// ── AUDIO ENGINE ──────────────────────────────────
const AC = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq = 440, type = 'square', dur = 0.1, vol = 0.15) {
  try {
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    o.start(); o.stop(AC.currentTime + dur);
  } catch(e) {}
}

// (character state will be added to the main GS object below)

function chime()   { beep(880,'sine',0.12,0.15); setTimeout(()=>beep(1100,'sine',0.1,0.12),80); setTimeout(()=>beep(1320,'sine',0.15,0.1),160); }
function buzzer()  { beep(150,'sawtooth',0.25,0.18); setTimeout(()=>beep(120,'sawtooth',0.2,0.15),80); }
function blip()    { beep(660,'square',0.05,0.1); }
function select_s(){ beep(440,'square',0.07,0.1); }
function levelUp() {
  [440,554,659,880].forEach((f,i) => setTimeout(()=>beep(f,'sine',0.15,0.2),i*80));
}
function bossSound(){
  [200,150,100,200,150].forEach((f,i)=>setTimeout(()=>beep(f,'sawtooth',0.2,0.25),i*120));
}

// ── GAME STATE ────────────────────────────────────
const GS = {
  teamName: '',
  xp: 0,
  streak: 0,
  level: 0,          // 1-8
  levelsDone: [],
  playerIndex: 0,    // 0-3, rotates every 2 levels
  character: { gender: 'boy', emoji: '👮‍♂️', name: 'TANOD CARLO' },
};

// ── DOM REFS ──────────────────────────────────────
const $ = id => document.getElementById(id);
const bootScreen     = $('boot-screen');
const teamEntry      = $('team-entry');
const introComic     = $('intro-comic');
const gameScreen     = $('game-screen');
const finalScreen    = $('final-screen');
const teamInput      = $('team-name-input');
const startBtn       = $('start-btn');
const levelContent   = $('level-content');
const levelSplash    = $('level-splash');
const feedbackOverlay= $('feedback-overlay');
const fbIcon         = $('fb-icon');
const fbTitle        = $('fb-title');
const fbMsg          = $('fb-msg');
const fbCount        = $('fb-count');
const xpFloat        = $('xp-float');
const screenFlash    = $('screen-flash');
const dispTeam       = $('disp-team');
const dispXP         = $('disp-xp');
const dispTier       = $('disp-tier');
const xpBarInner     = $('xp-bar-inner');
const dispStreak     = $('disp-streak');
const activeTanodDisp= $('active-tanod-display');

// ── TIMERS ───────────────────────────────────────
let timerInterval = null;
let feedbackTimeout = null;

function clearAllTimers() {
  clearInterval(timerInterval); timerInterval = null;
  clearTimeout(feedbackTimeout); feedbackTimeout = null;
}

// ═══════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════
const bootLines = [
  'BARANGAY DEFENSE FORCE OS v3.7.2',
  'Initializing security modules...',
  'Loading threat database... OK',
  'Mounting phishing detection engine... OK',
  'Calibrating password analyzer... OK',
  'Starting URL inspection service... OK',
  'Connecting to Barangay Network... OK',
  'All systems nominal.',
  '>> CYBER TANOD SYSTEM READY <<',
];

function runBootSequence() {
  const logEl = $('boot-log');
  const fillEl = $('boot-bar-fill');
  const labelEl = $('boot-bar-label');
  let i = 0;

  function nextLine() {
    if (i >= bootLines.length) {
      labelEl.textContent = '[ SYSTEM READY ]';
      fillEl.style.width = '100%';
      beep(880,'sine',0.2,0.2);
      setTimeout(showTeamEntry, 600);
      return;
    }
    const span = document.createElement('span');
    span.className = 'log-line';
    span.textContent = '> ' + bootLines[i];
    logEl.appendChild(span);
    beep(440 + i * 40, 'square', 0.04, 0.08);
    fillEl.style.width = ((i + 1) / bootLines.length * 100) + '%';
    labelEl.textContent = 'LOADING ' + Math.round((i+1)/bootLines.length*100) + '%...';
    i++;
    setTimeout(nextLine, 260);
  }
  nextLine();
}

// ═══════════════════════════════════════════════════
// TEAM ENTRY
// ═══════════════════════════════════════════════════
function showTeamEntry() {
  const bootEl = document.getElementById('boot-screen');
  const teamEl = document.getElementById('team-entry');
  const inputEl = document.getElementById('team-name-input');
  if (bootEl) bootEl.style.display = 'none';
  if (teamEl) teamEl.style.display = 'flex';
  setTimeout(() => { if (inputEl) inputEl.focus(); }, 100);
}

if (startBtn) startBtn.addEventListener('click', submitTeam);
if (teamInput) teamInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitTeam(); });

function showCharacterSelect() {
  const charScreen = document.getElementById('char-select');
  // `#char-select` is nested inside `#intro-comic`, ensure the wrapper is visible
  if (introComic) introComic.style.display = 'flex';
  if (charScreen) charScreen.style.display = 'flex';

  charScreen.querySelectorAll('.char-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      GS.character = {
        gender: btn.dataset.gender,
        emoji:  btn.dataset.emoji,
        name:   btn.dataset.name,
      };
      select_s();
      charScreen.style.display = 'none';
      showIntroComic();
    });
  });
}

function submitTeam() {
  const name = teamInput.value.trim().toUpperCase();
  if (!name) { teamInput.style.borderColor = 'var(--red)'; setTimeout(()=>teamInput.style.borderColor='',600); return; }
  GS.teamName = name;
  select_s();
  teamEntry.style.display = 'none';
  showCharacterSelect(); // ← changed from showIntroComic()
}

// ═══════════════════════════════════════════════════
// INTRO COMIC
// ═══════════════════════════════════════════════════
function showIntroComic() {
  introComic.style.display = 'flex';
  const panels = ['cp1','cp2','cp3'];
  let pi = 0;
  const fill = $('comic-timer-fill');
  fill.style.transition = 'none'; fill.style.width = '100%';

  function showPanel(idx) {
    panels.forEach((id,i) => $(id).style.display = i === idx ? 'flex' : 'none');
    blip();
    fill.style.transition = 'none'; fill.style.width = '100%';
    setTimeout(() => {
      fill.style.transition = 'width 2.8s linear';
      fill.style.width = '0%';
    }, 50);
    setTimeout(() => {
      if (idx + 1 < panels.length) showPanel(idx + 1);
      else {
        introComic.style.display = 'none';
        startGame();
      }
    }, 3000);
  }
  showPanel(0);
}

// ═══════════════════════════════════════════════════
// GAME START & SCREEN SETUP
// ═══════════════════════════════════════════════════
function startGame() {
  gameScreen.style.display = 'flex';
  dispTeam.textContent = GS.teamName;
  updateHUD();
  GS.level = 1;
  GS.levelsDone = [];
  GS.streak = 0;
  GS.xp = 0;
  showLevelTransition(1);
}

function updateHUD() {
  dispXP.textContent = GS.xp;
  dispStreak.textContent = GS.streak;
  const tiers = [
    { min:0,   max:150, label:'ROOKIE TANOD',       bg:'#4a6080'   },
    { min:151, max:250, label:'ACTIVE TANOD',        bg:'#00aacc'   },
    { min:251, max:350, label:'SENIOR TANOD',        bg:'#9900cc'   },
    { min:351, max:9999,label:'CYBER TANOD ELITE',   bg:'#FFD700', color:'#000' },
  ];
  const tier = tiers.find(t => GS.xp >= t.min && GS.xp <= t.max) || tiers[0];
  dispTier.textContent = tier.label;
  dispTier.style.background = tier.bg;
  dispTier.style.color = tier.color || '#fff';
  const pct = Math.min((GS.xp / 400) * 100, 100);
  xpBarInner.style.width = pct + '%';
  const player = GS.playerIndex + 1;
  const emojiEl = document.getElementById('tanod-emoji-disp');
  const nameEl  = document.getElementById('tanod-name-disp');
    if (emojiEl) emojiEl.textContent = GS.character ? GS.character.emoji : '🛡️';
    if (nameEl)  nameEl.textContent  = GS.character ? GS.character.name  : 'PLAYER ' + player;
}

function updateLevelSidebar() {
  document.querySelectorAll('.lvl-item').forEach(el => {
    const lv = +el.dataset.lv;
    el.classList.remove('active','done');
    const dotEl = el.querySelector('.lvl-dot');
    if (GS.levelsDone.includes(lv)) { el.classList.add('done'); dotEl.textContent = '●'; }
    else if (lv === GS.level) { el.classList.add('active'); dotEl.textContent = '►'; }
    else { dotEl.textContent = '○'; }
  });
}

// ═══════════════════════════════════════════════════
// XP SYSTEM
// ═══════════════════════════════════════════════════
function addXP(amount, el) {
  if (amount <= 0) return;
  GS.xp = Math.max(0, GS.xp + amount);
  updateHUD();
  if (el) floatXP('+' + amount + ' XP', el);
  else     floatXPCenter('+' + amount + ' XP');
  chime();
}

function loseXP(amount) {
  GS.xp = Math.max(0, GS.xp - amount);
  GS.streak = 0;
  updateHUD();
  buzzer();
  flashScreen('red');
}

function floatXPCenter(text) {
  xpFloat.textContent = text;
  xpFloat.style.display = 'block';
  xpFloat.style.left = '50%';
  xpFloat.style.top  = '40%';
  xpFloat.style.transform = 'translateX(-50%)';
  xpFloat.style.animation = 'none';
  void xpFloat.offsetWidth;
  xpFloat.style.animation = 'float-up 1.2s ease-out forwards';
  setTimeout(()=>{ xpFloat.style.display='none'; }, 1300);
}

function floatXP(text, el) {
  const rect = el.getBoundingClientRect();
  const parentRect = document.getElementById('main-area').getBoundingClientRect();
  xpFloat.textContent = text;
  xpFloat.style.display = 'block';
  xpFloat.style.left = (rect.left - parentRect.left + rect.width/2 - 50) + 'px';
  xpFloat.style.top  = (rect.top  - parentRect.top) + 'px';
  xpFloat.style.animation = 'none';
  void xpFloat.offsetWidth;
  xpFloat.style.animation = 'float-up 1.2s ease-out forwards';
  setTimeout(()=>{ xpFloat.style.display='none'; }, 1300);
}

function flashScreen(color) {
  screenFlash.className = '';
  void screenFlash.offsetWidth;
  screenFlash.className = color === 'green' ? 'flash-green' : 'flash-red';
}

function registerCorrect(xpAmount, btn) {
  GS.streak++;
  if (GS.streak === 5) { addXP(20, btn); } // streak bonus
  addXP(xpAmount, btn);
  flashScreen('green');
}

function registerWrong(penaltyXP, msg, correctInfo) {
  loseXP(penaltyXP);
  showFeedback(false, '⚠ MALI!', msg, correctInfo, 3);
}

// ═══════════════════════════════════════════════════
// FEEDBACK OVERLAY
// ═══════════════════════════════════════════════════
function showFeedback(correct, title, msg, extraInfo='', duration=3) {
  feedbackOverlay.style.display = 'flex';
  $('feedback-box').className = correct ? 'correct-fb' : 'wrong-fb';
  fbIcon.textContent  = correct ? '✅' : '❌';
  fbTitle.textContent = title;
  fbMsg.textContent   = msg + (extraInfo ? '\n' + extraInfo : '');
  fbMsg.style.whiteSpace = 'pre-line';

  let t = duration;
  fbCount.textContent = t;
  clearTimeout(feedbackTimeout);
  const iv = setInterval(()=>{
    t--;
    fbCount.textContent = t;
    if (t <= 0) { clearInterval(iv); feedbackOverlay.style.display = 'none'; }
  }, 1000);
}

// ═══════════════════════════════════════════════════
// LEVEL TRANSITION
// ═══════════════════════════════════════════════════
const LEVEL_META = {
  1: { name:'CONVEYOR BELT',   desc:'Sort each data packet — SHARE or KEEP PRIVATE!', boss: false },
  2: { name:'SPOT THE PHISH',  desc:'Click ALL suspicious elements in the email!',     boss: false },
  3: { name:'PASSWORD POWER',  desc:'Choose the STRONGEST password!',                 boss: false },
  4: { name:'SPEED ROUND',     desc:'Vote SAFE or UNSAFE — fast!',                    boss: false },
  5: { name:'LINK INSPECTOR',  desc:'Is the URL SAFE or FAKE?',                       boss: false },
  6: { name:'SCAM INBOX',      desc:'Memorize the emails, then answer from memory!',  boss: false },
  7: { name:'SAFE PROFILE',    desc:'Toggle each field: PUBLIC or PRIVATE!',          boss: false },
  8: { name:'BOSS LEVEL',      desc:'3 challenges in 90 seconds — don\'t get BREACHED!', boss: true },
};

function showLevelTransition(lvNum) {
  clearAllTimers();
  levelContent.innerHTML = '';
  feedbackOverlay.style.display = 'none';
  levelSplash.style.display = 'flex';

  GS.level = lvNum;
  updateHUD();

  const meta = LEVEL_META[lvNum];
  const splashLvl  = $('splash-lvl');
  const splashName = $('splash-name');
  const splashDesc = $('splash-desc');
  const splashCount= $('splash-count');

  if (lvNum === 8) bossSound();
  else levelUp();

  splashLvl.textContent  = 'LEVEL ' + lvNum;
  splashName.textContent = meta.name;
  splashDesc.textContent = meta.desc;
  splashName.className   = meta.boss ? 'boss-splash' : '';

  if (lvNum > 2 && (lvNum - 1) % 2 === 0) {
    GS.playerIndex = (GS.playerIndex + 1) % 4;
  }

  // Show a BEGIN button so facilitator can explain the level before starting
  splashCount.innerHTML = '<button id="begin-level-btn" class="retro-btn btn-primary">BEGIN LEVEL</button>';
  const beginBtn = $('begin-level-btn');
  function onBegin() {
    if (beginBtn) beginBtn.removeEventListener('click', onBegin);
    splashCount.textContent = '';
    setTimeout(() => {
      levelSplash.style.display = 'none';
      startLevel(lvNum);
    }, 200);
  }
  if (beginBtn) beginBtn.addEventListener('click', onBegin);
}

function completeLevel(lvNum) {
  if (!GS.levelsDone.includes(lvNum)) GS.levelsDone.push(lvNum);
  clearAllTimers();
  feedbackOverlay.style.display = 'none';

  if (lvNum >= 8) {
    showFinalScreen();
    return;
  }

  // Show brief success splash then auto-advance
  levelSplash.style.display = 'flex';
  $('splash-lvl').textContent  = '✅ LEVEL ' + lvNum + ' COMPLETE!';
  $('splash-name').textContent = 'LEVEL UP!';
  $('splash-desc').textContent = '';
  $('splash-count').textContent = '';
  $('splash-name').className = '';
  levelUp();
  setTimeout(() => showLevelTransition(lvNum + 1), 2000);
}

// ═══════════════════════════════════════════════════
// LEVEL DISPATCHER
// ═══════════════════════════════════════════════════
function startLevel(n) {
  levelContent.innerHTML = '';
  switch(n) {
    case 1: startLevel1(); break;
    case 2: startLevel2(); break;
    case 3: startLevel3(); break;
    case 4: startLevel4(); break;
    case 5: startLevel5(); break;
    case 6: startLevel6(); break;
    case 7: startLevel7(); break;
    case 8: startLevel8(); break;
  }
}

// ═══════════════════════════════════════════════════
// LEVEL 1 — CONVEYOR BELT (Data Classification)
// ═══════════════════════════════════════════════════
function startLevel1() {
  let items = [
    { label: '📛 Full Name',        answer: 'private', xp: 10 },
    { label: '🎨 Favorite Color',   answer: 'share',   xp: 10 },
    { label: '🏠 Home Address',     answer: 'private', xp: 10 },
    { label: '🏫 School Name',      answer: 'share',   xp: 10 },
    { label: '🔑 Password',         answer: 'private', xp: 10 },
    { label: '🐾 Pet\'s Name',      answer: 'share',   xp: 10 },
    { label: '📅 Birthday (Full)',  answer: 'private', xp: 10 },
    { label: '👤 Username',         answer: 'share',   xp: 10 },
    { label: '📞 Phone Number',     answer: 'private', xp: 10 },
    { label: '🎮 Hobby',            answer: 'share',   xp: 10 },
  ];

  // shuffle items so packets appear in random order
  (function shuffle(a){
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  })(items);

  let currentIdx = 0;
  let correct = 0, wrong = 0;
  let done = false;
  let answering = false;
  const TOTAL_TIME = 60;
  let timeLeft = TOTAL_TIME;

  levelContent.innerHTML = `
    <div id="belt-new-wrap">
      <div id="belt-top-bar">
        <div id="belt-score-info">
          <span style="font-family:var(--font-pixel);font-size:10px;color:var(--white-dim)">
            PACKET <span id="l1-idx" style="color:var(--gold)">1</span> of ${items.length}
          </span>
          <span style="font-family:var(--font-pixel);font-size:10px;color:var(--white-dim)">
            ✅ <span id="l1-correct" style="color:var(--lime)">0</span>
            &nbsp; ❌ <span id="l1-wrong" style="color:var(--red)">0</span>
          </span>
        </div>
        <div id="belt-timer-row">
          <div id="belt-timer-track">
            <div id="belt-timer-fill"></div>
          </div>
          <span id="belt-timer-label">${TOTAL_TIME}s left</span>
        </div>
      </div>
      <div id="belt-dots-row">
        ${items.map((_,i) => `<div class="belt-dot" id="bdot-${i}"></div>`).join('')}
      </div>
      <div id="belt-arena">
        <div id="belt-camera">
          <div id="belt-scene">
            <div id="belt-track"></div>
            <div id="belt-packet-card">
              <div class="packet-label">DATA PACKET</div>
              <div class="packet-name" id="packet-name-el"></div>
              <div class="packet-arrow">↓</div>
            </div>
          </div>
        </div>
        <div id="belt-dir-left">← SHARE THIS WAY</div>
        <div id="belt-dir-right">KEEP PRIVATE THIS WAY →</div>
      </div>
      <div id="belt-action-buttons">
        <button id="btn-share-new" class="belt-action-btn share-btn">
          <div class="btn-arrow-big">←</div>
          <div class="btn-action-label">SHARE</div>
          <div class="btn-key-label">press LEFT arrow</div>
        </button>
        <button id="btn-private-new" class="belt-action-btn private-btn">
          <div class="btn-arrow-big">→</div>
          <div class="btn-action-label">KEEP PRIVATE</div>
          <div class="btn-key-label">press RIGHT arrow</div>
        </button>
      </div>
      <div id="belt-hint">Decide before time runs out!</div>
    </div>
  `;

  const timerFill  = $('belt-timer-fill');
  const timerLabel = $('belt-timer-label');
  const packetCard = $('belt-packet-card');
  const packetName = $('packet-name-el');

  function updateDots(idx) {
    items.forEach((_,i) => {
      const d = $('bdot-'+i);
      if (!d) return;
      d.className = 'belt-dot' + (i < idx ? ' done' : i === idx ? ' active' : '');
    });
  }

  function showItem(idx) {
    if (idx >= items.length || done) return;
    $('l1-idx').textContent = idx + 1;
    packetName.textContent = items[idx].label;
    updateDots(idx);
    // start rolling animation across the belt
    packetCard.classList.remove('packet-rolling');
    packetCard.style.transition = 'none';
    packetCard.style.transform = 'none';
    void packetCard.offsetWidth;
    packetCard.classList.add('packet-rolling');
    packetCard.style.opacity = '1';
  }

  function answer(choice) {
    if (done || answering || currentIdx >= items.length) return;
    answering = true;
    const item = items[currentIdx];

    const computed = window.getComputedStyle(packetCard).transform;
    packetCard.classList.remove('packet-rolling');
    packetCard.style.transform = computed;
    void packetCard.offsetWidth;

    // stop rolling and fly the packet off in chosen direction
    const flyDir = choice === 'share' ? '-220px' : '220px';
    packetCard.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    packetCard.style.transform = computed === 'none' ? `translateX(${flyDir})` : `${computed} translateX(${flyDir})`;
    packetCard.style.opacity = '0';

    if (choice === item.answer) {
      correct++;
      $('l1-correct').textContent = correct;
      registerCorrect(item.xp, packetCard);
    } else {
      wrong++;
      $('l1-wrong').textContent = wrong;
      loseXP(5);
      showFeedback(false, '⚠ MALI!', item.answer === 'private' ? '🔒 Dapat PRIVATE yan!' : '📤 Pwede nang i-SHARE yan!', '', 2);
    }
    blip();
    currentIdx++;

    if (currentIdx >= items.length) {
      done = true;
      clearAllTimers();
      document.removeEventListener('keydown', l1Key);
      if (correct === items.length) addXP(20, null);
      setTimeout(() => completeLevel(1), 1200);
    } else {
      setTimeout(() => { answering = false; showItem(currentIdx); }, 350);
    }
  }

  $('btn-share-new').addEventListener('click',   () => answer('share'));
  $('btn-private-new').addEventListener('click', () => answer('private'));

  document.addEventListener('keydown', l1Key);
  function l1Key(e) {
    if (e.key === 'ArrowLeft')  answer('share');
    if (e.key === 'ArrowRight') answer('private');
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    const pct = (timeLeft / TOTAL_TIME * 100);
    timerFill.style.width = pct + '%';
    timerLabel.textContent = timeLeft + 's left';
    if (timeLeft <= 10)      { timerFill.classList.add('timer-red');    timerFill.classList.remove('timer-yellow'); }
    else if (timeLeft <= 20) { timerFill.classList.add('timer-yellow'); }
    if (timeLeft <= 0) {
      done = true;
      clearAllTimers();
      document.removeEventListener('keydown', l1Key);
      showFeedback(false, 'TIME IS UP!', `Nasagot: ${correct}/${items.length}`, '', 2);
      setTimeout(() => completeLevel(1), 3000);
    }
  }, 1000);

  showItem(0);
  levelContent.addEventListener('removed', () => document.removeEventListener('keydown', l1Key));
}

// ═══════════════════════════════════════════════════
// LEVEL 2 — SPOT THE PHISH
// ═══════════════════════════════════════════════════
const PHISH_EMAILS = [
  {
    from:    'kapitan@brgy-sanjose.c0m',
    to:      'tanod@barangay.ph',
    subject: 'URGENT: Verify Your Account NOW!!!',
    body: [
      { text: 'Dear Resident,', click: false },
      { text: ' Your account has been COMPROMISED!!! Click here NOW to verify:', click: false },
      { text: ' CLICK HERE NOW →', click: true, hint: '"Click here NOW" urgency link' },
      { text: ' Or visit: ', click: false },
      { text: 'http://brgy-sanjose-verify.freesite.net', click: true, hint: 'Suspicious link — not official .gov.ph' },
      { text: ' Failure to comply will result in IMMEDIATE SUSPENSION!!!', click: false },
      { text: ' — Kap. dela Cruz', click: false },
    ],
    susItems: [0,1], // indices of click:true that are suspicious (sender + link + urgency)
    allBad: 3,       // total bad elements including sender
    notes: 'Red flags: fake sender, urgency language, suspicious link'
  },
  {
    from:    'gcash-support@gcash-rewards-ph.xyz',
    to:      'you@email.com',
    subject: 'You have won 5000 PESOS! Claim now!',
    body: [
      { text: 'Congratulations!!!', click: false },
      { text: ' You have been selected for a SPECIAL REWARD of ₱5,000!', click: false },
      { text: ' To claim, send your ', click: false },
      { text: 'full name, birthday, and PIN', click: true, hint: 'Asking for personal info + PIN — NEVER share!' },
      { text: ' to this number: 09XX-XXX-XXXX.', click: false },
      { text: ' Act fast — offer expires in 1 HOUR!!!', click: true, hint: 'Artificial urgency tactic' },
      { text: ' Claim here: ', click: false },
      { text: 'http://gcash-promo.free.nf/claim', click: true, hint: 'Fake GCash site — not gcash.com.ph' },
    ],
    allBad: 3,
    notes: 'Red flags: asking for PIN, fake domain, unrealistic prize'
  },
];

function startLevel2() {
  let emailIdx = 0;
  let totalFound = 0;
  let totalNeeded = 0;
  PHISH_EMAILS.forEach(e => totalNeeded += e.allBad);
  let wrongClicks = 0;
  const TOTAL_TIME = 45;
  let timeLeft = TOTAL_TIME;
  let clickedCount = 0;
  let emailDone = [0, 0];

  levelContent.innerHTML = `
    <div id="phish-wrap">
      <div class="level-header">CLICK ALL SUSPICIOUS ELEMENTS!</div>
      <div style="display:flex;gap:16px;align-items:center">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l2-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l2-timer-num">${TOTAL_TIME}</span>
      </div>
      <div id="phish-btn-area" style="display:flex;justify-content:space-between;align-items:center">
        <span id="phish-found-count" style="font-family:var(--font-pixel);font-size:12px;color:var(--gold)">FOUND: 0 / ${totalNeeded}</span>
        <span id="phish-round-info" style="font-family:var(--font-pixel);font-size:11px;color:var(--gray)">EMAIL 1 / 2</span>
      </div>
      <div id="phish-email-container"></div>
    </div>
  `;

  timerInterval = setInterval(() => {
    timeLeft--;
    $('l2-timer-num').textContent = timeLeft;
    $('l2-timer-fill').style.width = (timeLeft / TOTAL_TIME * 100) + '%';
    if (timeLeft <= 0) {
      clearAllTimers();
      finishPhish();
    }
  }, 1000);

  function renderEmail(idx) {
    const email = PHISH_EMAILS[idx];
    $('phish-round-info').textContent = `EMAIL ${idx+1} / 2`;
    const container = $('phish-email-container');
    container.innerHTML = `
      <div class="phish-email-header">
        <div class="phish-field"><span class="phish-label">FROM: </span><span id="phish-from" class="phish-clickable" data-type="sender">${email.from}</span></div>
        <div class="phish-field"><span class="phish-label">TO: </span>${email.to}</div>
        <div class="phish-field"><span class="phish-label">SUBJECT: </span>${email.subject}</div>
      </div>
      <div class="phish-body" id="phish-body"></div>
    `;
    const bodyEl = $('phish-body');
    email.body.forEach((seg, si) => {
      if (seg.click) {
        const sp = document.createElement('span');
        sp.className = 'phish-clickable';
        sp.textContent = seg.text;
        sp.dataset.seg = si;
        sp.dataset.hint = seg.hint;
        sp.addEventListener('click', () => clickSegment(sp, idx, si, true));
        bodyEl.appendChild(sp);
      } else {
        bodyEl.appendChild(document.createTextNode(seg.text));
      }
    });
    // Sender is always suspicious
    $('phish-from').addEventListener('click', () => {
      const el = $('phish-from');
      if (el.classList.contains('found')) return;
      el.classList.add('found');
      totalFound++;
      emailDone[idx]++;
      $('phish-found-count').textContent = `FOUND: ${totalFound} / ${totalNeeded}`;
      blip();
      floatXPCenter('+10 XP');
      GS.xp += 10; updateHUD();
      if (emailDone[idx] >= email.allBad || emailDone[idx] >= email.body.filter(s=>s.click).length + 1) {
        setTimeout(() => nextEmail(idx), 800);
      }
    });
  }

  function clickSegment(el, emailIdx, segIdx, isBad) {
    if (el.classList.contains('found')) return;
    if (isBad) {
      el.classList.add('found');
      totalFound++;
      emailDone[emailIdx]++;
      $('phish-found-count').textContent = `FOUND: ${totalFound} / ${totalNeeded}`;
      blip();
      floatXPCenter('+10 XP');
      GS.xp += 10; updateHUD();
      const hint = el.dataset.hint || 'Suspicious element!';
      showFeedback(true, '🎯 FOUND IT!', hint, '', 1);
      if (emailDone[emailIdx] >= PHISH_EMAILS[emailIdx].allBad) {
        setTimeout(() => nextEmail(emailIdx), 1200);
      }
    } else {
      el.classList.add('wrong');
      wrongClicks++;
      loseXP(5);
      setTimeout(() => el.classList.remove('wrong'), 400);
    }
  }

  function nextEmail(idx) {
    if (idx + 1 < PHISH_EMAILS.length) {
      emailIdx = idx + 1;
      renderEmail(emailIdx);
    } else {
      finishPhish();
    }
  }

  function finishPhish() {
    clearAllTimers();
    const xpEarned = Math.round((totalFound / totalNeeded) * 60);
    addXP(xpEarned > 0 ? xpEarned : 0, null);
    completeLevel(2);
  }

  renderEmail(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 3 — PASSWORD POWER-UP (MCQ)
// ═══════════════════════════════════════════════════
const PW_ROUNDS = [
  {
    question: 'Which password is STRONGEST?',
    options:  ['12345', 'MySunshine', 'M@ri0_2024!', 'password'],
    correct:  2,
    explanation: 'M@ri0_2024! has uppercase, numbers, symbols, and length!'
  },
  {
    question: 'Pick the STRONGEST password:',
    options:  ['Juan123', 'Br@y_SanJose#9', 'hello', 'CAPITALONLY'],
    correct:  1,
    explanation: 'Br@y_SanJose#9 combines letters, symbols, numbers!'
  },
  {
    question: 'Which one would HACKERS hate most?',
    options:  ['iloveyou', 'Pass1234', 'qwerty!', 'T@nd@7_Brgy#2024'],
    correct:  3,
    explanation: 'T@nd@7_Brgy#2024 is long, random, and complex!'
  },
];

function startLevel3() {
  let roundIdx = 0;
  let roundsCorrect = 0;

  levelContent.innerHTML = `
    <div id="pw-wrap">
      <div class="level-header">CHOOSE THE STRONGEST PASSWORD</div>
      <div id="pw-round-info" style="font-family:var(--font-pixel);font-size:12px;color:var(--gray);text-align:center">ROUND 1 / 3</div>
      <div style="display:flex;gap:16px;align-items:center">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l3-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l3-timer-num">15</span>
      </div>
      <div id="pw-question" style="font-family:var(--font-mono);font-size:clamp(16px,2vw,20px);color:var(--white);text-align:center"></div>
      <div id="pw-options" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1"></div>
      <div id="pw-feedback" style="font-family:var(--font-mono);font-size:16px;color:var(--white);text-align:center;min-height:30px"></div>
    </div>
  `;

  function showRound(idx) {
    const round = PW_ROUNDS[idx];
    const timePerRound = 15;
    let timeLeft = timePerRound;
    let answered = false;

    $('pw-round-info').textContent = `ROUND ${idx+1} / 3`;
    $('pw-question').textContent = round.question;
    $('pw-feedback').textContent = '';
    $('l3-timer-num').textContent = timeLeft;
    $('l3-timer-fill').style.width = '100%';

    const optionsEl = $('pw-options');
    optionsEl.innerHTML = '';
    round.options.forEach((pw, oi) => {
      const btn = document.createElement('button');
      btn.className = 'pw-option';
      btn.textContent = pw;
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        clearInterval(timerInterval);
        btn.classList.add(oi === round.correct ? 'correct' : 'wrong');
        if (oi === round.correct) {
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          roundsCorrect++;
          const fastBonus = timeLeft >= (timePerRound - 8);
          registerCorrect(20, btn);
          if (fastBonus) addXP(10, btn);
          $('pw-feedback').textContent = '✅ ' + round.explanation;
          $('pw-feedback').style.color = 'var(--green)';
        } else {
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          loseXP(5);
          $('pw-feedback').textContent = '❌ ' + round.explanation;
          $('pw-feedback').style.color = 'var(--red)';
        }
        setTimeout(() => {
          if (idx + 1 < PW_ROUNDS.length) showRound(idx + 1);
          else {
            if (roundsCorrect === PW_ROUNDS.length) addXP(20, null);
            completeLevel(3);
          }
        }, 2000);
      });
      optionsEl.appendChild(btn);
    });

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      $('l3-timer-num').textContent = timeLeft;
      $('l3-timer-fill').style.width = (timeLeft / timePerRound * 100) + '%';
      if (timeLeft <= 5) $('l3-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0) {
        if (!answered) {
          answered = true;
          clearInterval(timerInterval);
          const fbEl = $('l3-feedback');
          if (!fbEl) return;
          fbEl.textContent = '⏰ TIME! ' + round.explanation;
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          loseXP(5);
          setTimeout(()=>{
            if (idx+1 < PW_ROUNDS.length) showRound(idx+1);
            else completeLevel(3);
          }, 2000);
        }
      }
    }, 1000);
  }

  showRound(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 4 — SAFE OR UNSAFE SPEED ROUND
// ═══════════════════════════════════════════════════
const SPEED_SCENARIOS = [
  { text: 'A stranger online asks for your school address.', icon:'👤', answer:'unsafe', xp:5 },
  { text: 'You use HTTPS websites for research.', icon:'🔒', answer:'safe', xp:5 },
  { text: 'You use the same password for ALL your apps.', icon:'🔑', answer:'unsafe', xp:5 },
  { text: 'You log out of shared computers after use.', icon:'💻', answer:'safe', xp:5 },
  { text: 'You click a link from an unknown email.', icon:'📧', answer:'unsafe', xp:5 },
  { text: 'You enable 2-factor authentication on GCash.', icon:'📱', answer:'safe', xp:5 },
  { text: 'You share your OTP code with a "GCash agent".', icon:'💬', answer:'unsafe', xp:5 },
  { text: 'You update your apps when notified.', icon:'🔄', answer:'safe', xp:5 },
  { text: 'You save passwords in a shared notebook.', icon:'📓', answer:'unsafe', xp:5 },
  { text: 'You use a strong password with symbols and numbers.', icon:'🛡️', answer:'safe', xp:5 },
  { text: 'You post your full birthday on social media.', icon:'🎂', answer:'unsafe', xp:5 },
  { text: 'You check URLs before clicking links.', icon:'🔍', answer:'safe', xp:5 },
  { text: 'You download apps from unofficial websites.', icon:'⬇️', answer:'unsafe', xp:5 },
  { text: 'You use a VPN on public Wi-Fi.', icon:'📡', answer:'safe', xp:5 },
  { text: 'You share your home address in a public chat group.', icon:'🏠', answer:'unsafe', xp:5 },
];

function startLevel4() {
  let idx = 0;
  let correct = 0, wrong = 0;
  let timeLeft = 5;
  let answered = false;
  let multiplier = 1;
  let streakForMultiplier = 0;

  levelContent.innerHTML = `
    <div id="speed-wrap">
      <div style="display:flex;gap:20px;align-items:center;justify-content:space-between;width:100%">
        <span id="speed-counter" style="font-family:var(--font-pixel);font-size:14px;color:var(--gray)">SCENARIO 1 / ${SPEED_SCENARIOS.length}</span>
        <div class="level-timer-bar" style="width:200px">
          <div class="level-timer-bar-fill" id="l4-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span id="l4-timer-num" style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:28px">5</span>
        <span id="speed-multiplier" style="font-family:var(--font-pixel);font-size:12px;color:var(--gold)">×1</span>
      </div>
      <div id="speed-scenario">
        <span class="scenario-icon" id="speed-icon">?</span>
        <span id="speed-text"></span>
      </div>
      <div id="speed-buttons">
        <button class="retro-btn btn-safe" id="btn-speed-safe" style="font-size:20px;padding:20px 40px">✅ SAFE</button>
        <button class="retro-btn btn-unsafe" id="btn-speed-unsafe" style="font-size:20px;padding:20px 40px">⛔ UNSAFE</button>
      </div>
    </div>
  `;

  function showScenario(i) {
    if (i >= SPEED_SCENARIOS.length) {
      clearInterval(timerInterval);
      completeLevel(4);
      return;
    }
    const sc = SPEED_SCENARIOS[i];
    answered = false;
    timeLeft = 5;
    $('speed-icon').textContent = sc.icon;
    $('speed-text').textContent = sc.text;
    $('speed-counter').textContent = `SCENARIO ${i+1} / ${SPEED_SCENARIOS.length}`;
    $('l4-timer-num').textContent = timeLeft;
    $('l4-timer-fill').style.width = '100%';
    $('l4-timer-fill').classList.remove('timer-red','timer-yellow');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      $('l4-timer-num').textContent = timeLeft;
      $('l4-timer-fill').style.width = (timeLeft / 5 * 100) + '%';
      if (timeLeft <= 2) $('l4-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0 && !answered) {
        answered = true;
        clearInterval(timerInterval);
        streakForMultiplier = 0;
        multiplier = 1;
        $('speed-multiplier').textContent = '×' + multiplier;
        loseXP(5);
        showFeedback(false,'⏰ TOO SLOW!', sc.answer === 'safe' ? 'Ito ay SAFE!' : 'Ito ay UNSAFE!', '', 1);
        setTimeout(() => showScenario(i+1), 1500);
      }
    }, 1000);
  }

  function answer(choice) {
    if (answered) return;
    answered = true;
    clearInterval(timerInterval);
    const sc = SPEED_SCENARIOS[idx];
    if (choice === sc.answer) {
      correct++;
      streakForMultiplier++;
      if (streakForMultiplier >= 5) multiplier = 2;
      $('speed-multiplier').textContent = '×' + multiplier;
      const earned = sc.xp * multiplier;
      registerCorrect(earned, choice === 'safe' ? $('btn-speed-safe') : $('btn-speed-unsafe'));
      flashScreen('green');
    } else {
      wrong++;
      streakForMultiplier = 0;
      multiplier = 1;
      $('speed-multiplier').textContent = '×' + multiplier;
      loseXP(5);
      showFeedback(false, '❌ MALI!', sc.answer === 'safe' ? '✅ Ito ay SAFE.' : '⛔ Ito ay UNSAFE.', '', 1);
      flashScreen('red');
    }
    idx++;
    setTimeout(() => showScenario(idx), 1200);
  }

  $('btn-speed-safe').addEventListener('click',   () => answer('safe'));
  $('btn-speed-unsafe').addEventListener('click',  () => answer('unsafe'));

  showScenario(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 5 — SUSPICIOUS LINK / URL INSPECTOR
// ═══════════════════════════════════════════════════
const URL_ITEMS = [
  { url: 'https://deped.gov.ph',                    answer: 'safe', reason: '✅ Official .gov.ph domain = SAFE!' },
  { url: 'http://depd-ph.weebly.com',               answer: 'fake', reason: '❌ Fake: misspelled + weebly.com = NOT official' },
  { url: 'https://gcash-rewards.ph.freesite.net',   answer: 'fake', reason: '❌ Fake: gcash is NOT on freesite.net' },
  { url: 'https://www.bsp.gov.ph',                  answer: 'safe', reason: '✅ Official BSP government site' },
  { url: 'https://fb-security-update.xyz',          answer: 'fake', reason: '❌ Fake: Facebook never uses .xyz domain' },
];

function startLevel5() {
  let idx = 0;
  let score = 0;
  let timeLeft = 10;

  levelContent.innerHTML = `
    <div id="url-wrap">
      <div class="level-header">IS THIS URL SAFE OR FAKE?</div>
      <div style="display:flex;gap:16px;align-items:center;width:100%">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l5-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l5-timer-num">10</span>
      </div>
      <div id="url-counter" style="font-family:var(--font-pixel);font-size:12px;color:var(--gray)">URL 1 / 5</div>
      <div id="url-browser-frame">
        <div id="url-browser-titlebar">
          <div class="browser-dot bd-red"></div>
          <div class="browser-dot bd-yellow"></div>
          <div class="browser-dot bd-green"></div>
          <span style="font-family:var(--font-mono);font-size:12px;color:var(--gray);margin-left:10px">CYBER TANOD BROWSER v1.0</span>
        </div>
        <div id="url-browser-bar"></div>
        <div id="url-browser-content">Analyzing URL...</div>
      </div>
      <div id="url-question" style="font-family:var(--font-pixel);font-size:14px;color:var(--white);text-align:center">
        Read the URL carefully with your team!
      </div>
      <div id="url-buttons">
        <button class="retro-btn btn-safe" id="btn-url-safe" style="font-size:18px;padding:18px 36px">✅ SAFE</button>
        <button class="retro-btn btn-unsafe" id="btn-url-fake" style="font-size:18px;padding:18px 36px">⛔ FAKE</button>
      </div>
    </div>
  `;

  function showURL(i) {
    if (i >= URL_ITEMS.length) { clearInterval(timerInterval); completeLevel(5); return; }
    const item = URL_ITEMS[i];
    let answered = false;
    timeLeft = 10;
    $('url-counter').textContent = `URL ${i+1} / 5`;
    $('url-browser-bar').textContent = item.url;
    $('url-browser-content').textContent = 'Read the URL carefully. Team — discuss!';
    $('l5-timer-num').textContent = timeLeft;
    $('l5-timer-fill').style.width = '100%';
    $('l5-timer-fill').classList.remove('timer-red','timer-yellow');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      $('l5-timer-num').textContent = timeLeft;
      $('l5-timer-fill').style.width = (timeLeft / 10 * 100) + '%';
      if (timeLeft <= 3) $('l5-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0 && !answered) {
        answered = true;
        clearInterval(timerInterval);
        loseXP(5);
        $('url-browser-content').textContent = item.reason;
        showFeedback(false, '⏰ TIME!', item.reason, '', 2);
        setTimeout(() => showURL(i+1), 3000);
      }
    }, 1000);

    function ans(choice) {
      if (answered) return;
      answered = true;
      clearInterval(timerInterval);
      if (choice === item.answer) {
        score++;
        registerCorrect(15, $('btn-url-safe'));
        $('url-browser-content').textContent = item.reason;
        showFeedback(true, '🎯 TAMA!', item.reason, '', 2);
        flashScreen('green');
      } else {
        loseXP(5);
        $('url-browser-content').textContent = item.reason;
        showFeedback(false, '❌ MALI!', item.reason, '', 2);
        flashScreen('red');
      }
      setTimeout(() => showURL(i+1), 3000);
    }

    $('btn-url-safe').onclick = () => ans('safe');
    $('btn-url-fake').onclick = () => ans('fake');
  }

  showURL(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 6 — SCAM INBOX MEMORY
// ═══════════════════════════════════════════════════
const MEMORY_EMAILS = [
  {
    from: 'prizes@win-gcash-now.xyz',
    subject: 'YOU WON ₱10,000! CLAIM NOW!',
    body: 'You have been selected! Send your full name, birthday, and bank details to claim your prize. Offer expires TONIGHT!'
  },
  {
    from: 'admin@brgy-sanjose.free.nf',
    subject: 'URGENT: Account Verification Required',
    body: 'Your barangay ID is about to expire. Click the link below to verify. Failure to comply = account suspended.'
  },
  {
    from: 'support@gcash-ph-official.com',
    subject: 'Security Alert: Unauthorized Login',
    body: 'Someone tried to access your GCash. Send your OTP immediately to: 09XX-XXX-XXXX to secure your account.'
  },
];
const MEMORY_QUESTIONS = [
  { text: 'One sender\'s email ended in .gov.ph', answer: false },
  { text: 'One email offered free prizes (₱10,000)', answer: true },
  { text: 'One subject line said "URGENT"', answer: true },
  { text: 'All 3 emails asked for your OTP', answer: false },
  { text: 'One email mentioned a barangay ID', answer: true },
  { text: 'One email was from gcash.com.ph', answer: false },
];

function startLevel6() {
  let phase = 'flash'; // 'flash' or 'quiz'
  let flashTimeLeft = 12;
  let answered = 0;
  let correct = 0;

  levelContent.innerHTML = `
    <div id="memory-wrap">
      <div class="level-header">MEMORIZE THE EMAILS — THEN ANSWER!</div>
      <div id="memory-phase-label" style="font-family:var(--font-pixel);font-size:14px;color:var(--gold);text-align:center">
        📧 MEMORIZING... ${flashTimeLeft}s
      </div>
      <div style="display:flex;gap:16px;align-items:center">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l6-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l6-timer-num">${flashTimeLeft}</span>
      </div>
      <div id="memory-flash-area"></div>
      <div id="memory-questions" style="display:none"></div>
    </div>
  `;

  // Show all 3 emails
  const flashArea = $('memory-flash-area');
  MEMORY_EMAILS.forEach(em => {
    const div = document.createElement('div');
    div.className = 'memory-email-block';
    div.innerHTML = `
      <div class="memory-email-field"><span class="mem-label">FROM: </span>${em.from}</div>
      <div class="memory-email-field"><span class="mem-label">SUBJECT: </span>${em.subject}</div>
      <div class="memory-email-body">${em.body}</div>
    `;
    flashArea.appendChild(div);
  });

  timerInterval = setInterval(() => {
    flashTimeLeft--;
    $('l6-timer-num').textContent = flashTimeLeft;
    $('l6-timer-fill').style.width = (flashTimeLeft / 12 * 100) + '%';
    $('memory-phase-label').textContent = `📧 MEMORIZING... ${flashTimeLeft}s`;
    if (flashTimeLeft <= 0) {
      clearInterval(timerInterval);
      flashArea.style.display = 'none';
      startQuizPhase();
    }
  }, 1000);

  function startQuizPhase() {
    $('memory-phase-label').textContent = '🧠 ANSWER FROM MEMORY!';
    $('l6-timer-fill').style.width = '100%';
    const quizEl = $('memory-questions');
    quizEl.style.display = 'flex';

    MEMORY_QUESTIONS.forEach((q, qi) => {
      const div = document.createElement('div');
      div.className = 'mem-q-item';
      div.innerHTML = `
        <span class="mem-q-text">${qi+1}. ${q.text}</span>
        <div class="mem-q-buttons">
          <button class="mem-btn mem-btn-true" data-qi="${qi}" data-ans="true">TRUE</button>
          <button class="mem-btn mem-btn-false" data-qi="${qi}" data-ans="false">FALSE</button>
        </div>
      `;
      div.querySelectorAll('.mem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('answered')) return;
          const userAns = btn.dataset.ans === 'true';
          div.querySelectorAll('.mem-btn').forEach(b => b.classList.add('answered'));
          answered++;
          if (userAns === q.answer) {
            correct++;
            btn.classList.add('correct-ans');
            GS.xp += 15; GS.streak++; updateHUD();
            floatXPCenter('+15 XP');
            blip();
          } else {
            btn.classList.add('wrong-ans');
            const correctBtn = [...div.querySelectorAll('.mem-btn')].find(b => (b.dataset.ans === 'true') === q.answer);
            if (correctBtn) correctBtn.classList.add('correct-ans');
            loseXP(5);
          }
          if (answered >= MEMORY_QUESTIONS.length) {
            setTimeout(() => {
              if (correct === MEMORY_QUESTIONS.length) addXP(30, null);
              completeLevel(6);
            }, 1500);
          }
        });
      });
      quizEl.appendChild(div);
    });
  }
}

// ═══════════════════════════════════════════════════
// LEVEL 7 — BUILD-A-SAFE-PROFILE
// ═══════════════════════════════════════════════════
const PROFILE_FIELDS = [
  { name: '👤 Full Name',       correct: 'private' },
  { name: '😎 Nickname',        correct: 'public'  },
  { name: '🏫 School',          correct: 'public'  },
  { name: '📚 Grade Level',     correct: 'private' },
  { name: '🎂 Birthday',        correct: 'private' },
  { name: '📞 Phone Number',    correct: 'private' },
  { name: '❤️ Favorite Subject',correct: 'public'  },
  { name: '🏘️ Home Barangay',   correct: 'private' },
];

function startLevel7() {
  const states = new Array(PROFILE_FIELDS.length).fill('unset');

  levelContent.innerHTML = `
    <div id="profile-wrap">
      <div class="level-header">SET EACH FIELD: PUBLIC OR PRIVATE?</div>
      <div style="font-family:var(--font-mono);font-size:14px;color:var(--gray);text-align:center">
        Click each field to toggle. Submit when ready!
      </div>
      <div id="profile-grid"></div>
      <div id="profile-submit-row">
        <span id="profile-score" style="font-family:var(--font-pixel);font-size:12px;color:var(--gray)">Set all fields first</span>
        <button class="retro-btn btn-primary" id="profile-submit-btn" style="font-size:12px;padding:12px 20px">[ SUBMIT PROFILE ]</button>
      </div>
    </div>
  `;

  const grid = $('profile-grid');
  PROFILE_FIELDS.forEach((f, fi) => {
    const div = document.createElement('div');
    div.className = 'profile-field';
    div.innerHTML = `
      <span class="pf-name">${f.name}</span>
      <span class="pf-status unset" id="pf-status-${fi}">? UNSET</span>
    `;
    div.addEventListener('click', () => {
      if (states[fi] === 'unset') states[fi] = 'public';
      else if (states[fi] === 'public') states[fi] = 'private';
      else states[fi] = 'public';

      div.className = 'profile-field ' + states[fi];
      const statusEl = $(`pf-status-${fi}`);
      if (states[fi] === 'public')  { statusEl.textContent = '📤 PUBLIC';  statusEl.className = 'pf-status public-tag'; }
      else                           { statusEl.textContent = '🔒 PRIVATE'; statusEl.className = 'pf-status private-tag'; }
      blip();

      const setCount = states.filter(s => s !== 'unset').length;
      $('profile-score').textContent = `${setCount} / ${PROFILE_FIELDS.length} fields set`;
    });
    grid.appendChild(div);
  });

  $('profile-submit-btn').addEventListener('click', () => {
    const unset = states.filter(s=>s==='unset').length;
    if (unset > 0) {
      showFeedback(false,'⚠ INCOMPLETE!', `Please set all ${PROFILE_FIELDS.length} fields first!`, '', 2);
      return;
    }
    let correct = 0;
    let xpEarned = 0;
    PROFILE_FIELDS.forEach((f,fi) => {
      if (states[fi] === f.correct) { correct++; xpEarned += 10; }
    });
    if (correct === PROFILE_FIELDS.length) xpEarned += 20;
    addXP(xpEarned, null);
    showFeedback(
      correct >= 6,
      correct === 8 ? '🏆 PERPEKTO!' : correct >= 6 ? '✅ MAGALING!' : '📝 KAYA PA!',
      `${correct} / ${PROFILE_FIELDS.length} correct!`,
      correct < 8 ? 'Full Name, Birthday, Phone, Barangay = PRIVATE. Nickname, School, Favorite Subject = PUBLIC.' : '',
      2
    );
    setTimeout(()=>completeLevel(7), 3500);
  });
}

// ═══════════════════════════════════════════════════
// LEVEL 8 — BOSS LEVEL (3-Step Combined)
// ═══════════════════════════════════════════════════
function startLevel8() {
  let bossStep = 0; // 0,1,2
  let mistakes = 0;
  let totalTime = 90;
  let timeLeft = totalTime;
  let stepDone = [false,false,false];

  levelContent.innerHTML = `
    <div id="boss-wrap">
      <div id="boss-header">⚡ BOSS LEVEL: NETWORK DEFENDER ⚡</div>
      <div style="display:flex;gap:16px;align-items:center;width:100%">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l8-timer-fill" style="background:var(--red);transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:22px;color:var(--red);text-shadow:0 0 10px var(--red);min-width:36px" id="l8-timer-num">90</span>
      </div>
      <div id="boss-step-indicator">
        <div class="boss-step-dot active" id="bsd-0">STEP 1</div>
        <div class="boss-step-dot" id="bsd-1">STEP 2</div>
        <div class="boss-step-dot" id="bsd-2">STEP 3</div>
      </div>
      <div id="boss-content"></div>
    </div>
  `;

  timerInterval = setInterval(() => {
    timeLeft--;
    $('l8-timer-num').textContent = timeLeft;
    $('l8-timer-fill').style.width = (timeLeft / totalTime * 100) + '%';
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishBoss();
    }
  }, 1000);

  function showBreach(callback) {
    mistakes++;
    bossSound();
    const bossContent = $('boss-content');
    const breachDiv = document.createElement('div');
    breachDiv.id = 'boss-breach';
    breachDiv.innerHTML = `💀 BREACH! 💀<div id="boss-breach-subtitle">RECOVER BY ANSWERING CORRECTLY!</div>`;
    bossContent.appendChild(breachDiv);
    flashScreen('red');
    setTimeout(() => {
      breachDiv.remove();
      callback();
    }, 2000);
  }

  function updateStepIndicator(step) {
    for (let i=0;i<3;i++) {
      const el = $('bsd-'+i);
      if (stepDone[i]) el.className = 'boss-step-dot done';
      else if (i===step) el.className = 'boss-step-dot active';
      else el.className = 'boss-step-dot';
    }
  }

  function showStep0() {
    bossStep = 0;
    updateStepIndicator(0);
    const items = [
      { label: '📛 Full Name', answer: 'private' },
      { label: '🎮 Gaming Username', answer: 'share' },
      { label: '🏠 Home Address', answer: 'private' },
    ];
    let itemIdx = 0;

    function showItem() {
      if (itemIdx >= items.length) { stepDone[0]=true; showStep1(); return; }
      const item = items[itemIdx];
      $('boss-content').innerHTML = `
        <div style="font-family:var(--font-pixel);font-size:clamp(12px,1.5vw,16px);color:var(--cyan);text-align:center;margin-bottom:16px">
          STEP 1: CLASSIFY THIS DATA PACKET
        </div>
        <div style="font-family:var(--font-pixel);font-size:clamp(20px,3.5vw,32px);color:var(--gold);text-align:center;margin:20px 0;text-shadow:0 0 14px var(--gold)">
          ${item.label}
        </div>
        <div style="display:flex;gap:20px;justify-content:center">
          <button class="retro-btn btn-safe" id="boss-private" style="font-size:16px;padding:16px 28px">🔒 PRIVATE</button>
          <button class="retro-btn btn-unsafe" id="boss-share" style="background:var(--cyan);border-color:var(--cyan);color:var(--bg);font-size:16px;padding:16px 28px">📤 SHARE</button>
        </div>
      `;
      function ans(choice) {
        if (choice === item.answer) {
          addXP(10, $('boss-private'));
          itemIdx++;
          showItem();
        } else {
          showBreach(() => { showItem(); });
          loseXP(5);
        }
      }
      $('boss-private').onclick = () => ans('private');
      $('boss-share').onclick   = () => ans('share');
    }
    showItem();
  }

  function showStep1() {
    bossStep = 1;
    updateStepIndicator(1);
    const suspiciousItems = [
      { text: 'support@gcash-update-now.xyz', isBad: true },
      { text: 'CLICK HERE to secure your account NOW!', isBad: true },
      { text: 'Dear Customer', isBad: false },
    ];
    let found = 0;
    const needed = suspiciousItems.filter(s=>s.isBad).length;

    $('boss-content').innerHTML = `
      <div style="font-family:var(--font-pixel);font-size:clamp(12px,1.5vw,16px);color:var(--red);text-align:center;margin-bottom:12px">
        STEP 2: CLICK THE ${needed} SUSPICIOUS ELEMENTS!
      </div>
      <div id="boss-phish-area" style="background:var(--bg3);border:2px solid var(--red)55;padding:16px;font-family:var(--font-mono);font-size:clamp(14px,1.8vw,18px)">
        ${suspiciousItems.map((s,i)=>`<div class="phish-clickable" data-idx="${i}" style="display:block;padding:8px 0;border-bottom:1px solid var(--gray)22">${s.text}</div>`).join('')}
      </div>
      <div style="font-family:var(--font-pixel);font-size:12px;color:var(--gold);text-align:center;margin-top:10px">
        FOUND: <span id="boss-found">0</span> / ${needed}
      </div>
    `;
    document.querySelectorAll('#boss-phish-area .phish-clickable').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('found')) return;
        const idx = +el.dataset.idx;
        if (suspiciousItems[idx].isBad) {
          el.classList.add('found');
          found++;
          $('boss-found').textContent = found;
          addXP(10, el);
          if (found >= needed) { stepDone[1]=true; setTimeout(showStep2, 800); }
        } else {
          showBreach(() => { /* same step */ });
          loseXP(5);
        }
      });
    });
  }

  function showStep2() {
    bossStep = 2;
    updateStepIndicator(2);
    const options = ['password123','Brgy@Tanod#9','hello','qwerty'];
    const correct = 1;

    $('boss-content').innerHTML = `
      <div style="font-family:var(--font-pixel);font-size:clamp(12px,1.5vw,16px);color:var(--gold);text-align:center;margin-bottom:12px">
        STEP 3: CHOOSE THE STRONGEST PASSWORD!
      </div>
      <div id="boss-pw-opts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>
    `;
    options.forEach((pw, oi) => {
      const btn = document.createElement('button');
      btn.className = 'pw-option';
      btn.style.fontSize = 'clamp(14px,2vw,18px)';
      btn.textContent = pw;
      btn.addEventListener('click', () => {
        if (oi === correct) {
          btn.classList.add('correct');
          stepDone[2] = true;
          updateStepIndicator(2);
          addXP(10, btn);
          clearInterval(timerInterval);
          setTimeout(finishBoss, 1000);
        } else {
          btn.classList.add('wrong');
          showBreach(() => { /* remain on step */ });
          loseXP(5);
        }
      });
      $('boss-pw-opts').appendChild(btn);
    });
  }

  function finishBoss() {
    clearInterval(timerInterval);
    let xpBonus = 0;
    if (mistakes === 0) xpBonus = 30;
    else if (mistakes <= 2) xpBonus = 20;
    else xpBonus = 10;
    addXP(xpBonus + 50, null); // +50 completion bonus
    completeLevel(8);
  }

  showStep0();
}

// ═══════════════════════════════════════════════════
// FINAL SCORE SCREEN
// ═══════════════════════════════════════════════════
function showFinalScreen() {
  clearAllTimers();
  gameScreen.style.display = 'none';
  finalScreen.style.display = 'flex';

  const xp = GS.xp;
  let badge, icon, quote;

  if (xp <= 150) {
    badge = 'ROOKIE TANOD';
    icon  = '🪖';
    quote = '"Magaling! Hindi lang ito ang simula. Patuloy na mag-aral ng cybersecurity!"';
  } else if (xp <= 250) {
    badge = 'ACTIVE TANOD';
    icon  = '🛡️';
    quote = '"Outstanding! Kaya ng team na ito i-depensa ang barangay digital!"';
  } else if (xp <= 350) {
    badge = 'SENIOR TANOD';
    icon  = '⭐';
    quote = '"Kahanga-hanga! Mga cyber hero kayo ng barangay!"';
  } else {
    badge = 'CYBER TANOD ELITE';
    icon  = '🏆';
    quote = '"LEGENDARY! Walang hacker na kayang talunin ang team na ito!"';
  }

  $('final-team').textContent = '[ ' + GS.teamName + ' ]';
  $('final-badge-icon').textContent = icon;
  $('final-badge-label').textContent = badge;
  $('final-xp').textContent = xp + ' XP';
  $('final-quote').textContent = quote;

  const pct = Math.min((xp / 400) * 100, 100);
  levelUp();
  setTimeout(() => {
    $('final-xp-bar-fill').style.width = pct + '%';
  }, 500);

  $('play-again-btn').addEventListener('click', () => {
    finalScreen.style.display = 'none';
    GS.xp = 0; GS.streak = 0; GS.level = 0; GS.levelsDone = []; GS.playerIndex = 0;
    teamEntry.style.display = 'flex';
    setTimeout(() => teamInput.focus(), 100);
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  showTeamEntry();
});
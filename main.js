// ═══════════════════════════════════════════════════
// CYBER TANOD: BARANGAY DEFENSE FORCE
// Pure Vanilla JavaScript Game Engine
// ═══════════════════════════════════════════════════

// ── DEV / TEST MODE ──────────────────────────────
// Set to true to show the Test Mode section in Options.
// Set to false before deploying to players.
const DEV_MODE = false;

// ── LEVEL TIMINGS & SPEEDS ────────────────────────
// Change the countdown timers and specific level speeds here.
const LEVEL_SETTINGS = {
  1: { countdown: 60, speed: 5 },   // Level 1: total time, packet rolling speed (seconds)
  2: { countdown: 45 },             // Level 2: total time
  3: { countdown: 15 },             // Level 3: time per round
  4: { countdown: 5 },              // Level 4: time per scenario
  5: { countdown: 10 },             // Level 5: time per URL
  6: { countdown: 12 },             // Level 6: memorization time
  8: { countdown: 90 }              // Level 8: boss level total time
};

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
// ── GAME STATE ────────────────────────────────────
const GS = {
  teamName: '',
  xp: 0,
  streak: 0,
  level: 0,          // 1-8
  levelsDone: [],
  playerIndex: 0,    // 0-3, rotates every 2 levels
  character: { gender: 'boy', name: 'TANOD CARLO' },
  recapResults: {},
};

// ═══════════════════════════════════════════════════
// GAME LEVEL DATABASES (MODIFIABLE BY CREATOR)
// ═══════════════════════════════════════════════════

// ── LEVEL 1: CONVEYOR BELT ──
const LEVEL1_ITEMS = [
  { label: '📛 Full Name',        answer: 'private', xp: 10, recap: 'Keep your full name private as scammers can use it for identity theft and impersonation.' },
  { label: '🎨 Favorite Color',   answer: 'share',   xp: 10, recap: 'Sharing your favorite color is safe since it cannot be used to compromise your security.' },
  { label: '🏠 Home Address',     answer: 'private', xp: 10, recap: 'Your home address must be private to prevent physical safety risks and targeted scams.' },
  { label: '🏫 School Name',      answer: 'share',   xp: 10, recap: 'Sharing your school name is generally safe but avoid posting it alongside specific schedules.' },
  { label: '🔑 Password',         answer: 'private', xp: 10, recap: 'Your password must remain absolutely private and never shared with anyone under any circumstances.' },
  { label: '🐾 Pet\'s Name',      answer: 'share',   xp: 10, recap: 'Sharing your pet\'s name is safe but avoid using it as your password or security question answer.' },
  { label: '📅 Birthday (Full)',  answer: 'private', xp: 10, recap: 'Your full birthday should be private since it is a crucial piece of information used for account recovery.' },
  { label: '👤 Username',         answer: 'share',   xp: 10, recap: 'Your username is safe to share as it is public-facing, but ensure it does not contain sensitive details.' },
  { label: '📞 Phone Number',     answer: 'private', xp: 10, recap: 'Your phone number should remain private to protect you from spam calls and SMS phishing attacks.' },
  { label: '🎮 Hobby',            answer: 'share',   xp: 10, recap: 'Sharing your hobbies is a great and safe way to connect with others online without exposing personal data.' },
];

// ── LEVEL 2: SPOT THE PHISH ──
const PHISH_EMAILS = [
  {
    from:    'kapitan@brgy-sanjose.c0m',
    fromRecap: 'The email address kapitan@brgy-sanjose.c0m uses the number "0" instead of the letter "o" to impersonate the official Barangay Kapitan.',
    to:      'tanod@barangay.ph',
    subject: 'URGENT: Verify Your Account NOW!!!',
    body: [
      { text: 'Dear Resident,', click: false },
      { text: ' Your account has been COMPROMISED!!! Click here NOW to verify:', click: false },
      { text: ' CLICK HERE NOW →', click: true, hint: '"Click here NOW" urgency link', recap: 'Urgent calls to action like "CLICK HERE NOW" are classic pressure tactics used to induce panic and hasty actions.' },
      { text: ' Or visit: ', click: false },
      { text: 'http://brgy-sanjose-verify.freesite.net', click: true, hint: 'Suspicious link — not official .gov.ph', recap: 'Official government websites use ".gov.ph" domains, not free hosting services like "freesite.net".' },
      { text: ' Failure to comply will result in IMMEDIATE SUSPENSION!!!', click: false },
      { text: ' — Kap. dela Cruz', click: false },
    ],
    susItems: [0,1], // indices of click:true that are suspicious (sender + link + urgency)
    allBad: 3,       // total bad elements including sender
    notes: 'Red flags: fake sender, urgency language, suspicious link'
  },
  {
    from:    'gcash-support@gcash-rewards-ph.xyz',
    fromRecap: 'Official GCash support will never email you from a random ".xyz" domain address.',
    to:      'you@email.com',
    subject: 'You have won 5000 PESOS! Claim now!',
    body: [
      { text: 'Congratulations!!!', click: false },
      { text: ' You have been selected for a SPECIAL REWARD of ₱5,000!', click: false },
      { text: ' To claim, send your ', click: false },
      { text: 'full name, birthday, and PIN', click: true, hint: 'Asking for personal info + PIN — NEVER share!', recap: 'Legitimate services like GCash will never ask for your personal PIN or sensitive account details via email.' },
      { text: ' to this number: 09XX-XXX-XXXX.', click: false },
      { text: ' Act fast — offer expires in 1 HOUR!!!', click: true, hint: 'Artificial urgency tactic', recap: 'Creating artificial urgency is a psychological trick scammers use to stop you from verifying their claims.' },
      { text: ' Claim here: ', click: false },
      { text: 'http://gcash-promo.free.nf/claim', click: true, hint: 'Fake GCash site — not gcash.com.ph', recap: 'Always check the address bar, as fake GCash domains hosted on "free.nf" are designed to steal your credentials.' },
    ],
    allBad: 4,
    notes: 'Red flags: asking for PIN, fake domain, unrealistic prize'
  },
];

// ── LEVEL 3: PASSWORD POWER-UP ──
const PW_ROUNDS = [
  {
    question: 'Which password is STRONGEST?',
    options:  ['12345', 'MySunshine', 'M@ri0_2024!', 'password'],
    correct:  2,
    explanation: 'M@ri0_2024! has uppercase, numbers, symbols, and length!',
    recap: 'The strongest passwords combine uppercase and lowercase letters, numbers, and special symbols for maximum complexity.'
  },
  {
    question: 'Pick the STRONGEST password:',
    options:  ['Juan123', 'Br@y_SanJose#9', 'hello', 'CAPITALONLY'],
    correct:  1,
    explanation: 'Br@y_SanJose#9 combines letters, symbols, numbers!',
    recap: 'A mixture of character types makes a password resilient against automated brute-force hacking attempts.'
  },
  {
    question: 'Which one would HACKERS hate most?',
    options:  ['iloveyou', 'Pass1234', 'qwerty!', 'T@nd@7_Brgy#2024'],
    correct:  3,
    explanation: 'T@nd@7_Brgy#2024 is long, random, and complex!',
    recap: 'Longer passwords with custom symbols and numbers take significantly more time and resources for hackers to crack.'
  },
];

// ── LEVEL 4: SPEED ROUND ──
const SPEED_SCENARIOS = [
  { text: 'A stranger online asks for your school address.', icon:'👤', answer:'unsafe', xp:5, recap: 'Sharing physical details like school address with strangers on the internet exposes you to severe offline safety hazards.' },
  { text: 'You use HTTPS websites for research.', icon:'🔒', answer:'safe', xp:5, recap: 'HTTPS encrypts your connection, ensuring that the data sent between your browser and the website cannot be intercepted.' },
  { text: 'You use the same password for ALL your apps.', icon:'🔑', answer:'unsafe', xp:5, recap: 'Reusing passwords across multiple accounts creates a single point of failure if one of those apps gets breached.' },
  { text: 'You log out of shared computers after use.', icon:'💻', answer:'safe', xp:5, recap: 'Logging out of public or shared computers prevents subsequent users from accessing your personal accounts.' },
  { text: 'You click a link from an unknown email.', icon:'📧', answer:'unsafe', xp:5, recap: 'Unsolicited email links can lead to malicious cloning sites or initiate automatic downloads of malware.' },
  { text: 'You enable 2-factor authentication on GCash.', icon:'📱', answer:'safe', xp:5, recap: 'Two-factor authentication adds an essential second layer of security, blocking access even if someone knows your password.' },
  { text: 'You share your OTP code with a "GCash agent".', icon:'💬', answer:'unsafe', xp:5, recap: 'Official support agents will never ask for your OTP, which grants direct access to authorize transactions.' },
  { text: 'You update your apps when notified.', icon:'🔄', answer:'safe', xp:5, recap: 'Keeping your software updated ensures that known security loopholes and system vulnerabilities are patched immediately.' },
  { text: 'You save passwords in a shared notebook.', icon:'📓', answer:'unsafe', xp:5, recap: 'Physical notebooks containing credentials are easily lost, stolen, or viewed by unauthorized people nearby.' },
  { text: 'You use a strong password with symbols and numbers.', icon:'🛡️', answer:'safe', xp:5, recap: 'High-entropy passwords with letters, numbers, and symbols are the first and best line of defense for your digital accounts.' },
  { text: 'You post your full birthday on social media.', icon:'🎂', answer:'unsafe', xp:5, recap: 'Scammers can harvest publicly shared birth dates to answer security questions and verify identity for account takeovers.' },
  { text: 'You check URLs before clicking links.', icon:'🔍', answer:'safe', xp:5, recap: 'Checking destination URLs helps you spot deceptive spelling tricks and confirm you are visiting the authentic site.' },
  { text: 'You download apps from unofficial websites.', icon:'⬇️', answer:'unsafe', xp:5, recap: 'Third-party marketplaces often host modified applications containing embedded spyware and Trojans.' },
  { text: 'You use a VPN on public Wi-Fi.', icon:'📡', answer:'safe', xp:5, recap: 'A Virtual Private Network encrypts your internet traffic on open networks, protecting it from local eavesdroppers.' },
  { text: 'You share your home address in a public chat group.', icon:'🏠', answer:'unsafe', xp:5, recap: 'Public chat rooms allow anyone to view your location, making you vulnerable to real-world threats and social engineering.' },
];

// ── LEVEL 5: LINK INSPECTOR ──
const URL_ITEMS = [
  { url: 'https://deped.gov.ph',                    answer: 'safe', reason: '✅ Official .gov.ph domain = SAFE!', recap: 'Genuine Philippine government portals always end in the official ".gov.ph" domain extension.' },
  { url: 'http://depd-ph.weebly.com',               answer: 'fake', reason: '❌ Fake: misspelled + weebly.com = NOT official', recap: 'Misspelled domains and free blog hosting platforms like "weebly.com" are telltale signs of a malicious clone.' },
  { url: 'https://gcash-rewards.ph.freesite.net',   answer: 'fake', reason: '❌ Fake: gcash is NOT on freesite.net', recap: 'Scammers use nested domains on free web hosts like "freesite.net" to disguise phishing sites as official portals.' },
  { url: 'https://www.bsp.gov.ph',                  answer: 'safe', reason: '✅ Official BSP government site', recap: 'Checking for ".gov.ph" is the most reliable way to verify the authenticity of a government institution online.' },
  { url: 'https://fb-security-update.xyz',          answer: 'fake', reason: '❌ Fake: Facebook never uses .xyz domain', recap: 'Major tech corporations like Facebook will never contact you using cheap, suspicious extensions like ".xyz".' },
];

// ── LEVEL 6: SCAM INBOX MEMORY ──
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
  { text: 'One sender\'s email ended in .gov.ph', answer: false, recap: 'None of the suspicious scam emails ended in the legitimate ".gov.ph" government domain.' },
  { text: 'One email offered free prizes (₱10,000)', answer: true, recap: 'Unsolicited lottery claims and cash rewards are common bait used in financial phishing campaigns.' },
  { text: 'One subject line said "URGENT"', answer: true, recap: 'Urgent alerts are deliberately designed to trigger immediate panic and override your logical thinking.' },
  { text: 'All 3 emails asked for your OTP', answer: false, recap: 'While not all asked for an OTP, any request for an One-Time Password is a massive security red flag.' },
  { text: 'One email mentioned a barangay ID', answer: true, recap: 'Scammers frequently reference local community elements like Barangay IDs to build a false sense of trust.' },
  { text: 'One email was from gcash.com.ph', answer: false, recap: 'None of the emails originated from real GCash channels, relying instead on deceptive, look-alike domains.' },
];

// ── LEVEL 7: SAFE PROFILE ──
const PROFILE_FIELDS = [
  { name: '👤 Full Name',       correct: 'private', desc: 'Your official first name and family surname.', recap: 'Hiding your full name protects you from public tracking and identity theft schemes.' },
  { name: '😎 Nickname',        correct: 'public',  desc: 'A casual name or gaming alias your friends use.', recap: 'Nicknames are safe for public display since they do not expose your legal identity.' },
  { name: '🏫 School',          correct: 'public',  desc: 'The name of the school or campus you attend.', recap: 'School name is public-level information, but keep specific class schedules private.' },
  { name: '📚 Grade Level',     correct: 'private', desc: 'Your current year level (e.g., Grade 7).', recap: 'Keeping your grade level private adds a layer of protection against online child profiling.' },
  { name: '🎂 Birthday',        correct: 'private', desc: 'Your full month, day, and year of birth.', recap: 'Birthdays are commonly used as security questions and identity verification points, so keep them private.' },
  { name: '📞 Phone Number',    correct: 'private', desc: 'Your private 11-digit mobile contact number.', recap: 'Your phone number must remain private to prevent SMS scams, unsolicited calls, and direct contact.' },
  { name: '❤️ Favorite Subject',correct: 'public',  desc: 'School topics you enjoy learning about.', recap: 'Sharing educational interests is safe and excellent for positive community interaction.' },
  { name: '🏘️ Home Barangay',   correct: 'private', desc: 'The specific neighborhood or area where you reside.', recap: 'Your home barangay should be private to prevent malicious actors from mapping your physical location.' },
];

// ── LEVEL 8: BOSS CHALLENGES ──
const BOSS_STEP1_ITEMS = [
  { label: '📛 Full Name', answer: 'private', recap: 'Full names must be kept private online to prevent cybercriminals from mining your personal data.' },
  { label: '🎮 Gaming Username', answer: 'share', recap: 'Gaming usernames are safe to share but should never match your real names or passwords.' },
  { label: '🏠 Home Address', answer: 'private', recap: 'Your home address must be private to secure your physical home and personal privacy.' },
];

const BOSS_STEP2_ITEMS = [
  { text: 'support@gcash-update-now.xyz', isBad: true, recap: 'Fake domains like "gcash-update-now.xyz" are hosted by scammers to harvest your account credentials.' },
  { text: 'CLICK HERE to secure your account NOW!', isBad: true, recap: 'Impulsive warnings demanding immediate action are classic social engineering tricks designed to deceive.' },
  { text: 'Dear Customer', isBad: false, recap: 'Generic greetings can sometimes be generic, but always look out for suspicious domains and links.' },
];

const BOSS_STEP3_ITEMS = [
  { question: 'CHOOSE THE STRONGEST PASSWORD!', options: ['password123', 'Brgy@Tanod#9', 'hello', 'qwerty'], correct: 1, recap: 'A strong password with mixed character types protects your system against hacking attempts.' }
];

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
const fbItem         = $('fb-item');
const fbMsg          = $('fb-msg');
const fbCount        = $('fb-count');
const fbContinueBtn  = $('fb-continue-btn');
const xpFloat        = $('xp-float');
const screenFlash    = $('screen-flash');
const dispTeam       = $('disp-team');
const dispXP         = $('disp-xp');
const dispTier       = $('disp-tier');
const xpBarInner     = $('xp-bar-inner');
const dispStreak     = $('disp-streak');
const activeTanodDisp= $('active-tanod-display');

// ── TIMERS & MAP STATE ─────────────────────────────
let timerInterval = null;
let feedbackTimeout = null;
let mapLoopId = null;
let isPaused = false;

function clearAllTimers() {
  clearInterval(timerInterval); timerInterval = null;
  clearTimeout(feedbackTimeout); feedbackTimeout = null;
  cancelAnimationFrame(mapLoopId);
}

// ── INPUT HANDLING ────────────────────────────────
const Input = { up: false, down: false, left: false, right: false, space: false };
document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') Input.up = true;
  if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') Input.down = true;
  if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') Input.left = true;
  if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') Input.right = true;
  if(e.key === ' ' || e.key === 'Enter') Input.space = true;
});
document.addEventListener('keyup', e => {
  if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') Input.up = false;
  if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') Input.down = false;
  if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') Input.left = false;
  if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') Input.right = false;
  if(e.key === ' ' || e.key === 'Enter') Input.space = false;
});

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
      setTimeout(showMainMenu, 600);
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
// MAIN & PAUSE MENUS
// ═══════════════════════════════════════════════════
function showMainMenu() {
  $('boot-screen').style.display = 'none';
  $('main-menu-screen').style.display = 'flex';
  
  const inputEl = document.getElementById('team-name-input');
  setTimeout(() => { if (inputEl) inputEl.focus(); }, 100);

  $('btn-play').onclick = () => {
    submitTeam();
  };
  $('btn-options').onclick = openOptions;
  $('btn-exit').onclick = () => {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:red;font-family:monospace;font-size:24px;">SYSTEM SHUTDOWN INITIATED...</div>';
  };
}

// ═══════════════════════════════════════════════════
// OPTIONS MODAL
// ═══════════════════════════════════════════════════
let sfxEnabled = true;

// Helper: update a toggle switch's visual state
function setOptSwitch(switchEl, labelEl, isOn, colors) {
  switchEl.dataset.on = isOn ? 'true' : 'false';
  labelEl.textContent = isOn ? 'ON' : 'OFF';
  switchEl.classList.toggle('opt-switch--active', isOn);
}

function openOptions() {
  select_s();
  const modal = $('options-modal');
  if (!modal) return;

  // Show dev section only if DEV_MODE flag is true
  const devSection = $('dev-mode-section');
  if (devSection) devSection.style.display = DEV_MODE ? 'block' : 'none';

  modal.style.display = 'flex';
}

function closeOptions() {
  const modal = $('options-modal');
  if (modal) modal.style.display = 'none';
  select_s();
}

// ── Wire up all options controls immediately (script is at bottom of body) ──
const optBtn = $('btn-options');
if (optBtn) optBtn.onclick = openOptions;

// Close button
const closeBtn = $('opt-close-btn');
if (closeBtn) closeBtn.onclick = closeOptions;

// Close on backdrop click
const modal = $('options-modal');
if (modal) modal.onclick = e => {
  if (e.target === modal) closeOptions();
};

// ── SFX Toggle ──
const sfxSwitch = $('opt-sfx-switch');
const sfxLabel  = $('sfx-label');
if (sfxSwitch) {
  // Set initial visual
  setOptSwitch(sfxSwitch, sfxLabel, sfxEnabled);
  sfxSwitch.onclick = () => {
    sfxEnabled = !sfxEnabled;
    setOptSwitch(sfxSwitch, sfxLabel, sfxEnabled);
    if (sfxEnabled) select_s();
  };
}

// ── Unlock All Levels Toggle (DEV only) ──
const unlockSwitch = $('opt-unlock-switch');
const unlockLabel  = $('unlock-label');
if (unlockSwitch) {
  unlockSwitch.onclick = () => {
    if (!DEV_MODE) return;
    const isOn = unlockSwitch.dataset.on !== 'true';
    setOptSwitch(unlockSwitch, unlockLabel, isOn);
    if (isOn) {
      GS.levelsDone = [1, 2, 3, 4, 5, 6, 7];
      GS.currentNode = 8;
      select_s();
      // Refresh map if visible
      const wm = document.getElementById('world-map-view');
      if (wm && wm.style.display !== 'none') showWorldMap();
    } else {
      GS.levelsDone = [];
      GS.currentNode = 1;
      select_s();
    }
  };
}

// ── Reset Progress Toggle (DEV only) ──
const resetSwitch = $('opt-reset-switch');
const resetLabel  = $('reset-label');
if (resetSwitch) {
  resetSwitch.onclick = () => {
    if (!DEV_MODE) return;
    const isOn = resetSwitch.dataset.on !== 'true';
    setOptSwitch(resetSwitch, resetLabel, isOn);
    if (isOn) {
      GS.levelsDone = [];
      GS.xp = 0;
      GS.streak = 0;
      GS.currentNode = 1;
      // Also reset unlock toggle
      if (unlockSwitch) setOptSwitch(unlockSwitch, unlockLabel, false);
      updateHUD();
      buzzer();
      // Auto-flip back off after 1s to show it as a momentary action
      setTimeout(() => setOptSwitch(resetSwitch, resetLabel, false), 1000);
    }
  };
}

// ── ESCAPE KEY HANDLER ───────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // Close Options modal first if open
  const modal = $('options-modal');
  if (modal && modal.style.display === 'flex') {
    closeOptions();
    return;
  }
  // Otherwise toggle pause during a level
  const mainArea = document.getElementById('main-area');
  if (mainArea && mainArea.style.display === 'block' && $('feedback-overlay').style.display !== 'flex' && $('level-splash').style.display !== 'flex') {
    togglePause();
  }
});


function togglePause() {
  isPaused = !isPaused;
  const pauseOverlay = $('pause-overlay');
  if (isPaused) {
    pauseOverlay.style.display = 'flex';
  } else {
    pauseOverlay.style.display = 'none';
  }
}

$('btn-resume').onclick = () => {
  togglePause();
};

$('btn-restart').onclick = () => {
  togglePause();
  clearAllTimers();
  showLevelTransition(GS.level);
};

$('btn-quit').onclick = () => {
  togglePause();
  clearAllTimers();
  showWorldMap();
};

// ═══════════════════════════════════════════════════
// TEAM ENTRY
// ═══════════════════════════════════════════════════

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
        img:    btn.dataset.img,
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
  $('main-menu-screen').style.display = 'none';
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
  GS.streak = 0;
  GS.xp = 0;
  
  const unlockSwitch = document.getElementById('opt-unlock-switch');
  if (DEV_MODE && unlockSwitch && unlockSwitch.dataset.on === 'true') {
    GS.levelsDone = [1, 2, 3, 4, 5, 6, 7];
    GS.currentNode = 8;
  } else {
    GS.levelsDone = [];
    GS.currentNode = 1;
  }
  
  showWorldMap();
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
    if (emojiEl) emojiEl.textContent = '';
    if (nameEl)  nameEl.textContent  = GS.character ? GS.character.name  : 'PLAYER ' + player;
}

function showWorldMap(autoAdvanceFromLv = null) {
  clearAllTimers();
  const mainArea = document.getElementById('main-area');
  const levelContent = document.getElementById('level-content');
  const mapNodes = document.querySelectorAll('.map-node');
  const playerSprite = document.getElementById('player-sprite');
  const playerImg = document.getElementById('player-sprite-img');
  const promptEl = document.getElementById('interaction-prompt');
  
  if (levelContent) {
    levelContent.dispatchEvent(new Event('removed'));
    levelContent.innerHTML = '';
  }
  
  if (mainArea) mainArea.style.display = 'none';
  if (promptEl) promptEl.style.display = 'none';
  if (playerImg && GS.character) playerImg.src = GS.character.img;

  const highestCompleted = GS.levelsDone.length > 0 ? Math.max(...GS.levelsDone) : 0;
  
  mapNodes.forEach(node => {
    const lv = parseInt(node.dataset.lv);
    node.classList.remove('completed', 'locked');
    
    if (GS.levelsDone.includes(lv)) {
      node.classList.add('completed');
    }
    
    // Sequential locking: node is locked if it's strictly greater than highest completed + 1
    if (lv > highestCompleted + 1) {
      node.classList.add('locked');
    }

    // Allow clicking the node to select and enter the level
    node.onclick = () => {
      if (node.classList.contains('locked')) return;
      GS.currentNode = lv;
      updatePlayerPos(GS.currentNode);
      
      select_s();
      cancelAnimationFrame(mapLoopId);
      if (promptEl) promptEl.style.display = 'none';
      if (mainArea) mainArea.style.display = 'block';
      showLevelTransition(GS.currentNode);
    };
  });

  // Reveal Boss Level 8 only if all 7 previous levels are completed
  const bossNode = document.getElementById('node-8');
  const bossPath = document.getElementById('path-to-boss');
  if (GS.levelsDone.length >= 7) {
    if (bossNode) {
      bossNode.style.display = 'flex';
      bossNode.classList.remove('locked');
    }
    if (bossPath) {
      bossPath.style.display = 'block';
    }
  } else {
    if (bossNode) bossNode.style.display = 'none';
    if (bossPath) bossPath.style.display = 'none';
  }

  // place player at highest completed + 1, or 1 (only if not already placed)
  if (GS.currentNode === undefined) {
    let targetLv = 1;
    if (GS.levelsDone.length > 0) {
       targetLv = Math.min(8, Math.max(...GS.levelsDone) + 1);
       if (targetLv === 8 && GS.levelsDone.length < 7) {
         targetLv = Math.max(...GS.levelsDone); // stay on last if boss locked
       }
    }
    GS.currentNode = targetLv;
  }

  // Update sprite position to current node
  const updatePlayerPos = (nodeId) => {
    const targetNode = document.querySelector(`.map-node[data-lv="${nodeId}"]`);
    if (targetNode && playerSprite) {
      playerSprite.style.left = targetNode.style.left;
      playerSprite.style.top = targetNode.style.top;
    }
  };
  
  // Disable transition initially to snap to position
  if (playerSprite) {
    playerSprite.style.transition = 'none';
    updatePlayerPos(GS.currentNode);
    void playerSprite.offsetWidth; // trigger reflow
    playerSprite.style.transition = 'left 0.3s linear, top 0.3s linear';
  }

  let isMoving = false;
  let spaceWasPressed = false;
  
  const Graph = {
    1: { right: 2 },
    2: { left: 1, right: 3 },
    3: { left: 2, down: 4 },
    4: { up: 3, left: 5 },
    5: { right: 4, left: 6 },
    6: { right: 5, down: 7 },
    7: { up: 6, right: 8 },
    8: { left: 7 }
  };

  if (autoAdvanceFromLv && autoAdvanceFromLv < 8) {
    let nextLv = autoAdvanceFromLv + 1;
    if (nextLv === 8 && GS.levelsDone.length < 7) {
      autoAdvanceFromLv = null;
    } else {
      let autoDir = null;
      for (let d in Graph[autoAdvanceFromLv]) {
        if (Graph[autoAdvanceFromLv][d] === nextLv) {
          autoDir = d;
          break;
        }
      }
      if (autoDir) {
        setTimeout(() => {
          isMoving = true;
          GS.currentNode = nextLv;
          
          if (playerSprite) {
            playerSprite.style.transition = 'left 1.5s linear, top 1.5s linear';
          }
          
          updatePlayerPos(GS.currentNode);
          if (promptEl) promptEl.style.display = 'none';
          
          if (autoDir === 'left' && playerImg) playerImg.style.transform = 'scaleX(-1)';
          if (autoDir === 'right' && playerImg) playerImg.style.transform = 'scaleX(1)';
          
          setTimeout(() => {
            isMoving = false;
            autoAdvanceFromLv = null;
            if (playerSprite) {
              playerSprite.style.transition = 'left 0.3s linear, top 0.3s linear';
            }
          }, 1500);
        }, 500);
      } else {
        autoAdvanceFromLv = null;
      }
    }
  }

  function mapLoop() {
    if (!isMoving && autoAdvanceFromLv == null) {
      let dir = null;
      if (Input.up) dir = 'up';
      else if (Input.down) dir = 'down';
      else if (Input.left) dir = 'left';
      else if (Input.right) dir = 'right';

      if (dir) {
        const nextNodeId = Graph[GS.currentNode]?.[dir];
        if (nextNodeId) {
          const nextNodeEl = document.querySelector(`.map-node[data-lv="${nextNodeId}"]`);
          if (nextNodeEl && !nextNodeEl.classList.contains('locked')) {
            isMoving = true;
            GS.currentNode = nextNodeId;
            updatePlayerPos(GS.currentNode);
            if (promptEl) promptEl.style.display = 'none';
            
            if (dir === 'left' && playerImg) playerImg.style.transform = 'scaleX(-1)';
            if (dir === 'right' && playerImg) playerImg.style.transform = 'scaleX(1)';
            
            setTimeout(() => {
              isMoving = false;
            }, 300); // match CSS transition duration
          }
        }
      }
      
      // Update prompt when stationary
      if (!isMoving) {
         const currentNodeEl = document.querySelector(`.map-node[data-lv="${GS.currentNode}"]`);
         if (currentNodeEl && !currentNodeEl.classList.contains('locked')) {
           if (promptEl) promptEl.style.display = 'block';
           
           if (Input.space && !spaceWasPressed) {
             spaceWasPressed = true;
             select_s();
             cancelAnimationFrame(mapLoopId);
             if (promptEl) promptEl.style.display = 'none';
             if (mainArea) mainArea.style.display = 'block';
             showLevelTransition(GS.currentNode);
             return;
           }
         } else {
           if (promptEl) promptEl.style.display = 'none';
         }
      }
    }
    
    if (!Input.space) spaceWasPressed = false;
    mapLoopId = requestAnimationFrame(mapLoop);
  }

  // Start loop
  mapLoop();
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
function showFeedback(correct, title, itemText, msg, duration=15, onComplete=null) {
  feedbackOverlay.style.display = 'flex';
  $('feedback-box').className = correct ? 'correct-fb' : 'wrong-fb';
  fbIcon.textContent  = correct ? '✅' : '❌';
  fbTitle.textContent = title;
  
  if (fbItem) {
    fbItem.textContent = itemText ? `"${itemText}"` : '';
  }
  
  fbMsg.textContent   = msg;
  fbMsg.style.whiteSpace = 'pre-line';

  let t = duration;
  fbCount.textContent = t + 's';
  clearInterval(feedbackTimeout);

  const finish = () => {
    clearInterval(feedbackTimeout);
    feedbackOverlay.style.display = 'none';
    if (onComplete) onComplete();
  };

  if (fbContinueBtn) {
    fbContinueBtn.onclick = finish;
  }

  feedbackTimeout = setInterval(()=>{
    t--;
    fbCount.textContent = t + 's';
    if (t <= 0) { finish(); }
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
  if (levelContent) {
    levelContent.dispatchEvent(new Event('removed'));
    levelContent.innerHTML = '';
  }
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
    showLevelRecap(8, () => {
      showFinalScreen();
    });
    return;
  }

  // Show brief success splash then advance to recap screen
  levelSplash.style.display = 'flex';
  $('splash-lvl').textContent  = '✅ LEVEL ' + lvNum + ' COMPLETE!';
  $('splash-name').textContent = 'LEVEL UP!';
  $('splash-desc').textContent = '';
  $('splash-count').textContent = '';
  $('splash-name').className = '';
  levelUp();
  setTimeout(() => {
    levelSplash.style.display = 'none';
    showLevelRecap(lvNum, () => {
      showWorldMap(lvNum);
    });
  }, 2000);
}

function showLevelRecap(lvNum, onContinue) {
  const recapOverlay = $('level-recap');
  const recapTitle = $('recap-title');
  const recapList = $('recap-list');
  const continueBtn = $('recap-continue-btn');

  recapTitle.textContent = `LEVEL ${lvNum} RECAP: SECURITY SECRETS`;
  recapList.innerHTML = '';

  let recapData = [];

  if (lvNum === 1) {
    recapData = LEVEL1_ITEMS.map(item => ({
      question: item.label,
      badge: item.answer,
      recap: item.recap
    }));
  } else if (lvNum === 2) {
    PHISH_EMAILS.forEach((email, idx) => {
      recapData.push({
        question: `EMAIL ${idx+1} SENDER: ${email.from}`,
        badge: 'fake',
        recap: email.fromRecap
      });
      email.body.forEach(seg => {
        if (seg.click) {
          recapData.push({
            question: `Email Segment: "${seg.text.trim()}"`,
            badge: 'suspicious',
            recap: seg.recap
          });
        }
      });
    });
  } else if (lvNum === 3) {
    recapData = PW_ROUNDS.map(round => ({
      question: round.question,
      badge: 'strong',
      recap: round.recap
    }));
  } else if (lvNum === 4) {
    recapData = SPEED_SCENARIOS.map(sc => ({
      question: sc.text,
      badge: sc.answer,
      recap: sc.recap
    }));
  } else if (lvNum === 5) {
    recapData = URL_ITEMS.map(item => ({
      question: item.url,
      badge: item.answer,
      recap: item.recap
    }));
  } else if (lvNum === 6) {
    recapData = MEMORY_QUESTIONS.map(q => ({
      question: q.text,
      badge: q.answer ? 'true' : 'false',
      recap: q.recap
    }));
  } else if (lvNum === 7) {
    recapData = PROFILE_FIELDS.map(f => ({
      question: f.name,
      badge: f.correct,
      recap: f.recap
    }));
  } else if (lvNum === 8) {
    BOSS_STEP1_ITEMS.forEach(item => {
      recapData.push({
        question: `STEP 1 PACKET: ${item.label}`,
        badge: item.answer,
        recap: item.recap
      });
    });
    BOSS_STEP2_ITEMS.forEach(item => {
      recapData.push({
        question: `STEP 2 Segment: "${item.text.trim()}"`,
        badge: item.isBad ? 'unsafe' : 'safe',
        recap: item.recap
      });
    });
    BOSS_STEP3_ITEMS.forEach(item => {
      recapData.push({
        question: `STEP 3 QUESTION: ${item.question}`,
        badge: 'strong',
        recap: item.recap
      });
    });
  }

  let totalCorrect = 0;
  const totalItems = recapData.length;
  recapData.forEach(data => {
    if (GS.recapResults[data.question]) totalCorrect++;
  });

  recapTitle.innerHTML = `LEVEL ${lvNum} RECAP: SECURITY SECRETS<br><span style="font-size:18px; color:var(--gold); display:block; margin-top:10px;">TOTAL CORRECT: ${totalCorrect} / ${totalItems}</span>`;

  recapData.forEach(data => {
    const itemEl = document.createElement('div');
    itemEl.className = 'recap-item';
    
    let badgeClass = data.badge.toLowerCase();
    if (badgeClass.includes('private')) badgeClass = 'private';
    else if (badgeClass.includes('share') || badgeClass.includes('public') || badgeClass.includes('safe') || badgeClass.includes('true')) badgeClass = 'safe';
    else if (badgeClass.includes('unsafe') || badgeClass.includes('fake') || badgeClass.includes('suspicious') || badgeClass.includes('false')) badgeClass = 'unsafe';

    const isCorrect = GS.recapResults[data.question] === true;
    const icon = isCorrect ? '✅' : '❌';

    itemEl.innerHTML = `
      <div class="recap-item-header">
        <span class="recap-question">${icon} ${data.question}</span>
        <span class="recap-badge ${badgeClass}">${data.badge}</span>
      </div>
      <div class="recap-subtext-box">
        <span>${data.recap}</span>
      </div>
    `;
    recapList.appendChild(itemEl);
  });

  recapOverlay.style.display = 'flex';

  continueBtn.onclick = () => {
    select_s();
    recapOverlay.style.display = 'none';
    onContinue();
  };
}

// ═══════════════════════════════════════════════════
// LEVEL DISPATCHER
// ═══════════════════════════════════════════════════
function startLevel(n) {
  levelContent.innerHTML = '';
  GS.recapResults = {};
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
  let items = LEVEL1_ITEMS.map(item => ({ ...item }));

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
  const TOTAL_TIME = LEVEL_SETTINGS[1].countdown;
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
    packetCard.style.animation = 'none';
    void packetCard.offsetWidth;
    packetCard.classList.add('packet-rolling');
    packetCard.style.animation = `packet-roll-3d ${LEVEL_SETTINGS[1].speed}s linear forwards, packet-pulse 1.4s ease-in-out infinite`;
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
      GS.recapResults[item.label] = true;
      correct++;
      $('l1-correct').textContent = correct;
      registerCorrect(item.xp, packetCard);
    } else {
      GS.recapResults[item.label] = false;
      wrong++;
      $('l1-wrong').textContent = wrong;
      loseXP(5);
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
    if (isPaused) return;
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
      flashScreen('red');
      setTimeout(() => completeLevel(1), 1000);
    }
  }, 1000);

  showItem(0);
  levelContent.addEventListener('removed', () => document.removeEventListener('keydown', l1Key));
}

// ═══════════════════════════════════════════════════
// LEVEL 2 — SPOT THE PHISH
// ═══════════════════════════════════════════════════

function startLevel2() {
  let emailIdx = 0;
  let totalFound = 0;
  let totalNeeded = 0;
  PHISH_EMAILS.forEach(e => totalNeeded += e.allBad);
  let wrongClicks = 0;
  const TOTAL_TIME = LEVEL_SETTINGS[2].countdown;
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

  const l2TimerFn = () => {
    if (isPaused) return;
    timeLeft--;
    $('l2-timer-num').textContent = timeLeft;
    $('l2-timer-fill').style.width = (timeLeft / TOTAL_TIME * 100) + '%';
    if (timeLeft <= 0) {
      clearAllTimers();
      finishPhish();
    }
  };
  timerInterval = setInterval(l2TimerFn, 1000);

  function renderEmail(idx) {
    const email = PHISH_EMAILS[idx];
    GS.recapResults[`EMAIL ${idx+1} SENDER: ${email.from}`] = false;
    email.body.forEach(seg => { if (seg.click) GS.recapResults[`Email Segment: "${seg.text.trim()}"`] = false; });
    
    const headerEl = document.querySelector('#phish-wrap .level-header');
    if (headerEl) {
      headerEl.textContent = 'CLICK ALL SUSPICIOUS ELEMENTS!';
      headerEl.style.color = '';
    }
    $('phish-round-info').textContent = `EMAIL ${idx+1} / 2`;
    const container = $('phish-email-container');
    container.innerHTML = `
      <div class="phish-email-header">
        <div class="phish-field">
          <span id="phish-from-label" class="phish-clickable phish-label">FROM: </span>
          <span id="phish-from" class="phish-clickable" data-type="sender">${email.from}</span>
        </div>
        <div class="phish-field">
          <span id="phish-to-label" class="phish-clickable phish-label">TO: </span>
          <span id="phish-to" class="phish-clickable">${email.to}</span>
        </div>
        <div class="phish-field">
          <span id="phish-subject-label" class="phish-clickable phish-label">SUBJECT: </span>
          <span id="phish-subject" class="phish-clickable">${email.subject}</span>
        </div>
      </div>
      <div class="phish-body" id="phish-body"></div>
    `;
    const bodyEl = $('phish-body');
    email.body.forEach((seg, si) => {
      const sp = document.createElement('span');
      sp.className = 'phish-clickable';
      sp.textContent = seg.text;
      sp.dataset.seg = si;

      // Realistically style links and buttons in the email body
      if (seg.text.toLowerCase().includes('http') || seg.text.toLowerCase().includes('click here')) {
        sp.classList.add('is-link');
      }

      if (seg.click) {
        sp.dataset.hint = seg.hint;
        sp.addEventListener('click', () => clickSegment(sp, idx, si, true));
      } else {
        sp.addEventListener('click', () => clickSegment(sp, idx, si, false));
      }
      bodyEl.appendChild(sp);
    });
    // Sender is always suspicious
    $('phish-from').addEventListener('click', () => {
      const el = $('phish-from');
      if (el.classList.contains('found') || el.classList.contains('wrong')) return;
      el.classList.add('found');
      GS.recapResults[`EMAIL ${idx+1} SENDER: ${email.from}`] = true;
      totalFound++;
      emailDone[idx]++;
      $('phish-found-count').textContent = `FOUND: ${totalFound} / ${totalNeeded}`;
      blip();
      floatXPCenter('+10 XP');
      GS.xp += 10; updateHUD();
      
      const headerEl = document.querySelector('#phish-wrap .level-header');
      if (headerEl) {
        headerEl.textContent = `SENDER ADDRESS IS FAKE/SUSPICIOUS!`;
        headerEl.style.color = 'var(--lime)';
      }
      flashScreen('green');

      clearInterval(timerInterval);
      showFeedback(true, 'CORRECT!', email.from, email.fromRecap, 15, () => {
        timerInterval = setInterval(l2TimerFn, 1000);
        if (emailDone[idx] >= email.allBad) {
          nextEmail(idx);
        }
      });
    });

    // Make other header elements and labels clickable but wrong (triggers wrong feedback/penalty)
    const wrongHeaderEls = ['phish-from-label', 'phish-to-label', 'phish-to', 'phish-subject-label', 'phish-subject'];
    wrongHeaderEls.forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener('click', () => {
          if (el.classList.contains('wrong') || el.classList.contains('found')) return;
          el.classList.add('wrong');
          wrongClicks++;
          loseXP(5);
          if (headerEl) {
            headerEl.textContent = `❌ NOT SUSPICIOUS!`;
            headerEl.style.color = 'var(--red)';
            setTimeout(() => {
              headerEl.textContent = 'CLICK ALL SUSPICIOUS ELEMENTS!';
              headerEl.style.color = '';
            }, 2000);
          }
          setTimeout(() => el.classList.remove('wrong'), 400);

          clearInterval(timerInterval);
          showFeedback(false, 'WRONG!', el.textContent.trim(), 'This field is standard and not inherently suspicious in this context.', 15, () => {
            timerInterval = setInterval(l2TimerFn, 1000);
          });
        });
      }
    });
  }

  function clickSegment(el, emailIdx, segIdx, isBad) {
    if (el.classList.contains('found') || el.classList.contains('wrong')) return;
    const headerEl = document.querySelector('#phish-wrap .level-header');
    
    const segInfo = PHISH_EMAILS[emailIdx].body[segIdx];
    
    if (isBad) {
      el.classList.add('found');
      GS.recapResults[`Email Segment: "${el.textContent.trim()}"`] = true;
      totalFound++;
      emailDone[emailIdx]++;
      $('phish-found-count').textContent = `FOUND: ${totalFound} / ${totalNeeded}`;
      blip();
      floatXPCenter('+10 XP');
      GS.xp += 10; updateHUD();
      const hint = el.dataset.hint || 'Suspicious element!';
      if (headerEl) {
        headerEl.textContent = hint.toUpperCase();
        headerEl.style.color = 'var(--lime)';
      }
      flashScreen('green');
      
      clearInterval(timerInterval);
      showFeedback(true, 'CORRECT!', el.textContent.trim(), segInfo.recap || 'Suspicious element found!', 15, () => {
        timerInterval = setInterval(l2TimerFn, 1000);
        if (emailDone[emailIdx] >= PHISH_EMAILS[emailIdx].allBad) {
          nextEmail(emailIdx);
        }
      });
    } else {
      el.classList.add('wrong');
      wrongClicks++;
      loseXP(5);
      if (headerEl) {
        headerEl.textContent = `❌ NOT SUSPICIOUS!`;
        headerEl.style.color = 'var(--red)';
        setTimeout(() => {
          headerEl.textContent = 'CLICK ALL SUSPICIOUS ELEMENTS!';
          headerEl.style.color = '';
        }, 2000);
      }
      setTimeout(() => el.classList.remove('wrong'), 400);
      
      clearInterval(timerInterval);
      showFeedback(false, 'WRONG!', el.textContent.trim(), 'This part of the email is actually safe! Not all parts of a phishing email are malicious.', 15, () => {
        timerInterval = setInterval(l2TimerFn, 1000);
      });
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
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l3-timer-num">${LEVEL_SETTINGS[3].countdown}</span>
      </div>
      <div id="pw-question" style="font-family:var(--font-mono);font-size:clamp(16px,2vw,20px);color:var(--white);text-align:center"></div>
      <div id="pw-options" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1"></div>
      <div id="pw-feedback" style="font-family:var(--font-mono);font-size:16px;color:var(--white);text-align:center;min-height:30px"></div>
    </div>
  `;

  function showRound(idx) {
    const round = PW_ROUNDS[idx];
    const timePerRound = LEVEL_SETTINGS[3].countdown;
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
          GS.recapResults[round.question] = true;
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          roundsCorrect++;
          const fastBonus = timeLeft >= (timePerRound - 8);
          registerCorrect(20, btn);
          if (fastBonus) addXP(10, btn);
          $('pw-feedback').textContent = '✅ ' + round.explanation;
          $('pw-feedback').style.color = 'var(--green)';

          showFeedback(true, 'CORRECT!', pw, round.explanation, 15, () => {
            if (idx + 1 < PW_ROUNDS.length) showRound(idx + 1);
            else {
              if (roundsCorrect === PW_ROUNDS.length) addXP(20, null);
              completeLevel(3);
            }
          });
        } else {
          GS.recapResults[round.question] = false;
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          loseXP(5);
          $('pw-feedback').textContent = '❌ ' + round.explanation;
          $('pw-feedback').style.color = 'var(--red)';

          showFeedback(false, 'WRONG!', pw, round.explanation, 15, () => {
            if (idx + 1 < PW_ROUNDS.length) showRound(idx + 1);
            else {
              if (roundsCorrect === PW_ROUNDS.length) addXP(20, null);
              completeLevel(3);
            }
          });
        }
      });
      optionsEl.appendChild(btn);
    });

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isPaused) return;
      timeLeft--;
      $('l3-timer-num').textContent = timeLeft;
      $('l3-timer-fill').style.width = (timeLeft / timePerRound * 100) + '%';
      if (timeLeft <= 5) $('l3-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0) {
        if (!answered) {
          answered = true;
          GS.recapResults[round.question] = false;
          clearInterval(timerInterval);
          const fbEl = $('pw-feedback');
          if (fbEl) {
             fbEl.textContent = 'TIME! ' + round.explanation;
             fbEl.style.color = 'var(--red)';
          }
          optionsEl.querySelectorAll('.pw-option')[round.correct].classList.add('correct');
          loseXP(5);
          
          showFeedback(false, 'TIME OUT!', null, round.explanation, 15, () => {
            if (idx+1 < PW_ROUNDS.length) showRound(idx+1);
            else {
              if (roundsCorrect === PW_ROUNDS.length) addXP(20, null);
              completeLevel(3);
            }
          });
        }
      }
    }, 1000);
  }

  showRound(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 4 — SAFE OR UNSAFE SPEED ROUND
// ═══════════════════════════════════════════════════

function startLevel4() {
  let idx = 0;
  let correct = 0, wrong = 0;
  let timeLeft = LEVEL_SETTINGS[4].countdown;
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
        <span id="l4-timer-num" style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:28px">${LEVEL_SETTINGS[4].countdown}</span>
        <span id="speed-multiplier" style="font-family:var(--font-pixel);font-size:12px;color:var(--gold)">×1</span>
      </div>
      <div id="speed-scenario">
        <span class="scenario-icon" id="speed-icon">?</span>
        <span id="speed-text"></span>
      </div>
      <div id="speed-buttons">
        <button class="retro-btn btn-safe" id="btn-speed-safe" style="font-size:20px;padding:20px 40px">SAFE</button>
        <button class="retro-btn btn-unsafe" id="btn-speed-unsafe" style="font-size:20px;padding:20px 40px">UNSAFE</button>
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
    timeLeft = LEVEL_SETTINGS[4].countdown;
    $('speed-icon').textContent = sc.icon;
    $('speed-text').textContent = sc.text;
    $('speed-counter').textContent = `SCENARIO ${i+1} / ${SPEED_SCENARIOS.length}`;
    $('l4-timer-num').textContent = timeLeft;
    $('l4-timer-fill').style.width = '100%';
    $('l4-timer-fill').classList.remove('timer-red','timer-yellow');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isPaused) return;
      timeLeft--;
      $('l4-timer-num').textContent = timeLeft;
      $('l4-timer-fill').style.width = (timeLeft / LEVEL_SETTINGS[4].countdown * 100) + '%';
      if (timeLeft <= 2) $('l4-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0 && !answered) {
        answered = true;
        clearInterval(timerInterval);
        streakForMultiplier = 0;
        multiplier = 1;
        $('speed-multiplier').textContent = '×' + multiplier;
        GS.recapResults[sc.text] = false;
        loseXP(5);
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
      GS.recapResults[sc.text] = true;
      correct++;
      streakForMultiplier++;
      if (streakForMultiplier >= 5) multiplier = 2;
      $('speed-multiplier').textContent = '×' + multiplier;
      const earned = sc.xp * multiplier;
      registerCorrect(earned, choice === 'safe' ? $('btn-speed-safe') : $('btn-speed-unsafe'));
      flashScreen('green');
    } else {
      GS.recapResults[sc.text] = false;
      wrong++;
      streakForMultiplier = 0;
      multiplier = 1;
      $('speed-multiplier').textContent = '×' + multiplier;
      loseXP(5);
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

function startLevel5() {
  let idx = 0;
  let score = 0;
  let timeLeft = LEVEL_SETTINGS[5].countdown;

  levelContent.innerHTML = `
    <div id="url-wrap">
      <div class="level-header">IS THIS URL SAFE OR FAKE?</div>
      <div style="display:flex;gap:16px;align-items:center;width:100%">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l5-timer-fill" style="transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:18px;color:var(--gold);min-width:36px" id="l5-timer-num">${LEVEL_SETTINGS[5].countdown}</span>
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
        <button class="retro-btn btn-safe" id="btn-url-safe" style="font-size:18px;padding:18px 36px">SAFE</button>
        <button class="retro-btn btn-unsafe" id="btn-url-fake" style="font-size:18px;padding:18px 36px">FAKE</button>
      </div>
    </div>
  `;

  function showURL(i) {
    if (i >= URL_ITEMS.length) { clearInterval(timerInterval); completeLevel(5); return; }
    const item = URL_ITEMS[i];
    let answered = false;
    timeLeft = LEVEL_SETTINGS[5].countdown;
    $('url-counter').textContent = `URL ${i+1} / 5`;
    $('url-browser-bar').textContent = item.url;
    $('url-browser-content').textContent = 'Read the URL carefully. Team — discuss!';
    $('l5-timer-num').textContent = timeLeft;
    $('l5-timer-fill').style.width = '100%';
    $('l5-timer-fill').classList.remove('timer-red','timer-yellow');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isPaused) return;
      timeLeft--;
      $('l5-timer-num').textContent = timeLeft;
      $('l5-timer-fill').style.width = (timeLeft / LEVEL_SETTINGS[5].countdown * 100) + '%';
      if (timeLeft <= 3) $('l5-timer-fill').classList.add('timer-red');
      if (timeLeft <= 0 && !answered) {
        answered = true;
        clearInterval(timerInterval);
        GS.recapResults[item.url] = false;
        loseXP(5);
        $('url-browser-content').textContent = item.reason;
        flashScreen('red');
        showFeedback(false, 'TIME OUT!', item.url, item.reason + '\n\n' + item.recap, 15, () => {
          showURL(i+1);
        });
      }
    }, 1000);

    function ans(choice) {
      if (answered) return;
      answered = true;
      clearInterval(timerInterval);
      if (choice === item.answer) {
        GS.recapResults[item.url] = true;
        score++;
        registerCorrect(15, $('btn-url-safe'));
        $('url-browser-content').textContent = item.reason;
        flashScreen('green');
        
        showFeedback(true, 'CORRECT!', item.url, item.reason + '\n\n' + item.recap, 15, () => {
          showURL(i+1);
        });
      } else {
        GS.recapResults[item.url] = false;
        loseXP(5);
        $('url-browser-content').textContent = item.reason;
        flashScreen('red');
        
        showFeedback(false, 'WRONG!', item.url, item.reason + '\n\n' + item.recap, 15, () => {
          showURL(i+1);
        });
      }
    }

    $('btn-url-safe').onclick = () => ans('safe');
    $('btn-url-fake').onclick = () => ans('fake');
  }

  showURL(0);
}

// ═══════════════════════════════════════════════════
// LEVEL 6 — SCAM INBOX MEMORY
// ═══════════════════════════════════════════════════

function startLevel6() {
  let phase = 'flash'; // 'flash' or 'quiz'
  let flashTimeLeft = LEVEL_SETTINGS[6].countdown;
  let answered = 0;
  let correct = 0;

  levelContent.innerHTML = `
    <div id="memory-wrap">
      <div class="level-header">MEMORIZE THE EMAILS — THEN ANSWER!</div>
      <div id="memory-phase-label" style="font-family:var(--font-pixel);font-size:14px;color:var(--gold);text-align:center">
        MEMORIZING... ${flashTimeLeft}s
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
    if (isPaused) return;
    flashTimeLeft--;
    $('l6-timer-num').textContent = flashTimeLeft;
    $('l6-timer-fill').style.width = (flashTimeLeft / LEVEL_SETTINGS[6].countdown * 100) + '%';
    $('memory-phase-label').textContent = `MEMORIZING... ${flashTimeLeft}s`;
    if (flashTimeLeft <= 0) {
      clearInterval(timerInterval);
      flashArea.style.display = 'none';
      startQuizPhase();
    }
  }, 1000);

  function startQuizPhase() {
    $('memory-phase-label').textContent = 'ANSWER FROM MEMORY!';
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
            GS.recapResults[q.text] = true;
            correct++;
            btn.classList.add('correct-ans');
            GS.xp += 15; GS.streak++; updateHUD();
            floatXPCenter('+15 XP');
            blip();
            flashScreen('green');
          } else {
            GS.recapResults[q.text] = false;
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

function startLevel7() {
  const states = new Array(PROFILE_FIELDS.length).fill('unset');
  
  // Grab current system time dynamically for status bar
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;

  levelContent.innerHTML = `
    <div id="profile-wrap">
      <!-- SMARTPHONE MOCKUP -->
      <div id="phone-container">
        <div id="phone-notch"></div>
        <div id="phone-status-bar">
          <span id="phone-status-time">${formattedTime}</span>
          <span id="phone-status-icons">📶 📶 🔋 100%</span>
        </div>
        <div id="phone-screen">
          <div class="phone-app-header">
            <div class="phone-app-title">⚙️ SETTINGS</div>
            <div class="phone-app-subtitle">Profile Privacy Configurator</div>
          </div>
          <div id="profile-grid"></div>
        </div>
        <div id="phone-home-indicator"></div>
      </div>

      <div id="profile-submit-row">
        <span id="profile-score" style="font-family:var(--font-pixel);font-size:12px;color:var(--gray)">Set all fields first</span>
        <button class="retro-btn btn-primary" id="profile-submit-btn" style="font-size:12px;padding:12px 20px">[ SUBMIT PROFILE ]</button>
      </div>
    </div>
  `;

  const grid = $('profile-grid');
  PROFILE_FIELDS.forEach((f, fi) => {
    const div = document.createElement('div');
    div.className = 'profile-field unset';
    div.id = `profile-field-${fi}`;
    div.innerHTML = `
      <div class="pf-info">
        <div class="pf-name-large">${f.name}</div>
        <div class="pf-subheading">${f.desc}</div>
      </div>
      <div class="toggle-switch-container">
        <span class="toggle-label-text private-label" id="toggle-label-private-${fi}">PRIVATE</span>
        <div class="custom-switch unset" id="custom-switch-${fi}">
          <div class="custom-slider"></div>
        </div>
        <span class="toggle-label-text public-label" id="toggle-label-public-${fi}">PUBLIC</span>
      </div>
    `;

    const switchEl = div.querySelector(`#custom-switch-${fi}`);
    const privateLabel = div.querySelector(`#toggle-label-private-${fi}`);
    const publicLabel = div.querySelector(`#toggle-label-public-${fi}`);

    function setToggleState(state) {
      states[fi] = state;
      blip();

      // Update classes
      div.className = `profile-field ${state}`;
      switchEl.className = `custom-switch ${state}-state`;
      
      if (state === 'public') {
        privateLabel.classList.remove('active');
        publicLabel.classList.add('active');
      } else if (state === 'private') {
        privateLabel.classList.add('active');
        publicLabel.classList.remove('active');
      }

      const setCount = states.filter(s => s !== 'unset').length;
      $('profile-score').textContent = `${setCount} / ${PROFILE_FIELDS.length} fields set`;
    }

    // Toggle switch click
    switchEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = states[fi];
      if (current === 'unset' || current === 'public') {
        setToggleState('private');
      } else {
        setToggleState('public');
      }
    });

    // Label clicks
    privateLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      setToggleState('private');
    });

    publicLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      setToggleState('public');
    });

    // Click anywhere on the row toggles
    div.addEventListener('click', () => {
      const current = states[fi];
      if (current === 'unset' || current === 'public') {
        setToggleState('private');
      } else {
        setToggleState('public');
      }
    });

    grid.appendChild(div);
  });

  $('profile-submit-btn').addEventListener('click', () => {
    const unset = states.filter(s=>s==='unset').length;
    if (unset > 0) {
      $('profile-score').textContent = '⚠️ SET ALL FIELDS FIRST!';
      $('profile-score').style.color = 'var(--red)';
      flashScreen('red');
      setTimeout(() => {
        $('profile-score').style.color = '';
        const setCount = states.filter(s => s !== 'unset').length;
        $('profile-score').textContent = `${setCount} / ${PROFILE_FIELDS.length} fields set`;
      }, 2000);
      return;
    }
    let correct = 0;
    let xpEarned = 0;
    PROFILE_FIELDS.forEach((f,fi) => {
      if (states[fi] === f.correct) {
        GS.recapResults[f.name] = true;
        correct++; xpEarned += 10;
      } else {
        GS.recapResults[f.name] = false;
      }
    });
    if (correct === PROFILE_FIELDS.length) xpEarned += 20;
    addXP(xpEarned, null);
    if (correct >= 6) {
      flashScreen('green');
    } else {
      flashScreen('red');
    }
    setTimeout(()=>completeLevel(7), 1000);
  });
}

// ═══════════════════════════════════════════════════
// LEVEL 8 — BOSS LEVEL (3-Step Combined)
// ═══════════════════════════════════════════════════
function startLevel8() {
  let bossStep = 0; // 0,1,2
  let mistakes = 0;
  let totalTime = LEVEL_SETTINGS[8].countdown;
  let timeLeft = totalTime;
  let stepDone = [false,false,false];

  levelContent.innerHTML = `
    <div id="boss-wrap">
      <div id="boss-header">BOSS LEVEL: NETWORK DEFENDER</div>
      <div style="display:flex;gap:16px;align-items:center;width:100%">
        <div class="level-timer-bar" style="flex:1">
          <div class="level-timer-bar-fill" id="l8-timer-fill" style="background:var(--red);transition:width 1s linear"></div>
        </div>
        <span style="font-family:var(--font-pixel);font-size:22px;color:var(--red);text-shadow:0 0 10px var(--red);min-width:36px" id="l8-timer-num">${LEVEL_SETTINGS[8].countdown}</span>
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
    if (isPaused) return;
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
    flashScreen('red');
    setTimeout(callback, 300);
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
    const items = BOSS_STEP1_ITEMS;
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
          <button class="retro-btn btn-safe" id="boss-private" style="font-size:16px;padding:16px 28px">PRIVATE</button>
          <button class="retro-btn btn-unsafe" id="boss-share" style="background:var(--cyan);border-color:var(--cyan);color:var(--bg);font-size:16px;padding:16px 28px">SHARE</button>
        </div>
      `;
      function ans(choice) {
        if (choice === item.answer) {
          GS.recapResults[`STEP 1 PACKET: ${item.label}`] = true;
          addXP(10, $('boss-private'));
          flashScreen('green');
          itemIdx++;
          showItem();
        } else {
          GS.recapResults[`STEP 1 PACKET: ${item.label}`] = false;
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
    const suspiciousItems = BOSS_STEP2_ITEMS;
    let found = 0;
    const needed = suspiciousItems.filter(s=>s.isBad).length;
    suspiciousItems.forEach(s => { if(s.isBad) GS.recapResults[`STEP 2 Segment: "${s.text.trim()}"`] = false; });

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
          GS.recapResults[`STEP 2 Segment: "${suspiciousItems[idx].text.trim()}"`] = true;
          el.classList.add('found');
          found++;
          $('boss-found').textContent = found;
          addXP(10, el);
          flashScreen('green');
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
    const options = BOSS_STEP3_ITEMS[0].options;
    const correct = BOSS_STEP3_ITEMS[0].correct;

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
          GS.recapResults[`STEP 3 QUESTION: ${BOSS_STEP3_ITEMS[0].question}`] = true;
          btn.classList.add('correct');
          stepDone[2] = true;
          updateStepIndicator(2);
          addXP(10, btn);
          flashScreen('green');
          clearInterval(timerInterval);
          setTimeout(finishBoss, 1000);
        } else {
          GS.recapResults[`STEP 3 QUESTION: ${BOSS_STEP3_ITEMS[0].question}`] = false;
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
    showMainMenu();
  });
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  showMainMenu();
});
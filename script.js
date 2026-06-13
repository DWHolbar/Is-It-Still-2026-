const YEAR_FROM = 2027;
const YEAR_TO   = 2050;

const EVENT_EMOJIS = {
  'Birthday':       '🎂',
  'Anniversary':    '💍',
  'Wedding':        '💒',
  'Baby Shower':    '👶',
  'Party':          '🎉',
  'Graduation':     '🎓',
  'Vacation':       '✈️',
  'Moving Day':     '🏠',
  'New Job':        '💼',
  'Holiday':        '🎄',
  'Concert':        '🎵',
  'Reunion':        '🤝',
  'Retirement':     '🌴',
  'New Year':       '🥂',
  "Valentine's Day":'💕',
  'Other':          '📅',
};

let mode        = 'year';   // 'year' | 'event'
let displayMode = 'days';   // 'days' | 'weeks'
let selectedYear = YEAR_FROM;
let activeEvent  = null;    // { label, date, type, emoji }
let timerHandle  = null;

document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();
  buildYearDropdown();
  initModeTabs();
  initDisplayToggle();
  initEventForm();
  initGCalBtn();
  initWidgetBtn();
  initMoodPicker();
  setTarget(String(selectedYear));
});

// ── Preferences (localStorage) ────────────────────────────

function loadPreferences() {
  const savedMood = localStorage.getItem('mood') || 'dusk';
  const savedDisp = localStorage.getItem('displayMode') || 'days';
  applyMood(savedMood);
  applyDisplayMode(savedDisp);
}

// ── Year dropdown ──────────────────────────────────────────

function buildYearDropdown() {
  const sel = document.getElementById('year-dropdown');
  for (let y = YEAR_FROM; y <= YEAR_TO; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  }
  sel.value = selectedYear;
  sel.addEventListener('change', () => {
    selectedYear = parseInt(sel.value);
    setTarget(String(selectedYear));
  });
}

// ── Mode tabs ──────────────────────────────────────────────

function initModeTabs() {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const m = tab.dataset.mode;
      if (m === mode) return;
      mode = m;

      document.querySelectorAll('.mode-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.mode === m)
      );
      document.getElementById('panel-year').classList.toggle('hidden', m !== 'year');
      document.getElementById('panel-event').classList.toggle('hidden', m !== 'event');

      if (m === 'year') {
        hideWidget();
        setTarget(String(selectedYear));
      } else if (activeEvent) {
        showWidget();
        setTarget(activeEvent.label);
      } else {
        document.getElementById('display-target').textContent = '—';
        document.title = 'Days Until';
        hide('gcal-btn');
        hideWidget();
        stopTimer();
      }
    });
  });
}

// ── Display toggle (Days / Weeks) ─────────────────────────

function initDisplayToggle() {
  document.querySelectorAll('.disp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyDisplayMode(btn.dataset.disp);
      localStorage.setItem('displayMode', btn.dataset.disp);
    });
  });
}

function applyDisplayMode(disp) {
  displayMode = disp;
  document.body.classList.toggle('show-weeks', disp === 'weeks');
  document.querySelectorAll('.disp-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.disp === disp)
  );
}

// ── Event form ─────────────────────────────────────────────

function initEventForm() {
  const dateInput = document.getElementById('event-date');
  const today = new Date();
  dateInput.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  document.getElementById('set-event-btn').addEventListener('click', submitEvent);
  dateInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitEvent(); });
  document.getElementById('event-name').addEventListener('keydown', e => { if (e.key === 'Enter') submitEvent(); });
}

function submitEvent() {
  const type    = document.getElementById('event-type').value;
  const nameRaw = document.getElementById('event-name').value.trim();
  const dateStr = document.getElementById('event-date').value;

  if (!dateStr) { document.getElementById('event-date').focus(); return; }

  const [y, m, d] = dateStr.split('-').map(Number);
  const eventDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  const label     = nameRaw || `your ${type}`;
  const emoji     = EVENT_EMOJIS[type] || '';

  activeEvent = { label, date: eventDate, type, emoji };
  mode = 'event';
  showWidget();
  setTarget(label);
}

// ── Google Calendar ────────────────────────────────────────

function initGCalBtn() {
  document.getElementById('gcal-btn').addEventListener('click', openGoogleCalendar);
}

function openGoogleCalendar() {
  const target = getTargetDate();
  const label  = document.getElementById('display-target').textContent;
  if (!target || label === '—') return;

  const start   = fmtDate(target);
  const endDate = new Date(target);
  endDate.setDate(endDate.getDate() + 1);
  const end = fmtDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   label,
    dates:  `${start}/${end}`,
  });

  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    '_blank',
    'noopener,noreferrer'
  );
}

function fmtDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// ── Desktop widget ─────────────────────────────────────────

function initWidgetBtn() {
  document.getElementById('widget-btn').addEventListener('click', addToDesktopWidget);
}

function addToDesktopWidget() {
  if (!activeEvent) return;

  // Open the daysuntil:// protocol URL — the installed widget app receives it
  // and updates its countdown without any file download needed.
  const params = new URLSearchParams({
    name:  activeEvent.label,
    date:  `${activeEvent.date.getFullYear()}-${pad(activeEvent.date.getMonth() + 1)}-${pad(activeEvent.date.getDate())}`,
    type:  activeEvent.type  || 'Other',
    emoji: activeEvent.emoji || '',
  });

  window.location.href = `daysuntil://add?${params.toString()}`;
}

function showWidget() {
  show('widget-btn');
  show('widget-note');
}

function hideWidget() {
  hide('widget-btn');
  hide('widget-note');
}

// ── Mood picker ────────────────────────────────────────────

function initMoodPicker() {
  document.querySelectorAll('.mood-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      applyMood(swatch.dataset.mood);
      localStorage.setItem('mood', swatch.dataset.mood);
    });
  });
}

function applyMood(mood) {
  document.body.dataset.mood = mood;
  document.querySelectorAll('.mood-swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.mood === mood)
  );
}

// ── Timer core ─────────────────────────────────────────────

function setTarget(label) {
  document.getElementById('display-target').textContent = label;
  document.title = `Days until ${label}`;
  document.getElementById('gcal-btn').classList.remove('hidden');
  startTimer();
}

function startTimer() {
  stopTimer();
  tick();
  timerHandle = setInterval(tick, 1000);
}

function stopTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

function getTargetDate() {
  if (mode === 'year')       return new Date(selectedYear, 0, 1, 0, 0, 0, 0);
  if (activeEvent)           return activeEvent.date;
  return null;
}

function tick() {
  const target = getTargetDate();
  if (!target) return;

  const absMs    = Math.abs(target - Date.now());
  const isFuture = target > Date.now();

  if (isFuture) {
    renderCountdown(absMs);
    show('countdown');
    hide('time-ago');
  } else {
    renderTimeAgo(absMs);
    show('time-ago');
    hide('countdown');
  }
}

// ── Countdown rendering ────────────────────────────────────

function renderCountdown(absMs) {
  const totalSec  = Math.floor(absMs / 1000);
  const totalMin  = Math.floor(totalSec  / 60);
  const totalHrs  = Math.floor(totalMin  / 60);
  const totalDays = Math.floor(totalHrs  / 24);

  if (displayMode === 'days') {
    setValue('val-days', totalDays);
  } else {
    setValue('val-weeks', Math.floor(totalDays / 7));
    setValue('val-days',  totalDays % 7);
  }
  setValue('val-hours',   totalHrs  % 24);
  setValue('val-minutes', totalMin  % 60);
  setValue('val-seconds', totalSec  % 60, true);
}

function renderTimeAgo(absMs) {
  const totalSec  = Math.floor(absMs / 1000);
  const totalMin  = Math.floor(totalSec  / 60);
  const totalHrs  = Math.floor(totalMin  / 60);
  const totalDays = Math.floor(totalHrs  / 24);

  let summary;
  if (displayMode === 'days') {
    summary = `${totalDays.toLocaleString()} day${totalDays !== 1 ? 's' : ''}`;
  } else {
    const weeks   = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const parts   = [];
    if (weeks   > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
    if (remDays > 0) parts.push(`${remDays} day${remDays !== 1 ? 's' : ''}`);
    summary = parts.length ? parts.join(', ') : '0 days';
  }

  const label = document.getElementById('display-target').textContent;
  document.getElementById('time-ago-text').textContent = `${label} was ${summary} ago.`;
}

// ── Helpers ────────────────────────────────────────────────

function setValue(id, value, flash) {
  const el = document.getElementById(id);
  el.textContent = String(value).padStart(2, '0');
  if (flash) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}

function pad(n)   { return String(n).padStart(2, '0'); }
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

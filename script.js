const YEAR_FROM = 2027;
const YEAR_TO   = 2050;

let mode = 'year';          // 'year' | 'event'
let selectedYear = YEAR_FROM;
let activeEvent  = null;    // { label, date }
let timerHandle  = null;

document.addEventListener('DOMContentLoaded', () => {
  buildYearDropdown();
  initModeTabs();
  initEventForm();
  startTimer();
});

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
        setTarget(String(selectedYear));
      } else if (activeEvent) {
        setTarget(activeEvent.label);
      } else {
        // Show form, blank out header until user submits
        document.getElementById('display-target').textContent = '—';
        document.title = 'Days Until';
        stopTimer();
      }
    });
  });
}

// ── Event form ─────────────────────────────────────────────

function initEventForm() {
  // Set today as default date
  const dateInput = document.getElementById('event-date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = String(today.getMonth() + 1).padStart(2, '0');
  const dd   = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;

  document.getElementById('set-event-btn').addEventListener('click', submitEvent);
  document.getElementById('event-date').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitEvent();
  });
  document.getElementById('event-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitEvent();
  });
}

function submitEvent() {
  const typeSelect = document.getElementById('event-type');
  const nameInput  = document.getElementById('event-name');
  const dateInput  = document.getElementById('event-date');

  const type      = typeSelect.value;
  const nameRaw   = nameInput.value.trim();
  const dateStr   = dateInput.value;

  if (!dateStr) {
    dateInput.focus();
    return;
  }

  // Parse the date locally (avoid UTC timezone shift from new Date(string))
  const [y, m, d] = dateStr.split('-').map(Number);
  const eventDate = new Date(y, m - 1, d, 0, 0, 0, 0);

  const label = nameRaw || `your ${type}`;

  activeEvent = { label, date: eventDate };
  mode = 'event';

  setTarget(label);
}

// ── Timer core ─────────────────────────────────────────────

function setTarget(label) {
  document.getElementById('display-target').textContent = label;
  document.title = `Days until ${label}`;
  startTimer();
}

function startTimer() {
  stopTimer();
  tick();
  timerHandle = setInterval(tick, 1000);
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function getTargetDate() {
  if (mode === 'year') {
    // Count to Jan 1 of selected year (New Year)
    return new Date(selectedYear, 0, 1, 0, 0, 0, 0);
  }
  if (activeEvent) {
    return activeEvent.date;
  }
  return null;
}

function tick() {
  const target = getTargetDate();
  if (!target) return;

  const diffMs  = target - Date.now();
  const isFuture = diffMs > 0;

  if (isFuture) {
    updateCountdown(decompose(diffMs));
    show('countdown');
    hide('time-ago');
  } else {
    updateTimeAgo(decompose(diffMs));
    show('time-ago');
    hide('countdown');
  }
}

// ── Time math ──────────────────────────────────────────────

function decompose(diffMs) {
  const totalSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalDays    = Math.floor(totalHours   / 24);
  const totalWeeks   = Math.floor(totalDays    / 7);
  return {
    weeks:   totalWeeks,
    days:    totalDays    % 7,
    hours:   totalHours   % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  };
}

// ── DOM updates ────────────────────────────────────────────

function updateCountdown({ weeks, days, hours, minutes, seconds }) {
  setValue('val-weeks',   weeks);
  setValue('val-days',    days);
  setValue('val-hours',   hours);
  setValue('val-minutes', minutes);
  setValue('val-seconds', seconds, true);
}

function setValue(id, value, flash) {
  const el = document.getElementById(id);
  el.textContent = String(value).padStart(2, '0');
  if (flash) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}

function updateTimeAgo({ weeks, days, hours, minutes, seconds }) {
  const parts = [];
  if (weeks   > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
  if (days    > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours   > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  const label = document.getElementById('display-target').textContent;
  const summary = parts.slice(0, 3).join(', ');
  document.getElementById('time-ago-text').textContent =
    `${label} was ${summary} ago.`;
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

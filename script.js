const YEARS = [2026, 2027, 2028, 2029, 2030];

let selectedYear = getCurrentOrDefaultYear();
let timerHandle = null;

document.addEventListener('DOMContentLoaded', () => {
  buildYearSelector();
  selectYear(selectedYear);
});

function getCurrentOrDefaultYear() {
  const currentYear = new Date().getFullYear();
  return YEARS.includes(currentYear) ? currentYear : YEARS[0];
}

function buildYearSelector() {
  const nav = document.getElementById('year-selector');
  YEARS.forEach(year => {
    const btn = document.createElement('button');
    btn.className = 'year-btn';
    btn.dataset.year = year;
    btn.textContent = year;
    btn.setAttribute('aria-label', `Show countdown for ${year}`);
    btn.addEventListener('click', () => selectYear(year));
    nav.appendChild(btn);
  });
}

function selectYear(year) {
  selectedYear = year;

  document.querySelectorAll('.year-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.year) === year);
  });

  document.getElementById('display-year').textContent = year;
  document.title = `Is It Still ${year}?`;

  if (timerHandle) clearInterval(timerHandle);

  tick();
  timerHandle = setInterval(tick, 1000);
}

function getYearEnd(year) {
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

function decompose(diffMs) {
  const totalSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours   = Math.floor(totalMinutes / 60);
  const totalDays    = Math.floor(totalHours / 24);
  const totalWeeks   = Math.floor(totalDays / 7);
  return {
    weeks:   totalWeeks,
    days:    totalDays    % 7,
    hours:   totalHours   % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
  };
}

function tick() {
  const now = new Date();
  const yearEnd = getYearEnd(selectedYear);
  const diffMs = yearEnd - now;
  const isStill = diffMs > 0;

  updateVerdict(isStill);

  if (isStill) {
    updateCountdown(decompose(diffMs));
    show('countdown');
    hide('time-ago');
  } else {
    updateTimeAgo(decompose(diffMs));
    show('time-ago');
    hide('countdown');
  }
}

function updateVerdict(isStill) {
  const verdict = document.getElementById('verdict');
  const text = document.getElementById('verdict-text');
  const sub = document.getElementById('verdict-sub');

  verdict.className = isStill ? 'verdict-yes' : 'verdict-no';
  text.textContent = isStill ? 'YES' : 'NO';
  sub.textContent = isStill
    ? `${selectedYear} is still going. It ends in:`
    : `${selectedYear} is over. It ended:`;
}

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
  if (weeks > 0)   parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
  if (days > 0)    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0)   parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  const summary = parts.slice(0, 3).join(', ');
  document.getElementById('time-ago-text').textContent =
    `${selectedYear} ended ${summary} ago.`;
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

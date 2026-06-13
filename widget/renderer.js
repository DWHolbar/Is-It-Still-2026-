'use strict';

let config      = null;
let timerHandle = null;
let isPinned    = true;

async function init() {
  config = await window.api.getConfig();
  render();

  window.api.onConfigUpdated((updated) => {
    config = updated;
    render();
    restartTimer();
  });
}

function render() {
  const nameEl    = document.getElementById('event-name');
  const tilesEl   = document.getElementById('tiles');
  const noEventEl = document.getElementById('no-event');
  const pastEl    = document.getElementById('past-label');

  if (!config) {
    nameEl.textContent = '—';
    tilesEl.classList.add('hidden');
    noEventEl.classList.remove('hidden');
    pastEl.classList.add('hidden');
    stopTimer();
    return;
  }

  noEventEl.classList.add('hidden');
  tilesEl.classList.remove('hidden');

  const label = config.emoji ? `${config.emoji}  ${config.name}` : config.name;
  nameEl.textContent = label;

  restartTimer();
}

function restartTimer() {
  stopTimer();
  if (!config) return;
  tick();
  timerHandle = setInterval(tick, 1000);
}

function stopTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

function tick() {
  if (!config) return;

  const [y, m, d] = config.date.split('-').map(Number);
  const target    = new Date(y, m - 1, d, 0, 0, 0, 0);
  const now       = Date.now();
  const diffMs    = target - now;
  const isFuture  = diffMs > 0;
  const absMs     = Math.abs(diffMs);

  const totalSec  = Math.floor(absMs / 1000);
  const totalMin  = Math.floor(totalSec / 60);
  const totalHrs  = Math.floor(totalMin / 60);
  const totalDays = Math.floor(totalHrs / 24);

  setValue('val-days',    totalDays,       false);
  setValue('val-hours',   totalHrs  % 24,  false);
  setValue('val-minutes', totalMin  % 60,  false);
  setValue('val-seconds', totalSec  % 60,  true);

  document.getElementById('past-label').classList.toggle('hidden', isFuture);
}

function setValue(id, value, flash) {
  const el = document.getElementById(id);
  if (!el) return;
  const str = String(value).padStart(2, '0');
  if (el.textContent === str) return;
  el.textContent = str;
  if (flash) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}

document.getElementById('close-btn').addEventListener('click', () => {
  window.api.quit();
});

document.getElementById('pin-btn').addEventListener('click', () => {
  isPinned = !isPinned;
  window.api.setAlwaysOnTop(isPinned);
  document.getElementById('pin-btn').classList.toggle('pinned', isPinned);
  document.getElementById('pin-btn').setAttribute('aria-pressed', String(isPinned));
  document.getElementById('pin-btn').title = isPinned ? 'Unpin (floating)' : 'Pin (always on top)';
});

async function doImport() {
  const result = await window.api.importConfig();
  if (result) {
    config = result;
    render();
  }
}

document.getElementById('import-btn').addEventListener('click', doImport);
document.getElementById('import-btn-empty').addEventListener('click', doImport);

init();

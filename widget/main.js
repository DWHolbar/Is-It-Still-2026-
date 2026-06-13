'use strict';

const {
  app, BrowserWindow, ipcMain, Tray, Menu,
  dialog, screen, nativeImage,
} = require('electron');
const path = require('path');
const fs   = require('fs');

const CONFIG_FILE = path.join(app.getPath('userData'), 'dayuntil-event.json');
const PROTOCOL    = 'daysuntil';

let mainWindow = null;
let tray       = null;

// ── Single-instance guard ──────────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', (_event, argv) => {
  // Windows: protocol URL arrives as a CLI arg in the second instance
  const url = argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
  if (url) handleProtocolUrl(url);

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// macOS: protocol URL when the app is already running
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});

// ── App lifecycle ──────────────────────────────────────────
app.whenReady().then(() => {
  app.setAsDefaultProtocolClient(PROTOCOL);

  createWindow();
  createTray();

  // Windows: on first launch via protocol, URL is in argv
  const protocolUrl = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
  if (protocolUrl) {
    // Delay until the window is ready to receive IPC
    setTimeout(() => handleProtocolUrl(protocolUrl), 800);
  }
});

// Keep running in tray when all windows are closed
app.on('window-all-closed', () => { /* intentionally empty */ });

// macOS: re-show on dock click
app.on('activate', () => {
  if (mainWindow) mainWindow.show();
  else createWindow();
});

// ── Protocol URL handler ───────────────────────────────────
function handleProtocolUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'add') return;

    const name  = parsed.searchParams.get('name')  || '';
    const date  = parsed.searchParams.get('date')  || '';
    const type  = parsed.searchParams.get('type')  || 'Other';
    const emoji = parsed.searchParams.get('emoji') || '';

    const config = validateConfig({ name, date, type, emoji });
    if (!config) return;

    writeConfig(config);
    mainWindow?.webContents.send('config-updated', config);
  } catch {
    // Ignore malformed URLs
  }
}

// ── Window ─────────────────────────────────────────────────
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width:  300,
    height: 152,
    x: width  - 320,
    y: height - 172,
    transparent:  true,
    frame:        false,
    alwaysOnTop:  true,
    resizable:    false,
    skipTaskbar:  false,
    show:         false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      devTools:         !app.isPackaged,
      sandbox: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', e => e.preventDefault());
}

// ── Tray ───────────────────────────────────────────────────
function buildTrayIcon() {
  const assetPath = path.join(__dirname, 'assets', 'tray.png');
  if (fs.existsSync(assetPath)) {
    return nativeImage.createFromPath(assetPath);
  }

  // Programmatic 16×16 purple circle fallback
  const size = 16;
  const buf  = Buffer.alloc(size * size * 4, 0);
  const cx = size / 2, cy = size / 2, r = (size / 2) - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - cx, y - cy) <= r) {
        const i  = (y * size + x) * 4;
        buf[i]   = 180;
        buf[i+1] =  90;
        buf[i+2] = 200;
        buf[i+3] = 255;
      }
    }
  }
  try {
    return nativeImage.createFromBitmap(buf, { width: size, height: size });
  } catch {
    return nativeImage.createEmpty();
  }
}

function createTray() {
  try {
    tray = new Tray(buildTrayIcon());
    tray.setToolTip('Days Until Widget');

    tray.on('click', () => {
      if (!mainWindow) createWindow();
      else if (mainWindow.isVisible()) mainWindow.focus();
      else mainWindow.show();
    });

    refreshTrayMenu();
  } catch (err) {
    console.warn('Could not create system tray:', err.message);
  }
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Widget',           click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: 'Import Event Config…',  click: () => runImport() },
    { type: 'separator' },
    { label: 'Quit Days Until',       click: () => app.quit() },
  ]));
}

// ── Config helpers ─────────────────────────────────────────
function validateConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const name  = typeof raw.name  === 'string' ? raw.name.slice(0, 100).trim()  : null;
  const date  = typeof raw.date  === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;
  const type  = typeof raw.type  === 'string' ? raw.type.slice(0,  50) : 'Other';
  const emoji = typeof raw.emoji === 'string' ? raw.emoji.slice(0,   8) : '';

  if (!name || !date) return null;
  return { name, date, type, emoji };
}

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return validateConfig(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
    }
  } catch { /* ignore */ }
  return null;
}

function writeConfig(config) {
  const valid = validateConfig(config);
  if (!valid) return false;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(valid, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// ── Import flow (manual file picker fallback) ──────────────
async function runImport() {
  const result = await dialog.showOpenDialog(mainWindow ?? undefined, {
    title:       'Import Days Until Event Config',
    filters:     [{ name: 'JSON Config', extensions: ['json'] }],
    properties:  ['openFile'],
  });

  if (result.canceled || !result.filePaths.length) return null;

  let config;
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    config = validateConfig(JSON.parse(raw));
  } catch {
    await dialog.showMessageBox(mainWindow ?? undefined, {
      type: 'error', title: 'Invalid Config',
      message: 'The selected file is not a valid Days Until config.',
    });
    return null;
  }

  if (!config) {
    await dialog.showMessageBox(mainWindow ?? undefined, {
      type: 'error', title: 'Invalid Config',
      message: 'Missing required fields (name, date). Please download a fresh config from the website.',
    });
    return null;
  }

  writeConfig(config);
  mainWindow?.webContents.send('config-updated', config);
  return config;
}

// ── IPC handlers ───────────────────────────────────────────
ipcMain.handle('get-config',    ()        => readConfig());
ipcMain.handle('save-config',   (_, cfg)  => writeConfig(cfg));
ipcMain.handle('import-config', ()        => runImport());

ipcMain.on('quit-app',          ()        => app.quit());
ipcMain.on('set-always-on-top', (_, v)    => mainWindow?.setAlwaysOnTop(Boolean(v)));

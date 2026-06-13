'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig:       () => ipcRenderer.invoke('get-config'),
  saveConfig:      (config) => ipcRenderer.invoke('save-config', config),
  importConfig:    () => ipcRenderer.invoke('import-config'),
  quit:            () => ipcRenderer.send('quit-app'),
  setAlwaysOnTop:  (val) => ipcRenderer.send('set-always-on-top', Boolean(val)),
  onConfigUpdated: (cb) => {
    ipcRenderer.removeAllListeners('config-updated');
    ipcRenderer.on('config-updated', (_event, config) => cb(config));
  },
});

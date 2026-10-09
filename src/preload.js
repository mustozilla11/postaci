const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('postaciAPI', {
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  switchTab: (id) => ipcRenderer.invoke('switch-tab', id),
  addTab: (account) => ipcRenderer.invoke('add-tab', account),
  removeTab: (id) => ipcRenderer.invoke('remove-tab', id),
  reloadTab: (id) => ipcRenderer.invoke('reload-tab', id),
  updateTab: (account) => ipcRenderer.invoke('update-tab', account),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onTabsUpdated: (callback) => ipcRenderer.on('tabs-updated', (_event, value) => callback(value))
});

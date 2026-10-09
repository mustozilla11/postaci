const { app, BrowserWindow, WebContentsView, ipcMain } = require('electron');
const path = require('path');
const Store = require('./store');

// Wayland ve modern Linux GPU desteği için Ozone platform ipucu
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');

// Standart Desktop Chrome User Agent
const CHROME_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.191 Safari/537.36';

// Google OAuth / Giriş sayfaları için versiyonsuz Chromeless User-Agent
// (Google botguard tespitini aşarak "Bu tarayıcı veya uygulama güvenli olmayabilir" hatasını çözer)
const CHROMELESS_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36';

let mainWindow = null;
let store = null;
const accountViews = new Map(); // id -> WebContentsView
let activeAccountId = null;

function getServiceDefaultUrl(service) {
  switch (service) {
    case 'gmail':
      return 'https://mail.google.com';
    case 'outlook':
      return 'https://outlook.live.com';
    case 'icloud':
      return 'https://www.icloud.com/mail';
    default:
      return '';
  }
}

function updateViewBounds() {
  if (!mainWindow) return;

  const [width, height] = mainWindow.getContentSize();
  const TAB_BAR_HEIGHT = 44; // Üst sekme çubuğu yüksekliği

  if (!activeAccountId) return;
  const view = accountViews.get(activeAccountId);
  if (!view) return;

  view.setBounds({
    x: 0,
    y: TAB_BAR_HEIGHT,
    width: Math.max(0, width),
    height: Math.max(0, height - TAB_BAR_HEIGHT)
  });
}

function createAccountView(account) {
  if (accountViews.has(account.id)) {
    return accountViews.get(account.id);
  }

  // İzole session (persist:hesap_id)
  const view = new WebContentsView({
    webPreferences: {
      partition: `persist:${account.id}`,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const session = view.webContents.session;

  // İstek başlıklarını dinamik ayarla:
  // accounts.google.com üzerinde Chromeless UA göndererek güvenli değil uyarısını engelliyoruz
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    const isGoogleAuth = details.url.includes('accounts.google.com');
    details.requestHeaders['User-Agent'] = isGoogleAuth
      ? CHROMELESS_USER_AGENT
      : CHROME_USER_AGENT;
    callback({ requestHeaders: details.requestHeaders });
  });

  // Genel WebContents User-Agent
  view.webContents.setUserAgent(CHROME_USER_AGENT);

  const targetUrl = account.url || getServiceDefaultUrl(account.service);
  if (targetUrl) {
    view.webContents.loadURL(targetUrl);
  }

  // Yeni pencere açma isteklerini yönet
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.includes('accounts.google.com') ||
      url.includes('login.microsoftonline.com') ||
      url.includes('appleid.apple.com') ||
      url.includes('live.com')
    ) {
      view.webContents.loadURL(url);
      return { action: 'deny' };
    }
    const { shell } = require('electron');
    shell.openExternal(url);
    return { action: 'deny' };
  });

  accountViews.set(account.id, view);
  return view;
}

function activateAccountTab(accountId) {
  if (!mainWindow) return;

  // Önceki aktif görünümü pencereden kaldır
  if (activeAccountId && accountViews.has(activeAccountId)) {
    const prevView = accountViews.get(activeAccountId);
    try {
      mainWindow.contentView.removeChildView(prevView);
    } catch (e) {}
  }

  if (!accountId) {
    activeAccountId = null;
    store.set('activeAccountId', null);
    return;
  }

  const accounts = store.get('accounts') || [];
  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    activeAccountId = null;
    store.set('activeAccountId', null);
    return;
  }

  activeAccountId = accountId;
  store.set('activeAccountId', accountId);

  let view = accountViews.get(accountId);
  if (!view) {
    view = createAccountView(account);
  }

  mainWindow.contentView.addChildView(view);
  updateViewBounds();
}

function removeAccountTab(accountId) {
  if (!mainWindow) return;

  const view = accountViews.get(accountId);
  if (view) {
    try {
      mainWindow.contentView.removeChildView(view);
    } catch (e) {}
    accountViews.delete(accountId);
  }

  let accounts = store.get('accounts') || [];
  accounts = accounts.filter((a) => a.id !== accountId);
  store.set('accounts', accounts);

  if (activeAccountId === accountId) {
    if (accounts.length > 0) {
      activateAccountTab(accounts[0].id);
    } else {
      activateAccountTab(null);
    }
  }
}

function createWindow() {
  // Varsayılan hesap listesi boş (kullanıcı başlangıçta hesap seçer)
  store = new Store({
    accounts: [],
    activeAccountId: null,
    windowBounds: { width: 1200, height: 800 }
  });

  const savedBounds = store.get('windowBounds') || { width: 1200, height: 800 };

  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    minWidth: 800,
    minHeight: 500,
    title: `Postacı v${app.getVersion()}`,
    icon: path.join(__dirname, '../assets/icon.png'),
    backgroundColor: '#1e1e2e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('resize', () => {
    updateViewBounds();
    const [width, height] = mainWindow.getContentSize();
    store.set('windowBounds', { width, height });
  });

  mainWindow.webContents.once('did-finish-load', () => {
    const accounts = store.get('accounts') || [];
    const savedActiveId = store.get('activeAccountId');

    if (accounts.length > 0) {
      const targetId = accounts.some((a) => a.id === savedActiveId)
        ? savedActiveId
        : accounts[0].id;
      activateAccountTab(targetId);
    } else {
      activateAccountTab(null);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    accountViews.clear();
  });
}

// IPC Handlers
ipcMain.handle('get-accounts', () => {
  return {
    accounts: store.get('accounts') || [],
    activeAccountId: store.get('activeAccountId')
  };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('switch-tab', (_event, accountId) => {
  activateAccountTab(accountId);
  return true;
});

ipcMain.handle('add-tab', (_event, accountData) => {
  const accounts = store.get('accounts') || [];
  const newAccount = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: accountData.name || 'Yeni Hesap',
    service: accountData.service || 'custom',
    url: accountData.url || getServiceDefaultUrl(accountData.service),
    createdAt: Date.now()
  };

  accounts.push(newAccount);
  store.set('accounts', accounts);

  activateAccountTab(newAccount.id);
  return newAccount;
});

ipcMain.handle('remove-tab', (_event, accountId) => {
  removeAccountTab(accountId);
  return true;
});

ipcMain.handle('reload-tab', (_event, accountId) => {
  const view = accountViews.get(accountId);
  if (view) {
    view.webContents.reload();
  }
  return true;
});

ipcMain.handle('update-tab', (_event, updatedData) => {
  let accounts = store.get('accounts') || [];
  accounts = accounts.map((acc) => {
    if (acc.id === updatedData.id) {
      return { ...acc, name: updatedData.name, url: updatedData.url };
    }
    return acc;
  });
  store.set('accounts', accounts);
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

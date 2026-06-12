import {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  session,
  protocol,
  shell,
  Menu,
  nativeTheme,
} from "electron";
import path from "path";
import fs from "fs";
import {
  getAllDomains,
  registerDomain,
  deleteDomain,
  getSiteFiles,
  saveSiteFile,
  getDomainByName,
} from "./domainRegistry";
import { startSiteServer, stopSiteServer, getServerPort } from "./siteServer";
import { isBlockedUrl } from "./adBlocker";
import Store from "electron-store";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

interface Settings {
  adBlocker: boolean;
  trackerBlocker: boolean;
  fingerprintProtection: boolean;
  vpnEnabled: boolean;
  vpnServer: string;
  hardwareAcceleration: boolean;
  maxMemoryMb: number;
  theme: "dark" | "light" | "system";
  searchEngine: string;
  homepage: string;
  downloadPath: string;
  javascriptEnabled: boolean;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
}

const defaultSettings: Settings = {
  adBlocker: true,
  trackerBlocker: true,
  fingerprintProtection: true,
  vpnEnabled: false,
  vpnServer: "auto",
  hardwareAcceleration: true,
  maxMemoryMb: 512,
  theme: "dark",
  searchEngine: "https://search.brave.com/search?q=",
  homepage: "consia://browser",
  javascriptEnabled: true,
  cookiesEnabled: true,
  doNotTrack: true,
  downloadPath: app.getPath("downloads"),
};

const store = new Store<{ settings: Settings; bookmarks: Bookmark[]; history: HistoryEntry[] }>({
  defaults: {
    settings: defaultSettings,
    bookmarks: [],
    history: [],
  },
});

interface Tab {
  id: number;
  view: BrowserView;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  createdAt: string;
}

interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: string;
}

let mainWindow: BrowserWindow | null = null;
const tabs = new Map<number, Tab>();
let nextTabId = 1;
let activeTabId = -1;

function getSettings(): Settings {
  return store.get("settings", defaultSettings);
}

function saveSettings(settings: Partial<Settings>) {
  const current = getSettings();
  store.set("settings", { ...current, ...settings });
}

async function createWindow() {
  const settings = getSettings();
  if (!settings.hardwareAcceleration) {
    app.disableHardwareAcceleration();
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: "#0f0f11",
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: false,
    },
    icon: path.join(__dirname, "../public/icon.png"),
    show: false,
  });

  nativeTheme.themeSource = settings.theme === "system" ? "system" : settings.theme;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow!.show();
    openNewTab(settings.homepage || "consia://browser");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("resize", updateActiveViewBounds);
  mainWindow.on("maximize", updateActiveViewBounds);
  mainWindow.on("unmaximize", updateActiveViewBounds);

  setupAdBlocker();
  await startSiteServer();
  setupMenu();
}

function setupAdBlocker() {
  const settings = getSettings();
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ["<all_urls>"] },
    (details, callback) => {
      const blocked = isBlockedUrl(details.url, settings.adBlocker || settings.trackerBlocker);
      callback({ cancel: blocked });
    }
  );
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };
    if (settings.doNotTrack) {
      headers["DNT"] = "1";
      headers["Sec-GPC"] = "1";
    }
    if (settings.fingerprintProtection) {
      headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }
    callback({ requestHeaders: headers });
  });
}

function getChromeTabBarHeight(): number {
  return 90;
}

function updateActiveViewBounds() {
  if (!mainWindow || activeTabId === -1) return;
  const tab = tabs.get(activeTabId);
  if (!tab) return;
  const [winWidth, winHeight] = mainWindow.getContentSize();
  const topOffset = getChromeTabBarHeight();
  tab.view.setBounds({ x: 0, y: topOffset, width: winWidth, height: winHeight - topOffset });
}

function broadcastTabState() {
  if (!mainWindow) return;
  const tabList = Array.from(tabs.values()).map((t) => ({
    id: t.id,
    url: t.url,
    title: t.title,
    favicon: t.favicon,
    loading: t.loading,
    canGoBack: t.canGoBack,
    canGoForward: t.canGoForward,
  }));
  mainWindow.webContents.send("tab-state-update", {
    tabs: tabList,
    activeTabId,
  });
}

function resolveUrl(rawUrl: string): string {
  const settings = getSettings();
  if (!rawUrl.trim()) return "consia://browser";
  if (rawUrl.startsWith("consia://")) return rawUrl;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  if (rawUrl.includes(".") && !rawUrl.includes(" ")) {
    return "https://" + rawUrl;
  }
  return settings.searchEngine + encodeURIComponent(rawUrl);
}

function getLocalSiteUrl(domain: string): string | null {
  const port = getServerPort();
  if (!port) return null;
  const domainEntry = getDomainByName(domain);
  if (!domainEntry) return null;
  return `http://127.0.0.1:${port}`;
}

function openNewTab(url: string = "consia://browser"): number {
  if (!mainWindow) return -1;
  const tabId = nextTabId++;
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      javascript: getSettings().javascriptEnabled,
    },
  });
  const tab: Tab = {
    id: tabId,
    view,
    url: "",
    title: "New Tab",
    favicon: "",
    loading: false,
    canGoBack: false,
    canGoForward: false,
  };
  tabs.set(tabId, tab);
  mainWindow.addBrowserView(view);

  view.webContents.on("did-start-loading", () => {
    tab.loading = true;
    broadcastTabState();
  });
  view.webContents.on("did-stop-loading", () => {
    tab.loading = false;
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    broadcastTabState();
  });
  view.webContents.on("page-title-updated", (_, title) => {
    tab.title = title;
    broadcastTabState();
    addToHistory(tab.url, title);
  });
  view.webContents.on("did-navigate", (_, navUrl) => {
    tab.url = navUrl;
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    broadcastTabState();
  });
  view.webContents.on("did-navigate-in-page", (_, navUrl) => {
    tab.url = navUrl;
    tab.canGoBack = view.webContents.canGoBack();
    tab.canGoForward = view.webContents.canGoForward();
    broadcastTabState();
  });
  view.webContents.on("page-favicon-updated", (_, favicons) => {
    tab.favicon = favicons[0] ?? "";
    broadcastTabState();
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    openNewTab(url);
    return { action: "deny" };
  });
  view.webContents.on("did-fail-load", (_, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;
    const errorHtml = getErrorPage(validatedURL, errorDescription);
    view.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  });

  activateTab(tabId);
  navigateTab(tabId, url);
  return tabId;
}

function activateTab(tabId: number) {
  if (!mainWindow) return;
  const tab = tabs.get(tabId);
  if (!tab) return;
  for (const [id, t] of tabs) {
    if (id !== tabId) {
      const [w, h] = mainWindow.getContentSize();
      t.view.setBounds({ x: 0, y: 0, width: w, height: 0 });
    }
  }
  activeTabId = tabId;
  updateActiveViewBounds();
  broadcastTabState();
}

function navigateTab(tabId: number, rawUrl: string) {
  const tab = tabs.get(tabId);
  if (!tab) return;
  const url = resolveUrl(rawUrl);
  tab.url = url;
  if (url.startsWith("consia://")) {
    loadInternalPage(tab, url);
  } else if (url.startsWith("https://") || url.startsWith("http://")) {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const localUrl = getLocalSiteUrl(hostname);
    if (localUrl) {
      tab.view.webContents.loadURL(localUrl);
    } else {
      tab.view.webContents.loadURL(url);
    }
  }
  broadcastTabState();
}

function loadInternalPage(tab: Tab, url: string) {
  const page = url.replace("consia://", "");
  let html = "";
  if (page === "browser" || page === "newtab" || page === "") {
    html = getNewTabPage();
  } else if (page === "settings") {
    html = getSettingsRedirectPage();
  } else if (page === "history") {
    html = getHistoryPage();
  } else if (page === "bookmarks") {
    html = getBookmarksPage();
  } else {
    html = getNotFoundPage(url);
  }
  tab.view.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  tab.title = page === "browser" || page === "newtab" ? "Consia Browser" : page;
}

function closeTab(tabId: number) {
  if (!mainWindow) return;
  const tab = tabs.get(tabId);
  if (!tab) return;
  mainWindow.removeBrowserView(tab.view);
  (tab.view.webContents as any).destroy?.();
  tabs.delete(tabId);
  if (activeTabId === tabId) {
    const remaining = Array.from(tabs.keys());
    if (remaining.length > 0) {
      activateTab(remaining[remaining.length - 1]);
    } else {
      activeTabId = -1;
      openNewTab("consia://browser");
    }
  }
  broadcastTabState();
}

function addToHistory(url: string, title: string) {
  if (!url || url.startsWith("data:") || url.startsWith("consia://")) return;
  const history: HistoryEntry[] = store.get("history", []);
  history.unshift({ url, title, visitedAt: new Date().toISOString() });
  if (history.length > 1000) history.splice(1000);
  store.set("history", history);
}

function setupIpcHandlers() {
  ipcMain.handle("tab:open", (_, url?: string) => openNewTab(url));
  ipcMain.handle("tab:close", (_, tabId: number) => closeTab(tabId));
  ipcMain.handle("tab:activate", (_, tabId: number) => activateTab(tabId));
  ipcMain.handle("tab:navigate", (_, tabId: number, url: string) => navigateTab(tabId, url));
  ipcMain.handle("tab:goBack", (_, tabId: number) => {
    tabs.get(tabId)?.view.webContents.goBack();
  });
  ipcMain.handle("tab:goForward", (_, tabId: number) => {
    tabs.get(tabId)?.view.webContents.goForward();
  });
  ipcMain.handle("tab:reload", (_, tabId: number) => {
    tabs.get(tabId)?.view.webContents.reload();
  });
  ipcMain.handle("tab:stop", (_, tabId: number) => {
    tabs.get(tabId)?.view.webContents.stop();
  });
  ipcMain.handle("tab:getState", () => {
    const tabList = Array.from(tabs.values()).map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      favicon: t.favicon,
      loading: t.loading,
      canGoBack: t.canGoBack,
      canGoForward: t.canGoForward,
    }));
    return { tabs: tabList, activeTabId };
  });

  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:save", (_, settings: Partial<Settings>) => {
    saveSettings(settings);
    setupAdBlocker();
    const s = getSettings();
    nativeTheme.themeSource = s.theme === "system" ? "system" : s.theme;
    return true;
  });

  ipcMain.handle("domains:getAll", () => getAllDomains());
  ipcMain.handle("domains:register", (_, entry) => registerDomain(entry));
  ipcMain.handle("domains:delete", (_, id: string) => deleteDomain(id));
  ipcMain.handle("domains:getFiles", (_, domainId: string) => getSiteFiles(domainId));
  ipcMain.handle("domains:saveFile", (_, domainId: string, fileName: string, content: string) =>
    saveSiteFile(domainId, fileName, content)
  );

  ipcMain.handle("bookmarks:get", () => store.get("bookmarks", []));
  ipcMain.handle("bookmarks:add", (_, bookmark: Omit<Bookmark, "id" | "createdAt">) => {
    const bookmarks: Bookmark[] = store.get("bookmarks", []);
    const newB: Bookmark = { ...bookmark, id: `${Date.now()}`, createdAt: new Date().toISOString() };
    bookmarks.unshift(newB);
    store.set("bookmarks", bookmarks);
    return newB;
  });
  ipcMain.handle("bookmarks:delete", (_, id: string) => {
    const bookmarks: Bookmark[] = store.get("bookmarks", []);
    store.set("bookmarks", bookmarks.filter((b) => b.id !== id));
  });

  ipcMain.handle("history:get", () => store.get("history", []));
  ipcMain.handle("history:clear", () => store.set("history", []));

  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle("window:close", () => mainWindow?.close());
  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

  ipcMain.handle("shell:openExternal", (_, url: string) => shell.openExternal(url));
  ipcMain.handle("shell:showItemInFolder", (_, filePath: string) =>
    shell.showItemInFolder(filePath)
  );
  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:getDataPath", () => app.getPath("userData"));
}

function setupMenu() {
  Menu.setApplicationMenu(null);
}

function getNewTabPage(): string {
  const settings = getSettings();
  const history: HistoryEntry[] = store.get("history", []).slice(0, 8);
  const bookmarks: Bookmark[] = store.get("bookmarks", []).slice(0, 8);
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consia Browser</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f11; color: #e0e0e0; min-height: 100vh; }
    .hero { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem 3rem; text-align: center; }
    .logo { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; }
    .tagline { color: #6b7280; font-size: 0.95rem; margin-bottom: 0.75rem; }
    .clock { font-size: 3.5rem; font-weight: 200; color: #f3f4f6; margin-bottom: 0.25rem; }
    .date { font-size: 1rem; color: #6b7280; margin-bottom: 2.5rem; }
    .search-bar { display: flex; align-items: center; background: #1a1a2e; border: 1px solid #2d2d3d; border-radius: 999px; padding: 0.6rem 1.2rem; gap: 0.5rem; width: 100%; max-width: 540px; margin: 0 auto 3rem; }
    .search-bar input { background: none; border: none; outline: none; color: #e0e0e0; font-size: 1rem; flex: 1; }
    .search-bar button { background: none; border: none; cursor: pointer; color: #60a5fa; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .section { background: #1a1a2e; border: 1px solid #2d2d3d; border-radius: 0.75rem; padding: 1.25rem; }
    .section h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 0.75rem; }
    .item { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; border-radius: 0.4rem; text-decoration: none; color: #c0c0d0; font-size: 0.875rem; white-space: nowrap; overflow: hidden; }
    .item:hover { color: #60a5fa; }
    .item-icon { width: 16px; height: 16px; background: #2d2d3d; border-radius: 3px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; }
    .empty { color: #4b5563; font-size: 0.8rem; padding: 0.5rem 0; }
    .stats { display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 1.5rem; }
    .stat { text-align: center; }
    .stat-num { font-size: 1.25rem; font-weight: 600; color: #60a5fa; }
    .stat-label { font-size: 0.75rem; color: #6b7280; }
    .badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
    .badge.green { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .badge.blue { background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
    .privacy-bar { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="logo">Consia Browser</div>
    <div class="tagline">v0.0.0.1 KDICLM · Privacy-first · Local-first</div>
    <div class="clock">${time}</div>
    <div class="date">${date}</div>
    <div class="privacy-bar">
      <span class="badge green">● Ad Blocker ${settings.adBlocker ? "On" : "Off"}</span>
      <span class="badge green">● Tracker Blocker ${settings.trackerBlocker ? "On" : "Off"}</span>
      <span class="badge ${settings.vpnEnabled ? "green" : "blue"}">● VPN ${settings.vpnEnabled ? "Connected" : "Off"}</span>
      <span class="badge blue">● Consia Local Network</span>
    </div>
  </div>
  <div class="grid">
    <div class="section">
      <h3>Recent History</h3>
      ${
        history.length
          ? history.map((h) => `<a href="${h.url}" class="item"><span class="item-icon">🌐</span><span style="overflow:hidden;text-overflow:ellipsis">${h.title || h.url}</span></a>`).join("")
          : '<div class="empty">No history yet</div>'
      }
    </div>
    <div class="section">
      <h3>Bookmarks</h3>
      ${
        bookmarks.length
          ? bookmarks.map((b) => `<a href="${b.url}" class="item"><span class="item-icon">⭐</span><span style="overflow:hidden;text-overflow:ellipsis">${b.title || b.url}</span></a>`).join("")
          : '<div class="empty">No bookmarks yet</div>'
      }
    </div>
    <div class="section">
      <h3>Consia Domains</h3>
      ${getAllDomains().slice(0, 6).map((d) => `<div class="item"><span class="item-icon">🏠</span><span>${d.domain}</span></div>`).join("") || '<div class="empty">No local domains registered</div>'}
    </div>
    <div class="section">
      <h3>Quick Access</h3>
      <a href="consia://settings" class="item"><span class="item-icon">⚙️</span> Settings</a>
      <a href="consia://browser" class="item"><span class="item-icon">🏠</span> Consia Home</a>
      <a href="consia://history" class="item"><span class="item-icon">📜</span> Full History</a>
      <a href="consia://bookmarks" class="item"><span class="item-icon">⭐</span> All Bookmarks</a>
    </div>
  </div>
</body>
</html>`;
}

function getHistoryPage(): string {
  const history: HistoryEntry[] = store.get("history", []);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>History</title><style>body{font-family:system-ui;background:#0f0f11;color:#e0e0e0;padding:2rem;max-width:800px;margin:0 auto}h1{margin-bottom:1.5rem;color:#60a5fa}a{color:#a5b4fc;text-decoration:none}.item{padding:.75rem;border-bottom:1px solid #2d2d3d;display:flex;flex-direction:column;gap:.2rem}.url{font-size:.8rem;color:#6b7280}.time{font-size:.75rem;color:#4b5563}</style></head><body><h1>History</h1>${history.map((h) => `<div class="item"><a href="${h.url}">${h.title || h.url}</a><span class="url">${h.url}</span><span class="time">${new Date(h.visitedAt).toLocaleString()}</span></div>`).join("") || "<p>No history.</p>"}</body></html>`;
}

function getBookmarksPage(): string {
  const bookmarks: Bookmark[] = store.get("bookmarks", []);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bookmarks</title><style>body{font-family:system-ui;background:#0f0f11;color:#e0e0e0;padding:2rem;max-width:800px;margin:0 auto}h1{margin-bottom:1.5rem;color:#60a5fa}a{color:#a5b4fc;text-decoration:none}.item{padding:.75rem;border-bottom:1px solid #2d2d3d}.url{font-size:.8rem;color:#6b7280}</style></head><body><h1>Bookmarks</h1>${bookmarks.map((b) => `<div class="item"><a href="${b.url}">${b.title || b.url}</a><div class="url">${b.url}</div></div>`).join("") || "<p>No bookmarks.</p>"}</body></html>`;
}

function getSettingsRedirectPage(): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Settings</title><style>body{font-family:system-ui;background:#0f0f11;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}p{color:#6b7280}</style></head><body><p>Open Settings from the browser UI sidebar.</p></body></html>`;
}

function getErrorPage(url: string, error: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Can't reach this page</title><style>body{font-family:system-ui;background:#0f0f11;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:1rem;text-align:center}h1{font-size:2rem;color:#f87171}p{color:#6b7280}small{font-size:.75rem;color:#4b5563}</style></head><body><h1>Can't reach this page</h1><p>${url}</p><small>${error}</small></body></html>`;
}

function getNotFoundPage(url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not Found</title><style>body{font-family:system-ui;background:#0f0f11;color:#e0e0e0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:1rem;text-align:center}h1{color:#f87171}p{color:#6b7280}</style></head><body><h1>404 - Not Found</h1><p>${url} is not a valid Consia page.</p></body></html>`;
}

protocol.registerSchemesAsPrivileged([
  { scheme: "consia", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

app.whenReady().then(async () => {
  protocol.handle("consia", (request) => {
    const page = request.url.replace("consia://", "").replace(/\/$/, "") || "browser";
    const html = page === "browser" || page === "newtab" ? getNewTabPage() : getNotFoundPage(request.url);
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  });
  setupIpcHandlers();
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopSiteServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopSiteServer();
});

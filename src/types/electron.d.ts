export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface TabState {
  tabs: TabInfo[];
  activeTabId: number;
}

export interface DomainEntry {
  id: string;
  domain: string;
  type: "free" | "paid";
  owner: string;
  createdAt: string;
  siteDir: string;
  description: string;
  isPc: boolean;
}

export interface SiteFile {
  name: string;
  content: string;
  type: "html" | "css" | "js" | "other";
}

export interface Settings {
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

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  createdAt: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: string;
}

export interface CConsiaAPI {
  tab: {
    open: (url?: string) => Promise<number>;
    close: (tabId: number) => Promise<void>;
    activate: (tabId: number) => Promise<void>;
    navigate: (tabId: number, url: string) => Promise<void>;
    goBack: (tabId: number) => Promise<void>;
    goForward: (tabId: number) => Promise<void>;
    reload: (tabId: number) => Promise<void>;
    stop: (tabId: number) => Promise<void>;
    getState: () => Promise<TabState>;
    onStateUpdate: (cb: (state: TabState) => void) => void;
    offStateUpdate: () => void;
  };
  settings: {
    get: () => Promise<Settings>;
    save: (settings: Partial<Settings>) => Promise<boolean>;
  };
  domains: {
    getAll: () => Promise<DomainEntry[]>;
    register: (entry: Omit<DomainEntry, "id" | "createdAt" | "siteDir">) => Promise<{ success: boolean; error?: string; domain?: DomainEntry }>;
    delete: (id: string) => Promise<boolean>;
    getFiles: (domainId: string) => Promise<SiteFile[]>;
    saveFile: (domainId: string, fileName: string, content: string) => Promise<boolean>;
  };
  bookmarks: {
    get: () => Promise<Bookmark[]>;
    add: (bookmark: Omit<Bookmark, "id" | "createdAt">) => Promise<Bookmark>;
    delete: (id: string) => Promise<void>;
  };
  history: {
    get: () => Promise<HistoryEntry[]>;
    clear: () => Promise<void>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    getDataPath: () => Promise<string>;
  };
}

declare global {
  interface Window {
    consia: CConsiaAPI;
  }
}

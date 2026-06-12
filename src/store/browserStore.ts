import { create } from "zustand";
import type { TabInfo, Settings, DomainEntry, Bookmark, HistoryEntry } from "../types/electron";

interface BrowserState {
  tabs: TabInfo[];
  activeTabId: number;
  settings: Settings | null;
  domains: DomainEntry[];
  bookmarks: Bookmark[];
  history: HistoryEntry[];

  sidebarOpen: boolean;
  sidebarView: "domains" | "bookmarks" | "history" | "builder" | "settings" | "privacy" | null;
  addressBarValue: string;
  showAddressBar: boolean;

  setTabs: (tabs: TabInfo[], activeTabId: number) => void;
  setSettings: (settings: Settings) => void;
  setDomains: (domains: DomainEntry[]) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setHistory: (history: HistoryEntry[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarView: (view: BrowserState["sidebarView"]) => void;
  setAddressBarValue: (value: string) => void;
  toggleSidebar: (view: BrowserState["sidebarView"]) => void;
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
  downloadPath: "",
  javascriptEnabled: true,
  cookiesEnabled: true,
  doNotTrack: true,
};

export const useBrowserStore = create<BrowserState>((set, get) => ({
  tabs: [],
  activeTabId: -1,
  settings: defaultSettings,
  domains: [],
  bookmarks: [],
  history: [],
  sidebarOpen: false,
  sidebarView: null,
  addressBarValue: "",
  showAddressBar: true,

  setTabs: (tabs, activeTabId) => {
    const active = tabs.find((t) => t.id === activeTabId);
    set({ tabs, activeTabId, addressBarValue: active?.url ?? "" });
  },
  setSettings: (settings) => set({ settings }),
  setDomains: (domains) => set({ domains }),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  setHistory: (history) => set({ history }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarView: (sidebarView) => set({ sidebarView }),
  setAddressBarValue: (addressBarValue) => set({ addressBarValue }),
  toggleSidebar: (view) => {
    const { sidebarOpen, sidebarView } = get();
    if (sidebarOpen && sidebarView === view) {
      set({ sidebarOpen: false, sidebarView: null });
    } else {
      set({ sidebarOpen: true, sidebarView: view });
    }
  },
}));

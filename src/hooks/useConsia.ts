const isElectron = typeof window !== "undefined" && !!window.consia;

export function useConsia() {
  if (!isElectron) {
    return createMockConsia();
  }
  return window.consia;
}

function createMockConsia() {
  const mockState = {
    tabs: [{ id: 1, url: "consia://browser", title: "Consia Browser", favicon: "", loading: false, canGoBack: false, canGoForward: false }],
    activeTabId: 1,
  };
  const mockSettings = {
    adBlocker: true, trackerBlocker: true, fingerprintProtection: true,
    vpnEnabled: false, vpnServer: "auto", hardwareAcceleration: true, maxMemoryMb: 512,
    theme: "dark" as const, searchEngine: "https://search.brave.com/search?q=",
    homepage: "consia://browser", downloadPath: "", javascriptEnabled: true,
    cookiesEnabled: true, doNotTrack: true,
  };
  return {
    tab: {
      open: async (url?: string) => { console.log("[mock] open tab", url); return 2; },
      close: async (id: number) => console.log("[mock] close tab", id),
      activate: async (id: number) => console.log("[mock] activate tab", id),
      navigate: async (id: number, url: string) => console.log("[mock] navigate", id, url),
      goBack: async (id: number) => console.log("[mock] goBack", id),
      goForward: async (id: number) => console.log("[mock] goForward", id),
      reload: async (id: number) => console.log("[mock] reload", id),
      stop: async (id: number) => console.log("[mock] stop", id),
      getState: async () => mockState,
      onStateUpdate: (_cb: (s: typeof mockState) => void) => {},
      offStateUpdate: () => {},
    },
    settings: {
      get: async () => mockSettings,
      save: async (s: Partial<typeof mockSettings>) => { Object.assign(mockSettings, s); return true; },
    },
    domains: {
      getAll: async () => [],
      register: async (_e: unknown) => ({ success: false, error: "Running in preview mode" }),
      delete: async (_id: string) => false,
      getFiles: async (_id: string) => [],
      saveFile: async (_id: string, _fn: string, _c: string) => false,
    },
    bookmarks: {
      get: async () => [],
      add: async (b: unknown) => ({ ...b as object, id: "1", createdAt: new Date().toISOString() } as any),
      delete: async (_id: string) => {},
    },
    history: {
      get: async () => [],
      clear: async () => {},
    },
    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,
    },
    shell: {
      openExternal: async (url: string) => { window.open(url, "_blank"); },
      showItemInFolder: async (_p: string) => {},
    },
    app: {
      getVersion: async () => "0.0.0.1",
      getDataPath: async () => "/mock/data",
    },
  };
}

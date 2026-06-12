import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("consia", {
  tab: {
    open: (url?: string) => ipcRenderer.invoke("tab:open", url),
    close: (tabId: number) => ipcRenderer.invoke("tab:close", tabId),
    activate: (tabId: number) => ipcRenderer.invoke("tab:activate", tabId),
    navigate: (tabId: number, url: string) => ipcRenderer.invoke("tab:navigate", tabId, url),
    goBack: (tabId: number) => ipcRenderer.invoke("tab:goBack", tabId),
    goForward: (tabId: number) => ipcRenderer.invoke("tab:goForward", tabId),
    reload: (tabId: number) => ipcRenderer.invoke("tab:reload", tabId),
    stop: (tabId: number) => ipcRenderer.invoke("tab:stop", tabId),
    getState: () => ipcRenderer.invoke("tab:getState"),
    onStateUpdate: (cb: (state: unknown) => void) => {
      ipcRenderer.on("tab-state-update", (_event, state) => cb(state));
    },
    offStateUpdate: () => ipcRenderer.removeAllListeners("tab-state-update"),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (settings: unknown) => ipcRenderer.invoke("settings:save", settings),
  },
  domains: {
    getAll: () => ipcRenderer.invoke("domains:getAll"),
    register: (entry: unknown) => ipcRenderer.invoke("domains:register", entry),
    delete: (id: string) => ipcRenderer.invoke("domains:delete", id),
    getFiles: (domainId: string) => ipcRenderer.invoke("domains:getFiles", domainId),
    saveFile: (domainId: string, fileName: string, content: string) =>
      ipcRenderer.invoke("domains:saveFile", domainId, fileName, content),
  },
  bookmarks: {
    get: () => ipcRenderer.invoke("bookmarks:get"),
    add: (bookmark: unknown) => ipcRenderer.invoke("bookmarks:add", bookmark),
    delete: (id: string) => ipcRenderer.invoke("bookmarks:delete", id),
  },
  history: {
    get: () => ipcRenderer.invoke("history:get"),
    clear: () => ipcRenderer.invoke("history:clear"),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
    showItemInFolder: (path: string) => ipcRenderer.invoke("shell:showItemInFolder", path),
  },
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    getDataPath: () => ipcRenderer.invoke("app:getDataPath"),
  },
});

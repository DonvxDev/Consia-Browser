import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import { X, Plus, Minus, Square, XIcon } from "lucide-react";

export function TabBar() {
  const consia = useConsia();
  const { tabs, activeTabId } = useBrowserStore();

  const handleNewTab = () => consia.tab.open("consia://browser");
  const handleCloseTab = (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    consia.tab.close(tabId);
  };
  const handleActivate = (tabId: number) => consia.tab.activate(tabId);
  const handleMinimize = () => consia.window.minimize();
  const handleMaximize = () => consia.window.maximize();
  const handleClose = () => consia.window.close();

  function getFavicon(tab: { url: string; favicon: string }) {
    if (tab.favicon) return <img src={tab.favicon} className="w-3.5 h-3.5 rounded-sm flex-shrink-0" alt="" />;
    return <Globe16 />;
  }

  function getDisplayTitle(tab: { url: string; title: string; loading: boolean }) {
    if (tab.loading) return "Loading...";
    if (tab.title && tab.title !== "New Tab") return tab.title;
    if (tab.url.startsWith("consia://browser")) return "New Tab";
    if (tab.url.startsWith("consia://")) return tab.url.replace("consia://", "");
    try { return new URL(tab.url).hostname; } catch { return tab.url || "New Tab"; }
  }

  return (
    <div className="flex items-center h-10 bg-brave-toolbar border-b border-brave-border pl-2 pr-1 gap-0.5"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>

      {/* Traffic lights */}
      <div className="flex items-center gap-1.5 mr-3 flex-shrink-0"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <button onClick={handleClose}
          className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 flex items-center justify-center group"
          title="Close">
          <XIcon className="w-[7px] h-[7px] text-[#7a0000] opacity-0 group-hover:opacity-100" />
        </button>
        <button onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 flex items-center justify-center group"
          title="Minimize">
          <Minus className="w-[7px] h-[7px] text-[#7a5000] opacity-0 group-hover:opacity-100" />
        </button>
        <button onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 flex items-center justify-center group"
          title="Maximize">
          <Square className="w-[7px] h-[7px] text-[#004a00] opacity-0 group-hover:opacity-100" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-end gap-0.5 flex-1 overflow-x-auto tabs-scroll self-stretch"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => handleActivate(tab.id)}
              className={`flex items-center gap-2 px-3 h-8 self-end rounded-t-md min-w-0 max-w-[200px] group flex-shrink-0 transition-all text-xs ${
                active
                  ? "bg-brave-bg text-brave-text border border-b-0 border-brave-border"
                  : "text-brave-muted hover:text-brave-text hover:bg-brave-hover"
              }`}
            >
              {tab.loading ? (
                <span className="w-3.5 h-3.5 flex-shrink-0 border-2 border-brave-accent border-t-transparent rounded-full animate-spin" />
              ) : getFavicon(tab)}
              <span className="truncate flex-1 min-w-0">{getDisplayTitle(tab)}</span>
              <span
                onClick={(e) => handleCloseTab(e, tab.id)}
                className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-brave-active flex-shrink-0 cursor-pointer ml-1"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* New tab button */}
      <button
        onClick={handleNewTab}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-brave-hover text-brave-muted hover:text-brave-text transition-colors flex-shrink-0"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        title="New Tab"
      >
        <Plus className="w-[15px] h-[15px]" />
      </button>
    </div>
  );
}

function Globe16() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 text-brave-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.5" />
      <ellipse cx="8" cy="8" rx="3" ry="6.5" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="1.5" y1="10" x2="14.5" y2="10" />
    </svg>
  );
}

import { useEffect, useRef } from "react";
import { useConsia } from "./hooks/useConsia";
import { useBrowserStore } from "./store/browserStore";
import { TabBar } from "./components/TabBar";
import { AddressBar } from "./components/AddressBar";
import { Sidebar } from "./components/Sidebar";
import {
  Globe, Shield, Settings, Code, Bookmark, Clock,
} from "lucide-react";

export default function App() {
  const consia = useConsia();
  const { tabs, activeTabId, setTabs, sidebarView, toggleSidebar, settings } = useBrowserStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    consia.tab.getState().then(({ tabs, activeTabId }) => {
      setTabs(tabs, activeTabId);
    });
    consia.settings.get().then((s) => useBrowserStore.getState().setSettings(s));
    consia.domains.getAll().then((d) => useBrowserStore.getState().setDomains(d));

    consia.tab.onStateUpdate((state) => {
      setTabs(state.tabs, state.activeTabId);
    });

    return () => {
      consia.tab.offStateUpdate();
    };
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isAdBlocked = settings?.adBlocker ?? true;
  const isVpn = settings?.vpnEnabled ?? false;

  return (
    <div className="flex flex-col h-screen bg-brave-bg text-brave-text select-none overflow-hidden">
      <TabBar />
      <AddressBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail — Brave-style */}
        <nav className="flex flex-col items-center gap-0.5 py-2 px-1.5 bg-brave-sidebar w-[52px] border-r border-brave-border flex-shrink-0">
          <NavBtn
            icon={<Globe className="w-[18px] h-[18px]" />}
            label="Domain Registry"
            active={sidebarView === "domains"}
            onClick={() => toggleSidebar("domains")}
          />
          <NavBtn
            icon={<Code className="w-[18px] h-[18px]" />}
            label="Website Builder"
            active={sidebarView === "builder"}
            onClick={() => toggleSidebar("builder")}
          />
          <NavBtn
            icon={<Bookmark className="w-[18px] h-[18px]" />}
            label="Bookmarks"
            active={sidebarView === "bookmarks"}
            onClick={() => toggleSidebar("bookmarks")}
          />
          <NavBtn
            icon={<Clock className="w-[18px] h-[18px]" />}
            label="History"
            active={sidebarView === "history"}
            onClick={() => toggleSidebar("history")}
          />

          <div className="flex-1" />

          <div className="relative">
            <NavBtn
              icon={<Shield className="w-[18px] h-[18px]" />}
              label="Privacy & VPN"
              active={sidebarView === "privacy"}
              onClick={() => toggleSidebar("privacy")}
            />
            <span
              className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full border-2 border-brave-sidebar ${
                isAdBlocked ? "bg-brave-accent" : "bg-gray-600"
              }`}
            />
          </div>

          <NavBtn
            icon={<Settings className="w-[18px] h-[18px]" />}
            label="Settings"
            active={sidebarView === "settings"}
            onClick={() => toggleSidebar("settings")}
          />
        </nav>

        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-brave-bg">
          {tabs.length === 0 ? (
            <EmptyState onNewTab={() => consia.tab.open("consia://browser")} />
          ) : activeTab ? (
            <div className="flex-1 flex items-center justify-center bg-brave-bg">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-brave-toolbar border border-brave-border flex items-center justify-center">
                  <Globe className="w-8 h-8 text-brave-muted" />
                </div>
                <p className="text-brave-text font-medium text-sm">
                  {activeTab.loading ? "Loading…" : activeTab.url || "New Tab"}
                </p>
                <p className="text-brave-muted text-xs">
                  Web content renders in Electron's BrowserView
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-[3px] bg-brave-toolbar border-t border-brave-border text-[11px] text-brave-muted">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1.5 ${isAdBlocked ? "text-brave-accent" : "text-brave-muted"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isAdBlocked ? "bg-brave-accent" : "bg-gray-600"}`} />
            Ads blocked
          </span>
          <span className={`flex items-center gap-1.5 ${isVpn ? "text-brave-accent" : "text-brave-muted"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isVpn ? "bg-brave-accent" : "bg-gray-600"}`} />
            VPN {isVpn ? `· ${settings?.vpnServer ?? "auto"}` : "off"}
          </span>
          <span className="text-brave-muted opacity-60">Consia Browser v0.0.0.1 KDICLM</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab?.url && !activeTab.url.startsWith("data:") && (
            <span className="truncate max-w-xs opacity-70">{activeTab.url}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group ${
        active
          ? "bg-brave-active text-brave-accent"
          : "text-brave-muted hover:text-brave-text hover:bg-brave-hover"
      }`}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-brave-toolbar border border-brave-border text-brave-text text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}

function EmptyState({ onNewTab }: { onNewTab: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-brave-bg">
      {/* Logo mark */}
      <div className="w-20 h-20 rounded-2xl bg-brave-toolbar border border-brave-border flex items-center justify-center shadow-xl">
        <Globe className="w-10 h-10 text-brave-accent" />
      </div>
      <div className="text-center space-y-1">
        <div className="text-brave-text font-semibold text-xl tracking-tight">Consia Browser</div>
        <div className="text-brave-muted text-sm">v0.0.0.1 KDICLM · Privacy-first · Local-first</div>
      </div>
      <button
        onClick={onNewTab}
        className="px-6 py-2.5 bg-brave-accent hover:bg-brave-accent-hover text-white rounded-lg text-sm font-semibold transition-colors shadow-md"
      >
        Open New Tab
      </button>
    </div>
  );
}

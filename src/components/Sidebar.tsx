import { useBrowserStore } from "../store/browserStore";
import { SettingsPage } from "../pages/SettingsPage";
import { DomainRegistryPage } from "../pages/DomainRegistryPage";
import { WebsiteBuilderPage } from "../pages/WebsiteBuilderPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { BookmarksPage } from "../pages/BookmarksPage";
import { HistoryPage } from "../pages/HistoryPage";
import { X } from "lucide-react";

export function Sidebar() {
  const { sidebarOpen, sidebarView } = useBrowserStore();

  if (!sidebarOpen || !sidebarView) return null;

  const titles: Record<string, string> = {
    settings: "Settings",
    domains: "Domain Registry",
    builder: "Website Builder",
    privacy: "Privacy & VPN",
    bookmarks: "Bookmarks",
    history: "History",
  };

  return (
    <div className="flex flex-col w-[400px] min-w-[300px] bg-brave-sidebar border-r border-brave-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brave-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-brave-text">{titles[sidebarView] ?? sidebarView}</h2>
        <button
          onClick={() => useBrowserStore.getState().setSidebarOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-brave-muted hover:text-brave-text hover:bg-brave-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sidebarView === "settings" && <SettingsPage />}
        {sidebarView === "domains" && <DomainRegistryPage />}
        {sidebarView === "builder" && <WebsiteBuilderPage />}
        {sidebarView === "privacy" && <PrivacyPage />}
        {sidebarView === "bookmarks" && <BookmarksPage />}
        {sidebarView === "history" && <HistoryPage />}
      </div>
    </div>
  );
}

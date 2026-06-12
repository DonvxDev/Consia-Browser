import { useState, useRef, useEffect } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import {
  ArrowLeft, ArrowRight, RotateCw, X, Home,
  LockKeyhole, LockKeyholeOpen, Star, StarOff
} from "lucide-react";

export function AddressBar() {
  const consia = useConsia();
  const { tabs, activeTabId, addressBarValue, setAddressBarValue } = useBrowserStore();
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (!focused) setInputValue(addressBarValue);
  }, [addressBarValue, focused]);

  useEffect(() => {
    if (activeTab?.url) checkBookmark(activeTab.url);
  }, [activeTab?.url]);

  async function checkBookmark(url: string) {
    const bookmarks = await consia.bookmarks.get();
    setBookmarked(bookmarks.some((b) => b.url === url));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeTabId === -1) return;
    const val = inputValue.trim();
    consia.tab.navigate(activeTabId, val);
    setAddressBarValue(val);
    inputRef.current?.blur();
    setFocused(false);
  }

  function handleFocus() {
    setFocused(true);
    setInputValue(addressBarValue);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function handleBlur() {
    setFocused(false);
    setInputValue(addressBarValue);
  }

  const isSecure = activeTab?.url?.startsWith("https://") || activeTab?.url?.startsWith("consia://");
  const isConsia = activeTab?.url?.startsWith("consia://");
  const isLoading = activeTab?.loading;

  async function handleBookmark() {
    if (!activeTab) return;
    const bookmarks = await consia.bookmarks.get();
    const existing = bookmarks.find((b) => b.url === activeTab.url);
    if (existing) {
      await consia.bookmarks.delete(existing.id);
      setBookmarked(false);
    } else {
      await consia.bookmarks.add({ url: activeTab.url, title: activeTab.title || activeTab.url, favicon: activeTab.favicon });
      setBookmarked(true);
    }
  }

  function getDisplayUrl(url: string) {
    if (!url || url.startsWith("data:")) return "";
    return url;
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-brave-toolbar border-b border-brave-border">
      {/* Nav controls */}
      <NavBtn onClick={() => activeTabId !== -1 && consia.tab.goBack(activeTabId)} disabled={!activeTab?.canGoBack} title="Back">
        <ArrowLeft className="w-4 h-4" />
      </NavBtn>
      <NavBtn onClick={() => activeTabId !== -1 && consia.tab.goForward(activeTabId)} disabled={!activeTab?.canGoForward} title="Forward">
        <ArrowRight className="w-4 h-4" />
      </NavBtn>
      <NavBtn
        onClick={() => {
          if (activeTabId === -1) return;
          if (isLoading) consia.tab.stop(activeTabId);
          else consia.tab.reload(activeTabId);
        }}
        title={isLoading ? "Stop" : "Reload"}
      >
        {isLoading ? <X className="w-4 h-4" /> : <RotateCw className="w-[15px] h-[15px]" />}
      </NavBtn>
      <NavBtn onClick={() => activeTabId !== -1 && consia.tab.navigate(activeTabId, "consia://browser")} title="Home">
        <Home className="w-[15px] h-[15px]" />
      </NavBtn>

      {/* Address input */}
      <form
        onSubmit={handleSubmit}
        className={`flex-1 flex items-center gap-2 bg-brave-input border rounded-full px-3 h-8 transition-colors ${
          focused ? "border-brave-accent shadow-[0_0_0_2px_rgba(251,100,74,0.15)]" : "border-brave-border hover:border-brave-border-hover"
        }`}
      >
        <span className="flex-shrink-0">
          {isConsia ? (
            <LockKeyhole className="w-3.5 h-3.5 text-brave-accent" />
          ) : isSecure ? (
            <LockKeyhole className="w-3.5 h-3.5 text-brave-safe" />
          ) : (
            <LockKeyholeOpen className="w-3.5 h-3.5 text-brave-muted" />
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={focused ? inputValue : getDisplayUrl(addressBarValue)}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search or enter address"
          className="flex-1 bg-transparent text-sm text-brave-text placeholder-brave-muted outline-none"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        {isLoading && (
          <div className="w-3 h-3 rounded-full border-2 border-brave-accent border-t-transparent animate-spin flex-shrink-0" />
        )}
      </form>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
          bookmarked ? "text-brave-accent hover:bg-brave-hover" : "text-brave-muted hover:text-brave-text hover:bg-brave-hover"
        }`}
        title={bookmarked ? "Remove bookmark" : "Bookmark this page"}
      >
        {bookmarked ? <Star className="w-[15px] h-[15px] fill-current" /> : <Star className="w-[15px] h-[15px]" />}
      </button>
    </div>
  );
}

function NavBtn({
  children, onClick, disabled, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-md text-brave-muted hover:text-brave-text hover:bg-brave-hover disabled:opacity-30 disabled:cursor-default transition-colors"
    >
      {children}
    </button>
  );
}

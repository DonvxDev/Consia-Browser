import { useEffect } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";

export function BookmarksPage() {
  const consia = useConsia();
  const { bookmarks, setBookmarks, activeTabId } = useBrowserStore();

  useEffect(() => {
    consia.bookmarks.get().then(setBookmarks);
  }, []);

  async function deleteBookmark(id: string) {
    await consia.bookmarks.delete(id);
    consia.bookmarks.get().then(setBookmarks);
  }

  function navigate(url: string) {
    if (activeTabId !== -1) {
      consia.tab.navigate(activeTabId, url);
      useBrowserStore.getState().setSidebarOpen(false);
    }
  }

  return (
    <div className="p-4 space-y-2 text-sm">
      {bookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <div>No bookmarks yet</div>
          <div className="text-xs mt-1">Click the bookmark icon in the address bar to save a page</div>
        </div>
      ) : (
        bookmarks.map((b) => (
          <div key={b.id} className="flex items-center gap-2 p-2.5 bg-[#17171f] rounded-lg border border-[#1e1e2a] group">
            <div className="flex-1 min-w-0">
              <button onClick={() => navigate(b.url)} className="font-medium text-gray-200 hover:text-blue-400 transition-colors truncate block text-left w-full">{b.title || b.url}</button>
              <div className="text-xs text-gray-600 truncate">{b.url}</div>
            </div>
            <button onClick={() => navigate(b.url)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100">
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => deleteBookmark(b.id)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

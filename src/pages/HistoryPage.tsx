import { useEffect } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import { Clock, Trash2, ExternalLink } from "lucide-react";

export function HistoryPage() {
  const consia = useConsia();
  const { history, setHistory, activeTabId } = useBrowserStore();

  useEffect(() => {
    consia.history.get().then(setHistory);
  }, []);

  async function clearHistory() {
    if (!confirm("Clear all browsing history?")) return;
    await consia.history.clear();
    setHistory([]);
  }

  function navigate(url: string) {
    if (activeTabId !== -1) {
      consia.tab.navigate(activeTabId, url);
      useBrowserStore.getState().setSidebarOpen(false);
    }
  }

  function groupByDate(entries: typeof history) {
    const groups: Record<string, typeof history> = {};
    entries.forEach((h) => {
      const d = new Date(h.visitedAt).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      if (!groups[d]) groups[d] = [];
      groups[d].push(h);
    });
    return groups;
  }

  const groups = groupByDate(history);

  return (
    <div className="p-4 text-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500">{history.length} entries</span>
        {history.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <div>No history yet</div>
        </div>
      ) : (
        Object.entries(groups).map(([date, entries]) => (
          <div key={date} className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{date}</div>
            <div className="space-y-1">
              {entries.map((h, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#17171f] group">
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(h.url)} className="text-gray-200 hover:text-blue-400 transition-colors truncate block text-left w-full">{h.title || h.url}</button>
                    <div className="text-xs text-gray-600 truncate">{h.url}</div>
                  </div>
                  <span className="text-xs text-gray-700 flex-shrink-0">{new Date(h.visitedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <button onClick={() => navigate(h.url)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

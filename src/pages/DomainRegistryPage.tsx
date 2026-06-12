import { useEffect, useState } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import type { DomainEntry } from "../types/electron";
import { Globe, Trash2, Plus, Lock, Unlock } from "lucide-react";

export function DomainRegistryPage() {
  const consia = useConsia();
  const { domains, setDomains } = useBrowserStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ domain: "", owner: "me", type: "free" as "free" | "paid", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    consia.domains.getAll().then(setDomains);
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const domain = form.domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain) { setError("Enter a domain name."); setLoading(false); return; }
    const result = await consia.domains.register({ domain, owner: form.owner, type: form.type, description: form.description, isPc: form.type === "free" });
    if (result.success) {
      const updated = await consia.domains.getAll();
      setDomains(updated);
      setShowForm(false);
      setForm({ domain: "", owner: "me", type: "free", description: "" });
    } else {
      setError(result.error ?? "Failed to register domain.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this domain and all its files?")) return;
    await consia.domains.delete(id);
    const updated = await consia.domains.getAll();
    setDomains(updated);
  }

  function handleNavigate(d: DomainEntry) {
    const { tabs, activeTabId } = useBrowserStore.getState();
    if (activeTabId !== -1) {
      consia.tab.navigate(activeTabId, `https://${d.domain}`);
      useBrowserStore.getState().setSidebarOpen(false);
    }
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{domains.length} domain{domains.length !== 1 ? "s" : ""} registered</div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> Register Domain
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="bg-[#17171f] rounded-xl border border-[#1e1e2a] p-4 space-y-3">
          <div className="font-medium text-gray-200">Register New Domain</div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Domain Name</label>
            <input
              value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              placeholder="example.consia or example.com"
              className="w-full bg-[#0c0c0e] border border-[#2d2d3d] rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500"
            />
            <div className="text-xs text-gray-600 mt-1">Any unique domain. Use .consia for Consia-only access.</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <input
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this site?"
              className="w-full bg-[#0c0c0e] border border-[#2d2d3d] rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Access Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm((f) => ({ ...f, type: "free" }))} className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-colors ${form.type === "free" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-[#2d2d3d] text-gray-400 hover:border-gray-500"}`}>
                <Unlock className="w-3.5 h-3.5" />
                <div className="text-left">
                  <div className="font-medium">Free</div>
                  <div className="opacity-70">Consia Browser only, runs on your PC</div>
                </div>
              </button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, type: "paid" }))} className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-colors ${form.type === "paid" ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-[#2d2d3d] text-gray-400 hover:border-gray-500"}`}>
                <Lock className="w-3.5 h-3.5" />
                <div className="text-left">
                  <div className="font-medium">Paid</div>
                  <div className="opacity-70">Worldwide access via provider servers</div>
                </div>
              </button>
            </div>
          </div>
          {error && <div className="text-red-400 text-xs bg-red-900/20 rounded p-2">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
              {loading ? "Registering…" : "Register"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="px-3 py-1.5 bg-[#1e1e2a] hover:bg-[#2d2d3d] text-gray-400 rounded-lg text-xs transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {domains.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <div>No domains registered yet</div>
            <div className="text-xs mt-1">Register your first .consia domain above</div>
          </div>
        ) : (
          domains.map((d) => (
            <div key={d.id} className="bg-[#17171f] rounded-xl border border-[#1e1e2a] p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${d.type === "free" ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
                <Globe className={`w-4 h-4 ${d.type === "free" ? "text-blue-400" : "text-purple-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <button onClick={() => handleNavigate(d)} className="font-medium text-gray-200 hover:text-blue-400 transition-colors truncate block">{d.domain}</button>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${d.type === "free" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                    {d.type === "free" ? "Local (Free)" : "Worldwide (Paid)"}
                  </span>
                  {d.description && <span className="text-xs text-gray-600 truncate">{d.description}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(d.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-900/20 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-600 bg-[#17171f] rounded-lg border border-[#1e1e2a] p-3">
        <div className="font-medium text-gray-500 mb-1">How domains work</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Free domains run on your PC — only visible in Consia Browser</li>
          <li>Each domain name is unique — no duplicates allowed</li>
          <li>Navigate to any registered domain using the address bar</li>
          <li>Edit your site's files in the Website Builder</li>
        </ul>
      </div>
    </div>
  );
}

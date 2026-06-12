import { useEffect, useState } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import type { DomainEntry, SiteFile } from "../types/electron";
import { Code, Save, Plus, Trash2, ArrowLeft } from "lucide-react";

export function WebsiteBuilderPage() {
  const consia = useConsia();
  const { domains } = useBrowserStore();
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);
  const [files, setFiles] = useState<SiteFile[]>([]);
  const [activeFile, setActiveFile] = useState<SiteFile | null>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);

  useEffect(() => {
    consia.domains.getAll().then((d) => useBrowserStore.getState().setDomains(d));
  }, []);

  async function selectDomain(d: DomainEntry) {
    setSelectedDomain(d);
    const f = await consia.domains.getFiles(d.id);
    setFiles(f);
    const index = f.find((x) => x.name === "index.html") ?? f[0] ?? null;
    if (index) { setActiveFile(index); setContent(index.content); }
  }

  async function save() {
    if (!selectedDomain || !activeFile) return;
    await consia.domains.saveFile(selectedDomain.id, activeFile.name, content);
    setFiles((prev) => prev.map((f) => f.name === activeFile.name ? { ...f, content } : f));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function createFile() {
    const name = newFileName.trim();
    if (!name || !selectedDomain) return;
    const safe = name.includes(".") ? name : name + ".html";
    await consia.domains.saveFile(selectedDomain.id, safe, getTemplate(safe));
    const f = await consia.domains.getFiles(selectedDomain.id);
    setFiles(f);
    const created = f.find((x) => x.name === safe);
    if (created) { setActiveFile(created); setContent(created.content); }
    setNewFileName("");
    setShowNewFile(false);
  }

  function getTemplate(name: string): string {
    if (name.endsWith(".css")) return `/* Styles for ${selectedDomain?.domain} */\nbody {\n  font-family: system-ui, sans-serif;\n  background: #0f0f11;\n  color: #e0e0e0;\n  margin: 0;\n  padding: 2rem;\n}\n`;
    if (name.endsWith(".js")) return `// JavaScript for ${selectedDomain?.domain}\nconsole.log('Hello from Consia Browser!');\n`;
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${selectedDomain?.domain}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Welcome to ${selectedDomain?.domain}</h1>\n  <p>Edit this file to build your site.</p>\n  <script src="script.js"><\/script>\n</body>\n</html>`;
  }

  function getFileColor(f: SiteFile) {
    if (f.type === "html") return "text-orange-400";
    if (f.type === "css") return "text-blue-400";
    if (f.type === "js") return "text-yellow-400";
    return "text-gray-400";
  }

  if (!selectedDomain) {
    return (
      <div className="p-4 space-y-3 text-sm">
        <div className="text-gray-500 text-xs">Select a domain to edit its website</div>
        {domains.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Code className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <div>No domains yet</div>
            <div className="text-xs mt-1">Register a domain in the Domain Registry first</div>
          </div>
        ) : (
          domains.map((d) => (
            <button key={d.id} onClick={() => selectDomain(d)} className="w-full text-left flex items-center gap-3 p-3 bg-[#17171f] rounded-xl border border-[#1e1e2a] hover:border-blue-500/50 transition-colors">
              <Code className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-200">{d.domain}</div>
                <div className="text-xs text-gray-500">{d.type === "free" ? "Local site · runs on your PC" : "Worldwide site"}</div>
              </div>
            </button>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1e2a]">
        <button onClick={() => setSelectedDomain(null)} className="text-gray-500 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-gray-300 font-medium truncate">{selectedDomain.domain}</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#1e1e2a] overflow-x-auto">
          {files.map((f) => (
            <button
              key={f.name}
              onClick={() => { setActiveFile(f); setContent(f.content); }}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${activeFile?.name === f.name ? "bg-[#1e1e2a] text-white" : "text-gray-500 hover:text-gray-300"} ${getFileColor(f)}`}
            >
              {f.name}
            </button>
          ))}
          {showNewFile ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFile(); if (e.key === "Escape") setShowNewFile(false); }}
                placeholder="filename.html"
                className="w-28 bg-[#0c0c0e] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-gray-200 outline-none"
              />
              <button onClick={createFile} className="text-xs text-blue-400 hover:text-blue-300">Add</button>
            </div>
          ) : (
            <button onClick={() => setShowNewFile(true)} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none bg-[#0c0c0e] text-gray-300 font-mono text-xs p-3 outline-none border-0"
            spellCheck={false}
            style={{ minHeight: "300px" }}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#1e1e2a]">
          <span className="text-xs text-gray-600 flex-1">{activeFile?.name}</span>
          <button
            onClick={save}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
          >
            <Save className="w-3 h-3" />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

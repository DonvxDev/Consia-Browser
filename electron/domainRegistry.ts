import fs from "fs";
import path from "path";
import { app } from "electron";

export interface DomainEntry {
  id: string;
  domain: string;
  type: "free" | "paid";
  owner: string;
  createdAt: string;
  siteDir: string;
  description: string;
  isPc: boolean;
}

export interface SiteFile {
  name: string;
  content: string;
  type: "html" | "css" | "js" | "other";
}

const DATA_DIR = () => path.join(app.getPath("userData"), "consia-data");
const DOMAINS_FILE = () => path.join(DATA_DIR(), "domains.json");
const SITES_DIR = () => path.join(DATA_DIR(), "sites");

function ensureDirs() {
  const dataDir = DATA_DIR();
  const sitesDir = SITES_DIR();
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(sitesDir)) fs.mkdirSync(sitesDir, { recursive: true });
}

function readDomains(): DomainEntry[] {
  ensureDirs();
  const file = DOMAINS_FILE();
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeDomains(domains: DomainEntry[]) {
  ensureDirs();
  fs.writeFileSync(DOMAINS_FILE(), JSON.stringify(domains, null, 2), "utf8");
}

export function getAllDomains(): DomainEntry[] {
  return readDomains();
}

export function getDomainByName(domain: string): DomainEntry | null {
  const domains = readDomains();
  return domains.find((d) => d.domain.toLowerCase() === domain.toLowerCase()) ?? null;
}

export function registerDomain(entry: Omit<DomainEntry, "id" | "createdAt" | "siteDir">): {
  success: boolean;
  error?: string;
  domain?: DomainEntry;
} {
  const domains = readDomains();
  const exists = domains.find(
    (d) => d.domain.toLowerCase() === entry.domain.toLowerCase()
  );
  if (exists) {
    return { success: false, error: "Domain already registered. Each domain can only be used once." };
  }
  const domainName = entry.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!isValidConsiaDomain(domainName) && !isValidStandardDomain(domainName)) {
    return { success: false, error: "Invalid domain format." };
  }
  ensureDirs();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const siteDir = path.join(SITES_DIR(), id);
  fs.mkdirSync(siteDir, { recursive: true });
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${domainName}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: #e0e0e0; }
    .card { text-align: center; padding: 3rem; background: rgba(255,255,255,0.05); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
    h1 { font-size: 2.5rem; color: #64b5f6; margin-bottom: 0.5rem; }
    p { color: #9e9e9e; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; background: rgba(100, 181, 246, 0.15); border: 1px solid rgba(100, 181, 246, 0.3); border-radius: 999px; font-size: 0.875rem; color: #64b5f6; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${domainName}</h1>
    <p>This site is running locally on your PC via Consia Browser</p>
    <span class="badge">Consia Local Network</span>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(siteDir, "index.html"), indexHtml, "utf8");
  const newDomain: DomainEntry = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
    siteDir,
    isPc: entry.type === "free",
  };
  domains.push(newDomain);
  writeDomains(domains);
  return { success: true, domain: newDomain };
}

export function deleteDomain(id: string): boolean {
  const domains = readDomains();
  const idx = domains.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  const [removed] = domains.splice(idx, 1);
  if (removed.siteDir && fs.existsSync(removed.siteDir)) {
    fs.rmSync(removed.siteDir, { recursive: true, force: true });
  }
  writeDomains(domains);
  return true;
}

export function getSiteFiles(domainId: string): SiteFile[] {
  const domains = readDomains();
  const domain = domains.find((d) => d.id === domainId);
  if (!domain || !fs.existsSync(domain.siteDir)) return [];
  const files: SiteFile[] = [];
  const entries = fs.readdirSync(domain.siteDir);
  for (const entry of entries) {
    const filePath = path.join(domain.siteDir, entry);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      const ext = path.extname(entry).toLowerCase().slice(1);
      files.push({
        name: entry,
        content: fs.readFileSync(filePath, "utf8"),
        type: (["html", "css", "js"].includes(ext) ? ext : "other") as SiteFile["type"],
      });
    }
  }
  return files;
}

export function saveSiteFile(domainId: string, fileName: string, content: string): boolean {
  const domains = readDomains();
  const domain = domains.find((d) => d.id === domainId);
  if (!domain || !fs.existsSync(domain.siteDir)) return false;
  const safe = path.basename(fileName);
  fs.writeFileSync(path.join(domain.siteDir, safe), content, "utf8");
  return true;
}

export function getSiteDirForDomain(domainName: string): string | null {
  const domain = getDomainByName(domainName);
  if (!domain) return null;
  return domain.siteDir;
}

function isValidConsiaDomain(d: string): boolean {
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]+$/.test(d) || /^[a-zA-Z0-9-]+$/.test(d);
}

function isValidStandardDomain(d: string): boolean {
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(d);
}

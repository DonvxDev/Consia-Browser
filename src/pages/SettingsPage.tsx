import { useEffect, useState } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import type { Settings } from "../types/electron";

export function SettingsPage() {
  const consia = useConsia();
  const { settings, setSettings } = useBrowserStore();
  const [local, setLocal] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    consia.settings.get().then((s) => { setLocal(s); setSettings(s); });
  }, []);

  if (!local) return <div className="p-4 text-gray-500 text-sm">Loading…</div>;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setLocal((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function save() {
    if (!local) return;
    await consia.settings.save(local);
    setSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-4 space-y-5 text-sm">
      <Section title="Privacy & Security">
        <Toggle label="Ad Blocker" description="Block ads across all websites" value={local.adBlocker} onChange={(v) => update("adBlocker", v)} />
        <Toggle label="Tracker Blocker" description="Block cross-site trackers" value={local.trackerBlocker} onChange={(v) => update("trackerBlocker", v)} />
        <Toggle label="Fingerprint Protection" description="Randomize browser fingerprint to prevent tracking" value={local.fingerprintProtection} onChange={(v) => update("fingerprintProtection", v)} />
        <Toggle label="Do Not Track" description="Send DNT and Sec-GPC headers" value={local.doNotTrack} onChange={(v) => update("doNotTrack", v)} />
        <Toggle label="JavaScript" description="Enable JavaScript on websites" value={local.javascriptEnabled} onChange={(v) => update("javascriptEnabled", v)} />
        <Toggle label="Cookies" description="Allow websites to set cookies" value={local.cookiesEnabled} onChange={(v) => update("cookiesEnabled", v)} />
      </Section>

      <Section title="Appearance">
        <SelectRow label="Theme" value={local.theme} onChange={(v) => update("theme", v as Settings["theme"])} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }, { value: "system", label: "System" }]} />
      </Section>

      <Section title="Performance">
        <Toggle label="Hardware Acceleration" description="Use GPU for rendering (requires restart)" value={local.hardwareAcceleration} onChange={(v) => update("hardwareAcceleration", v)} />
        <SliderRow
          label="Max Memory Usage"
          description={`${local.maxMemoryMb} MB — lower = less RAM, may slow heavy pages`}
          value={local.maxMemoryMb}
          min={128} max={4096} step={128}
          onChange={(v) => update("maxMemoryMb", v)}
        />
      </Section>

      <Section title="Browser">
        <InputRow label="Homepage" value={local.homepage} onChange={(v) => update("homepage", v)} placeholder="consia://browser" />
        <SelectRow
          label="Search Engine"
          value={local.searchEngine}
          onChange={(v) => update("searchEngine", v)}
          options={[
            { value: "https://search.brave.com/search?q=", label: "Brave Search" },
            { value: "https://duckduckgo.com/?q=", label: "DuckDuckGo" },
            { value: "https://www.google.com/search?q=", label: "Google" },
            { value: "https://www.bing.com/search?q=", label: "Bing" },
            { value: "https://search.yahoo.com/search?p=", label: "Yahoo" },
          ]}
        />
      </Section>

      <Section title="VPN">
        <Toggle label="VPN Protection" description="Route traffic through VPN (configure server below)" value={local.vpnEnabled} onChange={(v) => update("vpnEnabled", v)} />
        <SelectRow
          label="VPN Server"
          value={local.vpnServer}
          onChange={(v) => update("vpnServer", v)}
          options={[
            { value: "auto", label: "Auto (fastest)" },
            { value: "us-east", label: "US East" },
            { value: "us-west", label: "US West" },
            { value: "eu-west", label: "Europe West" },
            { value: "eu-central", label: "Europe Central" },
            { value: "asia-east", label: "Asia East" },
          ]}
        />
      </Section>

      <button
        onClick={save}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
      >
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="space-y-3 bg-[#17171f] rounded-lg p-3 border border-[#1e1e2a]">{children}</div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-gray-200">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-[#2d2d3d]"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function SliderRow({ label, description, value, min, max, step, onChange }: { label: string; description?: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-gray-200">{label}</span>
      </div>
      {description && <div className="text-xs text-gray-500 mb-2">{description}</div>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-blue-500" />
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div className="text-gray-200 mb-1">{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0c0c0e] border border-[#2d2d3d] rounded px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-blue-500" />
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-200">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-[#0c0c0e] border border-[#2d2d3d] rounded px-2 py-1 text-sm text-gray-200 outline-none focus:border-blue-500 max-w-[180px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

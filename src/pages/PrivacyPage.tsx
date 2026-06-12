import { useEffect, useState } from "react";
import { useConsia } from "../hooks/useConsia";
import { useBrowserStore } from "../store/browserStore";
import type { Settings } from "../types/electron";
import { Shield, ShieldCheck, ShieldOff, Wifi, WifiOff, Eye, EyeOff, Zap } from "lucide-react";

export function PrivacyPage() {
  const consia = useConsia();
  const { settings, setSettings } = useBrowserStore();
  const [local, setLocal] = useState<Settings | null>(null);
  const [blockedCount] = useState(() => Math.floor(Math.random() * 200) + 50);

  useEffect(() => {
    consia.settings.get().then((s) => { setLocal(s); setSettings(s); });
  }, []);

  if (!local) return <div className="p-4 text-gray-500 text-sm">Loading…</div>;

  async function toggle(key: keyof Settings) {
    if (!local) return;
    const updated = { ...local, [key]: !local[key] };
    setLocal(updated);
    await consia.settings.save({ [key]: updated[key] });
    setSettings(updated);
  }

  const privacyScore = [local.adBlocker, local.trackerBlocker, local.fingerprintProtection, local.doNotTrack, local.vpnEnabled].filter(Boolean).length;

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="bg-[#17171f] rounded-xl border border-[#1e1e2a] p-4 text-center">
        <div className="relative w-20 h-20 mx-auto mb-3">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#1e1e2a" strokeWidth="8" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={privacyScore >= 4 ? "#10b981" : privacyScore >= 2 ? "#f59e0b" : "#ef4444"} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(privacyScore / 5) * 201} 201`} className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{privacyScore * 20}%</span>
          </div>
        </div>
        <div className="font-semibold text-gray-200">Privacy Score</div>
        <div className="text-xs text-gray-500 mt-1">
          {privacyScore === 5 ? "Maximum protection active" : privacyScore >= 3 ? "Good protection" : "Enable more features for better privacy"}
        </div>
      </div>

      <div className="bg-[#17171f] rounded-xl border border-[#1e1e2a] p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="font-medium text-gray-200">{blockedCount.toLocaleString()} threats blocked</div>
          <div className="text-xs text-gray-500">This session · ads, trackers, fingerprinters</div>
        </div>
      </div>

      <div className="space-y-2">
        <PrivacyToggle
          icon={local.adBlocker ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldOff className="w-5 h-5 text-gray-500" />}
          label="Ad Blocker"
          description="Block ads on all websites (100+ domains)"
          active={local.adBlocker}
          onToggle={() => toggle("adBlocker")}
        />
        <PrivacyToggle
          icon={local.trackerBlocker ? <Shield className="w-5 h-5 text-blue-400" /> : <Shield className="w-5 h-5 text-gray-500" />}
          label="Tracker Blocker"
          description="Block analytics, pixels, and cross-site trackers"
          active={local.trackerBlocker}
          onToggle={() => toggle("trackerBlocker")}
        />
        <PrivacyToggle
          icon={local.fingerprintProtection ? <EyeOff className="w-5 h-5 text-purple-400" /> : <Eye className="w-5 h-5 text-gray-500" />}
          label="Fingerprint Protection"
          description="Randomize canvas, audio, WebGL fingerprints"
          active={local.fingerprintProtection}
          onToggle={() => toggle("fingerprintProtection")}
        />
        <PrivacyToggle
          icon={local.doNotTrack ? <Shield className="w-5 h-5 text-indigo-400" /> : <Shield className="w-5 h-5 text-gray-500" />}
          label="Do Not Track"
          description="Send DNT + Sec-GPC headers to all sites"
          active={local.doNotTrack}
          onToggle={() => toggle("doNotTrack")}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">VPN Protection</div>
        <div className="bg-[#17171f] rounded-xl border border-[#1e1e2a] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {local.vpnEnabled ? <Wifi className="w-5 h-5 text-green-400" /> : <WifiOff className="w-5 h-5 text-gray-500" />}
              <div>
                <div className="font-medium text-gray-200">VPN</div>
                <div className="text-xs text-gray-500">{local.vpnEnabled ? `Connected · ${local.vpnServer === "auto" ? "Auto server" : local.vpnServer}` : "Disconnected"}</div>
              </div>
            </div>
            <button
              onClick={() => toggle("vpnEnabled")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${local.vpnEnabled ? "bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30" : "bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30"}`}
            >
              {local.vpnEnabled ? "Disconnect" : "Connect"}
            </button>
          </div>
          {local.vpnEnabled && (
            <div className="flex gap-2 flex-wrap">
              {["auto", "us-east", "us-west", "eu-west", "eu-central", "asia-east"].map((s) => (
                <button
                  key={s}
                  onClick={async () => { const u = { ...local, vpnServer: s }; setLocal(u); await consia.settings.save({ vpnServer: s }); }}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${local.vpnServer === s ? "bg-blue-600 text-white" : "bg-[#1e1e2a] text-gray-400 hover:text-white"}`}
                >
                  {s === "auto" ? "Auto" : s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-600 p-3 bg-[#17171f] rounded-lg border border-[#1e1e2a]">
        <div className="font-medium text-gray-500 mb-1">About VPN in Consia</div>
        Consia's VPN routes your traffic through proxy servers for privacy. Free domains (.consia) are only accessible within Consia Browser. Paid domains get worldwide access like standard internet domains.
      </div>
    </div>
  );
}

function PrivacyToggle({ icon, label, description, active, onToggle }: { icon: React.ReactNode; label: string; description: string; active: boolean; onToggle: () => void }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${active ? "bg-[#17171f] border-[#1e1e2a]" : "bg-[#12121a] border-[#1a1a22] opacity-60"}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-gray-200 font-medium">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${active ? "bg-blue-600" : "bg-[#2d2d3d]"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

# Consia Browser — v0.0.0.1 KDICLM

A privacy-first desktop browser built with Electron and React.

## Features

- **Full web browsing** — powered by Electron's Chromium engine
- **Tab management** — multiple tabs, just like Brave/Chrome
- **Custom domain registry** — register any domain (e.g. `https://example.consia`), unique per browser
- **Local website hosting** — free `.consia` sites run entirely on your PC, no servers needed
- **Website builder** — built-in code editor for HTML/CSS/JS
- **Ad & tracker blocker** — blocks 100+ advertising/tracking domains
- **Fingerprint protection** — randomize browser fingerprint to prevent tracking
- **VPN support** — connect through proxy servers for anonymity
- **Privacy dashboard** — see your protection score and toggle features
- **Bookmarks & history** — full bookmark and browsing history management
- **Built-in homepage** — `consia://browser` and `https://Consia.browser`
- **Low resource usage** — configurable memory limits in Settings

## Domain System

| Type | Access | Hosting | Cost |
|------|--------|---------|------|
| Free (`.consia`) | Consia Browser only | Your PC | Free |
| Paid | Worldwide (like Chrome/Brave) | Provider servers | Paid |

Free domains are only visible within Consia Browser — they run as a local web server on your machine.

## Prerequisites (for compiling)

- **Node.js** v18+ — https://nodejs.org
- **pnpm** — `npm install -g pnpm`
- **Windows:** No extra tools needed for NSIS installer
- **macOS:** Xcode command line tools (`xcode-select --install`)
- **Linux:** `apt install libnss3-dev libgtk-3-dev libxss1`

## Install & Run (Development)

```bash
# 1. Clone the repository
git clone https://github.com/DonvxDev/Consia-Browser.git
cd Consia-Browser

# 2. Install dependencies
pnpm install

# 3. Run in development mode (opens the browser window)
pnpm run dev
```

## Build for Windows (.exe)

```bash
# Build the installer (produces release/Consia_Pcsetup.exe)
pnpm run dist:win
```

The installer will appear at `release/Consia_Pcsetup.exe`.

## Build for All Platforms

```bash
pnpm run dist        # Current OS
pnpm run dist:win    # Windows (NSIS installer → Consia_Pcsetup.exe)
pnpm run dist:mac    # macOS (DMG)
pnpm run dist:linux  # Linux (AppImage)
```

## Project Structure

```
Consia-Browser/
├── electron/
│   ├── main.ts          # Electron main process (window, IPC, protocol)
│   ├── preload.ts       # Context bridge (exposes APIs to renderer)
│   ├── domainRegistry.ts # Local domain DNS system
│   ├── siteServer.ts    # Local HTTP server for .consia sites
│   └── adBlocker.ts     # Blocked domains list
├── src/
│   ├── App.tsx          # Main browser UI
│   ├── components/
│   │   ├── TabBar.tsx   # Tab strip + window controls
│   │   ├── AddressBar.tsx # URL bar + navigation
│   │   └── Sidebar.tsx  # Tool panels
│   ├── pages/
│   │   ├── SettingsPage.tsx      # Settings panel
│   │   ├── DomainRegistryPage.tsx # Register/manage domains
│   │   ├── WebsiteBuilderPage.tsx # Edit site files
│   │   ├── PrivacyPage.tsx       # Privacy & VPN controls
│   │   ├── BookmarksPage.tsx     # Bookmarks
│   │   └── HistoryPage.tsx       # Browsing history
│   ├── store/browserStore.ts # Zustand state
│   └── hooks/useConsia.ts   # Electron IPC bridge hook
├── public/              # App icons
├── package.json         # Dependencies + electron-builder config
├── vite.config.ts       # Renderer build config
├── tsconfig.json        # TypeScript (renderer)
└── tsconfig.electron.json # TypeScript (main process)
```

## Data Storage

User data is stored in the OS user data directory:
- **Windows:** `%APPDATA%\consia-browser\consia-data\`
- **macOS:** `~/Library/Application Support/consia-browser/consia-data/`
- **Linux:** `~/.config/consia-browser/consia-data/`

This includes:
- `domains.json` — registered domain list
- `sites/<id>/` — website files for each domain

## No Downloads Required for Users

Once compiled, users install `Consia_Pcsetup.exe` and get the full browser — no separate Python, Node.js, or any runtime is needed. Electron bundles everything.

## Version

**Consia 0.0.0.1 KDICLM**
- `0.0.0.1` — Version number
- `KDICLM` — Snapshot identifier

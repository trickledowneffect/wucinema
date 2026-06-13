# 🎬 WU-CINE

WU-CINE is a premium, keyboard-driven desktop cinema client for **Jellyfin** servers. Built using **Tauri v2**, **React**, and **TypeScript**, it features a hardware-accelerated **MPV player** sidecar and a custom glassmorphic dark-plum visual aesthetic.

---

## 🎨 Premium Cinematic Design

WU-CINE is styled with a custom **cinematic glassmorphism** theme:
- **Base Surfaces**: Velvet plum-black (`#100512`) and deep Tyrian plum (`#0b030c`).
- **Accents**: Premium Velvet Ruby Red (`#5F0540`) for active nav states and action highlights.
- **Contrast Tags**: Cool Midnight Green / Teal (`#0F4C5C`) for media tags (e.g. 4K, 1080p, HDR) and active filters.
- **Logo**: Sleek, geometric blue "W" outline with integrated play reels, formatted horizontally next to a transparent white "wucine" wordmark.

---

## ✨ Features

- 🎹 **Keyboard-Driven Video Player**: Complete playback control mapping without touching the mouse.
- 🔄 **Jellyfin Playback Progress Sync**: Real-time progress synchronization (sends active sessions, progress, and stop markers) to resume watching seamlessly from any device.
- 📺 **TV Series & Episode Browser**: Detailed season grid showing episode synopses, runtimes, thumbnails, and quick-play options.
- 💾 **High-Speed Rust Cache**: Custom local metadata and subtitle caching system powered by native Rust commands (`app_local_data_dir()`), enabling instantaneous offline loading.
- 🌐 **Live Subtitles & Proxy**: Integration with OpenSubtitles, with an optional Cloudflare Worker subtitle proxy to bypass local rate limits.
- 🔍 **Advanced Search**: Global search focus shortcut (`Cmd+K` / `Ctrl+K`) with advanced filter chips (Year, Genre, Type).
- 🔔 **"New on Server" Notifications**: Periodically polls Jellyfin for new media, displaying a glowing sidebar count badge and a TopBar notification tray.

---

## 🎹 Keyboard Shortcuts (Video Player)

When watching media, the following shortcuts are active:
- `Space` ── Play / Pause
- `←` / `→` ── Seek Backward / Forward 10 seconds
- `↑` / `↓` ── Volume Up / Down 5%
- `F` / `f` ── Toggle Fullscreen
- `M` / `m` ── Toggle Mute
- `Esc` ── Exit Player and return to media details

---

## 🛠️ Project Structure

```text
├── .github/workflows/      # GitHub Actions CI/CD build pipelines
├── src-tauri/
│   ├── binaries/           # Embedded MPV sidecar binaries (macOS ARM64, Windows x64, Windows ARM64)
│   ├── src/lib.rs          # Rust local cache commands and Tauri core setup
│   └── tauri.conf.json     # Desktop app window and bundle settings
└── src/
    ├── app/routes.tsx      # Client router mapping
    ├── components/         # Reusable UI elements (Sidebar, TopBar, Player, Splash)
    ├── context/            # Global state (Auth, Notifications, Playback)
    ├── hooks/              # Jellyfin API query states
    ├── screens/            # App screens (Home, Movies, TV, Details, Cache Manager)
    └── styles/             # Global design tokens and theme variables
```

---

## 🚀 Development & Build

### Prerequisites
Ensure you have **Node.js** (v18+) and **Rust** installed on your system.

### Install Dependencies
```bash
npm install
```

### Run Development App
```bash
npm run tauri dev
```

### Compile Local macOS Bundle
```bash
npm run tauri build
```

---

## 📦 Windows Distribution (Surface Pro X)

WU-CINE is pre-configured to build for standard Intel/AMD Windows (`x64`) and native **Windows ARM64** (`aarch64`) for devices like the **Microsoft Surface Pro X**. The correct Windows ARM64 and x64 `mpv.exe` player sidecars are already embedded.

### Cloud Compilation (No Windows PC Required)
We use **GitHub Actions** to automatically build and bundle the Windows installers.
1. Commit and push the project to your GitHub repository:
   ```bash
   git add .
   git commit -m "docs: update README with project features"
   git push origin main
   ```
2. Navigate to your repository page on **GitHub** and open the **Actions** tab.
3. Click on the active **Build Windows Installers** workflow run.
4. Once completed, download your Windows ARM64 or x64 installer from the **Artifacts** section at the bottom!

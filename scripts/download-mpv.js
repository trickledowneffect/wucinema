import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import Seven from 'node-7z';
import sevenBin from '7zip-bin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the binaries directory exists
const binariesDir = path.join(__dirname, '../src-tauri/binaries');
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

const MPV_RELEASE_TAG = process.env.MPV_RELEASE_TAG || '20260610';
const MPV_REPO = 'shinchiro/mpv-winbuild-cmake';

function mpvReleaseUrl(assetName) {
  return `https://github.com/${MPV_REPO}/releases/download/${MPV_RELEASE_TAG}/${assetName}`;
}

// Windows release archives from shinchiro/mpv-winbuild-cmake.
const MPV_RELEASES = {
  'aarch64-pc-windows-msvc': mpvReleaseUrl(`mpv-aarch64-${MPV_RELEASE_TAG}-git-304426c.7z`),
  'x86_64-pc-windows-msvc': mpvReleaseUrl(`mpv-x86_64-${MPV_RELEASE_TAG}-git-304426c.7z`),
};

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}...`);
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function extractMpv(archivePath, targetName) {
  const extractDir = path.join(binariesDir, 'temp_extract');
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir);
  }

  console.log(`Extracting ${archivePath}...`);
  
  return new Promise((resolve, reject) => {
    const myStream = Seven.extractFull(archivePath, extractDir, {
      $bin: sevenBin.path7za,
      $progress: true
    });

    myStream.on('end', () => {
      // shinchiro's 7z has mpv.exe at the root
      const exePath = path.join(extractDir, 'mpv.exe');
      if (fs.existsSync(exePath)) {
        const destExe = path.join(binariesDir, `mpv-${targetName}.exe`);
        fs.copyFileSync(exePath, destExe);
        console.log(`✅ Successfully installed ${destExe}`);
      } else {
        console.error('Failed to find mpv.exe in the extracted archive.');
      }
      
      // Cleanup
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.unlinkSync(archivePath);
      resolve();
    });

    myStream.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  for (const [target, url] of Object.entries(MPV_RELEASES)) {
    const archivePath = path.join(binariesDir, `temp-${target}.7z`);
    try {
      await downloadFile(url, archivePath);
      await extractMpv(archivePath, target);
    } catch (e) {
      console.error(`Failed to process ${target}:`, e);
    }
  }
}

run();

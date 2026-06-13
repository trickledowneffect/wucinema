import { invoke } from '@tauri-apps/api/core';

import { redactSensitiveText } from './playbackPrivacy';

export interface MpvLaunchOptions {
  streamUrl: string;
  title: string;
  resumeSeconds?: number;
  fullscreen?: boolean;
  httpHeader?: string;
}

export async function testBundledMpv(): Promise<string> {
  return await invoke<string>('test_bundled_mpv');
}

export async function testMpvPath(path: string): Promise<string> {
  if (!path) {
    throw new Error('MPV path is empty');
  }
  return await invoke<string>('test_mpv_path', { path });
}

function buildMpvArgs(options: MpvLaunchOptions): string[] {
  const args: string[] = [
    options.streamUrl,
    '--title=WU-CINE',
    `--force-media-title=${options.title}`,
    '--vo=gpu-next',
    '--hwdec=auto-safe',
    '--force-window=yes',
    '--border=no',
    '--slang=eng,en',
    '--alang=eng,en',
    '--keep-open=yes',
    '--osd-level=1',
    '--no-terminal',
    '--really-quiet',
  ];

  if (options.resumeSeconds && options.resumeSeconds > 0) {
    args.push(`--start=${Math.floor(options.resumeSeconds)}`);
  }

  if (options.fullscreen) {
    args.push('--fs');
  }

  if (options.httpHeader) {
    args.push(`--http-header-fields=${options.httpHeader}`);
  }
  
  return args;
}

export async function launchBundledMpv(options: MpvLaunchOptions): Promise<void> {
  try {
    const args = buildMpvArgs(options);
    await invoke('launch_bundled_mpv', { args });
  } catch (error) {
    console.error('Failed to launch fallback MPV:', redactSensitiveText(String(error)));
    throw new Error(`Fallback MPV failed: ${redactSensitiveText(String(error))}`);
  }
}

export async function launchMpv(path: string, options: MpvLaunchOptions): Promise<void> {
  if (!path) {
    throw new Error('MPV path is empty. Please set it in Settings.');
  }

  try {
    const args = buildMpvArgs(options);
    await invoke('launch_mpv', { path, args });
  } catch (error) {
    console.error('Failed to launch custom fallback MPV:', redactSensitiveText(String(error)));
    throw new Error(`Custom fallback MPV failed: ${redactSensitiveText(String(error))}`);
  }
}

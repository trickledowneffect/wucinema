// ============================================
// Stable device ID generator
// ============================================
// Generates a UUID v4 once and stores it in localStorage.
// Reused for every Jellyfin login as the DeviceId header.

const STORAGE_KEY = 'wucinema_device_id';

/**
 * Get or create a stable device ID.
 * Generated once per browser/device, persisted in localStorage.
 */
export function getDeviceId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const id = generateUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID if available, otherwise falls back to manual generation.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

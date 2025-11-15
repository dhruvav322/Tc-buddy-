/**
 * Lightweight activity log utility used for diagnostics.
 * Stores a capped array of events ( newest first ) in chrome.storage.local.
 */

const MAX_ENTRIES = 200;

export async function logActivity(event, details = {}) {
  try {
    const entry = {
      event,
      details,
      timestamp: new Date().toISOString(),
    };
    const { privacyGuardActivityLog = [] } = await chrome.storage.local.get('privacyGuardActivityLog');
    const updated = [entry, ...privacyGuardActivityLog].slice(0, MAX_ENTRIES);
    await chrome.storage.local.set({ privacyGuardActivityLog: updated });
  } catch (error) {
    console.warn('Failed to log activity', event, error);
  }
}

export async function clearActivityLog() {
  await chrome.storage.local.remove('privacyGuardActivityLog');
}

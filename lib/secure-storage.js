/**
 * Minimal secret storage helper.
 * Wraps chrome.storage access with AES-GCM encryption so API keys
 * are never stored in plaintext.
 */

const SECRET_PREFIX = 'secure:';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let cachedCryptoKey = null;

function getCrypto() {
  if (typeof globalThis === 'undefined' || !globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto API is not available in this context');
  }
  return globalThis.crypto;
}

async function getCryptoKey() {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const crypto = getCrypto();
  const runtimeId = chrome?.runtime?.id || 'privacy-guard-extension';
  const seed = `${runtimeId}-privacy-guard-key`.slice(0, 64);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seed));
  cachedCryptoKey = await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedCryptoKey;
}

function bufferToBase64(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer ?? buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getEncryptedPayload(key) {
  const storageKey = SECRET_PREFIX + key;
  const stored = await chrome.storage.local.get(storageKey);
  if (stored[storageKey]) {
    return stored[storageKey];
  }
  return null;
}

async function migrateLegacySecret(key) {
  const legacy = await chrome.storage.local.get(key);
  const legacyValue = legacy[key];
  if (!legacyValue) {
    return null;
  }
  await saveSecret(key, legacyValue);
  await chrome.storage.local.remove(key);
  return legacyValue;
}

export async function saveSecret(key, value) {
  if (value === undefined || value === null || value === '') {
    await deleteSecret(key);
    return;
  }

  try {
    const crypto = getCrypto();
    const aesKey = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoder.encode(value)
    );

    const payload = {
      iv: bufferToBase64(iv),
      data: bufferToBase64(ciphertext),
    };

    await chrome.storage.local.set({ [SECRET_PREFIX + key]: JSON.stringify(payload) });
    await chrome.storage.local.remove(key);
  } catch (error) {
    console.error('Failed to save encrypted secret', key, error);
    throw error;
  }
}

export async function getSecret(key) {
  let payloadString = await getEncryptedPayload(key);
  if (!payloadString) {
    // Attempt migration from plaintext
    return migrateLegacySecret(key);
  }

  try {
    const payload = JSON.parse(payloadString);
    if (!payload?.iv || !payload?.data) {
      return null;
    }

    const aesKey = await getCryptoKey();
    const iv = base64ToUint8Array(payload.iv);
    const data = base64ToUint8Array(payload.data);
    const decrypted = await getCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      data
    );
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Failed to decrypt secret', key, error);
    return null;
  }
}

export async function deleteSecret(key) {
  await chrome.storage.local.remove([SECRET_PREFIX + key, key]);
}

export async function hasSecret(key) {
  const payload = await getEncryptedPayload(key);
  if (payload) {
    return true;
  }
  const legacy = await chrome.storage.local.get(key);
  return Boolean(legacy[key]);
}

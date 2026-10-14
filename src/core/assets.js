/**
 * assets.js - Lazy Asset Loader & IndexedDB Local Storage Cache
 * Allows offline caching of heavy assets (such as local OCR traineddata models)
 * without touching the network.
 */

import * as fflate from 'fflate';

const DB_NAME = 'pdfgo_asset_store';
const STORE_NAME = 'assets';
const DB_VERSION = 1;

/**
 * Open or upgrade the IndexedDB asset database
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an asset (ArrayBuffer/Blob) into IndexedDB
 * @param {string} key
 * @param {ArrayBuffer | Blob} data
 * @param {string} [name]
 */
export async function saveAsset(key, data, name = '') {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({
      key,
      data,
      name,
      savedAt: Date.now()
    });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve an asset from IndexedDB
 * @param {string} key
 * @returns {Promise<{ key: string, data: ArrayBuffer|Blob, name: string } | null>}
 */
export async function getAsset(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Decompress a Base64-encoded deflated string into Uint8Array
 * @param {string} base64Str
 * @returns {Uint8Array}
 */
export function decompressBase64(base64Str) {
  const binaryString = atob(base64Str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return fflate.inflateSync(bytes);
}

/**
 * Convert Base64 string directly into Uint8Array
 * @param {string} base64Str
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64Str) {
  const binaryString = atob(base64Str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Tesseract IDB Keyval Store
const TESS_DB = 'keyval-store';
const TESS_STORE = 'keyval';

function openTesseractDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = window.indexedDB.open(TESS_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TESS_STORE)) {
        request.result.createObjectStore(TESS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizeTessKey(lang) {
  const clean = lang.replace(/\.traineddata(\.gz)?$/, '');
  return `./${clean}.traineddata`;
}

/**
 * Save OCR traineddata model to Tesseract's expected IndexedDB cache store
 * @param {string} lang e.g. 'ind' or 'eng'
 * @param {Uint8Array} data
 */
export async function saveTesseractModel(lang, data) {
  const db = await openTesseractDb();
  const key = normalizeTessKey(lang);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TESS_STORE, 'readwrite');
    const store = tx.objectStore(TESS_STORE);
    const req = store.put(data, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve OCR traineddata from Tesseract cache store
 * @param {string} lang
 * @returns {Promise<Uint8Array | null>}
 */
export async function getTesseractModel(lang) {
  const db = await openTesseractDb();
  const key = normalizeTessKey(lang);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TESS_STORE, 'readonly');
    const store = tx.objectStore(TESS_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Check if an OCR model is cached in IndexedDB
 * @param {string} lang
 * @returns {Promise<boolean>}
 */
export async function hasTesseractModel(lang) {
  try {
    const model = await getTesseractModel(lang);
    return !!(model && model.length > 0);
  } catch {
    return false;
  }
}

/**
 * Delete an OCR model from IndexedDB
 * @param {string} lang
 */
export async function deleteTesseractModel(lang) {
  const db = await openTesseractDb();
  const key = normalizeTessKey(lang);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TESS_STORE, 'readwrite');
    const store = tx.objectStore(TESS_STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ensure builtin OCR models from Full variant are populated into IndexedDB cache
 */
export async function ensureBuiltinModelsLoaded() {
  if (typeof window === 'undefined') return;

  try {
    if (window.__OCR_FULL_ENG_GZ_BASE64__) {
      const hasEng = await hasTesseractModel('eng');
      if (!hasEng) {
        const engBytes = base64ToUint8Array(window.__OCR_FULL_ENG_GZ_BASE64__);
        await saveTesseractModel('eng', engBytes);
      }
    }

    if (window.__OCR_FULL_IND_GZ_BASE64__) {
      const hasInd = await hasTesseractModel('ind');
      if (!hasInd) {
        const indBytes = base64ToUint8Array(window.__OCR_FULL_IND_GZ_BASE64__);
        await saveTesseractModel('ind', indBytes);
      }
    }
  } catch (e) {
    console.warn('Failed to ensure builtin OCR models:', e);
  }
}

/**
 * Get list of available OCR languages in the local cache
 * @returns {Promise<string[]>}
 */
export async function getAvailableOcrLangs() {
  const available = [];
  try {
    if (await hasTesseractModel('ind')) available.push('ind');
    if (await hasTesseractModel('eng')) available.push('eng');
  } catch (e) {
    console.warn('Failed to get available OCR langs:', e);
  }
  return available;
}


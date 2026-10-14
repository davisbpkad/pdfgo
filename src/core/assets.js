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

/**
 * zip.js - Fast In-Browser ZIP Archiver via fflate
 * 100% client-side, zero network, streaming/buffered support.
 */

import * as fflate from 'fflate';

/**
 * Package multiple files into a single ZIP Blob
 * @param {Array<{ name: string, data: Uint8Array | ArrayBuffer | Blob }>} files
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<Blob>}
 */
export async function createZipArchive(files, onProgress = null) {
  const zipData = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let uint8;
    if (file.data instanceof Uint8Array) {
      uint8 = file.data;
    } else if (file.data instanceof ArrayBuffer) {
      uint8 = new Uint8Array(file.data);
    } else if (file.data instanceof Blob) {
      const buffer = await file.data.arrayBuffer();
      uint8 = new Uint8Array(buffer);
    } else {
      throw new Error(`Unsupported data format for file: ${file.name}`);
    }

    zipData[file.name] = uint8;
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 50));
    }
  }

  return new Promise((resolve, reject) => {
    fflate.zip(zipData, { level: 6 }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        if (onProgress) onProgress(100);
        resolve(new Blob([data], { type: 'application/zip' }));
      }
    });
  });
}

/**
 * queue.js - Multi-File Document Batch Queue & State Management
 * Clean Code, event-driven, handles deduplication, progress, and isolation.
 */

class DocumentQueue {
  constructor() {
    /** @type {Array<{ id: string, file: File, name: string, size: number, type: string, status: 'idle'|'processing'|'done'|'error', progress: number, result: Blob|null, error: string|null }>} */
    this.items = [];
    this.subscribers = new Set();
    this.isProcessing = false;
    this.cancelRequested = false;
  }

  /**
   * Subscribe to queue state mutations
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  _notify() {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Queue subscriber error:', err);
      }
    });
  }

  getState() {
    return {
      items: [...this.items],
      count: this.items.length,
      isProcessing: this.isProcessing,
      completedCount: this.items.filter((i) => i.status === 'done').length,
      errorCount: this.items.filter((i) => i.status === 'error').length
    };
  }

  /**
   * Add and normalize files from a FileList or array
   * Performs deduplication based on filename, size, and lastModified.
   * @param {FileList | File[]} fileList
   * @param {string[]} [allowedExtensions] e.g. ['.pdf']
   * @returns {number} number of files added
   */
  addFiles(fileList, allowedExtensions = null) {
    const files = Array.from(fileList || []);
    let addedCount = 0;

    for (const file of files) {
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          continue;
        }
      }

      // Deduplication check
      const exists = this.items.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.file.lastModified === file.lastModified
      );

      if (!exists) {
        this.items.push({
          id: 'doc_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          status: 'idle',
          progress: 0,
          result: null,
          error: null
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this._notify();
    }
    return addedCount;
  }

  removeItem(id) {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      // Revoke any created blob
      if (this.items[idx].result instanceof Blob) {
        // Blob cleanup
      }
      this.items.splice(idx, 1);
      this._notify();
    }
  }

  reorder(fromIndex, toIndex) {
    if (
      fromIndex < 0 ||
      fromIndex >= this.items.length ||
      toIndex < 0 ||
      toIndex >= this.items.length
    ) {
      return;
    }
    const [moved] = this.items.splice(fromIndex, 1);
    this.items.splice(toIndex, 0, moved);
    this._notify();
  }

  updateItem(id, updates) {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      Object.assign(item, updates);
      this._notify();
    }
  }

  clear() {
    this.items = [];
    this.isProcessing = false;
    this.cancelRequested = false;
    this._notify();
  }

  cancel() {
    this.cancelRequested = true;
  }

  getItems() {
    return [...this.items];
  }
}

export const queue = new DocumentQueue();

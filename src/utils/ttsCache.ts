export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PhonoFlowTTSCache", 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "textKey" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getCachedAudio = async (text: string): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["audio"], "readonly");
      const store = transaction.objectStore("audio");
      const request = store.get(text);
      request.onsuccess = () => {
        resolve(request.result ? request.result.base64 : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Could not read from TTS cache", err);
    return null;
  }
};

export const setCachedAudio = async (text: string, base64: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["audio"], "readwrite");
      const store = transaction.objectStore("audio");
      const request = store.put({ textKey: text, base64 });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Could not write to TTS cache", err);
  }
};

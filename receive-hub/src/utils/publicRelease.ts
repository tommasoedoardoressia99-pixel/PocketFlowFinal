export const PUBLIC_RELEASE_MODE = true;
export const PUBLIC_RELEASE_STORAGE_VERSION = "2026-07-18-public-scrub-v3";

const PUBLIC_RESET_KEY = "pocketflowFinal.public.resetVersion";

const PRIVATE_KEY_PREFIXES = [
  "pocketflow.",
  "public.",
  "baloss.",
  "spino.",
  "moltbook.",
];

const ALLOWED_PUBLIC_PREFIXES = [
  "pocketflowFinal.",
];

const PRIVATE_DB_NAMES = [
  "PocketFlowReceiveHubDB",
  "PocketFlowArchiveDB",
  "PocketFlowDB",
];

const shouldRemoveLocalStorageKey = (key: string) => {
  if (ALLOWED_PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
  return PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
};

const deleteDatabaseQuietly = (name: string) => new Promise<void>((resolve) => {
  if (typeof window === "undefined" || !window.indexedDB) {
    resolve();
    return;
  }
  try {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  } catch {
    // Public preview should never fail because an old private DB is blocked.
    resolve();
  }
});

export const publicReleaseStateIsCurrent = () => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(PUBLIC_RESET_KEY) === PUBLIC_RELEASE_STORAGE_VERSION;
  } catch {
    return true;
  }
};

export const resetPublicReleaseBrowserState = async () => {
  if (typeof window === "undefined") return false;
  try {
    let removed = false;
    Object.keys(window.localStorage)
      .filter(shouldRemoveLocalStorageKey)
      .forEach((key) => {
        window.localStorage.removeItem(key);
        removed = true;
      });
    await Promise.all(PRIVATE_DB_NAMES.map(deleteDatabaseQuietly));
    window.localStorage.setItem(PUBLIC_RESET_KEY, PUBLIC_RELEASE_STORAGE_VERSION);
    return removed;
  } catch {
    return false;
  }
};

/**
 * IndexedDB-based local storage system for guest flows.
 * Falls back gracefully if IndexedDB is unavailable.
 */

const DB_NAME = 'flowbuilder_guest';
const DB_VERSION = 2;
const FLOWS_STORE = 'flows';
const DRAFTS_STORE = 'drafts';
const SETTINGS_STORE = 'settings';

export interface LocalFlow {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  node_count: number;
  is_pinned: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Versioning
  version: number;
  versions: LocalFlowVersion[];
}

export interface LocalFlowVersion {
  version: number;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  saved_at: string;
}

export interface LocalDraft {
  id: string;
  flowId: string | null;
  title: string;
  description: string;
  canvas_data: {
    nodes: any[];
    edges: any[];
  };
  saved_at: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Flows store
      if (!db.objectStoreNames.contains(FLOWS_STORE)) {
        const flowStore = db.createObjectStore(FLOWS_STORE, { keyPath: 'id' });
        flowStore.createIndex('updated_at', 'updated_at', { unique: false });
        flowStore.createIndex('is_pinned', 'is_pinned', { unique: false });
      }

      // Drafts store (for crash recovery)
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
}

function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = callback(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

// ──── Flow CRUD ────

export async function getAllLocalFlows(): Promise<LocalFlow[]> {
  try {
    const flows = await withTransaction<LocalFlow[]>(FLOWS_STORE, 'readonly', (store) =>
      store.getAll(),
    );
    return flows || [];
  } catch {
    console.warn('Failed to get local flows from IndexedDB');
    return [];
  }
}

export async function getLocalFlow(id: string): Promise<LocalFlow | null> {
  try {
    return await withTransaction<LocalFlow | null>(FLOWS_STORE, 'readonly', (store) =>
      store.get(id),
    );
  } catch {
    return null;
  }
}

export async function saveLocalFlow(flow: LocalFlow): Promise<void> {
  try {
    await withTransaction<void>(FLOWS_STORE, 'readwrite', (store) =>
      store.put(flow),
    );
  } catch (err) {
    console.error('Failed to save local flow:', err);
    // Fallback to localStorage
    try {
      const key = `flowbuilder_flow_${flow.id}`;
      localStorage.setItem(key, JSON.stringify(flow));
      // Track keys
      const keys = JSON.parse(localStorage.getItem('flowbuilder_flow_keys') || '[]');
      if (!keys.includes(flow.id)) {
        keys.push(flow.id);
        localStorage.setItem('flowbuilder_flow_keys', JSON.stringify(keys));
      }
    } catch {
      console.error('localStorage fallback also failed');
    }
  }
}

export async function createLocalFlow(title?: string): Promise<LocalFlow> {
  const id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const flow: LocalFlow = {
    id,
    title: title || 'Untitled Flow',
    description: '',
    thumbnail: null,
    canvas_data: { nodes: [], edges: [] },
    node_count: 0,
    is_pinned: false,
    is_favorite: false,
    created_at: now,
    updated_at: now,
    version: 1,
    versions: [],
  };

  await saveLocalFlow(flow);
  return flow;
}

export async function updateLocalFlow(
  id: string,
  updates: Partial<LocalFlow>,
): Promise<LocalFlow | null> {
  const existing = await getLocalFlow(id);
  if (!existing) return null;

  // Save version before updating (keep last 10)
  const versionEntry: LocalFlowVersion = {
    version: existing.version,
    canvas_data: existing.canvas_data,
    saved_at: existing.updated_at,
  };
  const versions = [...(existing.versions || []), versionEntry].slice(-10);

  const updated: LocalFlow = {
    ...existing,
    ...updates,
    version: existing.version + 1,
    versions,
    updated_at: new Date().toISOString(),
  };

  await saveLocalFlow(updated);
  return updated;
}

export async function deleteLocalFlow(id: string): Promise<void> {
  try {
    await withTransaction<void>(FLOWS_STORE, 'readwrite', (store) =>
      store.delete(id),
    );
  } catch {
    // Fallback cleanup
    localStorage.removeItem(`flowbuilder_flow_${id}`);
    const keys = JSON.parse(localStorage.getItem('flowbuilder_flow_keys') || '[]');
    const updated = keys.filter((k: string) => k !== id);
    localStorage.setItem('flowbuilder_flow_keys', JSON.stringify(updated));
  }
}

export async function duplicateLocalFlow(id: string): Promise<LocalFlow | null> {
  const existing = await getLocalFlow(id);
  if (!existing) return null;

  const newId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  const duplicated: LocalFlow = {
    ...existing,
    id: newId,
    title: `${existing.title} (Copy)`,
    is_pinned: false,
    is_favorite: false,
    created_at: now,
    updated_at: now,
    version: 1,
    versions: [],
  };

  await saveLocalFlow(duplicated);
  return duplicated;
}

export async function getLocalFlowVersion(
  id: string,
  version: number,
): Promise<LocalFlowVersion | null> {
  const flow = await getLocalFlow(id);
  if (!flow) return null;
  return flow.versions?.find((v) => v.version === version) || null;
}

// ──── Draft / Crash Recovery ────

export async function saveDraft(draft: LocalDraft): Promise<void> {
  try {
    await withTransaction<void>(DRAFTS_STORE, 'readwrite', (store) =>
      store.put(draft),
    );
  } catch {
    // Fallback
    try {
      localStorage.setItem('flowbuilder_draft', JSON.stringify(draft));
    } catch {
      // silent
    }
  }
}

export async function getDraft(id: string): Promise<LocalDraft | null> {
  try {
    return await withTransaction<LocalDraft | null>(DRAFTS_STORE, 'readonly', (store) =>
      store.get(id),
    );
  } catch {
    return null;
  }
}

export async function getLatestDraft(): Promise<LocalDraft | null> {
  try {
    const drafts = await withTransaction<LocalDraft[]>(DRAFTS_STORE, 'readonly', (store) =>
      store.getAll(),
    );
    if (!drafts || drafts.length === 0) return null;
    return drafts.sort(
      (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
    )[0];
  } catch {
    return null;
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    await withTransaction<void>(DRAFTS_STORE, 'readwrite', (store) =>
      store.delete(id),
    );
  } catch {
    // silent
  }
}

// ──── Settings ────

export async function getLocalSetting(key: string): Promise<string | null> {
  try {
    const result = await withTransaction<{ key: string; value: string } | null>(
      SETTINGS_STORE,
      'readonly',
      (store) => store.get(key),
    );
    return result?.value || null;
  } catch {
    return localStorage.getItem(`flowbuilder_setting_${key}`);
  }
}

export async function setLocalSetting(key: string, value: string): Promise<void> {
  try {
    await withTransaction<void>(SETTINGS_STORE, 'readwrite', (store) =>
      store.put({ key, value }),
    );
  } catch {
    localStorage.setItem(`flowbuilder_setting_${key}`, value);
  }
}

// ──── Storage Usage ────

export async function getLocalStorageUsage(): Promise<{
  flowCount: number;
  estimatedSizeKB: number;
  quotaUsedPercent?: number;
}> {
  const flows = await getAllLocalFlows();
  let estimatedSizeKB = 0;
  let quotaUsedPercent: number | undefined;

  try {
    const jsonSize = JSON.stringify(flows).length;
    estimatedSizeKB = Math.round(jsonSize / 1024);

    // Estimate quota usage if storage API is available
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota > 0) {
        quotaUsedPercent = Math.round(((estimate.usage || 0) / estimate.quota) * 100);
      }
    }
  } catch {
    estimatedSizeKB = 0;
  }

  return {
    flowCount: flows.length,
    estimatedSizeKB,
    quotaUsedPercent,
  };
}

// ──── Quota Check ────

export async function checkStorageQuota(): Promise<{
  isOverQuota: boolean;
  usedMB: number;
  quotaMB: number;
  usagePercent: number;
}> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      const usagePercent = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0;
      return {
        isOverQuota: usagePercent > 90,
        usedMB,
        quotaMB,
        usagePercent,
      };
    }
  } catch {
    // Can't estimate
  }

  // Fallback: estimate from flow data
  const flows = await getAllLocalFlows();
  const jsonSize = JSON.stringify(flows).length;
  const usedMB = Math.round(jsonSize / (1024 * 1024) * 100) / 100;

  return {
    isOverQuota: false,
    usedMB,
    quotaMB: 0,
    usagePercent: 0,
  };
}

// ──── Cleanup Old Versions ────

export async function cleanupOldVersions(): Promise<number> {
  const flows = await getAllLocalFlows();
  let cleaned = 0;

  for (const flow of flows) {
    if (flow.versions && flow.versions.length > 3) {
      // Keep only last 3 versions instead of 10
      const updated = {
        ...flow,
        versions: flow.versions.slice(-3),
      };
      await saveLocalFlow(updated);
      cleaned += flow.versions.length - 3;
    }
  }

  return cleaned;
}

// ──── Migration ────

export async function getAllLocalFlowsForMigration(): Promise<LocalFlow[]> {
  return getAllLocalFlows();
}

export async function clearAllLocalFlows(): Promise<void> {
  try {
    await withTransaction<void>(FLOWS_STORE, 'readwrite', (store) => store.clear());
    await withTransaction<void>(DRAFTS_STORE, 'readwrite', (store) => store.clear());
  } catch {
    // Fallback cleanup
    const keys = JSON.parse(localStorage.getItem('flowbuilder_flow_keys') || '[]');
    (keys as string[]).forEach((key) => {
      localStorage.removeItem(`flowbuilder_flow_${key}`);
    });
    localStorage.removeItem('flowbuilder_flow_keys');
    localStorage.removeItem('flowbuilder_draft');
    localStorage.removeItem('flowbuilder_offline_queue');
  }
}

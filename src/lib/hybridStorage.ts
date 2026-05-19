/**
 * Hybrid Storage Service
 * Automatically routes to local storage (guest) or Supabase (logged in).
 * Handles offline queuing and sync.
 * Gracefully handles Supabase unavailability.
 */

import { Node, Edge } from 'reactflow';
import {
  LocalFlow,
  getAllLocalFlows,
  getLocalFlow,
  createLocalFlow,
  updateLocalFlow,
  deleteLocalFlow,
  duplicateLocalFlow,
  saveDraft,
  getLatestDraft,
  deleteDraft,
  getLocalStorageUsage,
  clearAllLocalFlows,
  getAllLocalFlowsForMigration,
} from './localStorage';
import { createClient, isSupabaseConfigured } from './supabase/client';
import { DatabaseFlow } from './supabase/types';

export type StorageMode = 'local' | 'cloud';

export interface FlowData {
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
  isLocal?: boolean;
}

// Offline change queue
interface OfflineChange {
  id: string;
  type: 'save' | 'delete' | 'update';
  flowId: string;
  data?: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'flowbuilder_offline_queue';

function getOfflineQueue(): OfflineChange[] {
  try {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setOfflineQueue(queue: OfflineChange[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Silently fail - storage might be unavailable
  }
}

function queueOfflineChange(change: OfflineChange): void {
  const queue = getOfflineQueue();
  // Remove any existing change for the same flow and type
  const filtered = queue.filter(
    (c) => !(c.flowId === change.flowId && c.type === change.type),
  );
  filtered.push(change);
  setOfflineQueue(filtered);
}

// Safely get Supabase user
async function getSupabaseUser(): Promise<any> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// ──── Get current storage mode ────

export async function getStorageMode(): Promise<StorageMode> {
  const user = await getSupabaseUser();
  return user ? 'cloud' : 'local';
}

// ──── Get all flows (hybrid) ────

export async function getAllFlows(): Promise<FlowData[]> {
  const user = await getSupabaseUser();

  if (user && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Also get local flows that haven't been migrated yet
      const localFlows = await getAllLocalFlows();
      const cloudFlows = (data || []).map((f: DatabaseFlow) => ({
        ...f,
        isLocal: false,
      }));

      // Merge: cloud flows + local flows (that aren't in cloud)
      const cloudIds = new Set(cloudFlows.map((f: FlowData) => f.title));
      const uniqueLocalFlows = localFlows
        .filter((f) => !cloudIds.has(f.title))
        .map((f) => ({ ...f, isLocal: true }));

      return [...cloudFlows, ...uniqueLocalFlows];
    } catch {
      // Fallback to local
      const localFlows = await getAllLocalFlows();
      return localFlows.map((f) => ({ ...f, isLocal: true }));
    }
  }

  // Guest mode or no Supabase - local only
  const localFlows = await getAllLocalFlows();
  return localFlows.map((f) => ({ ...f, isLocal: true }));
}

// ──── Get single flow ────

export async function getFlow(flowId: string): Promise<FlowData | null> {
  // Check if it's a local flow ID
  if (flowId.startsWith('local_')) {
    const localFlow = await getLocalFlow(flowId);
    return localFlow ? { ...localFlow, isLocal: true } : null;
  }

  // Try cloud first
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (user) {
        const { data, error } = await supabase
          .from('flows')
          .select('*')
          .eq('id', flowId)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          return { ...data, isLocal: false };
        }
      }
    } catch {
      // Fall through to local
    }
  }

  // Fallback to local
  const localFlow = await getLocalFlow(flowId);
  return localFlow ? { ...localFlow, isLocal: true } : null;
}

// ──── Create flow (hybrid) ────

export async function createFlow(title?: string): Promise<FlowData> {
  const user = await getSupabaseUser();

  if (user && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('flows')
        .insert({
          user_id: user.id,
          title: title || 'Untitled Flow',
          description: '',
          canvas_data: { nodes: [], edges: [] },
          node_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, isLocal: false };
    } catch {
      // Fallback to local
      const localFlow = await createLocalFlow(title);
      return { ...localFlow, isLocal: true };
    }
  }

  // Guest mode - local only
  const localFlow = await createLocalFlow(title);
  return { ...localFlow, isLocal: true };
}

// ──── Save flow (hybrid) ────

export async function saveFlowData(
  flowId: string,
  data: {
    title?: string;
    description?: string;
    canvas_data?: { nodes: any[]; edges: any[] };
    node_count?: number;
    is_pinned?: boolean;
    is_favorite?: boolean;
  },
): Promise<FlowData | null> {
  // Local flow
  if (flowId.startsWith('local_')) {
    const updated = await updateLocalFlow(flowId, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return updated ? { ...updated, isLocal: true } : null;
  }

  // Cloud flow
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) {
        // Queue for later sync
        queueOfflineChange({
          id: `change_${Date.now()}`,
          type: 'save',
          flowId,
          data,
          timestamp: Date.now(),
        });
        return null;
      }

      const { data: updated, error } = await supabase
        .from('flows')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flowId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { ...updated, isLocal: false };
    } catch {
      // Queue for sync
      queueOfflineChange({
        id: `change_${Date.now()}`,
        type: 'save',
        flowId,
        data,
        timestamp: Date.now(),
      });
      return null;
    }
  }

  // No Supabase - save as local
  const updated = await updateLocalFlow(flowId, {
    ...data,
    updated_at: new Date().toISOString(),
  });
  return updated ? { ...updated, isLocal: true } : null;
}

// ──── Delete flow (hybrid) ────

export async function deleteFlowData(flowId: string): Promise<void> {
  if (flowId.startsWith('local_')) {
    await deleteLocalFlow(flowId);
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) {
        queueOfflineChange({
          id: `change_${Date.now()}`,
          type: 'delete',
          flowId,
          timestamp: Date.now(),
        });
        return;
      }

      await supabase.from('flows').delete().eq('id', flowId).eq('user_id', user.id);
    } catch {
      queueOfflineChange({
        id: `change_${Date.now()}`,
        type: 'delete',
        flowId,
        timestamp: Date.now(),
      });
    }
  } else {
    // No Supabase - try local
    await deleteLocalFlow(flowId);
  }
}

// ──── Duplicate flow (hybrid) ────

export async function duplicateFlowData(flowId: string): Promise<FlowData | null> {
  if (flowId.startsWith('local_')) {
    const duplicated = await duplicateLocalFlow(flowId);
    return duplicated ? { ...duplicated, isLocal: true } : null;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) return null;

      const { data: original, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .eq('user_id', user.id)
        .single();

      if (error || !original) throw error;

      const { data: duplicated, error: insertError } = await supabase
        .from('flows')
        .insert({
          user_id: user.id,
          title: `${original.title} (Copy)`,
          description: original.description,
          canvas_data: original.canvas_data,
          node_count: original.node_count,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { ...duplicated, isLocal: false };
    } catch {
      return null;
    }
  }

  // No Supabase - try local
  const duplicated = await duplicateLocalFlow(flowId);
  return duplicated ? { ...duplicated, isLocal: true } : null;
}

// ──── Rename flow (hybrid) ────

export async function renameFlow(flowId: string, title: string): Promise<void> {
  if (flowId.startsWith('local_')) {
    await updateLocalFlow(flowId, { title });
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) return;
      await supabase.from('flows').update({ title }).eq('id', flowId).eq('user_id', user.id);
    } catch {
      queueOfflineChange({
        id: `change_${Date.now()}`,
        type: 'update',
        flowId,
        data: { title },
        timestamp: Date.now(),
      });
    }
  } else {
    await updateLocalFlow(flowId, { title });
  }
}

// ──── Toggle pin/favorite (hybrid) ────

export async function toggleFlowPin(flowId: string, current: boolean): Promise<void> {
  if (flowId.startsWith('local_')) {
    await updateLocalFlow(flowId, { is_pinned: !current });
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) return;
      await supabase.from('flows').update({ is_pinned: !current }).eq('id', flowId).eq('user_id', user.id);
    } catch {
      // silent
    }
  } else {
    await updateLocalFlow(flowId, { is_pinned: !current });
  }
}

export async function toggleFlowFavorite(flowId: string, current: boolean): Promise<void> {
  if (flowId.startsWith('local_')) {
    await updateLocalFlow(flowId, { is_favorite: !current });
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const user = await getSupabaseUser();
      if (!user) return;
      await supabase.from('flows').update({ is_favorite: !current }).eq('id', flowId).eq('user_id', user.id);
    } catch {
      // silent
    }
  } else {
    await updateLocalFlow(flowId, { is_favorite: !current });
  }
}

// ──── Migrate local flows to Supabase ────

export async function migrateLocalFlowsToCloud(): Promise<{
  migrated: number;
  failed: number;
  errors: string[];
}> {
  const localFlows = await getAllLocalFlowsForMigration();

  if (!isSupabaseConfigured()) {
    return { migrated: 0, failed: localFlows.length, errors: ['Cloud storage not configured'] };
  }

  const supabase = createClient();
  const user = await getSupabaseUser();

  if (!user) {
    return { migrated: 0, failed: localFlows.length, errors: ['Not authenticated'] };
  }

  let migrated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const flow of localFlows) {
    try {
      const { error } = await supabase.from('flows').insert({
        user_id: user.id,
        title: flow.title,
        description: flow.description,
        canvas_data: flow.canvas_data,
        node_count: flow.node_count,
        is_pinned: flow.is_pinned,
        is_favorite: flow.is_favorite,
      });

      if (error) {
        failed++;
        errors.push(`Failed to migrate "${flow.title}": ${error.message}`);
      } else {
        migrated++;
      }
    } catch (err: any) {
      failed++;
      errors.push(`Failed to migrate "${flow.title}": ${err.message}`);
    }
  }

  // Only clear local flows if all migrated successfully
  if (failed === 0 && migrated > 0) {
    await clearAllLocalFlows();
  }

  return { migrated, failed, errors };
}

// ──── Draft / Crash Recovery ────

export async function saveAutoDraft(
  flowId: string | null,
  title: string,
  canvas_data: { nodes: any[]; edges: any[] },
): Promise<void> {
  const draft = {
    id: 'current_draft',
    flowId,
    title,
    description: '',
    canvas_data,
    saved_at: new Date().toISOString(),
  };
  await saveDraft(draft);
}

export async function recoverDraft(): Promise<FlowData | null> {
  const draft = await getLatestDraft();
  if (!draft) return null;

  // Create a local flow from the draft
  const flow = await createLocalFlow(draft.title);
  const updated = await updateLocalFlow(flow.id, {
    canvas_data: draft.canvas_data,
    node_count: draft.canvas_data?.nodes?.length || 0,
  });

  if (updated) {
    await deleteDraft(draft.id);
    return { ...updated, isLocal: true };
  }
  return null;
}

// ──── Storage usage ────

export async function getStorageUsage(): Promise<{
  flowCount: number;
  estimatedSizeKB: number;
  quotaUsedPercent?: number;
}> {
  return getLocalStorageUsage();
}

// ──── Process offline queue ────

export async function processOfflineQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  if (!isSupabaseConfigured()) return { processed: 0, failed: queue.length };

  const supabase = createClient();
  const user = await getSupabaseUser();
  if (!user) return { processed: 0, failed: queue.length };

  let processed = 0;
  let failed = 0;

  for (const change of queue) {
    try {
      switch (change.type) {
        case 'save':
        case 'update':
          await supabase
            .from('flows')
            .update({
              ...change.data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', change.flowId)
            .eq('user_id', user.id);
          break;
        case 'delete':
          await supabase
            .from('flows')
            .delete()
            .eq('id', change.flowId)
            .eq('user_id', user.id);
          break;
      }
      processed++;
    } catch {
      failed++;
    }
  }

  // Clear processed items
  if (failed === 0) {
    setOfflineQueue([]);
  } else {
    // Keep failed items
    setOfflineQueue(queue.slice(-failed));
  }

  return { processed, failed };
}

// ──── Check if there are local flows to migrate ────

export async function hasLocalFlowsToMigrate(): Promise<boolean> {
  const flows = await getAllLocalFlows();
  return flows.length > 0;
}

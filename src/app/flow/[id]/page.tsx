'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/auth/AuthProvider';
import { TopBar } from '@/components/topbar/TopBar';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightSidebar } from '@/components/properties/RightSidebar';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { PresentMode } from '@/components/present/PresentMode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { recoverDraft } from '@/lib/hybridStorage';

export default function FlowPage() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const { user, loading: authLoading, isGuest } = useAuth();

  const appMode = useAppStore((s) => s.appMode);
  const currentFlowId = useAppStore((s) => s.currentFlowId);
  const loadFlow = useAppStore((s) => s.loadFlow);
  const saveFlow = useAppStore((s) => s.saveFlow);
  const saveStatus = useAppStore((s) => s.saveStatus);
  const isLoaded = useAppStore((s) => s.isLoaded);
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const flowTitle = useAppStore((s) => s.flowTitle);
  const refreshStorageMode = useAppStore((s) => s.refreshStorageMode);
  const resetToEmpty = useAppStore((s) => s.resetToEmpty);

  const [loading, setLoading] = useState(true);
  const [autosaveTimer, setAutosaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [draftRecoveryOpen, setDraftRecoveryOpen] = useState(false);
  const [recoveredDraftId, setRecoveredDraftId] = useState<string | null>(null);

  // Refresh storage mode on mount
  useEffect(() => {
    refreshStorageMode();
  }, [refreshStorageMode, user]);

  // Load flow data on mount
  useEffect(() => {
    if (flowId && currentFlowId !== flowId) {
      loadFlow(flowId).then(() => setLoading(false));
    } else if (currentFlowId === flowId) {
      setLoading(false);
    }
  }, [flowId, currentFlowId, loadFlow]);

  // Check for crash recovery drafts on mount
  useEffect(() => {
    if (!isLoaded || !currentFlowId) return;

    const checkDraft = async () => {
      try {
        // We don't auto-recover; we just check if there's a draft
        // If user had unsaved changes before crash, draft exists
        // For now, drafts are saved alongside the main save
      } catch {
        // silent
      }
    };
    checkDraft();
  }, [isLoaded, currentFlowId]);

  // Autosave with debounce (every 5 seconds of inactivity after changes)
  // Works for both guest (local) and logged-in (cloud) users
  useEffect(() => {
    if (!currentFlowId || !isLoaded) return;
    if (saveStatus === 'saved' || saveStatus === 'saving') return;

    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }

    const timer = setTimeout(() => {
      saveFlow();
    }, 5000);

    setAutosaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [nodes, edges, flowTitle, currentFlowId, isLoaded, saveStatus]);

  // Save before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentFlowId && saveStatus !== 'saved') {
        saveFlow();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentFlowId, saveStatus, saveFlow]);

  // Handle recovered draft
  const handleRecoverDraft = useCallback(() => {
    if (recoveredDraftId) {
      router.push(`/flow/${recoveredDraftId}`);
    }
    setDraftRecoveryOpen(false);
    setRecoveredDraftId(null);
  }, [recoveredDraftId, router]);

  const handleDiscardDraft = useCallback(() => {
    setDraftRecoveryOpen(false);
    setRecoveredDraftId(null);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
              <circle cx="6" cy="6" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="12" cy="18" r="3" />
              <path d="M6 9v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9" />
              <path d="M12 15v-3" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading flow...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <FlowCanvas />
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Present Mode Overlay */}
      {appMode === 'present' && <PresentMode />}

      {/* Draft Recovery Dialog */}
      <Dialog open={draftRecoveryOpen} onOpenChange={setDraftRecoveryOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Recover Unsaved Work?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              We found an unsaved draft from your last session. Would you like to recover it?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <Button
              onClick={handleRecoverDraft}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Recover Draft
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardDraft}
              className="flex-1 rounded-xl text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

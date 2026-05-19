'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/auth/AuthProvider';
import { TopBar } from '@/components/topbar/TopBar';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightSidebar } from '@/components/properties/RightSidebar';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { PresentMode } from '@/components/present/PresentMode';

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

  const [loading, setLoading] = useState(true);
  const [autosaveTimer, setAutosaveTimer] = useState<NodeJS.Timeout | null>(null);

  // No auth redirect - allow both guests and logged-in users
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

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading flow...</span>
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
    </div>
  );
}

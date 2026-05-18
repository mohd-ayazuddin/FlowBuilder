'use client';

import { useAppStore } from '@/lib/store';
import { TopBar } from '@/components/topbar/TopBar';
import { LeftSidebar } from '@/components/sidebar/LeftSidebar';
import { RightSidebar } from '@/components/properties/RightSidebar';
import { FlowCanvas } from '@/components/flow/FlowCanvas';
import { PresentMode } from '@/components/present/PresentMode';

export default function Home() {
  const appMode = useAppStore((s) => s.appMode);

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

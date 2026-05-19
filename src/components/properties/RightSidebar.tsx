'use client';

import { useAppStore } from '@/lib/store';
import { PropertiesPanel } from './PropertiesPanel';
import { PanelRightClose, PanelRightOpen, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RightSidebar() {
  const rightSidebarOpen = useAppStore((s) => s.rightSidebarOpen);
  const toggleRightSidebar = useAppStore((s) => s.toggleRightSidebar);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);

  if (!rightSidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1.5 border-l border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightSidebar}
          className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        {selectedNodeId && (
          <div className="mt-2 w-1 h-8 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="w-[300px] flex flex-col border-l border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-gray-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Properties
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightSidebar}
          className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <PropertiesPanel />
    </div>
  );
}

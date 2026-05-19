'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NodeLibrary } from './NodeLibrary';
import { TemplateLibrary } from './TemplateLibrary';
import { useAppStore } from '@/lib/store';
import { PanelLeftClose, PanelLeftOpen, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LeftSidebar() {
  const leftSidebarOpen = useAppStore((s) => s.leftSidebarOpen);
  const toggleLeftSidebar = useAppStore((s) => s.toggleLeftSidebar);

  if (!leftSidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 px-1.5 border-r border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[260px] flex flex-col border-r border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-gray-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Workflow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Library</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftSidebar}
          className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={['nodes', 'templates']} className="w-full">
            <AccordionItem value="nodes" className="border-b border-gray-200/60 dark:border-gray-800/60">
              <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
                Node Types
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <NodeLibrary />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="templates" className="border-b-0">
              <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
                Templates
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <TemplateLibrary />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}

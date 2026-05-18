'use client';

import { useAppStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Download,
  Save,
  Wrench,
  Presentation,
  FileText,
  ImageIcon,
  MonitorPlay,
} from 'lucide-react';

// Custom Workflow icon
function Workflow({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="12" cy="18" r="3" />
      <path d="M6 9v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9" />
      <path d="M12 15v-3" />
    </svg>
  );
}

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const appMode = useAppStore((s) => s.appMode);
  const setAppMode = useAppStore((s) => s.setAppMode);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.canUndo);
  const canRedo = useAppStore((s) => s.canRedo);
  const zoomLevel = useAppStore((s) => s.zoomLevel);
  const setZoomLevel = useAppStore((s) => s.setZoomLevel);

  if (appMode === 'present') return null;

  return (
    <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
      {/* Logo / App Name */}
      <div className="flex items-center gap-2.5 mr-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
          <Workflow className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
            FlowBuilder
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight">
            Demo Flow Builder
          </span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Build/Present toggle */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAppMode('build')}
          className={`h-7 px-3 text-xs rounded-md transition-all ${
            appMode === 'build'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100 font-medium'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 mr-1.5" />
          Build
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAppMode('present')}
          className={`h-7 px-3 text-xs rounded-md transition-all ${
            appMode === 'present'
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100 font-medium'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Presentation className="w-3.5 h-3.5 mr-1.5" />
          Present
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Save */}
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <Save className="w-3.5 h-3.5 mr-1.5" />
        <span className="hidden sm:inline">Save</span>
      </Button>

      {/* Undo / Redo */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={undo}
        disabled={!canUndo}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={redo}
        disabled={!canRedo}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800/80 rounded-lg px-1.5 py-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => setZoomLevel(Math.max(20, zoomLevel - 10))}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[11px] text-gray-600 dark:text-gray-400 w-10 text-center font-medium tabular-nums">
          {zoomLevel}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="text-xs">
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs">
            <ImageIcon className="w-4 h-4 mr-2" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs">
            <MonitorPlay className="w-4 h-4 mr-2" />
            Export as PPT
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Present Button */}
      <Button
        onClick={() => setAppMode('present')}
        className="h-8 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all duration-300 hover:shadow-emerald-600/40 hover:scale-[1.02]"
      >
        <Play className="w-3.5 h-3.5 mr-1.5" />
        Present
      </Button>
    </div>
  );
}

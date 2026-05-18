'use client';

import { TEMPLATES } from '@/lib/constants';
import { Template } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { FolderOpen } from 'lucide-react';

export function TemplateLibrary() {
  const loadTemplate = useAppStore((s) => s.loadTemplate);

  const handleLoadTemplate = (template: Template) => {
    loadTemplate(template);
  };

  return (
    <div className="space-y-2">
      {TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => handleLoadTemplate(template)}
          className="w-full text-left p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 hover:border-emerald-400/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-600/40 transition-all duration-200 hover:shadow-md group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
              <FolderOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {template.name}
              </h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                {template.description}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 font-medium">
              {template.category}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 font-medium">
              {template.nodes.length} steps
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

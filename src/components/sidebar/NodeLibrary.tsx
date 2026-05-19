'use client';

import { DragEvent } from 'react';
import { NodeType } from '@/lib/types';
import { NODE_CONFIG } from '@/components/flow/NodeConfig';
import { NodeIcon } from '@/components/flow/NodeIcon';

const nodeTypes: NodeType[] = [
  'process',
  'decision',
  'database',
  'api',
  'userAction',
  'approval',
  'milestone',
  'status',
  'section',
];

export function NodeLibrary() {
  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {nodeTypes.map((type) => {
        const config = NODE_CONFIG[type];

        return (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 cursor-grab active:cursor-grabbing hover:border-emerald-400/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 dark:hover:border-emerald-600/40 transition-all duration-200 hover:shadow-md group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${config.color}18`, color: config.color }}
            >
              <NodeIcon nodeType={type} className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

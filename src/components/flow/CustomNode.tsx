'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { FlowNodeData, StepStatus } from '@/lib/types';
import { NODE_CONFIG } from './NodeConfig';
import { NodeIcon } from './NodeIcon';

const statusStyles: Record<
  StepStatus,
  {
    container: string;
    iconBg: string;
    badge: string;
    badgeText: string;
    opacity: string;
    glow: string;
  }
> = {
  pending: {
    container:
      'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60',
    iconBg: 'bg-gray-100 dark:bg-gray-700/80',
    badge: 'bg-gray-100 dark:bg-gray-700/80',
    badgeText: 'text-gray-500 dark:text-gray-400',
    opacity: 'opacity-60',
    glow: '',
  },
  active: {
    container:
      'border-amber-400/80 dark:border-amber-500/80 bg-gradient-to-br from-amber-50/95 to-orange-50/80 dark:from-amber-950/60 dark:to-orange-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    badge: 'bg-amber-100 dark:bg-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    opacity: 'opacity-100',
    glow: 'animate-pulse-glow',
  },
  completed: {
    container:
      'border-emerald-400/80 dark:border-emerald-500/80 bg-gradient-to-br from-emerald-50/95 to-teal-50/80 dark:from-emerald-950/60 dark:to-teal-950/40 shadow-lg shadow-emerald-500/10',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    opacity: 'opacity-100',
    glow: '',
  },
  blocked: {
    container:
      'border-rose-300/80 dark:border-rose-500/80 bg-gradient-to-br from-rose-50/95 to-pink-50/80 dark:from-rose-950/60 dark:to-pink-950/40 shadow-lg shadow-rose-500/10',
    iconBg: 'bg-rose-100 dark:bg-rose-900/60',
    badge: 'bg-rose-100 dark:bg-rose-900/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    opacity: 'opacity-80',
    glow: '',
  },
};

const statusLabels: Record<StepStatus, string> = {
  pending: 'Pending',
  active: 'Running...',
  completed: 'Completed',
  blocked: 'Blocked',
};

/* Global callbacks — set by FlowCanvas so the context menu can be
   triggered from inside React Flow nodes without prop-drilling. */
let _onNodeContextMenu: ((e: React.MouseEvent, nodeId: string) => void) | null = null;
let _onNodeTouchStart: ((e: React.TouchEvent, nodeId: string) => void) | null = null;
let _onNodeTouchMove: ((e: React.TouchEvent) => void) | null = null;
let _onNodeTouchEnd: ((e: React.TouchEvent) => void) | null = null;

export function setNodeContextMenuHandler(
  handler: (e: React.MouseEvent, nodeId: string) => void
) {
  _onNodeContextMenu = handler;
}

export function setNodeTouchHandlers(handlers: {
  onTouchStart: (e: React.TouchEvent, nodeId: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}) {
  _onNodeTouchStart = handlers.onTouchStart;
  _onNodeTouchMove = handlers.onTouchMove;
  _onNodeTouchEnd = handlers.onTouchEnd;
}

function CustomNodeComponent({ data, selected, id }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const status = nodeData.status || 'pending';
  const styles = statusStyles[status];
  const nodeType = nodeData.nodeType;
  const config = NODE_CONFIG[nodeType];
  const color = config?.color || nodeData.color;
  const isLocked = nodeData.isLocked ?? false;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (_onNodeContextMenu) {
        _onNodeContextMenu(e, id);
      }
    },
    [id]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (_onNodeTouchStart) {
        _onNodeTouchStart(e, id);
      }
    },
    [id]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (_onNodeTouchMove) {
        _onNodeTouchMove(e);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (_onNodeTouchEnd) {
        _onNodeTouchEnd(e);
      }
    },
    []
  );

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.04, y: -3 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${styles.opacity} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`
          relative min-w-[170px] max-w-[210px] rounded-xl border-2
          backdrop-blur-xl p-3.5 transition-all duration-500 ease-out
          ${styles.container}
          ${styles.glow}
          ${selected ? 'ring-2 ring-emerald-500/70 ring-offset-2 dark:ring-offset-gray-900 shadow-lg shadow-emerald-500/10' : ''}
          ${isLocked ? 'ring-2 ring-gray-400/40 dark:ring-gray-500/30 ring-offset-1 dark:ring-offset-gray-900' : ''}
        `}
      >
        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !bg-gray-300 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !-top-1"
        />

        {/* Main Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <motion.div
            className={`flex-shrink-0 w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shadow-sm`}
            style={{ color }}
            animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {status === 'blocked' ? (
              <Lock className="w-4 h-4" />
            ) : status === 'completed' ? (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            ) : (
              <NodeIcon nodeType={nodeType} className="w-4 h-4" />
            )}
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3
              className={`
                font-semibold text-[13px] leading-tight truncate
                ${status === 'blocked' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}
              `}
            >
              {nodeData.label}
            </h3>
            {nodeData.description && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                {nodeData.description}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mt-2.5"
          >
            <span
              className={`
                inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium
                ${styles.badge} ${styles.badgeText}
              `}
            >
              {status === 'active' && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
              )}
              {status === 'completed' && (
                <Check className="w-2.5 h-2.5" />
              )}
              {statusLabels[status]}
              {isLocked && (
                <Lock className="w-2.5 h-2.5 ml-0.5 text-gray-400" />
              )}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Required indicator */}
        {nodeData.isRequired && status !== 'completed' && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-white text-[6px] font-bold">!</span>
          </div>
        )}

        {/* Lock indicator */}
        {isLocked && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-500 dark:bg-gray-600 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-sm">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Step number */}
        <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gray-700 dark:bg-gray-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm border border-gray-600 dark:border-gray-500">
          {(nodeData.order ?? 0) + 1}
        </div>

        {/* Bottom Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2 !h-2 !bg-gray-300 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800 !rounded-full !-bottom-1"
        />

        {/* Left Handle for horizontal flow */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2 !h-2 !bg-gray-300 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800 !rounded-full"
        />

        {/* Right Handle for horizontal flow */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2 !h-2 !bg-gray-300 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800 !rounded-full"
        />

        {/* Context menu hint on hover — small "right-click" indicator */}
        <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[8px] text-gray-400 dark:text-gray-500">⋮</span>
        </div>
      </div>
    </motion.div>
  );
}

export const CustomNode = memo(CustomNodeComponent);

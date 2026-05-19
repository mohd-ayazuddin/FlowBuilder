'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Loader2,
  Circle,
  Ban,
  RotateCcw,
  Lock,
  Unlock,
  Focus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FlowNodeData, StepStatus } from '@/lib/types';

/* ────────────────────────────────────────────
   Menu Item Definition
   ──────────────────────────────────────────── */
interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  dividerAfter?: boolean;
  action: () => void;
}

/* ────────────────────────────────────────────
   Context Menu Component
   ──────────────────────────────────────────── */
interface NodeContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  nodeId: string | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onEditDetails?: (nodeId: string) => void;
  onFocusNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export function NodeContextMenu({
  isOpen,
  x,
  y,
  nodeId,
  menuRef,
  onClose,
  onEditDetails,
  onFocusNode,
  onDeleteNode,
}: NodeContextMenuProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nodes = useAppStore((s) => s.nodes);
  const updateNodeStatus = useAppStore((s) => s.updateNodeStatus);
  const toggleNodeLock = useAppStore((s) => s.toggleNodeLock);
  const resetNode = useAppStore((s) => s.resetNode);
  const removeNode = useAppStore((s) => s.removeNode);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  const node = nodes.find((n) => n.id === nodeId);
  const data = node?.data as FlowNodeData | undefined;

  const handleStatusChange = useCallback(
    (status: StepStatus) => {
      if (!nodeId || data?.isLocked) return;
      updateNodeStatus(nodeId, status);
      onClose();
    },
    [nodeId, data?.isLocked, updateNodeStatus, onClose]
  );

  const handleLock = useCallback(() => {
    if (!nodeId) return;
    toggleNodeLock(nodeId);
    onClose();
  }, [nodeId, toggleNodeLock, onClose]);

  const handleReset = useCallback(() => {
    if (!nodeId) return;
    resetNode(nodeId);
    onClose();
  }, [nodeId, resetNode, onClose]);

  const handleEdit = useCallback(() => {
    if (!nodeId) return;
    setSelectedNodeId(nodeId);
    onEditDetails?.(nodeId);
    onClose();
  }, [nodeId, setSelectedNodeId, onEditDetails, onClose]);

  const handleFocus = useCallback(() => {
    if (!nodeId) return;
    onFocusNode?.(nodeId);
    onClose();
  }, [nodeId, onFocusNode, onClose]);

  const handleDelete = useCallback(() => {
    if (!nodeId || data?.isLocked) return;
    onDeleteNode?.(nodeId);
    removeNode(nodeId);
    setSelectedNodeId(null);
    onClose();
  }, [nodeId, data?.isLocked, onDeleteNode, removeNode, setSelectedNodeId, onClose]);

  // Build menu items
  const menuItems: MenuItemDef[] = data
    ? [
        {
          id: 'completed',
          label: 'Mark as Completed',
          icon: CheckCircle2,
          shortcut: '',
          disabled: data.isLocked || data.status === 'completed',
          action: () => handleStatusChange('completed'),
        },
        {
          id: 'active',
          label: 'Mark as In Progress',
          icon: Loader2,
          shortcut: '',
          disabled: data.isLocked || data.status === 'active',
          action: () => handleStatusChange('active'),
        },
        {
          id: 'pending',
          label: 'Mark as Pending',
          icon: Circle,
          shortcut: '',
          disabled: data.isLocked || data.status === 'pending',
          action: () => handleStatusChange('pending'),
        },
        {
          id: 'blocked',
          label: 'Mark as Blocked',
          icon: Ban,
          shortcut: '',
          disabled: data.isLocked || data.status === 'blocked',
          action: () => handleStatusChange('blocked'),
          dividerAfter: true,
        },
        {
          id: 'reset',
          label: 'Reset Step',
          icon: RotateCcw,
          disabled: data.isLocked || (data.status === 'pending' && !data.isLocked),
          action: handleReset,
          dividerAfter: true,
        },
        {
          id: 'lock',
          label: data.isLocked ? 'Unlock Step' : 'Lock Step',
          icon: data.isLocked ? Unlock : Lock,
          action: handleLock,
        },
        {
          id: 'focus',
          label: 'Focus Step',
          icon: Focus,
          shortcut: 'F',
          action: handleFocus,
        },
        {
          id: 'edit',
          label: 'Edit Details',
          icon: Pencil,
          shortcut: 'E',
          action: handleEdit,
          dividerAfter: true,
        },
        {
          id: 'delete',
          label: 'Delete Node',
          icon: Trash2,
          shortcut: 'Del',
          danger: true,
          disabled: data.isLocked,
          action: handleDelete,
        },
      ]
    : [];

  // Keyboard navigation within the menu
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex((prev) => {
            // Find next enabled item
            let next = prev;
            for (let i = 0; i < menuItems.length; i++) {
              next = (next + 1) % menuItems.length;
              if (!menuItems[next].disabled) return next;
            }
            return prev;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          e.stopPropagation();
          setFocusedIndex((prev) => {
            let next = prev <= 0 ? menuItems.length - 1 : prev - 1;
            for (let i = 0; i < menuItems.length; i++) {
              if (!menuItems[next].disabled) return next;
              next = next <= 0 ? menuItems.length - 1 : next - 1;
            }
            return prev;
          });
          break;
        }
        case 'Enter': {
          e.preventDefault();
          e.stopPropagation();
          if (focusedIndex >= 0 && focusedIndex < menuItems.length && !menuItems[focusedIndex].disabled) {
            menuItems[focusedIndex].action();
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, focusedIndex, menuItems, onClose]);

  // Focus the item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  if (!isOpen || !nodeId) return null;

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.8,
          }}
          className="fixed z-[9999] min-w-[220px] max-w-[280px] rounded-xl overflow-hidden
            bg-white/90 dark:bg-gray-900/95 backdrop-blur-2xl
            border border-gray-200/60 dark:border-white/[0.08]
            shadow-xl shadow-black/[0.08] dark:shadow-black/40
            py-1.5"
          style={{
            left: x,
            top: y,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Node header in menu */}
          {data && (
            <div className="px-3 py-2.5 mb-1 border-b border-gray-200/60 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${data.color}15`,
                    color: data.color,
                  }}
                >
                  <Circle className="w-3 h-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {data.label}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
                    {data.status}{data.isLocked ? ' · Locked' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Menu items */}
          <div className="py-0.5">
            {menuItems.map((item, idx) => (
              <div key={item.id}>
                <button
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  onClick={() => {
                    if (!item.disabled) item.action();
                  }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-[7px] text-left
                    transition-all duration-100 ease-out
                    focus:outline-none
                    ${item.disabled
                      ? 'opacity-35 cursor-not-allowed'
                      : item.danger
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer'
                        : focusedIndex === idx
                          ? 'bg-gray-100/80 dark:bg-white/[0.06] text-gray-900 dark:text-gray-100 cursor-pointer'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/[0.06] cursor-pointer'
                    }
                  `}
                  disabled={item.disabled}
                  tabIndex={-1}
                >
                  {/* Icon */}
                  <span className={`
                    flex items-center justify-center w-[18px] h-[18px] shrink-0
                    ${item.id === 'completed' ? 'text-emerald-500' : ''}
                    ${item.id === 'active' ? 'text-amber-500' : ''}
                    ${item.id === 'pending' ? 'text-gray-400' : ''}
                    ${item.id === 'blocked' ? 'text-rose-500' : ''}
                  `}>
                    {item.id === 'active' ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="flex items-center justify-center"
                      >
                        <item.icon className="w-[15px] h-[15px]" />
                      </motion.span>
                    ) : (
                      <item.icon className="w-[15px] h-[15px]" />
                    )}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-[12.5px] font-medium leading-tight">
                    {item.label}
                  </span>

                  {/* Shortcut hint */}
                  {item.shortcut && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tabular-nums ml-auto">
                      {item.shortcut}
                    </span>
                  )}

                  {/* Status dot for status items */}
                  {(item.id === 'completed' || item.id === 'active' || item.id === 'pending' || item.id === 'blocked') && data && (
                    <span className={`
                      w-2 h-2 rounded-full ml-auto shrink-0
                      ${item.id === 'completed' ? 'bg-emerald-500' : ''}
                      ${item.id === 'active' ? 'bg-amber-500' : ''}
                      ${item.id === 'pending' ? 'bg-gray-300 dark:bg-gray-600' : ''}
                      ${item.id === 'blocked' ? 'bg-rose-500' : ''}
                      ${data.status === item.id ? 'ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-600 dark:ring-offset-gray-900' : ''}
                    `} />
                  )}
                </button>

                {/* Divider */}
                {item.dividerAfter && (
                  <div className="my-1.5 mx-3 h-px bg-gray-200/60 dark:bg-white/[0.06]" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render as portal to avoid z-index issues
  if (typeof document !== 'undefined') {
    return createPortal(menu, document.body);
  }
  return menu;
}

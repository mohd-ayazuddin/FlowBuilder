'use client';

import {
  GitBranch,
  GitMerge,
  Database,
  Cloud,
  User,
  CheckCircle,
  Flag,
  Activity,
  Layers,
  Lock,
  Check,
  LucideIcon,
} from 'lucide-react';
import { NodeType } from '@/lib/types';

interface NodeConfigType {
  icon: LucideIcon;
  label: string;
  color: string;
  description: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  GitBranch,
  GitMerge,
  Database,
  Cloud,
  User,
  CheckCircle,
  Flag,
  Activity,
  Layers,
};

export function getNodeIcon(nodeType: NodeType): LucideIcon {
  const iconMap: Record<NodeType, LucideIcon> = {
    process: GitBranch,
    decision: GitMerge,
    database: Database,
    api: Cloud,
    userAction: User,
    approval: CheckCircle,
    milestone: Flag,
    status: Activity,
    section: Layers,
  };
  return iconMap[nodeType] || GitBranch;
}

export function getIconByName(name: string): LucideIcon {
  return ICON_MAP[name] || GitBranch;
}

export const NODE_CONFIG: Record<NodeType, NodeConfigType> = {
  process: { icon: GitBranch, label: 'Process Step', color: '#10b981', description: 'A process or action step' },
  decision: { icon: GitMerge, label: 'Decision', color: '#f59e0b', description: 'A decision point' },
  database: { icon: Database, label: 'Database', color: '#8b5cf6', description: 'Data storage' },
  api: { icon: Cloud, label: 'API / System', color: '#06b6d4', description: 'External API or system' },
  userAction: { icon: User, label: 'User Action', color: '#10b981', description: 'User-initiated action' },
  approval: { icon: CheckCircle, label: 'Approval', color: '#f97316', description: 'Approval gate' },
  milestone: { icon: Flag, label: 'Milestone', color: '#ec4899', description: 'Key milestone' },
  status: { icon: Activity, label: 'Status', color: '#64748b', description: 'Status indicator' },
  section: { icon: Layers, label: 'Section', color: '#78716c', description: 'Section group' },
};

export { Lock, Check };

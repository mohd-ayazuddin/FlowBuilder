'use client';

import { NodeType } from '@/lib/types';
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
} from 'lucide-react';

const ICON_MAP: Record<NodeType, React.ComponentType<{ className?: string }>> = {
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

export function NodeIcon({ nodeType, className }: { nodeType: NodeType; className?: string }) {
  const Icon = ICON_MAP[nodeType] || GitBranch;
  return <Icon className={className} />;
}

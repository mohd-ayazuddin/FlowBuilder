export type NodeType =
  | 'process'
  | 'decision'
  | 'database'
  | 'api'
  | 'userAction'
  | 'approval'
  | 'milestone'
  | 'status'
  | 'section';

export type StepStatus = 'pending' | 'active' | 'completed' | 'blocked';

export type AppMode = 'build' | 'present';

export type ThemeMode = 'light' | 'dark';

export interface FlowNodeData {
  label: string;
  description: string;
  notes: string;
  nodeType: NodeType;
  status: StepStatus;
  color: string;
  isRequired: boolean;
  order: number;
  dependencies: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
}

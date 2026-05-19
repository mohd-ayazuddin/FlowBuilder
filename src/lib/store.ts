'use client';

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge, Node, Edge } from 'reactflow';
import { FlowNodeData, NodeType, StepStatus, AppMode, Template } from './types';
import { NODE_TYPE_CONFIG, TEMPLATES } from './constants';
import { SaveStatus } from './supabase/types';
import { createClient } from './supabase/client';
import {
  createFlow,
  saveFlowData,
  getFlow,
  deleteFlowData,
  duplicateFlowData,
  saveAutoDraft,
  getStorageMode,
  StorageMode,
} from './hybridStorage';

interface AppState {
  // Mode
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // Flow identity
  currentFlowId: string | null;
  flowTitle: string;
  flowDescription: string;
  setFlowTitle: (title: string) => void;
  setFlowDescription: (desc: string) => void;
  setCurrentFlowId: (id: string | null) => void;

  // Save state
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  lastSavedAt: Date | null;
  setLastSavedAt: (date: Date | null) => void;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
  isLocalFlow: boolean;
  setIsLocalFlow: (local: boolean) => void;
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;

  // Flow
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Selection
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Node operations
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<FlowNodeData>) => void;
  updateNodeStatus: (id: string, status: StepStatus) => void;
  toggleNodeLock: (id: string) => void;
  resetNode: (id: string) => void;

  // Present mode
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  markCurrentComplete: () => void;
  getOrderedSteps: () => Node[];

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // History
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;
  pushHistory: () => void;

  // Sidebar
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Zoom
  zoomLevel: number;
  setZoomLevel: (level: number) => void;

  // Templates
  loadTemplate: (template: Template) => void;

  // Hybrid storage operations
  saveFlow: () => Promise<void>;
  loadFlow: (flowId: string) => Promise<void>;
  createNewFlow: (title?: string) => Promise<string | null>;
  deleteFlow: (flowId: string) => Promise<void>;
  duplicateFlow: (flowId: string) => Promise<string | null>;
  resetToEmpty: () => void;
  refreshStorageMode: () => Promise<void>;
}

const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const emptyNodes: Node[] = [];
const emptyEdges: Edge[] = [];
const emptyHistory = [{ nodes: emptyNodes, edges: emptyEdges }];

export const useAppStore = create<AppState>((set, get) => ({
  // Mode
  appMode: 'build',
  setAppMode: (mode) => set({ appMode: mode }),

  // Flow identity
  currentFlowId: null,
  flowTitle: 'Untitled Flow',
  flowDescription: '',
  setFlowTitle: (title) => set((s) => ({ flowTitle: title, saveStatus: s.isLoaded && s.saveStatus === 'saved' ? 'idle' : s.saveStatus })),
  setFlowDescription: (desc) => set({ flowDescription: desc }),
  setCurrentFlowId: (id) => set({ currentFlowId: id }),

  // Save state
  saveStatus: 'idle',
  setSaveStatus: (status) => set({ saveStatus: status }),
  lastSavedAt: null,
  setLastSavedAt: (date) => set({ lastSavedAt: date }),
  isLoaded: false,
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  isLocalFlow: false,
  setIsLocalFlow: (local) => set({ isLocalFlow: local }),
  storageMode: 'local',
  setStorageMode: (mode) => set({ storageMode: mode }),

  // Flow
  nodes: emptyNodes,
  edges: emptyEdges,
  setNodes: (nodes) => {
    set((s) => ({ nodes, saveStatus: s.isLoaded && s.saveStatus === 'saved' ? 'idle' : s.saveStatus }));
  },
  setEdges: (edges) => {
    set((s) => ({ edges, saveStatus: s.isLoaded && s.saveStatus === 'saved' ? 'idle' : s.saveStatus }));
  },
  onNodesChange: (changes) => {
    const s = get();
    set({ nodes: applyNodeChanges(changes, s.nodes), saveStatus: s.isLoaded && s.saveStatus === 'saved' ? 'idle' : s.saveStatus });
  },
  onEdgesChange: (changes) => {
    const s = get();
    set({ edges: applyEdgeChanges(changes, s.edges), saveStatus: s.isLoaded && s.saveStatus === 'saved' ? 'idle' : s.saveStatus });
  },
  onConnect: (connection) => {
    const newEdges = addEdge(
      { ...connection, type: 'customEdge' },
      get().edges
    );
    set({ edges: newEdges });
    get().pushHistory();
  },

  // Selection
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  // Node operations
  addNode: (type, position) => {
    const config = NODE_TYPE_CONFIG[type];
    const nodes = get().nodes;
    const maxOrder = nodes.reduce(
      (max, n) => Math.max(max, (n.data as FlowNodeData).order ?? 0),
      -1
    );
    const newNode: Node = {
      id: generateId(),
      type: 'customNode',
      position,
      data: {
        label: config.label,
        description: config.description,
        notes: '',
        nodeType: type,
        status: 'pending' as StepStatus,
        color: config.color,
        isRequired: false,
        order: maxOrder + 1,
        dependencies: [],
      } as FlowNodeData,
    };
    set({ nodes: [...nodes, newNode] });
    get().pushHistory();
  },

  removeNode: (id) => {
    const nodes = get().nodes.filter((n) => n.id !== id);
    const edges = get().edges.filter((e) => e.source !== id && e.target !== id);
    const updatedNodes = nodes.map((n) => {
      const data = n.data as FlowNodeData;
      if (data.dependencies.includes(id)) {
        return {
          ...n,
          data: {
            ...data,
            dependencies: data.dependencies.filter((d) => d !== id),
          },
        };
      }
      return n;
    });
    set({ nodes: updatedNodes, edges, selectedNodeId: null });
    get().pushHistory();
  },

  updateNodeData: (id, data) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          data: { ...(n.data as FlowNodeData), ...data },
        };
      }
      return n;
    });
    set({ nodes });
    get().pushHistory();
  },

  updateNodeStatus: (id, status) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          data: { ...(n.data as FlowNodeData), status },
        };
      }
      return n;
    });
    set({ nodes });
    reevaluateBlockedNodes(get, set);
  },

  toggleNodeLock: (id) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === id) {
        const data = n.data as FlowNodeData;
        return {
          ...n,
          data: { ...data, isLocked: !data.isLocked },
        };
      }
      return n;
    });
    set({ nodes });
  },

  resetNode: (id) => {
    const nodes = get().nodes.map((n) => {
      if (n.id === id) {
        const data = n.data as FlowNodeData;
        return {
          ...n,
          data: { ...data, status: 'pending' as StepStatus, isLocked: false },
        };
      }
      return n;
    });
    set({ nodes });
  },

  // Present mode
  currentStepIndex: 0,
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),

  nextStep: () => {
    const steps = get().getOrderedSteps();
    const currentIdx = get().currentStepIndex;
    if (currentIdx < steps.length - 1) {
      const currentStep = steps[currentIdx];
      const nodes = get().nodes.map((n) => {
        if (n.id === currentStep.id) {
          return {
            ...n,
            data: { ...(n.data as FlowNodeData), status: 'completed' as StepStatus },
          };
        }
        return n;
      });
      const nextStep = steps[currentIdx + 1];
      const updatedNodes = nodes.map((n) => {
        if (n.id === nextStep.id) {
          return {
            ...n,
            data: { ...(n.data as FlowNodeData), status: 'active' as StepStatus },
          };
        }
        return n;
      });
      set({ nodes: updatedNodes, currentStepIndex: currentIdx + 1 });
    }
  },

  prevStep: () => {
    const steps = get().getOrderedSteps();
    const currentIdx = get().currentStepIndex;
    if (currentIdx > 0) {
      const currentStep = steps[currentIdx];
      const nodes = get().nodes.map((n) => {
        if (n.id === currentStep.id) {
          return {
            ...n,
            data: { ...(n.data as FlowNodeData), status: 'pending' as StepStatus },
          };
        }
        return n;
      });
      const prevStep = steps[currentIdx - 1];
      const updatedNodes = nodes.map((n) => {
        if (n.id === prevStep.id) {
          return {
            ...n,
            data: { ...(n.data as FlowNodeData), status: 'active' as StepStatus },
          };
        }
        return n;
      });
      set({ nodes: updatedNodes, currentStepIndex: currentIdx - 1 });
    }
  },

  markCurrentComplete: () => {
    const steps = get().getOrderedSteps();
    const currentIdx = get().currentStepIndex;
    const currentStep = steps[currentIdx];
    if (currentStep) {
      const nodes = get().nodes.map((n) => {
        if (n.id === currentStep.id) {
          return {
            ...n,
            data: { ...(n.data as FlowNodeData), status: 'completed' as StepStatus },
          };
        }
        return n;
      });
      set({ nodes });
    }
  },

  getOrderedSteps: () => {
    return [...get().nodes].sort(
      (a, b) => ((a.data as FlowNodeData).order ?? 0) - ((b.data as FlowNodeData).order ?? 0)
    );
  },

  // Undo/Redo
  canUndo: false,
  canRedo: false,
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set({
        nodes: entry.nodes,
        edges: entry.edges,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set({
        nodes: entry.nodes,
        edges: entry.edges,
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1,
      });
    }
  },

  // History
  history: emptyHistory,
  historyIndex: 0,
  pushHistory: () => {
    const { nodes, edges, historyIndex, history } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },

  // Sidebar
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),

  // Zoom
  zoomLevel: 100,
  setZoomLevel: (level) => set({ zoomLevel: level }),

  // Templates
  loadTemplate: (template) => {
    const nodes: Node[] = template.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { ...n.data },
    }));
    const edges: Edge[] = template.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'customEdge',
    }));
    set({
      nodes,
      edges,
      selectedNodeId: null,
      currentStepIndex: 0,
      history: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  // Reset to empty canvas
  resetToEmpty: () => {
    set({
      nodes: emptyNodes,
      edges: emptyEdges,
      selectedNodeId: null,
      currentStepIndex: 0,
      currentFlowId: null,
      flowTitle: 'Untitled Flow',
      flowDescription: '',
      saveStatus: 'idle',
      lastSavedAt: null,
      isLoaded: false,
      isLocalFlow: false,
      history: emptyHistory,
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  // Refresh storage mode based on auth state
  refreshStorageMode: async () => {
    const mode = await getStorageMode();
    set({ storageMode: mode });
  },

  // ──── Hybrid Storage Operations ────

  saveFlow: async () => {
    const { currentFlowId, nodes, edges, flowTitle, flowDescription, isLocalFlow } = get();
    set({ saveStatus: 'saving' });

    const canvasData = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    try {
      if (currentFlowId) {
        // Save auto-draft for crash recovery
        await saveAutoDraft(currentFlowId, flowTitle, canvasData);

        // Update existing flow (hybrid routes to local or cloud)
        const result = await saveFlowData(currentFlowId, {
          title: flowTitle,
          description: flowDescription,
          canvas_data: canvasData,
          node_count: nodes.length,
        });

        set({ saveStatus: 'saved', lastSavedAt: new Date() });
      } else {
        // No flow ID yet - create a new flow
        const flow = await createFlow(flowTitle);
        const updatedCanvas = {
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        };

        const savedFlow = await saveFlowData(flow.id, {
          title: flowTitle,
          description: flowDescription,
          canvas_data: updatedCanvas,
          node_count: nodes.length,
        });

        set({
          currentFlowId: flow.id,
          isLocalFlow: flow.isLocal || false,
          saveStatus: 'saved',
          lastSavedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      set({ saveStatus: 'error' });
    }
  },

  loadFlow: async (flowId: string) => {
    try {
      const flowData = await getFlow(flowId);
      if (!flowData) return;

      const canvasData = flowData.canvas_data as { nodes: any[]; edges: any[] };
      const nodes: Node[] = (canvasData?.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'customNode',
        position: n.position,
        data: { ...n.data },
      }));
      const edges: Edge[] = (canvasData?.edges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type || 'customEdge',
        ...(e.data ? { data: e.data } : {}),
      }));

      set({
        currentFlowId: flowData.id,
        flowTitle: flowData.title,
        flowDescription: flowData.description || '',
        nodes,
        edges,
        selectedNodeId: null,
        currentStepIndex: 0,
        appMode: 'build',
        saveStatus: 'saved',
        lastSavedAt: new Date(flowData.updated_at),
        isLoaded: true,
        isLocalFlow: flowData.isLocal || false,
        history: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
        historyIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    } catch (error) {
      console.error('Load error:', error);
    }
  },

  createNewFlow: async (title?: string) => {
    const flowTitle = title || 'Untitled Flow';
    try {
      const flow = await createFlow(flowTitle);
      return flow.id;
    } catch (error) {
      console.error('Create flow error:', error);
      return null;
    }
  },

  deleteFlow: async (flowId: string) => {
    try {
      await deleteFlowData(flowId);
      if (get().currentFlowId === flowId) {
        get().resetToEmpty();
      }
    } catch (error) {
      console.error('Delete flow error:', error);
    }
  },

  duplicateFlow: async (flowId: string) => {
    try {
      const duplicated = await duplicateFlowData(flowId);
      return duplicated?.id || null;
    } catch (error) {
      console.error('Duplicate flow error:', error);
      return null;
    }
  },
}));

function reevaluateBlockedNodes(
  get: () => AppState,
  set: (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void
) {
  const nodes = get().nodes;
  const updatedNodes = nodes.map((n) => {
    const data = n.data as FlowNodeData;
    if (data.status === 'blocked') {
      const depsCompleted = data.dependencies.every((depId) => {
        const depNode = nodes.find((nd) => nd.id === depId);
        if (depNode) {
          return (depNode.data as FlowNodeData).status === 'completed';
        }
        return true;
      });
      if (depsCompleted) {
        return {
          ...n,
          data: { ...data, status: 'pending' as StepStatus },
        };
      }
    }
    return n;
  });
  set({ nodes: updatedNodes });
}

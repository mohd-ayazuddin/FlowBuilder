'use client';

import { useCallback, useRef, useMemo, DragEvent, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { NodeContextMenu } from './NodeContextMenu';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useAppStore } from '@/lib/store';
import { NodeType } from '@/lib/types';
import { NODE_CONFIG } from './NodeConfig';
import { setNodeContextMenuHandler, setNodeTouchHandlers } from './CustomNode';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, setViewport } = useReactFlow();

  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const onNodesChange = useAppStore((s) => s.onNodesChange);
  const onEdgesChange = useAppStore((s) => s.onEdgesChange);
  const onConnect = useAppStore((s) => s.onConnect);
  const addNode = useAppStore((s) => s.addNode);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const toggleRightSidebar = useAppStore((s) => s.toggleRightSidebar);
  const rightSidebarOpen = useAppStore((s) => s.rightSidebarOpen);

  // Context menu state
  const contextMenu = useContextMenu();

  // Register the context menu handler so CustomNode can call it
  useEffect(() => {
    setNodeContextMenuHandler((e, nodeId) => {
      contextMenu.open(e, nodeId);
    });
    setNodeTouchHandlers({
      onTouchStart: (e, nodeId) => {
        contextMenu.handleTouchStart(e, nodeId);
      },
      onTouchMove: (e) => {
        contextMenu.handleTouchMove();
      },
      onTouchEnd: (e) => {
        contextMenu.handleTouchEnd();
      },
    });
    return () => {
      setNodeContextMenuHandler(null as any);
      setNodeTouchHandlers({
        onTouchStart: () => {},
        onTouchMove: () => {},
        onTouchEnd: () => {},
      });
    };
  }, [contextMenu.open, contextMenu.handleTouchStart, contextMenu.handleTouchMove, contextMenu.handleTouchEnd]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    contextMenu.close();
  }, [setSelectedNodeId, contextMenu]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Focus node — smoothly zoom/focus camera to the node
  const handleFocusNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Animate to the node position with a nice zoom
      setViewport(
        {
          x: window.innerWidth / 2 - node.position.x - 100,
          y: window.innerHeight / 2 - node.position.y - 50,
          zoom: 1.2,
        },
        { duration: 600 }
      );
    },
    [nodes, setViewport]
  );

  // Edit details — open right sidebar
  const handleEditDetails = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      if (!rightSidebarOpen) {
        toggleRightSidebar();
      }
    },
    [setSelectedNodeId, rightSidebarOpen, toggleRightSidebar]
  );

  // Determine edge status based on connected node statuses
  const edgesWithStatus = useMemo(() => {
    return edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      const sourceStatus = sourceNode?.data?.status;
      const targetStatus = targetNode?.data?.status;

      let edgeStatus = 'pending';
      if (sourceStatus === 'completed' && targetStatus === 'active') {
        edgeStatus = 'active';
      } else if (sourceStatus === 'completed' && targetStatus === 'completed') {
        edgeStatus = 'completed';
      } else if (targetStatus === 'blocked') {
        edgeStatus = 'blocked';
      }

      return {
        ...edge,
        data: { ...edge.data, status: edgeStatus },
      };
    });
  }, [edges, nodes]);

  const miniMapNodeColor = useCallback((node: { data?: { nodeType?: string; status?: string } }) => {
    const status = node.data?.status;
    if (status === 'completed') return '#10b981';
    if (status === 'active') return '#f59e0b';
    if (status === 'blocked') return '#f43f5e';

    const type = node.data?.nodeType;
    if (type && NODE_CONFIG[type as NodeType]) {
      return NODE_CONFIG[type as NodeType].color;
    }
    return '#64748b';
  }, []);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edgesWithStatus}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'customEdge',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-gray-50 dark:bg-gray-950"
        selectionOnDrag={false}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Background
          gap={24}
          size={1}
          color="currentColor"
          className="!opacity-20"
        />
        <Controls
          position="bottom-left"
          className="!bg-white/90 !dark:bg-gray-800/90 !backdrop-blur-xl !border !border-gray-200/80 !dark:border-gray-700/80 !rounded-xl !shadow-lg !overflow-hidden"
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor="rgba(0, 0, 0, 0.08)"
          className="!bg-white/90 !dark:bg-gray-800/90 !backdrop-blur-xl !border !border-gray-200/80 !dark:border-gray-700/80 !rounded-xl !shadow-lg"
          position="bottom-right"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center space-y-3 px-6">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="12" cy="18" r="3" />
                <path d="M6 9v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9" />
                <path d="M12 15v-3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Drag a step from the sidebar to get started</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">or choose a template from the Templates tab</p>
            </div>
          </div>
        </div>
      )}

      {/* Right-click context menu */}
      <NodeContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        nodeId={contextMenu.nodeId}
        menuRef={contextMenu.menuRef}
        onClose={contextMenu.close}
        onEditDetails={handleEditDetails}
        onFocusNode={handleFocusNode}
      />
    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}

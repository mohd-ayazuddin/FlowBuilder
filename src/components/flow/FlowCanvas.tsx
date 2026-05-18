'use client';

import { useCallback, useRef, useMemo, DragEvent, useState } from 'react';
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
import { useAppStore } from '@/lib/store';
import { NodeType } from '@/lib/types';
import { NODE_CONFIG } from './NodeConfig';

const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const onNodesChange = useAppStore((s) => s.onNodesChange);
  const onEdgesChange = useAppStore((s) => s.onEdgesChange);
  const onConnect = useAppStore((s) => s.onConnect);
  const addNode = useAppStore((s) => s.addNode);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

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
    <div ref={reactFlowWrapper} className="w-full h-full">
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

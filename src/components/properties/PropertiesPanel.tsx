'use client';

import { useAppStore } from '@/lib/store';
import { FlowNodeData, StepStatus, NodeType } from '@/lib/types';
import { NODE_CONFIG } from '@/components/flow/NodeConfig';
import { NodeIcon } from '@/components/flow/NodeIcon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trash2, Plus, X, MousePointer2 } from 'lucide-react';

export function PropertiesPanel() {
  const nodes = useAppStore((s) => s.nodes);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const updateNodeData = useAppStore((s) => s.updateNodeData);
  const removeNode = useAppStore((s) => s.removeNode);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-4">
          <MousePointer2 className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          Select a node
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Click on a node in the canvas to edit its properties, status, and dependencies
        </p>
      </div>
    );
  }

  const data = selectedNode.data as FlowNodeData;
  const config = NODE_CONFIG[data.nodeType];

  const handleUpdate = (updates: Partial<FlowNodeData>) => {
    updateNodeData(selectedNode.id, updates);
  };

  const handleDelete = () => {
    removeNode(selectedNode.id);
    setSelectedNodeId(null);
  };

  const otherNodes = nodes.filter((n) => n.id !== selectedNode.id);
  const depNodes = otherNodes.filter((n) => data.dependencies.includes(n.id));
  const availableDepNodes = otherNodes.filter(
    (n) => !data.dependencies.includes(n.id)
  );

  const statusColors: Record<StepStatus, string> = {
    pending: 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800',
    active: 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    completed: 'border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    blocked: 'border-rose-400 text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Node Header */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: `${config.color}18`, color: config.color }}
          >
            <NodeIcon nodeType={data.nodeType} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {data.label}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {config.label}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Properties */}
        <Accordion type="multiple" defaultValue={['properties', 'status', 'deps', 'notes']}>
          <AccordionItem value="properties" className="border-b border-gray-200/60 dark:border-gray-800/60">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
              Properties
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              {/* Label */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Label</Label>
                <Input
                  value={data.label}
                  onChange={(e) => handleUpdate({ label: e.target.value })}
                  className="h-8 text-xs rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Description</Label>
                <Input
                  value={data.description}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  className="h-8 text-xs rounded-lg"
                />
              </div>

              {/* Node Type */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Node Type</Label>
                <Select
                  value={data.nodeType}
                  onValueChange={(val) =>
                    handleUpdate({
                      nodeType: val as NodeType,
                      color: NODE_CONFIG[val as NodeType].color,
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NODE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Required Toggle */}
              <div className="flex items-center justify-between py-1">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Required Step</Label>
                <Switch
                  checked={data.isRequired}
                  onCheckedChange={(checked) => handleUpdate({ isRequired: checked })}
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Step Order</Label>
                <Input
                  type="number"
                  value={data.order}
                  onChange={(e) => handleUpdate({ order: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg w-24"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="status" className="border-b border-gray-200/60 dark:border-gray-800/60">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
              Status
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[11px] px-3 py-1 rounded-lg ${statusColors[data.status]}`}
                >
                  {data.status}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Override Status</Label>
                <Select
                  value={data.status}
                  onValueChange={(val) =>
                    handleUpdate({ status: val as StepStatus })
                  }
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="deps" className="border-b border-gray-200/60 dark:border-gray-800/60">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
              Dependencies
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              {/* Current Dependencies */}
              {depNodes.length > 0 ? (
                <div className="space-y-1.5">
                  {depNodes.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/40"
                    >
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
                        {(dep.data as FlowNodeData).label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-gray-400 hover:text-rose-500"
                        onClick={() =>
                          handleUpdate({
                            dependencies: data.dependencies.filter(
                              (d) => d !== dep.id
                            ),
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  No dependencies
                </p>
              )}

              {/* Add Dependency */}
              {availableDepNodes.length > 0 && (
                <Select
                  onValueChange={(val) =>
                    handleUpdate({
                      dependencies: [...data.dependencies, val],
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Plus className="h-3 w-3" />
                      Add dependency
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {(node.data as FlowNodeData).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes" className="border-b-0">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:no-underline">
              Notes
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <Textarea
                value={data.notes}
                onChange={(e) => handleUpdate({ notes: e.target.value })}
                placeholder="Add presenter notes for this step..."
                className="text-xs min-h-[100px] resize-none rounded-lg bg-gray-50 dark:bg-gray-800/40"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}

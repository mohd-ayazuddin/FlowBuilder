'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { FlowNodeData } from '@/lib/types';
import { NODE_CONFIG } from '@/components/flow/NodeConfig';
import { NodeIcon } from '@/components/flow/NodeIcon';
import { NodeContextMenu } from '@/components/flow/NodeContextMenu';
import { useContextMenu } from '@/hooks/useContextMenu';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Keyboard,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Top Progress Tracker — Large, clear, cinematic
   ──────────────────────────────────────────── */
function ProgressTracker({
  steps,
  currentStepIndex,
  onStepClick,
  onStepContextMenu,
  completingStep,
}: {
  steps: ReturnType<typeof useAppStore.getState>['nodes'];
  currentStepIndex: number;
  onStepClick: (idx: number) => void;
  onStepContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  completingStep: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active step into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-step-idx="${currentStepIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentStepIndex]);

  return (
    <div className="relative w-full">
      {/* Thin progress fill line at very top */}
      <div className="h-[3px] bg-slate-800/60">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
          initial={false}
          animate={{
            width: `${steps.length > 0 ? ((steps.filter(s => (s.data as FlowNodeData).status === 'completed').length) / steps.length) * 100 : 0}%`
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Step pills area */}
      <div className="bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.06]">
        <div
          ref={scrollRef}
          className="flex items-center gap-0 px-4 lg:px-8 py-4 overflow-x-auto scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex items-center gap-0 mx-auto min-w-0">
            {steps.map((step, idx) => {
              const stepData = step.data as FlowNodeData;
              const isCompleted = stepData.status === 'completed';
              const isCurrent = idx === currentStepIndex;
              const config = NODE_CONFIG[stepData.nodeType];
              const stepColor = config?.color || stepData.color;

              return (
                <div key={step.id} className="flex items-center shrink-0" data-step-idx={idx}>
                  {/* Connector line between steps */}
                  {idx > 0 && (
                    <div className="relative flex items-center mx-0.5 lg:mx-1">
                      {/* Background track */}
                      <div className="w-6 lg:w-10 h-[2px] bg-slate-700/50 rounded-full" />
                      {/* Active fill */}
                      {isCompleted && (
                        <motion.div
                          className="absolute inset-0 h-[2px] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{ transformOrigin: 'left' }}
                        />
                      )}
                      {/* Animated flow for current-to-next */}
                      {isCurrent && steps[idx - 1] && (steps[idx - 1].data as FlowNodeData).status === 'completed' && (
                        <motion.div
                          className="absolute inset-0 h-[2px] bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ transformOrigin: 'left' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Step Pill */}
                  <button
                    onClick={() => onStepClick(idx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onStepContextMenu(e, step.id);
                    }}
                    className={`
                      relative flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl
                      font-medium transition-all duration-400 ease-out
                      border whitespace-nowrap
                      ${isCompleted
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                        : isCurrent
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-lg shadow-amber-500/15 scale-105 lg:scale-110'
                          : 'bg-slate-800/30 text-slate-500 border-slate-700/30 hover:bg-slate-800/50 hover:text-slate-400'
                      }
                    `}
                  >
                    {/* Step icon / indicator */}
                    <div className={`
                      flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-lg shrink-0 transition-all duration-300
                      ${isCompleted
                        ? 'bg-emerald-500/25'
                        : isCurrent
                          ? 'bg-amber-500/25'
                          : 'bg-slate-700/40'
                      }
                    `}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        >
                          <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
                        </motion.div>
                      ) : isCurrent ? (
                        <div className="relative" style={{ color: stepColor }}>
                          <NodeIcon nodeType={stepData.nodeType} className="w-4 h-4 lg:w-5 lg:h-5" />
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                          </span>
                        </div>
                      ) : (
                        <div style={{ color: stepColor + '80' }}>
                          <NodeIcon nodeType={stepData.nodeType} className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </div>
                      )}
                    </div>

                    {/* Step label */}
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[11px] lg:text-[13px] font-semibold leading-tight truncate max-w-[80px] lg:max-w-[120px]">
                        {stepData.label}
                      </span>
                      <span className={`
                        text-[9px] lg:text-[10px] font-medium leading-tight mt-0.5
                        ${isCompleted ? 'text-emerald-400/70' : isCurrent ? 'text-amber-400/70' : 'text-slate-600'}
                      `}>
                        {isCompleted ? 'Done' : isCurrent ? 'Running' : `Step ${idx + 1}`}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Hero Step Card — The center focus element
   ──────────────────────────────────────────── */
function HeroStepCard({
  step,
  stepIndex,
  totalSteps,
  completingStep,
  allNodes,
  onContextMenu,
}: {
  step: { id: string; data: FlowNodeData };
  stepIndex: number;
  totalSteps: number;
  completingStep: boolean;
  allNodes: ReturnType<typeof useAppStore.getState>['nodes'];
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const data = step.data as FlowNodeData;
  const config = NODE_CONFIG[data.nodeType];
  const stepColor = config?.color || data.color;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Floating card with glassmorphism */}
      <motion.div
        layout
        onContextMenu={onContextMenu}
        className={`
          relative rounded-3xl overflow-hidden
          border transition-all duration-700 ease-out
          ${completingStep
            ? 'border-emerald-400/50'
            : 'border-white/[0.08]'
          }
        `}
      >
        {/* Card background — layered gradient, NOT flat dark */}
        <div className={`
          absolute inset-0 transition-all duration-700
          ${completingStep
            ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-teal-950/80'
            : 'bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95'
          }
        `}
        style={{ backdropFilter: 'blur(40px)' }}
        />

        {/* Ambient glow behind card */}
        <div
          className="absolute -inset-4 rounded-3xl blur-3xl opacity-20 transition-opacity duration-700"
          style={{ backgroundColor: completingStep ? '#10b981' : stepColor }}
        />

        {/* Subtle animated border gradient */}
        {!completingStep && (
          <div className="absolute inset-0 rounded-3xl opacity-30"
            style={{
              background: `linear-gradient(135deg, ${stepColor}15, transparent 40%, transparent 60%, ${stepColor}10)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 px-8 py-10 md:px-14 md:py-14 lg:px-20 lg:py-16">

          {/* Top row: Step counter + Status */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="text-emerald-400 font-bold">{stepIndex + 1}</span>
                <span className="text-slate-600">/</span>
                <span>{totalSteps}</span>
              </span>
              {data.isRequired && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold uppercase tracking-wider">
                  Required
                </span>
              )}
            </div>

            {/* Running indicator */}
            {data.status === 'active' && !completingStep && (
              <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                Currently Running
              </span>
            )}

            {/* Completing indicator */}
            {completingStep && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed!
              </motion.span>
            )}
          </div>

          {/* Main content area — icon + text */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">

            {/* Icon with glow — large, dominant */}
            <motion.div
              className="relative shrink-0"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Outer glow ring */}
              <div
                className="absolute -inset-3 rounded-3xl blur-2xl opacity-25"
                style={{ backgroundColor: stepColor }}
              />
              {/* Inner glow ring */}
              <div
                className="absolute -inset-1 rounded-2xl opacity-15"
                style={{ backgroundColor: stepColor }}
              />
              {/* Icon container */}
              <div
                className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl flex items-center justify-center border border-white/[0.08]"
                style={{
                  background: `linear-gradient(135deg, ${stepColor}12, ${stepColor}06)`,
                  color: stepColor,
                }}
              >
                <NodeIcon nodeType={data.nodeType} className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" />
              </div>
            </motion.div>

            {/* Text content */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              {/* Title — large, high contrast */}
              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]"
              >
                {data.label}
              </motion.h2>

              {/* Description — clear, readable */}
              {data.description && (
                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mt-4 text-base md:text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl"
                >
                  {data.description}
                </motion.p>
              )}

              {/* Presenter Notes */}
              {data.notes && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="mt-6 p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] max-w-xl"
                >
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">
                    Presenter Notes
                  </p>
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                    {data.notes}
                  </p>
                </motion.div>
              )}

              {/* Dependency chain visualization */}
              {data.dependencies.length > 0 && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-5 flex items-center gap-2 flex-wrap"
                >
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
                    Depends on:
                  </span>
                  {data.dependencies.map((depId) => {
                    const depNode = allNodes.find(n => n.id === depId);
                    const depData = depNode?.data as FlowNodeData | undefined;
                    if (!depData) return null;
                    const isDepCompleted = depData.status === 'completed';
                    return (
                      <span
                        key={depId}
                        className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border
                          ${isDepCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }
                        `}
                      >
                        {isDepCompleted ? <CheckCircle2 className="w-3 h-3" /> : null}
                        {depData.label}
                      </span>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Completion checkmark burst overlay */}
        <AnimatePresence>
          {completingStep && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/15 flex items-center justify-center border-2 border-emerald-400/30 backdrop-blur-sm"
              >
                <CheckCircle2 className="w-14 h-14 md:w-16 md:h-16 text-emerald-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Present Mode Component
   ──────────────────────────────────────────── */
export function PresentMode() {
  const setAppMode = useAppStore((s) => s.setAppMode);
  const nodes = useAppStore((s) => s.nodes);
  const currentStepIndex = useAppStore((s) => s.currentStepIndex);
  const setCurrentStepIndex = useAppStore((s) => s.setCurrentStepIndex);
  const nextStep = useAppStore((s) => s.nextStep);
  const prevStep = useAppStore((s) => s.prevStep);
  const markCurrentComplete = useAppStore((s) => s.markCurrentComplete);
  const getOrderedSteps = useAppStore((s) => s.getOrderedSteps);

  const [completingStep, setCompletingStep] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Context menu for presentation mode
  const presentContextMenu = useContextMenu();

  const steps = getOrderedSteps();
  const currentStep = steps[currentStepIndex];
  const completedCount = nodes.filter(
    (n) => (n.data as FlowNodeData).status === 'completed'
  ).length;
  const totalCount = steps.length;

  const handleMarkComplete = useCallback(() => {
    if (completingStep) return;
    setCompletingStep(true);
    setTimeout(() => {
      markCurrentComplete();
      setTimeout(() => {
        const state = useAppStore.getState();
        const currentSteps = state.getOrderedSteps();
        const currentIdx = state.currentStepIndex;
        if (currentIdx < currentSteps.length - 1) {
          const nextIdx = currentIdx + 1;
          state.setCurrentStepIndex(nextIdx);
          const nextStepData = currentSteps[nextIdx];
          if (nextStepData && (nextStepData.data as FlowNodeData).status === 'pending') {
            state.updateNodeStatus(nextStepData.id, 'active');
          }
        }
        setCompletingStep(false);
      }, 600);
    }, 700);
  }, [completingStep, markCurrentComplete]);

  const handleNext = useCallback(() => {
    if (!completingStep) nextStep();
  }, [completingStep, nextStep]);

  const handlePrev = useCallback(() => {
    if (!completingStep) prevStep();
  }, [completingStep, prevStep]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleMarkComplete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAppMode('build');
      } else if (e.key === '?') {
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, setAppMode, handleMarkComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentStep) return null;

  const currentData = currentStep.data as FlowNodeData;
  const isLastStep = currentStepIndex >= totalCount - 1;
  const allCompleted = completedCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">

      {/* ── Background — layered, NOT flat black ── */}
      <div className="absolute inset-0 bg-[#0c1222]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Central ambient spotlight — follows current step color */}
      <motion.div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        animate={{
          backgroundColor: completingStep ? 'rgba(16, 185, 129, 0.07)' : `${currentData.color}0F`,
        }}
        transition={{ duration: 1 }}
      />

      {/* Top-left warm glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[400px] rounded-full blur-[100px] bg-amber-500/[0.03] pointer-events-none" />

      {/* Bottom-right cool glow */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full blur-[100px] bg-cyan-500/[0.03] pointer-events-none" />

      {/* ── Top Progress Tracker ── */}
      <div className="relative z-10 shrink-0">
        <ProgressTracker
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={setCurrentStepIndex}
          onStepContextMenu={presentContextMenu.open}
          completingStep={completingStep}
        />
      </div>

      {/* ── Center: Hero Step Card ── */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-12 py-6 relative z-10 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{
              opacity: completingStep ? 0.3 : 1,
              x: 0,
              scale: completingStep ? 0.97 : 1,
            }}
            exit={{ opacity: 0, x: -60, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full"
          >
            <HeroStepCard
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={totalCount}
              completingStep={completingStep}
              allNodes={nodes}
              onContextMenu={(e) => {
                e.preventDefault();
                presentContextMenu.open(e, currentStep.id);
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="relative z-10 shrink-0">
        <div className="border-t border-white/[0.06] bg-slate-950/70 backdrop-blur-2xl">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-5">

            {/* Main control row */}
            <div className="flex items-center justify-between gap-3 md:gap-6">
              {/* Previous */}
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStepIndex === 0 || completingStep}
                className="border-white/[0.1] text-slate-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] min-w-[90px] md:min-w-[120px] bg-transparent transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              {/* Center: Mark Complete */}
              <div className="flex flex-col items-center gap-1.5">
                {allCompleted ? (
                  <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    All Steps Completed!
                  </div>
                ) : (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={completingStep || currentData.status === 'completed'}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 md:px-10 py-2.5 shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:shadow-emerald-500/30 hover:scale-[1.03] disabled:hover:scale-100 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {completingStep ? 'Completing...' : isLastStep ? 'Finish' : 'Mark Complete'}
                  </Button>
                )}
                <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                  Step {currentStepIndex + 1} of {totalCount}
                </span>
              </div>

              {/* Next */}
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentStepIndex >= totalCount - 1 || completingStep}
                className="border-white/[0.1] text-slate-400 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] min-w-[90px] md:min-w-[120px] bg-transparent transition-all duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Footer info row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium tabular-nums">{formatTime(elapsedTime)}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {completedCount} of {totalCount} completed
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowShortcuts((s) => !s)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Shortcuts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyboard Shortcuts Overlay ── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-white/[0.1] rounded-2xl p-6 shadow-2xl z-30 backdrop-blur-xl"
          >
            <h4 className="text-xs font-semibold text-slate-300 mb-4 uppercase tracking-wider">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
              {[
                ['→', 'Next step'],
                ['←', 'Previous step'],
                ['Space', 'Mark complete'],
                ['Esc', 'Exit present'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <kbd className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 border border-white/[0.1] font-mono text-[11px] min-w-[36px] text-center">
                    {key}
                  </kbd>
                  <span className="text-slate-400">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Close Button ── */}
      <button
        onClick={() => setAppMode('build')}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.1] transition-all duration-200 z-20 border border-white/[0.08]"
        title="Exit presentation (Esc)"
      >
        <X className="w-4.5 h-4.5" />
      </button>

      {/* ── Context Menu (Presentation Mode) ── */}
      <NodeContextMenu
        isOpen={presentContextMenu.isOpen}
        x={presentContextMenu.x}
        y={presentContextMenu.y}
        nodeId={presentContextMenu.nodeId}
        menuRef={presentContextMenu.menuRef}
        onClose={presentContextMenu.close}
      />
    </div>
  );
}

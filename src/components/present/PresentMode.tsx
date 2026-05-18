'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { FlowNodeData } from '@/lib/types';
import { NODE_CONFIG } from '@/components/flow/NodeConfig';
import { NodeIcon } from '@/components/flow/NodeIcon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Keyboard,
} from 'lucide-react';

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

  const steps = getOrderedSteps();
  const currentStep = steps[currentStepIndex];
  const completedCount = nodes.filter(
    (n) => (n.data as FlowNodeData).status === 'completed'
  ).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
      }, 500);
    }, 600);
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
  const config = NODE_CONFIG[currentData.nodeType];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-emerald-900/10 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[300px] rounded-full bg-amber-900/8 blur-3xl" />
      </div>

      {/* Top Progress Bar */}
      <div className="relative z-10">
        <div className="h-1 bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Completed steps strip */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-gray-900/90 backdrop-blur-xl overflow-x-auto">
          {steps.map((step, idx) => {
            const stepData = step.data as FlowNodeData;
            const isCompleted = stepData.status === 'completed';
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-300 whitespace-nowrap
                  ${isCompleted
                    ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-800/50'
                    : isCurrent
                      ? 'bg-amber-900/60 text-amber-400 border border-amber-700/50'
                      : 'bg-gray-800/40 text-gray-600 border border-gray-700/30 hover:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : isCurrent ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-600" />
                )}
                <span className="hidden md:inline">{stepData.label}</span>
                <span className="md:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Current Step */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{
              opacity: completingStep ? 0 : 1,
              x: completingStep ? -100 : 0,
              scale: completingStep ? 0.85 : 1,
            }}
            exit={{ opacity: 0, x: -100, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="w-full max-w-2xl"
          >
            <div
              className={`
                relative rounded-2xl p-10 md:p-14 border-2 transition-all duration-500
                ${
                  completingStep
                    ? 'border-emerald-400/80 bg-gradient-to-br from-emerald-950/80 to-teal-950/60 shadow-2xl shadow-emerald-500/20'
                    : 'border-gray-700/80 bg-gray-900/90 shadow-2xl shadow-amber-500/5'
                }
                backdrop-blur-2xl
              `}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 left-8 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30">
                Step {currentStepIndex + 1} of {totalCount}
              </div>

              {/* Completing animation overlay */}
              {completingStep && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute top-8 right-8"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col items-center text-center gap-5">
                {/* Icon with background glow */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                    style={{ backgroundColor: config.color }}
                  />
                  <div
                    className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}18`, color: config.color }}
                  >
                    <NodeIcon nodeType={currentData.nodeType} className="w-10 h-10 md:w-12 md:h-12" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl md:text-4xl font-bold text-white tracking-tight"
                >
                  {currentData.label}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed"
                >
                  {currentData.description}
                </motion.p>

                {/* Notes */}
                {currentData.notes && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mt-1 p-5 rounded-xl bg-gray-800/60 border border-gray-700/60 max-w-lg"
                  >
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-semibold">Presenter Notes</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{currentData.notes}</p>
                  </motion.div>
                )}

                {/* Status badges */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2.5 mt-1"
                >
                  {currentData.status === 'active' && (
                    <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/50 text-amber-400 text-sm font-medium border border-amber-800/40">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                      </span>
                      In Progress
                    </span>
                  )}
                  {currentData.isRequired && (
                    <span className="px-3 py-1.5 rounded-full bg-rose-900/50 text-rose-400 text-sm font-medium border border-rose-800/40">
                      Required Step
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 px-6 py-5 bg-gray-900/95 backdrop-blur-2xl border-t border-gray-800/80">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {/* Previous */}
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStepIndex === 0 || completingStep}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {/* Center: Mark Complete + Counter */}
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleMarkComplete}
              disabled={completingStep || currentData.status === 'completed'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:shadow-emerald-600/40 hover:scale-105 disabled:hover:scale-100"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {completingStep ? 'Completing...' : 'Mark Complete'}
            </Button>
            <span className="text-xs text-gray-500 font-medium">
              Step {currentStepIndex + 1} of {totalCount}
            </span>
          </div>

          {/* Next */}
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentStepIndex >= totalCount - 1 || completingStep}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white min-w-[100px]"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Footer info */}
        <div className="max-w-2xl mx-auto flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{formatTime(elapsedTime)}</span>
          </div>
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="text-xs">Shortcuts</span>
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-2xl z-20"
          >
            <h4 className="text-xs font-semibold text-gray-300 mb-3">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600 font-mono">→</kbd>
                <span className="text-gray-400">Next step</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600 font-mono">←</kbd>
                <span className="text-gray-400">Previous step</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600 font-mono">Space</kbd>
                <span className="text-gray-400">Mark complete</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600 font-mono">Esc</kbd>
                <span className="text-gray-400">Exit present</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <button
        onClick={() => setAppMode('build')}
        className="absolute top-4 right-4 p-2.5 rounded-lg bg-gray-800/90 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-20 border border-gray-700/50"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

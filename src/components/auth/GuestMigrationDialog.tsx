'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CloudUpload, ArrowRight, Check, AlertCircle, Workflow, Loader2 } from 'lucide-react';
import { migrateLocalFlowsToCloud, getAllFlows, FlowData } from '@/lib/hybridStorage';

interface GuestMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrationComplete: () => void;
}

export function GuestMigrationDialog({
  open,
  onOpenChange,
  onMigrationComplete,
}: GuestMigrationDialogProps) {
  const [localFlows, setLocalFlows] = useState<FlowData[]>([]);
  const [step, setStep] = useState<'review' | 'migrating' | 'done' | 'error'>('review');
  const [result, setResult] = useState<{ migrated: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (open) {
      // Load local flows for review
      getAllFlows().then((flows) => {
        setLocalFlows(flows.filter((f) => f.isLocal));
      });
      setStep('review');
      setResult(null);
    }
  }, [open]);

  const handleImport = async () => {
    setStep('migrating');
    try {
      const migrationResult = await migrateLocalFlowsToCloud();
      setResult(migrationResult);
      if (migrationResult.failed === 0) {
        setStep('done');
      } else {
        setStep('error');
      }
    } catch {
      setResult({ migrated: 0, failed: localFlows.length, errors: ['Migration failed unexpectedly'] });
      setStep('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-emerald-500" />
            Import Guest Flows
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            You have local flows from your guest session. Import them to your account to sync across devices.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Flow list preview */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {localFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {flow.title}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {flow.node_count} node{flow.node_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {localFlows.length} flow{localFlows.length !== 1 ? 's' : ''} will be imported to your account
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl text-sm"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleImport}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm"
                >
                  <CloudUpload className="w-4 h-4 mr-1.5" />
                  Import All
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'migrating' && (
            <motion.div
              key="migrating"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-8 flex flex-col items-center gap-3"
            >
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Importing your flows...</p>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-4 flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {result?.migrated} flow{result?.migrated !== 1 ? 's' : ''} imported successfully!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your flows are now synced across all your devices.
              </p>
              <Button
                onClick={() => {
                  onMigrationComplete();
                  onOpenChange(false);
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-4 flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Partial import
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {result?.migrated} of {localFlows.length} flows imported. {result?.failed} failed.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-sm"
                >
                  Close
                </Button>
                <Button
                  onClick={handleImport}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm"
                >
                  Retry Failed
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

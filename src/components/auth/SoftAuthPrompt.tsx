'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Cloud, RefreshCw, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

interface SoftAuthPromptProps {
  variant?: 'save' | 'sync' | 'backup' | 'generic';
  className?: string;
}

const PROMPT_CONFIG = {
  save: {
    icon: Cloud,
    title: 'Save permanently with an account',
    description: 'Your local flows are saved in this browser. Create an account to save them permanently and access from anywhere.',
    cta: 'Create Free Account',
  },
  sync: {
    icon: RefreshCw,
    title: 'Sync your flows across devices',
    description: 'Sign in to access your workflows from any device. Changes sync automatically.',
    cta: 'Sign in to Sync',
  },
  backup: {
    icon: Shield,
    title: 'Backup your workflows',
    description: 'Don\'t lose your work. Create an account to back up your flows to the cloud automatically.',
    cta: 'Back Up Now',
  },
  generic: {
    icon: Cloud,
    title: 'Get the full experience',
    description: 'Sign in to unlock cloud sync, collaboration, and access from any device.',
    cta: 'Sign Up Free',
  },
};

export function SoftAuthPrompt({ variant = 'generic', className = '' }: SoftAuthPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const { isGuest } = useAuth();
  const router = useRouter();

  if (!isGuest || dismissed) return null;

  const config = PROMPT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`relative rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-sm p-4 ${className}`}
      >
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              {config.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {config.description}
            </p>
            <Button
              onClick={() => router.push('/signup')}
              size="sm"
              className="mt-3 h-8 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20"
            >
              {config.cta}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact inline prompt for the TopBar
export function SoftAuthBadge() {
  const { isGuest } = useAuth();
  const router = useRouter();

  if (!isGuest) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => router.push('/signup')}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
    >
      <Cloud className="w-3 h-3" />
      Save to cloud
    </motion.button>
  );
}

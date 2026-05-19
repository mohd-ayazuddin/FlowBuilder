'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  getAllFlows,
  createFlow,
  deleteFlowData,
  duplicateFlowData,
  renameFlow,
  toggleFlowPin,
  toggleFlowFavorite,
  getStorageUsage,
  hasLocalFlowsToMigrate,
  FlowData,
} from '@/lib/hybridStorage';
import { DatabaseFlow } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Workflow,
  Plus,
  Search,
  SortAsc,
  Grid3X3,
  List,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Star,
  Pin,
  Clock,
  GitBranch,
  Sun,
  Moon,
  LogOut,
  FolderOpen,
  ArrowUpDown,
  LayoutGrid,
  User,
  HardDrive,
  Cloud,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { GuestMigrationDialog } from '@/components/auth/GuestMigrationDialog';
import { SoftAuthPrompt } from '@/components/auth/SoftAuthPrompt';

type SortOption = 'updated' | 'created' | 'title' | 'nodes';
type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const { user, signOut, loading: authLoading, isGuest, enterGuestMode } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const resetToEmpty = useAppStore((s) => s.resetToEmpty);

  const [flows, setFlows] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newFlowDialogOpen, setNewFlowDialogOpen] = useState(false);
  const [newFlowTitle, setNewFlowTitle] = useState('');
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ flowCount: number; estimatedSizeKB: number; quotaUsedPercent?: number }>({ flowCount: 0, estimatedSizeKB: 0 });
  const [softPromptVariant, setSoftPromptVariant] = useState<'save' | 'sync' | 'backup'>('save');

  // Fetch flows (hybrid - local for guests, cloud for logged in)
  const fetchFlows = useCallback(async () => {
    try {
      const allFlows = await getAllFlows();
      setFlows(allFlows);
    } catch (err) {
      console.error('Failed to fetch flows:', err);
      setFlows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Allow both guests and logged-in users
    if (!authLoading) {
      // Auto-enter guest mode if not logged in
      if (!user && !isGuest) {
        enterGuestMode();
      }
      fetchFlows();
    }
  }, [authLoading, user, fetchFlows, isGuest, enterGuestMode]);

  // Storage usage for guests
  useEffect(() => {
    if (isGuest || !user) {
      getStorageUsage().then(setStorageUsage);
    }
  }, [isGuest, user, flows]);

  // Check for migration after login
  useEffect(() => {
    if (user && !authLoading && !isGuest) {
      hasLocalFlowsToMigrate().then((hasFlows) => {
        if (hasFlows) {
          setMigrationDialogOpen(true);
        }
      });
    }
  }, [user, authLoading, isGuest]);

  // Rotate soft prompt variant
  useEffect(() => {
    if (!isGuest) return;
    const variants: ('save' | 'sync' | 'backup')[] = ['save', 'sync', 'backup'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % variants.length;
      setSoftPromptVariant(variants[idx]);
    }, 30000);
    return () => clearInterval(interval);
  }, [isGuest]);

  // Handle create new flow
  const handleCreateNew = async () => {
    const title = newFlowTitle.trim() || 'Untitled Flow';
    try {
      const flow = await createFlow(title);
      resetToEmpty();
      router.push(`/flow/${flow.id}`);
    } catch (err) {
      console.error('Create flow error:', err);
    }
    setNewFlowDialogOpen(false);
    setNewFlowTitle('');
  };

  // Handle open flow
  const handleOpenFlow = (flowId: string) => {
    router.push(`/flow/${flowId}`);
  };

  // Handle delete flow
  const handleDelete = async () => {
    if (!selectedFlow) return;
    await deleteFlowData(selectedFlow.id);
    setFlows((prev) => prev.filter((f) => f.id !== selectedFlow.id));
    setDeleteDialogOpen(false);
    setSelectedFlow(null);
  };

  // Handle rename flow
  const handleRename = async () => {
    if (!selectedFlow || !renameValue.trim()) return;
    await renameFlow(selectedFlow.id, renameValue.trim());
    setFlows((prev) =>
      prev.map((f) => (f.id === selectedFlow.id ? { ...f, title: renameValue.trim() } : f))
    );
    setRenameDialogOpen(false);
    setSelectedFlow(null);
    setRenameValue('');
  };

  // Handle duplicate flow
  const handleDuplicate = async (flow: FlowData) => {
    const duplicated = await duplicateFlowData(flow.id);
    if (duplicated) {
      setFlows((prev) => [duplicated, ...prev]);
    }
  };

  // Handle toggle pin
  const handleTogglePin = async (flow: FlowData) => {
    await toggleFlowPin(flow.id, flow.is_pinned);
    setFlows((prev) =>
      prev.map((f) => (f.id === flow.id ? { ...f, is_pinned: !f.is_pinned } : f))
    );
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (flow: FlowData) => {
    await toggleFlowFavorite(flow.id, flow.is_favorite);
    setFlows((prev) =>
      prev.map((f) => (f.id === flow.id ? { ...f, is_favorite: !f.is_favorite } : f))
    );
  };

  // Filtered and sorted flows
  const filteredFlows = flows
    .filter((f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      switch (sort) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'nodes':
          return b.node_count - a.node_count;
        default:
          return 0;
      }
    });

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                <Workflow className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">FlowBuilder</span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Guest Mode Badge */}
              {isGuest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40"
                >
                  <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Guest</span>
                </motion.div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 h-9 pl-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[11px] font-bold">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate hidden sm:inline">
                        {user.user_metadata?.name || user.email?.split('@')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-xs text-gray-500" disabled>
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-xs text-rose-600 dark:text-rose-400">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/login')}
                    className="h-8 text-xs text-gray-600 dark:text-gray-400"
                  >
                    Sign in
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => router.push('/signup')}
                    className="h-8 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl"
                  >
                    Sign up free
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {isGuest ? (
                <>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Guest Flows
                </>
              ) : (
                <>
                  <Cloud className="w-5 h-5 text-emerald-500" />
                  Your Flows
                </>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isGuest
                ? 'Flows are saved locally in this browser. Sign up to sync across devices.'
                : 'Create, manage, and present interactive demo workflows.'}
            </p>
          </div>
          <Button
            onClick={() => setNewFlowDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:shadow-emerald-500/30 h-10 px-5 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Flow
          </Button>
        </div>

        {/* Guest Mode Info Banner - rotating variant */}
        {isGuest && (
          <SoftAuthPrompt variant={softPromptVariant} className="mb-6" />
        )}

        {/* Storage info for guests */}
        {isGuest && storageUsage.flowCount > 0 && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 dark:text-gray-500">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{storageUsage.flowCount} flow{storageUsage.flowCount !== 1 ? 's' : ''} stored locally</span>
            {storageUsage.estimatedSizeKB > 0 && (
              <span className="text-gray-300 dark:text-gray-600">·</span>
            )}
            {storageUsage.estimatedSizeKB > 0 && (
              <span>{storageUsage.estimatedSizeKB > 1024 ? `${(storageUsage.estimatedSizeKB / 1024).toFixed(1)} MB` : `${storageUsage.estimatedSizeKB} KB`} used</span>
            )}
            {storageUsage.quotaUsedPercent != null && storageUsage.quotaUsedPercent > 70 && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className={storageUsage.quotaUsedPercent > 90 ? 'text-amber-500 font-medium' : 'text-amber-400'}>
                  {storageUsage.quotaUsedPercent}% storage used
                </span>
              </>
            )}
          </div>
        )}

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flows..."
              className="h-9 pl-9 rounded-xl text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                  {sort === 'updated' ? 'Last edited' : sort === 'created' ? 'Created' : sort === 'title' ? 'Name' : 'Nodes'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setSort('updated')} className="text-xs">
                  <Clock className="w-3.5 h-3.5 mr-2" /> Last edited
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('created')} className="text-xs">
                  <FolderOpen className="w-3.5 h-3.5 mr-2" /> Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('title')} className="text-xs">
                  <SortAsc className="w-3.5 h-3.5 mr-2" /> Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort('nodes')} className="text-xs">
                  <GitBranch className="w-3.5 h-3.5 mr-2" /> Node count
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View mode */}
            <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-400'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Flow Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-100 dark:bg-gray-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFlows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mx-auto mb-6">
              <Workflow className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {search ? 'No flows found' : 'No flows yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {search
                ? 'Try a different search term or clear your search.'
                : isGuest
                  ? 'Start building your first flow — no account needed. It\'s saved automatically in your browser.'
                  : 'Create your first flow and start building interactive demo workflows.'}
            </p>
            {!search && (
              <Button
                onClick={() => setNewFlowDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm h-10 px-5 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first flow
              </Button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredFlows.map((flow, idx) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  index={idx}
                  isGuest={isGuest}
                  onOpen={handleOpenFlow}
                  onDuplicate={handleDuplicate}
                  onDelete={(f) => { setSelectedFlow(f); setDeleteDialogOpen(true); }}
                  onRename={(f) => { setSelectedFlow(f); setRenameValue(f.title); setRenameDialogOpen(true); }}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  formatDate={formatDate}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredFlows.map((flow, idx) => (
                <FlowListItem
                  key={flow.id}
                  flow={flow}
                  index={idx}
                  isGuest={isGuest}
                  onOpen={handleOpenFlow}
                  onDuplicate={handleDuplicate}
                  onDelete={(f) => { setSelectedFlow(f); setRenameValue(f.title); setDeleteDialogOpen(true); }}
                  onRename={(f) => { setSelectedFlow(f); setRenameValue(f.title); setRenameDialogOpen(true); }}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  formatDate={formatDate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* New Flow Dialog */}
      <Dialog open={newFlowDialogOpen} onOpenChange={setNewFlowDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              Create New Flow
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Start building a new interactive demo workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFlowTitle}
              onChange={(e) => setNewFlowTitle(e.target.value)}
              placeholder="Enter flow name..."
              className="h-10 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew();
              }}
              autoFocus
            />
            {isGuest && (
              <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                Saved locally in your browser — sign up for cloud sync
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFlowDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCreateNew}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Flow</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete &ldquo;{selectedFlow?.title}&rdquo;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Rename Flow</DialogTitle>
            <DialogDescription>Enter a new name for your flow.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new name..."
              className="h-10 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migration Dialog */}
      <GuestMigrationDialog
        open={migrationDialogOpen}
        onOpenChange={setMigrationDialogOpen}
        onMigrationComplete={() => {
          fetchFlows();
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Flow Card Component (Grid View)
   ──────────────────────────────────────────── */
function FlowCard({
  flow,
  index,
  isGuest,
  onOpen,
  onDuplicate,
  onDelete,
  onRename,
  onTogglePin,
  onToggleFavorite,
  formatDate,
}: {
  flow: FlowData;
  index: number;
  isGuest: boolean;
  onOpen: (id: string) => void;
  onDuplicate: (flow: FlowData) => void;
  onDelete: (flow: FlowData) => void;
  onRename: (flow: FlowData) => void;
  onTogglePin: (flow: FlowData) => void;
  onToggleFavorite: (flow: FlowData) => void;
  formatDate: (date: string) => string;
}) {
  const nodeCount = flow.node_count || (flow.canvas_data?.nodes?.length ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(flow.id)}
    >
      {/* Thumbnail area */}
      <div className="relative h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 overflow-hidden">
        {/* Mini flow preview */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          {nodeCount > 0 ? (
            <div className="flex items-center gap-1">
              {flow.canvas_data?.nodes?.slice(0, 5).map((node: any, i: number) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-md border-2"
                    style={{
                      borderColor: node.data?.color || '#10b981',
                      backgroundColor: `${node.data?.color || '#10b981'}15`,
                    }}
                  />
                  {i < Math.min(nodeCount, 5) - 1 && (
                    <div className="w-3 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  )}
                </div>
              ))}
              {nodeCount > 5 && (
                <span className="text-[10px] text-gray-400 ml-1">+{nodeCount - 5}</span>
              )}
            </div>
          ) : (
            <Workflow className="w-10 h-10 text-gray-200 dark:text-gray-700" />
          )}
        </div>

        {/* Storage badge */}
        {flow.isLocal && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase">
              <HardDrive className="w-2.5 h-2.5" /> Local
            </span>
          </div>
        )}

        {/* Cloud badge for logged-in users */}
        {!flow.isLocal && !isGuest && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
              <Cloud className="w-2.5 h-2.5" /> Cloud
            </span>
          </div>
        )}

        {/* Pin indicator */}
        {flow.is_pinned && (
          <div className={`absolute top-2 ${flow.isLocal ? 'left-16' : 'left-16'}`}>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
              <Pin className="w-2.5 h-2.5" /> Pinned
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(flow); }}
          className="absolute top-2 right-2 p-1 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        >
          <Star
            className={`w-3.5 h-3.5 transition-colors ${
              flow.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-gray-400 hover:text-amber-400'
            }`}
          />
        </button>

        {/* Menu button */}
        <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700"
              >
                <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(flow.id); }} className="text-xs">
                <FolderOpen className="w-4 h-4 mr-2" /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(flow); }} className="text-xs">
                <Pencil className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(flow); }} className="text-xs">
                <Copy className="w-4 h-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(flow); }} className="text-xs">
                <Pin className="w-4 h-4 mr-2" /> {flow.is_pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(flow); }}
                className="text-xs text-rose-600 dark:text-rose-400"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
          {flow.title}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(flow.updated_at)}
          </span>
          {flow.isLocal && (
            <span className="flex items-center gap-0.5 text-blue-400 dark:text-blue-500">
              <HardDrive className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────
   Flow List Item Component (List View)
   ──────────────────────────────────────────── */
function FlowListItem({
  flow,
  index,
  isGuest,
  onOpen,
  onDuplicate,
  onDelete,
  onRename,
  onTogglePin,
  onToggleFavorite,
  formatDate,
}: {
  flow: FlowData;
  index: number;
  isGuest: boolean;
  onOpen: (id: string) => void;
  onDuplicate: (flow: FlowData) => void;
  onDelete: (flow: FlowData) => void;
  onRename: (flow: FlowData) => void;
  onTogglePin: (flow: FlowData) => void;
  onToggleFavorite: (flow: FlowData) => void;
  formatDate: (date: string) => string;
}) {
  const nodeCount = flow.node_count || (flow.canvas_data?.nodes?.length ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={() => onOpen(flow.id)}
      className="group flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail mini */}
      <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {nodeCount > 0 ? (
          <div className="flex items-center gap-0.5 scale-75">
            {flow.canvas_data?.nodes?.slice(0, 3).map((node: any, i: number) => (
              <div key={i} className="flex items-center gap-0.5">
                <div
                  className="w-4 h-4 rounded-sm border"
                  style={{ borderColor: node.data?.color || '#10b981', backgroundColor: `${node.data?.color || '#10b981'}15` }}
                />
                {i < 2 && <div className="w-1.5 h-px bg-gray-300 dark:bg-gray-600" />}
              </div>
            ))}
          </div>
        ) : (
          <Workflow className="w-5 h-5 text-gray-200 dark:text-gray-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {flow.is_pinned && <Pin className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
          {flow.isLocal && <HardDrive className="w-3 h-3 text-blue-400 flex-shrink-0" />}
          {!flow.isLocal && !isGuest && <Cloud className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {flow.title}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          <span>{nodeCount} nodes</span>
          <span>{formatDate(flow.updated_at)}</span>
          {flow.isLocal && <span className="text-blue-400">Local</span>}
          {!flow.isLocal && !isGuest && <span className="text-emerald-400">Cloud</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(flow); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Star
            className={`w-4 h-4 ${
              flow.is_favorite ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'
            }`}
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(flow); }} className="text-xs">
              <Pencil className="w-4 h-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(flow); }} className="text-xs">
              <Copy className="w-4 h-4 mr-2" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(flow); }} className="text-xs">
              <Pin className="w-4 h-4 mr-2" /> {flow.is_pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(flow); }}
              className="text-xs text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

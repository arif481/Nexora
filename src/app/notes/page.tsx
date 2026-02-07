'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  FileText,
  Folder,
  Star,
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Grid3X3,
  List,
  Tag,
  Clock,
  Loader2,
  Brain,
  Sparkles,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate, formatRelativeDate } from '@/lib/utils';
import { useNotes, useNotesByCategory } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import type { Note } from '@/types';

const categoryOptions = [
  { label: 'Personal', value: 'personal', color: 'neon-cyan' },
  { label: 'Work', value: 'work', color: 'neon-purple' },
  { label: 'Ideas', value: 'ideas', color: 'neon-orange' },
  { label: 'Learning', value: 'learning', color: 'neon-green' },
  { label: 'Other', value: 'other', color: 'neon-pink' },
];

export default function NotesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote, togglePin, toggleFavorite, archiveNote } = useNotes();
  const notesByCategory = useNotesByCategory(notes);
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { openAIPanel } = useUIStore();

  // Form state for new note
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'personal',
    tags: '',
  });

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => !note.isArchived);
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(note => note.category === filterCategory);
    }
    
    // Sort: pinned first, then by updated date
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return result;
  }, [notes, searchQuery, filterCategory]);

  // Get pinned notes
  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  // Create new note
  const handleCreateNote = async () => {
    if (!newNote.title.trim()) return;
    
    setIsSaving(true);
    try {
      await createNote({
        title: newNote.title,
        content: newNote.content,
        category: newNote.category as any,
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      
      setIsCreateModalOpen(false);
      setNewNote({
        title: '',
        content: '',
        category: 'personal',
        tags: '',
      });
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    
    setIsSaving(true);
    try {
      await deleteNote(selectedNote.id);
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedNote(null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle pin toggle
  const handleTogglePin = async (note: Note) => {
    try {
      await togglePin(note.id, !note.isPinned);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (note: Note) => {
    try {
      await toggleFavorite(note.id, !note.isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <PageContainer title="Notes" subtitle="Capture and organize your thoughts">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400">Loading notes...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Notes" subtitle="Capture and organize your thoughts">
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="Sign in to take notes"
            description="Create an account to start organizing your thoughts"
            action={
              <Button variant="glow" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            }
          />
        </PageContainer>
      </MainLayout>
    );
  }

  const NoteCard = memo(({ note }: { note: Note }) => {
    const categoryColor = categoryOptions.find(c => c.value === note.category)?.color || 'neon-cyan';
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'group cursor-pointer rounded-xl transition-all duration-200',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-neon-cyan/30',
          viewMode === 'grid' ? 'p-4' : 'p-3'
        )}
        onClick={() => {
          setSelectedNote(note);
          setIsViewModalOpen(true);
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="w-3 h-3 text-neon-orange" />}
            {note.isFavorite && <Star className="w-3 h-3 text-neon-purple fill-neon-purple" />}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePin(note);
            }}
            className="p-1 rounded-lg hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-4 h-4 text-dark-400" />
          </button>
        </div>

        <h3 className="font-medium text-white mb-2 line-clamp-1">{note.title}</h3>
        
        {note.content && (
          <p className={cn(
            'text-sm text-dark-400 mb-3',
            viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-1'
          )}>
            {note.content}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="default" size="sm" className={`text-${categoryColor}`}>
            {note.category}
          </Badge>
          <span className="text-xs text-dark-500">
            {formatRelativeDate(new Date(note.updatedAt))}
          </span>
        </div>
      </motion.div>
    );
  });
  
  NoteCard.displayName = 'NoteCard';

  return (
    <MainLayout>
      <PageContainer title="Notes" subtitle="Capture and organize your thoughts">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-all',
                viewMode === 'list' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Note
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Notes Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {filteredNotes.length > 0 ? (
              <div className="space-y-6">
                {/* Pinned Notes */}
                {pinnedNotes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-dark-400 mb-3 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      Pinned
                    </h3>
                    <div className={cn(
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-2'
                    )}>
                      <AnimatePresence>
                        {pinnedNotes.map(note => (
                          <NoteCard key={note.id} note={note} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Other Notes */}
                {unpinnedNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <h3 className="text-sm font-medium text-dark-400 mb-3">Other Notes</h3>
                    )}
                    <div className={cn(
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-2'
                    )}>
                      <AnimatePresence>
                        {unpinnedNotes.map(note => (
                          <NoteCard key={note.id} note={note} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            ) : notes.length > 0 ? (
              <EmptyState
                icon={<Search className="w-12 h-12" />}
                title="No notes found"
                description="Try adjusting your search or filters"
              />
            ) : (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No notes yet"
                description="Start capturing your thoughts and ideas"
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Note
                  </Button>
                }
              />
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Stats */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Total Notes</span>
                  <span className="text-sm font-medium text-white">{notes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Pinned</span>
                  <span className="text-sm font-medium text-white">{notes.filter(n => n.isPinned).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Favorites</span>
                  <span className="text-sm font-medium text-white">{notes.filter(n => n.isFavorite).length}</span>
                </div>
              </div>
            </Card>

            {/* Categories */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {Object.entries(notesByCategory).map(([category, categoryNotes]) => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-lg transition-all',
                      filterCategory === category
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'hover:bg-dark-800 text-dark-400'
                    )}
                  >
                    <span className="text-sm capitalize">{category}</span>
                    <Badge variant="default" size="sm">{categoryNotes.length}</Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* AI Help */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
                <h3 className="font-medium text-white">AI Assistant</h3>
              </div>
              <p className="text-sm text-dark-400 mb-3">
                Get help organizing, summarizing, or expanding your notes.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={openAIPanel}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Ask AI
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Create Note Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Note"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Content</label>
              <textarea
                placeholder="Write your note..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-neon-cyan outline-none resize-none"
                rows={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setNewNote(prev => ({ ...prev, category: value }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all',
                      newNote.category === value
                        ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                        : 'bg-dark-800 border border-dark-700 text-dark-400 hover:border-dark-500'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Tags (comma separated)"
              placeholder="meeting, ideas, project"
              value={newNote.tags}
              onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={handleCreateNote}
                disabled={!newNote.title.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Note'
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Note Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedNote(null);
          }}
          title={selectedNote?.title || 'Note'}
          size="lg"
        >
          {selectedNote && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="default">{selectedNote.category}</Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(selectedNote)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      selectedNote.isFavorite
                        ? 'bg-neon-purple/20 text-neon-purple'
                        : 'bg-dark-800 text-dark-400 hover:text-white'
                    )}
                  >
                    <Star className={cn('w-4 h-4', selectedNote.isFavorite && 'fill-current')} />
                  </button>
                  <button
                    onClick={() => handleTogglePin(selectedNote)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      selectedNote.isPinned
                        ? 'bg-neon-orange/20 text-neon-orange'
                        : 'bg-dark-800 text-dark-400 hover:text-white'
                    )}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-dark-800/50 min-h-[200px]">
                <p className="text-white whitespace-pre-wrap">{selectedNote.content || 'No content'}</p>
              </div>

              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-dark-500">
                <span>Created: {formatDate(new Date(selectedNote.createdAt))}</span>
                <span>Updated: {formatRelativeDate(new Date(selectedNote.updatedAt))}</span>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedNote(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedNote(null);
          }}
          title="Delete Note"
        >
          <div className="space-y-4">
            <p className="text-dark-300">
              Are you sure you want to delete "{selectedNote?.title}"?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedNote(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                onClick={handleDeleteNote}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

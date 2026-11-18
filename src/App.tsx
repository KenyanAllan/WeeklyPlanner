import React, { useRef, useEffect, useState } from 'react';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/Header';
import { WeekGrid } from './components/WeekGrid';
import { EventModal } from './components/EventModal';
import { StatsModal } from './components/StatsModal';
import { MultiSelectActionBar } from './components/MultiSelectActionBar';

const MainLayout: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const {
    openCreateModal,
    toggleTheme,
    selectedEventIds,
    clearSelection,
    batchDeleteSelected,
  } = useSchedule();

  const handleJumpToHour = (hour: number) => {
    if (scrollContainerRef.current) {
      const targetTop = hour * 56;
      scrollContainerRef.current.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (selectedEventIds.length > 0) {
          e.preventDefault();
          clearSelection();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEventIds.length > 0) {
          e.preventDefault();
          if (
            confirm(
              `Delete ${selectedEventIds.length} selected ${
                selectedEventIds.length === 1 ? 'block' : 'blocks'
              }?`
            )
          ) {
            batchDeleteSelected();
          }
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreateModal();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openCreateModal,
    toggleTheme,
    selectedEventIds,
    clearSelection,
    batchDeleteSelected,
  ]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header Navigation */}
      <Header
        onJumpToHour={handleJumpToHour}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main 24-Hour Scrollable Week Grid Area */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto"
      >
        <WeekGrid scrollContainerRef={scrollContainerRef} />
      </main>

      {/* Event Create / Edit Dialog */}
      <EventModal />

      {/* Multi-Select Floating Action Bar */}
      <MultiSelectActionBar />

      {/* Weekly Stats Analytics Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Footer helper info */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span>💡 <strong>Tip:</strong> Click & drag to draw</span>
          <span className="hidden sm:inline">•</span>
          <span><strong>Shift + Click</strong> to select multiple & move together</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Drag top/bottom edges to resize</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <kbd className="rounded border border-slate-300 bg-slate-100 px-1 py-0.5 text-[10px] font-semibold dark:border-slate-700 dark:bg-slate-800">
            N
          </kbd>
          <span>New</span>
          <kbd className="ml-2 rounded border border-slate-300 bg-slate-100 px-1 py-0.5 text-[10px] font-semibold dark:border-slate-700 dark:bg-slate-800">
            D
          </kbd>
          <span>Dark Mode</span>
          <kbd className="ml-2 rounded border border-slate-300 bg-slate-100 px-1 py-0.5 text-[10px] font-semibold dark:border-slate-700 dark:bg-slate-800">
            Esc
          </kbd>
          <span>Deselect</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ScheduleProvider>
      <MainLayout />
    </ScheduleProvider>
  );
}

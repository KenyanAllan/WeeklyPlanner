import React, { useState, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  CalendarRange,
  ChevronDown,
  Plus,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Pencil,
  Trash2,
  Check,
  Printer,
  PieChart,
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

interface HeaderProps {
  onJumpToHour: (hour: number) => void;
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onJumpToHour, onOpenStats }) => {
  const {
    schedules,
    activeSchedule,
    theme,
    toggleTheme,
    switchSchedule,
    createSchedule,
    duplicateSchedule,
    renameSchedule,
    deleteSchedule,
    resetToStarter,
    exportActiveSchedule,
    importScheduleFromJson,
    openCreateModal,
  } = useSchedule();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [newScheduleName, setNewScheduleName] = useState('');
  const [showNewScheduleInput, setShowNewScheduleInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalWeeklyHours = useMemo(() => {
    const mins = activeSchedule.events.reduce((sum, e) => sum + e.durationMinutes, 0);
    return (mins / 60).toFixed(1).replace(/\.0$/, '');
  }, [activeSchedule.events]);

  const handleStartRename = () => {
    setRenameValue(activeSchedule.name);
    setIsRenaming(true);
    setDropdownOpen(false);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim()) {
      renameSchedule(activeSchedule.id, renameValue);
    }
    setIsRenaming(false);
  };

  const handleCreateNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScheduleName.trim()) {
      createSchedule(newScheduleName);
      setNewScheduleName('');
      setShowNewScheduleInput(false);
      setDropdownOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importScheduleFromJson(content);
        if (!success) {
          alert('Invalid schedule JSON file format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-xs backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      {/* Brand & Schedule Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Weekly Routine
            </h1>
          </div>
        </div>

        {/* Schedule Selector */}
        <div className="relative">
          {isRenaming ? (
            <form onSubmit={handleSaveRename} className="flex items-center gap-1.5">
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                autoFocus
                className="h-8 rounded-lg border border-indigo-500 bg-white px-2.5 text-xs font-semibold text-slate-900 shadow-xs outline-none dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
            >
              <span className="max-w-[140px] truncate font-semibold sm:max-w-[200px]">
                {activeSchedule.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
          )}

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setDropdownOpen(false);
                  setShowNewScheduleInput(false);
                }}
              />
              <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-700 dark:bg-slate-850">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Your Schedules
                </div>

                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {schedules.map(sch => (
                    <button
                      key={sch.id}
                      onClick={() => {
                        switchSchedule(sch.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                        sch.id === activeSchedule.id
                          ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{sch.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {sch.events.length} blocks
                      </span>
                    </button>
                  ))}
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-750" />

                {showNewScheduleInput ? (
                  <form onSubmit={handleCreateNewSchedule} className="p-1">
                    <input
                      type="text"
                      placeholder="Schedule name..."
                      value={newScheduleName}
                      onChange={e => setNewScheduleName(e.target.value)}
                      autoFocus
                      className="w-full rounded-md border border-indigo-500 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                    />
                    <div className="mt-1.5 flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setShowNewScheduleInput(false)}
                        className="rounded px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded bg-indigo-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-indigo-700"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                    <button
                      onClick={() => setShowNewScheduleInput(true)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-500" />
                      <span>New Schedule</span>
                    </button>
                    <button
                      onClick={handleStartRename}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                      <span>Rename Current</span>
                    </button>
                    <button
                      onClick={() => {
                        duplicateSchedule(activeSchedule.id);
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Duplicate Schedule</span>
                    </button>
                    {schedules.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${activeSchedule.name}"?`)) {
                            deleteSchedule(activeSchedule.id);
                            setDropdownOpen(false);
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Current</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Total Weekly Hours Badge */}
        <button
          onClick={onOpenStats}
          className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 sm:flex"
          title="Click to view weekly breakdown & stats"
        >
          <PieChart className="h-3 w-3 text-indigo-500" />
          <span>{totalWeeklyHours}h / week</span>
        </button>
      </div>

      {/* Quick Jump Buttons */}
      <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60 md:flex">
        <span className="px-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Jump:
        </span>
        <button
          onClick={() => onJumpToHour(7)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700"
          title="Scroll to 7:00 AM"
        >
          🌅 Morning (7 AM)
        </button>
        <button
          onClick={() => onJumpToHour(13)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700"
          title="Scroll to 1:00 PM"
        >
          ☀️ Afternoon (1 PM)
        </button>
        <button
          onClick={() => onJumpToHour(19)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700"
          title="Scroll to 7:00 PM"
        >
          🌙 Evening (7 PM)
        </button>
        <button
          onClick={() => onJumpToHour(0)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-xs dark:text-slate-300 dark:hover:bg-slate-700"
          title="Scroll to Midnight"
        >
          🌌 Night (12 AM)
        </button>
      </div>

      {/* Right Action Icons & Add Block Button */}
      <div className="flex items-center gap-2">
        {/* Reset starter */}
        <button
          onClick={() => {
            if (confirm('Reset to starter ideal routine? This will restore sample blocks.')) {
              resetToStarter();
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Reset to sample starter routine"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Export JSON */}
        <button
          onClick={() => {
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.15 },
              });
            } catch {
              // ignore
            }
            exportActiveSchedule();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Export schedule as JSON file"
        >
          <Download className="h-4 w-4" />
        </button>

        {/* Import JSON */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Import schedule from JSON file"
        >
          <Upload className="h-4 w-4" />
        </button>

        {/* Weekly Breakdown / Stats */}
        <button
          onClick={onOpenStats}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Weekly Routine Analytics & Breakdown"
        >
          <PieChart className="h-4 w-4 text-indigo-500" />
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={() => window.print()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Print or Save schedule as PDF"
        >
          <Printer className="h-4 w-4" />
        </button>

          {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-yellow-400 dark:hover:bg-slate-800"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-600" />}
        </button>

        {/* Add Block Button */}
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Block</span>
        </button>
      </div>
    </header>
  );
};


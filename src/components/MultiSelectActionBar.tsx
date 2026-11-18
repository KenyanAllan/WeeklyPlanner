import React, { useState } from 'react';
import { Trash2, Copy, Palette, X } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { PRESET_COLORS } from '../constants/colors';

export const MultiSelectActionBar: React.FC = () => {
  const {
    selectedEventIds,
    clearSelection,
    batchUpdateColor,
    batchDeleteSelected,
    batchDuplicateSelected,
  } = useSchedule();

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (selectedEventIds.length === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 z-40 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        {/* Count badge */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 dark:border-slate-750">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
            {selectedEventIds.length}
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Batch Color Change */}
          <div className="relative">
            <button
              onClick={() => setColorPickerOpen(prev => !prev)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Change color of all selected events"
            >
              <Palette className="h-3.5 w-3.5 text-indigo-500" />
              <span>Color</span>
            </button>

            {colorPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setColorPickerOpen(false)}
                />
                <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-850">
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => {
                          batchUpdateColor(c.hex);
                          setColorPickerOpen(false);
                        }}
                        style={{ backgroundColor: c.hex }}
                        className="h-6 w-6 rounded-lg transition hover:scale-110"
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Duplicate */}
          <button
            onClick={batchDuplicateSelected}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Duplicate selected blocks"
          >
            <Copy className="h-3.5 w-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (
                confirm(
                  `Delete ${selectedEventIds.length} selected ${
                    selectedEventIds.length === 1 ? 'event' : 'events'
                  }?`
                )
              ) {
                batchDeleteSelected();
              }
            }}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            title="Delete selected blocks (Delete or Backspace)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>

        {/* Clear selection */}
        <div className="border-l border-slate-200 pl-2 dark:border-slate-750">
          <button
            onClick={clearSelection}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Deselect all (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

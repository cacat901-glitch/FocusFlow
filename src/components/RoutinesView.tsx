/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { TimeOfDay, Routine, RoutineStep } from '../types';
import { 
  Plus, 
  Trash2, 
  Clock, 
  ChevronRight, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Bell, 
  Settings, 
  Zap, 
  X
} from 'lucide-react';

const EMOJI_GRID = [
  '📋','✅','🏃','☀️','🌙','💪','📚','🎯','⏰','🍳',
  '☕','🚿','🧘','💤','🎮','📝','🎵','🌿','🔥','⚡'
];

const TEMPLATE_PRESETS = [
  {
    name: "Morning Hygiene 🚿",
    emoji: "🚿",
    time_of_day: "morning" as TimeOfDay,
    steps: [
      { id: 't-m1', title: "Brush teeth & wash face", duration_minutes: 3, emoji: "🪥" },
      { id: 't-m2', title: "Take refreshing shower", duration_minutes: 8, emoji: "🚿" },
      { id: 't-m3', title: "Apply sunscreen & dress up", duration_minutes: 5, emoji: "👕" }
    ]
  },
  {
    name: "Work Start 💻",
    emoji: "💻",
    time_of_day: "afternoon" as TimeOfDay,
    steps: [
      { id: 't-w1', title: "Clear physical desk clutter", duration_minutes: 2, emoji: "🧹" },
      { id: 't-w2', title: "Pour hydration tea or coffee", duration_minutes: 3, emoji: "☕" },
      { id: 't-w3', title: "Map 3 daily tasks list", duration_minutes: 5, emoji: "🎯" }
    ]
  },
  {
    name: "Wind Down 💤",
    emoji: "💤",
    time_of_day: "evening" as TimeOfDay,
    steps: [
      { id: 't-wd1', title: "Phone in dresser charger (no screen)", duration_minutes: 2, emoji: "🔌" },
      { id: 't-wd2', title: "Inhale/Exhale box breathing", duration_minutes: 4, emoji: "🧘" },
      { id: 't-wd3', title: "Read 5 pages of fiction", duration_minutes: 10, emoji: "📖" }
    ]
  }
];

interface RoutinesViewProps {
  onOpenPaywall: () => void;
  onSelectRoutineForTimer: (routineId: string) => void;
  onNavigateTab: (tabName: 'home' | 'routines' | 'focus' | 'stats' | 'settings') => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({ 
  onOpenPaywall, 
  onSelectRoutineForTimer, 
  onNavigateTab 
}) => {
  const { 
    routines, 
    createRoutine, 
    updateRoutine, 
    deleteRoutine, 
    isPremium, 
    createStep, 
    deleteStep, 
    reorderSteps,
    showToast
  } = useAppContext();

  // AI Intelligent Assistant States
  const [aiQuery, setAiQuery] = useState('');
  const [aiDecomposing, setAiDecomposing] = useState(false);

  const handleAiDecompose = async () => {
    if (!aiQuery.trim()) {
      triggerHapticFeedback('error');
      showToast('warning', 'Action Required', 'Please describe your action goal first!');
      return;
    }
    triggerHapticFeedback('medium');
    setAiDecomposing(true);
    try {
      const response = await fetch('/api/gemini/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      if (!response.ok) {
        throw new Error("Could not contact the server's decomposition engine.");
      }
      const data = await response.json();
      if (data.steps && Array.isArray(data.steps)) {
        const generated = data.steps.map((st: any, i: number) => ({
          id: `preset-ai-${i}-${Math.random()}`,
          title: st.title,
          duration_minutes: st.duration_minutes || 5,
          emoji: st.emoji || '▶️'
        }));
        setBuilderSteps(generated);
        if (!routineName.trim()) {
          setRoutineName(aiQuery);
        }
        triggerHapticFeedback('success');
        showToast('success', 'Intelligent Steps Generated ✨', `Created ${generated.length} elegant sequence blocks for your goal.`);
      } else {
        throw new Error("Structured parse failure from assistant response.");
      }
    } catch (err: any) {
      console.error("AI decomposer error:", err);
      triggerHapticFeedback('error');
      showToast('error', 'AI Assistant Error', err.message || 'Unable to build smart step decomposition.');
    } finally {
      setAiDecomposing(false);
    }
  };

  // Builder States
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  // Form Fields
  const [routineName, setRoutineName] = useState('');
  const [routineEmoji, setRoutineEmoji] = useState('📋');
  const [routineTimeOfDay, setRoutineTimeOfDay] = useState<TimeOfDay>('morning');
  const [builderSteps, setBuilderSteps] = useState<{ id: string; title: string; duration_minutes: number; emoji: string }[]>([]);
  
  // Reminders states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderDays, setReminderDays] = useState<string[]>(['M', 'T', 'W', 'T', 'F']);

  // Helpers for steps form builder additions
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDuration, setNewStepDuration] = useState(5);
  const [newStepEmoji, setNewStepEmoji] = useState('▶️');

  // Trigger Edit Mode
  const handleEditRoutine = (routine: Routine) => {
    triggerHapticFeedback('light');
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setRoutineEmoji(routine.emoji);
    setRoutineTimeOfDay(routine.time_of_day);
    setReminderEnabled(routine.reminder_enabled);
    setReminderTime(routine.reminder_time || '08:00');
    setReminderDays(routine.reminder_days || ['M', 'T', 'W', 'T', 'F']);
    
    // Copy steps
    setBuilderSteps(routine.steps.map(st => ({
      id: st.id,
      title: st.title,
      duration_minutes: st.duration_minutes,
      emoji: st.emoji
    })));
    
    setBuilderOpen(true);
  };

  // Trigger Create Mode
  const handleCreateNewRoutine = () => {
    triggerHapticFeedback('light');
    // ADHD lock check
    if (!isPremium && routines.length >= 3) {
      triggerHapticFeedback('error');
      onOpenPaywall();
      return;
    }

    setEditingRoutineId(null);
    setRoutineName('');
    setRoutineEmoji('📋');
    setRoutineTimeOfDay('morning');
    setBuilderSteps([]);
    setReminderEnabled(false);
    setReminderTime('08:00');
    setReminderDays(['M', 'T', 'W', 'T', 'F']);
    setBuilderOpen(true);
  };

  // Preset Template Loader
  const handleLoadTemplate = (preset: typeof TEMPLATE_PRESETS[0]) => {
    triggerHapticFeedback('success');
    setRoutineName(preset.name.replace(/ 🚿| 💻| 💤/, ''));
    setRoutineEmoji(preset.emoji);
    setRoutineTimeOfDay(preset.time_of_day);
    
    const formattedPresetSteps = preset.steps.map((st, i) => ({
      id: `preset-${i}-${Math.random()}`,
      title: st.title,
      duration_minutes: st.duration_minutes,
      emoji: st.emoji
    }));
    setBuilderSteps(formattedPresetSteps);
  };

  // Add Step to local state
  const handleAddLocalStep = () => {
    if (!newStepTitle.trim()) {
      triggerHapticFeedback('error');
      return;
    }
    const newStep = {
      id: `local-step-${Math.random().toString(36).substr(2, 9)}`,
      title: newStepTitle,
      duration_minutes: newStepDuration,
      emoji: newStepEmoji
    };
    setBuilderSteps([...builderSteps, newStep]);
    setNewStepTitle('');
    setNewStepDuration(5);
    setNewStepEmoji('▶️');
    triggerHapticFeedback('success');
  };

  // Delete local step
  const handleDeleteLocalStep = (id: string) => {
    setBuilderSteps(builderSteps.filter(st => st.id !== id));
    triggerHapticFeedback('medium');
  };

  // Steps incrementors
  const updateLocalStepMinutes = (id: string, delta: number) => {
    triggerHapticFeedback('light');
    setBuilderSteps(builderSteps.map(st => {
      if (st.id === id) {
        return { ...st, duration_minutes: Math.max(1, st.duration_minutes + delta) };
      }
      return st;
    }));
  };

  // Shift elements in steps list represent drag flatlist
  const shiftStepPosition = (index: number, direction: 'up' | 'down') => {
    triggerHapticFeedback('light');
    const updated = [...builderSteps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBuilderSteps(updated);
  };

  // Days select toggle
  const toggleReminderDay = (day: string) => {
    triggerHapticFeedback('light');
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day]);
    }
  };

  // Save Builder content
  const handleSaveRoutine = () => {
    if (!routineName.trim()) {
      triggerHapticFeedback('error');
      return;
    }

    if (editingRoutineId) {
      // Edit existing routine
      updateRoutine(editingRoutineId, {
        name: routineName,
        emoji: routineEmoji,
        time_of_day: routineTimeOfDay,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        reminder_days: reminderDays
      });
      
      // Update its nested steps
      const newRoutineSteps: RoutineStep[] = builderSteps.map((bSt, idx) => ({
        id: bSt.id.startsWith('local-step-') || bSt.id.startsWith('preset-') 
          ? `step-${Math.random().toString(36).substr(2, 9)}` 
          : bSt.id,
        routine_id: editingRoutineId,
        title: bSt.title,
        duration_minutes: bSt.duration_minutes,
        order_index: idx,
        emoji: bSt.emoji,
        created_at: new Date().toISOString()
      }));
      
      reorderSteps(editingRoutineId, newRoutineSteps);
      triggerHapticFeedback('success');
    } else {
      // Create new routine
      const success = createRoutine(routineName, routineEmoji, routineTimeOfDay);
      if (!success) {
        onOpenPaywall();
        return;
      }

      // Add actual matching steps to the newly created routine!
      // Find latest routine id added
      const matchedRoutineId = routines[routines.length - 1]?.id || `rout-${Math.random()}`;
      builderSteps.forEach((bSt) => {
        createStep(matchedRoutineId, bSt.title, bSt.duration_minutes, bSt.emoji);
      });
    }

    setBuilderOpen(false);
  };

  // Categorize Routines
  const routinesByTime = (time: TimeOfDay) => routines.filter(r => r.time_of_day === time);

  const renderSection = (time: TimeOfDay, title: string, badgeIcon: string) => {
    const list = routinesByTime(time);
    return (
      <div className="space-y-3.5">
        <h4 className="bento-label flex items-center space-x-1.5 px-1">
          <span className="text-sm">{badgeIcon}</span>
          <span>{title} routines</span>
        </h4>

        <div className="space-y-3">
          {list.length > 0 ? (
            list.map((routine) => {
              const totalMinutes = routine.steps?.reduce((sum, st) => sum + st.duration_minutes, 0) || 0;
              const stepsCount = routine.steps?.length || 0;
              return (
                <div 
                  key={routine.id}
                  className="bento-card p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer group hover:border-[#6C63FF]/40 transition duration-250 select-none border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619]"
                  onClick={() => handleEditRoutine(routine)}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl p-2.5 bg-slate-50 dark:bg-black/15 border border-slate-200 dark:border-white/5 rounded-2xl group-hover:scale-105 transition scale-95 leading-none">
                      {routine.emoji}
                    </span>
                    <div>
                      <strong className="text-sm font-bold block">{routine.name}</strong>
                      <span className="text-xs font-mono font-bold flex items-center space-x-2 mt-1">
                        <span className="text-[#6C63FF]">{stepsCount} steps</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center opacity-70">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {totalMinutes} min total
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Action buttons list */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHapticFeedback('success');
                        onSelectRoutineForTimer(routine.id);
                        onNavigateTab('focus');
                      }}
                      className="px-3 py-1.5 bg-[#6C63FF] hover:bg-[#5b52e0] text-xs font-black rounded-xl text-white transition scale-95 shadow"
                    >
                      Start
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHapticFeedback('medium');
                        if (confirm(`Do you want to delete "${routine.name}" routine?`)) {
                          deleteRoutine(routine.id);
                        }
                      }}
                      className="p-1.5 opacity-55 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs opacity-50 border border-dashed border-slate-200 dark:border-white/5 rounded-xl bg-black/5 dark:bg-white/5">
              No routines scheduled here
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-inherit select-none pb-24 h-full relative">
      
      {/* Top Title Pane */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-black/5 dark:bg-[#1A1A2E]/20 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <span className="bento-label">PLANNER LIBRARY</span>
          <h2 className="text-xl font-bold font-display mt-0.5">Focus Routines</h2>
        </div>
        
        {/* ADD PLAN FAB TOP */}
        <button
          onClick={handleCreateNewRoutine}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#6C63FF] hover:bg-[#5b52e0] rounded-xl text-xs font-bold text-white transition shadow-lg shadow-[#6C63FF]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      <div className="px-5 py-5 space-y-7">
        
        {/* ADHD Info card */}
        <div className="p-4 bg-slate-50 dark:bg-[#1A1A2E]/55 border border-slate-200 dark:border-white/5 rounded-2xl flex items-start space-x-3 text-xs leading-normal opacity-80">
          <span className="text-xl shrink-0">💡</span>
          <p>
            <strong className="text-inherit">Dopamine stacking technique:</strong> Add your high-stimulating rewarding tasks (like coffee ☕ or favorite game 🎮) at the end of your hygiene steps to push past starting inertia.
          </p>
        </div>

        {/* Section List Morning, Afternoon, Evening */}
        {renderSection('morning', 'morning ☀️', '🌅')}
        {renderSection('afternoon', 'afternoon 🌤', '🌤')}
        {renderSection('evening', 'evening 🌙', '🌙')}

        {/* ADHD lock warning overlay if limit reached */}
        {!isPremium && routines.length >= 3 && (
          <div className="bento-card border-2 border-dashed border-[#6C63FF]/30 p-5 rounded-2xl text-center space-y-3.5 shadow-md">
            <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(108,99,255,0.2)] block select-none">🔒</span>
            <div className="space-y-1">
              <h5 className="font-bold text-sm">Routines Limits Active (3 Plan Max)</h5>
              <p className="text-[11px] opacity-70 px-4 leading-normal">
                Unlock Premium to create unlimited custom routines, reminder presets, and trace total ADHD consistency.
              </p>
            </div>
            <button
              onClick={() => { triggerHapticFeedback('light'); onOpenPaywall(); }}
              className="px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] text-xs font-bold rounded-xl text-white transition hover:opacity-90"
            >
              ⭐ Unlock Unlimited Routines
            </button>
          </div>
        )}
      </div>

      {/* Floating ADD Button bottom right */}
      <button
        onClick={handleCreateNewRoutine}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#6C63FF] hover:bg-[#5b52e0] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#6C63FF]/25 hover:scale-105 active:scale-[0.98] transition cursor-pointer z-40 border border-white/5 outline-none font-bold"
        title="Add new routine plan"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Routine Builder Screen Overlay Model */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#0c0d10] flex flex-col justify-between text-slate-800 dark:text-white overflow-y-auto px-5 py-6">
          
          {/* Header Row */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-black font-display">
              {editingRoutineId ? 'Modify Plan Steps' : 'Design Action Plan'}
            </h3>
            
            <button 
              onClick={() => { triggerHapticFeedback('light'); setBuilderOpen(false); }}
              className="w-8 h-8 bg-slate-50 dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 text-gray-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-6 py-5 max-w-sm mx-auto w-full">
            
            {/* AI Intelligent Autofill Assistant */}
            {!editingRoutineId && (
              <div className="bento-card bg-slate-50/70 dark:bg-[#1A1A2E]/25 border border-[#6C63FF]/20 dark:border-[#6C63FF]/30 p-4.5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-[#6C63FF] uppercase tracking-widest flex items-center space-x-1 font-mono">
                    <Zap className="w-3 h-3 text-[#6C63FF] fill-[#6C63FF] animate-pulse" />
                    <span>Intelligent AI Decomposer</span>
                  </span>
                  <span className="text-[9px] font-bold text-[#6C63FF]/70 bg-[#6C63FF]/10 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider scale-95">
                    Apple Style
                  </span>
                </div>
                <p className="text-[11px] opacity-75 leading-normal">
                  Type any goal (e.g. <em>"Clean garage & sorting boxes"</em> or <em>"Prepare suitcase for trip"</em>) and we'll magically break it down into mindful physical micro-steps to prevent execution paralysis.
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. Study for chemistry exam..."
                    disabled={aiDecomposing}
                    className="flex-1 h-10 px-3 bg-white dark:bg-[#0c0d10] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 focus:border-[#6C63FF] text-xs font-semibold rounded-xl outline-none transition disabled:opacity-50"
                  />
                  <button
                    onClick={handleAiDecompose}
                    disabled={aiDecomposing}
                    className="px-4.5 h-10 bg-[#6C63FF] hover:bg-[#5b52e0] font-black text-white text-xs rounded-xl flex items-center justify-center transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {aiDecomposing ? (
                      <span className="flex items-center space-x-1.5 font-bold font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>Analysing</span>
                      </span>
                    ) : (
                      "Breakdown"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Template Presets choice speed run */}
            {!editingRoutineId && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-[#8888AA] tracking-wider uppercase block">PRE-MADE TEMPLATE SPEEDLOAD</label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadTemplate(preset)}
                      className="px-2.5 py-2 text-left bg-slate-50 dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 hover:border-[#6C63FF] rounded-xl text-[10px] font-bold text-inherit transition"
                    >
                      <span>{preset.emoji}</span>
                      <span className="block opacity-60 mt-1 font-sans">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Basics */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-[#6C63FF] uppercase tracking-wider block">STEP 1: PLAN STATS</h4>
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-[#8888AA] tracking-wide block">ROUTINE NAME</label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="e.g. Work Morning Activation"
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1A1A2E] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 focus:border-[#6C63FF] text-xs font-semibold rounded-xl outline-none transition"
                />
              </div>

              {/* Theme Time of Day selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-[#8888AA] tracking-wide block">TIME OF DAY</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['morning', 'afternoon', 'evening'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { triggerHapticFeedback('light'); setRoutineTimeOfDay(t); }}
                      className={`h-9 font-bold text-xs capitalize rounded-xl border transition ${
                        routineTimeOfDay === t 
                          ? 'bg-[#6C63FF]/15 border-[#6C63FF] text-[#6C63FF] font-bold' 
                          : 'bg-slate-50 dark:bg-[#1A1A2E]/50 border-slate-200 dark:border-white/5 text-slate-400 hover:border-slate-350'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Picker Grid (20 emojis) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-[#8888AA] tracking-wide block">SELECT ICON EMOJI ({routineEmoji})</label>
                <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-50 dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 rounded-xl">
                  {EMOJI_GRID.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { triggerHapticFeedback('light'); setRoutineEmoji(e); }}
                      className={`h-7 w-7 flex items-center justify-center text-sm rounded-lg transition ${
                        routineEmoji === e ? 'bg-[#6C63FF] text-white scale-105 shadow' : 'hover:bg-slate-200 dark:hover:bg-black/20 text-inherit'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Steps configuration */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-[#6C63FF] uppercase tracking-wider block">STEP 2: MICRO-STEPS BUILDER</h4>

              {/* Drag flatlist simulation list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {builderSteps.length > 0 ? (
                  builderSteps.map((st, i) => (
                    <div 
                      key={st.id}
                      className="bg-slate-50 dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 p-3 rounded-xl flex items-center justify-between text-xs space-x-2"
                    >
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <span className="text-base select-none shrink-0">{st.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold block truncate">{st.title}</span>
                          <span className="text-[10px] font-mono text-slate-450 dark:text-[#8888AA] font-bold">{st.duration_minutes} minutes sprint</span>
                        </div>
                      </div>

                      {/* Controls drawer */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Shifters */}
                        <button 
                          disabled={i === 0}
                          onClick={() => shiftStepPosition(i, 'up')}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-black/10 rounded disabled:opacity-20 text-slate-400"
                          title="Shift step up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          disabled={i === builderSteps.length - 1}
                          onClick={() => shiftStepPosition(i, 'down')}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-black/10 rounded disabled:opacity-20 text-slate-400"
                          title="Shift step down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteLocalStep(st.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs opacity-50 border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                    No steps added to sequence yet.
                  </div>
                )}
              </div>

              {/* Add New step form inside drawer */}
              <div className="p-3 bg-[#6C63FF]/5 dark:bg-[#6C63FF]/10 border border-[#6C63FF]/15 rounded-xl space-y-3">
                <h5 className="text-[10px] font-bold tracking-widest opacity-60 uppercase">PULL IN NEW TASK STEP</h5>
                
                <div className="flex items-center space-x-2">
                  {/* Emoji selector step */}
                  <select
                    value={newStepEmoji}
                    onChange={(e) => { triggerHapticFeedback('light'); setNewStepEmoji(e.target.value); }}
                    className="h-10 px-2 bg-slate-50 dark:bg-[#1A1A2E] text-sm text-center border border-slate-200 dark:border-white/5 rounded-lg cursor-pointer outline-none shrink-0"
                  >
                    <option value="▶️">▶️</option>
                    <option value="🚿">🚿</option>
                    <option value="🏃">🏃</option>
                    <option value="🧘">🧘</option>
                    <option value="📖">📖</option>
                    <option value="🦷">🦷</option>
                    <option value="☕">☕</option>
                    <option value="🛌">🛌</option>
                    <option value="🧼">🧼</option>
                    <option value="🎧">🎧</option>
                    <option value="🪴">🪴</option>
                  </select>

                  <input
                    type="text"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    placeholder="Step name: Brush teeth 🪥"
                    className="flex-1 h-10 px-2.5 bg-slate-50 dark:bg-[#1A1A2E] border border-slate-200 dark:border-white/5 text-xs font-semibold rounded-lg outline-none transition text-inherit"
                  />
                </div>

                {/* Duration Stepper +- */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="opacity-70 font-bold">Step Duration:</span>
                  <div className="flex items-center space-x-3 bg-black/5 dark:bg-black/20 px-2.5 py-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { triggerHapticFeedback('light'); setNewStepDuration(Math.max(1, newStepDuration - 1)); }}
                      className="px-2 font-bold text-inherit hover:opacity-80"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold tracking-widest">{newStepDuration} mins</span>
                    <button
                      type="button"
                      onClick={() => { triggerHapticFeedback('light'); setNewStepDuration(newStepDuration + 1); }}
                      className="px-2 font-bold text-inherit hover:opacity-80"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLocalStep}
                  className="w-full h-8 bg-[#6C63FF] hover:bg-[#5b52e0] text-white font-black text-[10px] tracking-wider uppercase rounded-lg transition shadow"
                >
                  Confirm and sequence step
                </button>
              </div>
            </div>

            {/* Step 3: Reminders toggle */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold text-[#6C63FF] uppercase tracking-wider block">STEP 3: ADHD ALARM presets</h4>

              <div className="flex justify-between items-center bg-slate-50 dark:bg-[#1A1A2E]/50 border border-slate-200 dark:border-[#2A2A4A]/60 px-4 py-3 rounded-xl">
                <div className="space-y-0.5 pr-4 flex-1">
                  <label className="text-xs font-bold flex items-center space-x-1.5 cursor-pointer">
                    <Bell className="w-4 h-4 text-[#6C63FF]" />
                    <span>Trigger Reminder Alarms</span>
                  </label>
                  <span className="text-[10px] opacity-60 block leading-snug">Notify my device when it is time to sequence steps.</span>
                </div>

                {/* Alarm Enable Toggle */}
                <button
                  type="button"
                  onClick={() => { triggerHapticFeedback('light'); setReminderEnabled(!reminderEnabled); }}
                  className={`w-12 h-6.5 rounded-full p-0.5 border cursor-pointer transition ${
                    reminderEnabled ? 'bg-[#4CAF50] border-[#4CAF50] flex justify-end' : 'bg-slate-200 dark:bg-[#1A1A2E] border-slate-350 dark:border-[#2A2A4A] flex justify-start'
                  }`}
                >
                  <span className="w-5 h-5 bg-white rounded-full block shadow-md" />
                </button>
              </div>

              {reminderEnabled && (
                <div className="p-3 bg-slate-50 dark:bg-[#1A1A2E]/50 border border-slate-200 dark:border-[#2A2A4A] rounded-xl space-y-4.5 animate-fade-in">
                  {/* Micro Time Input chooser */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="opacity-70 font-bold">Daily Alarm Schedule Time:</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => { triggerHapticFeedback('light'); setReminderTime(e.target.value); }}
                      className="bg-slate-200 dark:bg-black/30 text-inherit font-mono font-bold px-3 py-1 text-center rounded-lg border border-slate-300 dark:border-[#2A2A4A] outline-none cursor-pointer"
                    />
                  </div>

                  {/* Day picker pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold opacity-60 uppercase block">CHOOSE REPEAT DAYS</span>
                    <div className="flex justify-between">
                      {['M','T','W','T','F','S','S'].map((day, idx) => {
                        const isSelected = reminderDays.includes(day);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleReminderDay(day)}
                            className={`w-8 h-8 rounded-full border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isSelected 
                                ? 'bg-[#6C63FF] border-[#6C63FF] text-white shadow shadow-[#6C63FF]/30' 
                                : 'bg-transparent border-slate-200 dark:border-[#2A2A4A] text-slate-400 hover:border-slate-350'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action bottom sticky row */}
          <div className="pb-6 pt-4 border-t border-slate-200 dark:border-[#2A2A4A] max-w-sm mx-auto w-full">
            <button
              onClick={handleSaveRoutine}
              className="w-full h-13 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] text-sm font-bold text-white rounded-xl shadow-lg active:scale-[0.98] transition cursor-pointer"
            >
              Confirm and Save Routine
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

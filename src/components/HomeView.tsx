/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { ambientSoundEngine } from '../utils/audio';
import { 
  Flame, 
  CheckSquare, 
  Square, 
  Plus, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Sparkles, 
  AlertCircle,
  X,
  Pin,
  Activity,
  Volume2,
  Circle,
  Zap,
  HelpCircle
} from 'lucide-react';

interface HomeViewProps {
  onNavigateTab: (tabName: 'home' | 'routines' | 'focus' | 'stats' | 'settings') => void;
  onSelectRoutineForTimer: (routineId: string) => void;
  onOpenPaywall: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigateTab, 
  onSelectRoutineForTimer,
  onOpenPaywall 
}) => {
  const { 
    profile, 
    streak, 
    routines, 
    tasks, 
    createTask, 
    toggleTask, 
    isPremium, 
    achievements 
  } = useAppContext();

  // Dialog State: "+ Add Task"
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Focal Anchor state (Local storage cached)
  const [focalAnchor, setFocalAnchor] = useState<string>(() => {
    return localStorage.getItem('focusflow_focal_anchor') || '';
  });
  const [focalInput, setFocalInput] = useState('');

  // SOS Tuner state
  const [sosState, setSosState] = useState<'none' | 'overwhelmed' | 'understimulated' | 'distracted'>('none');
  const [sosChallengeText, setSosChallengeText] = useState('');
  const [sosBreathingCount, setSosBreathingCount] = useState(4);

  // Fidget Pad states
  const [fidgetCount, setFidgetCount] = useState(0);
  const [fidgetActiveIndex, setFidgetActiveIndex] = useState<number | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [popStates, setPopStates] = useState<boolean[]>(() => Array(8).fill(false));

  const handlePopClick = (idx: number) => {
    const next = [...popStates];
    const originalState = next[idx];
    next[idx] = !originalState;
    setPopStates(next);
    
    // Play sweet synth pop frequencies dynamically depending on pop direction
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const popCtx = new AudioContextClass();
        const now = popCtx.currentTime;
        const osc = popCtx.createOscillator();
        const gain = popCtx.createGain();
        
        osc.type = originalState ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(originalState ? 340 : 680, now);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        
        osc.connect(gain);
        gain.connect(popCtx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      // safe fallback
    }

    triggerHapticFeedback(originalState ? 'light' : 'success');
    setFidgetCount((c) => c + 1);
  };

  const handleResetPops = () => {
    setPopStates(Array(8).fill(false));
    triggerHapticFeedback('medium');
  };

  // Time-aware greetings
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 22 || hours < 5) return { text: "Late Night, focus?", icon: "🌌" };
    if (hours < 12) return { text: "Good morning", icon: "☀️" };
    if (hours < 17) return { text: "Good afternoon", icon: "🌤" };
    return { text: "Good evening", icon: "🌙" };
  };

  const greeting = getGreeting();
  const userName = profile?.display_name || 'Achiever';

  // Format today's date elegantly
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Calculate today's routine progress (we'll look at the first active morning/afternoon routine)
  const activeRoutine = routines.find(r => r.is_active) || routines[0];
  const stepsCount = activeRoutine?.steps?.length || 0;
  
  // Calculate a demo completed steps count
  const demoCompletedStepsString = localStorage.getItem(`completed_steps_routine_${activeRoutine?.id}`) || '0';
  const completedSteps = Math.min(parseInt(demoCompletedStepsString, 10), stepsCount);
  const routineProgressPct = stepsCount > 0 ? Math.round((completedSteps / stepsCount) * 100) : 0;

  // Handle tasks modal submission
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      triggerHapticFeedback('error');
      return;
    }
    createTask(taskTitle, taskPriority);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskModalOpen(false);
    triggerHapticFeedback('success');
  };

  // ADHD Save Focal Anchor
  const handleSaveFocalAnchor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focalInput.trim()) {
      triggerHapticFeedback('error');
      return;
    }
    const anchorVal = focalInput.trim().toUpperCase();
    localStorage.setItem('focusflow_focal_anchor', anchorVal);
    setFocalAnchor(anchorVal);
    setFocalInput('');
    triggerHapticFeedback('success');
  };

  const handleClearFocalAnchor = () => {
    localStorage.removeItem('focusflow_focal_anchor');
    setFocalAnchor('');
    triggerHapticFeedback('medium');
  };

  // SOS Tuner Brain States Audio Support
  useEffect(() => {
    if (sosState === 'overwhelmed') {
      ambientSoundEngine.play('brown', 0.25);
    } else if (sosState === 'understimulated') {
      ambientSoundEngine.play('alpha', 0.35);
    } else {
      ambientSoundEngine.stop();
    }
    return () => {
      ambientSoundEngine.stop();
    };
  }, [sosState]);

  // SOS Overwhelmed Box Breathing Tick and prompt cycle
  const [sosBreatheMode, setSosBreatheMode] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  useEffect(() => {
    if (sosState !== 'overwhelmed') return;
    
    setSosBreatheMode('Inhale');
    setSosBreathingCount(4);

    const timer = setInterval(() => {
      setSosBreathingCount((prev) => {
        if (prev <= 1) {
          // transition mode
          setSosBreatheMode((curr) => {
            if (curr === 'Inhale') return 'Hold';
            if (curr === 'Hold') return 'Exhale';
            if (curr === 'Exhale') return 'Rest';
            return 'Inhale';
          });
          triggerHapticFeedback('light');
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sosState]);

  // SOS Understimulated Random Physical Prompts
  const UNDER_PROMPTS = [
    "Spin around once and look at a distant wall 🌀",
    "Squeeze an ice cube or run cold tap water on your wrists ❄️",
    "Perform 8 rapid vertical arm raises right now ⚡",
    "Unclench your jaw, drop your shoulders, and take a deep sigh 💨",
    "Write down your immediate shiny distraction on a scrap of paper 🖍️"
  ];
  const triggerNewUnderstimulatedChallenge = () => {
    const randomPrompt = UNDER_PROMPTS[Math.floor(Math.random() * UNDER_PROMPTS.length)];
    setSosChallengeText(randomPrompt);
  };

  useEffect(() => {
    if (sosState === 'understimulated') {
      triggerNewUnderstimulatedChallenge();
    }
  }, [sosState]);

  // Satisfying Haptic Fidget Pad Trigger
  const handleFidgetClick = (vibrationType: 'light' | 'medium' | 'warning' | 'success') => {
    triggerHapticFeedback(vibrationType);
    setFidgetCount((c) => c + 1);
    setFidgetActiveIndex(Math.floor(Math.random() * 4));
    setTimeout(() => {
      setFidgetActiveIndex(null);
    }, 150);
  };

  const handleSliderFidgetDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value, 10);
    setSliderPosition(newVal);
    // Play light friction haptic on every 5% threshold change
    if (newVal % 5 === 0) {
      triggerHapticFeedback('light');
    }
  };

  // Get most recent unlocked achievement to showcase on dashboard
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const recentAchievement = unlockedAchievements.length > 0 ? unlockedAchievements[unlockedAchievements.length - 1] : null;

  // Render 7-day mini calendar
  const last7DaysOfCalendar = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isToday = i === 0;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      // Simulate active states (e.g. past days active, today active check)
      const lastActiveDate = streak?.last_active_date;
      const dStr = d.toISOString().split('T')[0];
      
      let wasActive = false;
      if (lastActiveDate) {
        // If it's today, look at the streak state
        if (isToday) {
          wasActive = lastActiveDate === dStr;
        } else {
          // Mocking previous consistency
          wasActive = (d.getDay() !== 0 && d.getDay() !== 6) || Math.random() > 0.4;
        }
      }

      days.push({
        name: dayName,
        isToday,
        active: wasActive,
        key: d.getTime()
      });
    }
    return days;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-inherit select-none pb-24 h-full">
      {/* 1. Header Row */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-black/5 dark:bg-[#1A1A2E]/20 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <span className="bento-label">
            {formattedDate}
          </span>
          <h2 className="text-xl font-bold font-display mt-0.5">
            {greeting.text}, <span>{userName}</span>! {greeting.icon}
          </h2>
        </div>
        
        {/* Streak Badge */}
        <div 
          onClick={() => { triggerHapticFeedback('light'); onNavigateTab('stats'); }}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 rounded-2xl hover:border-[#6C63FF]/50 transition cursor-pointer"
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
          <span className="text-xs font-bold font-mono">
            {streak?.current_streak || 0} days
          </span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* PREMIUM MODULE 1: Daily Focal Anchor Sticky Note */}
        <div className="relative overflow-hidden rounded-2xl transition border border-[#E6E0D0] dark:border-amber-950/40 bg-[#FCFAF2] dark:bg-[#1A1813] text-[#4A3B2B] dark:text-amber-100 p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-700/80 dark:text-amber-500/80 flex items-center space-x-1 font-mono">
              <Pin className="w-3.5 h-3.5 rotate-45 shrink-0" />
              <span>COGNITIVE FOCAL ANCHOR</span>
            </span>
            {focalAnchor && (
              <button 
                onClick={handleClearFocalAnchor}
                className="text-[9px] font-bold text-amber-700/60 dark:text-amber-500/60 hover:text-amber-800 uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>

          {focalAnchor ? (
            <div className="space-y-2">
              <p className="text-xl md:text-2xl font-black font-display tracking-tight text-amber-950 dark:text-amber-100/90 py-0.5 leading-tight uppercase font-mono break-words">
                {focalAnchor}
              </p>
              <div className="flex items-center space-x-2 text-[10.5px] text-amber-900/60 dark:text-amber-400/60 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>Repeatedly look at this whenever you get distracted or lost.</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveFocalAnchor} className="space-y-2.5">
              <p className="text-[11px] text-amber-900/70 dark:text-amber-400/70 leading-normal">
                ADHD short-term working memory fades fast. Pin the <strong>single absolute priority phrase</strong> you must return to today:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={focalInput}
                  onChange={(e) => setFocalInput(e.target.value)}
                  placeholder="e.g. FINISH MATH ASSIGNMENT or PACK GYM BAG..."
                  className="flex-1 h-9.5 px-3 bg-white/85 dark:bg-black/25 text-[#4A3B2B] dark:text-amber-100 border border-[#E6E0D0] focus:border-amber-500 text-xs font-semibold rounded-xl outline-none placeholder:text-[#4A3B2B]/40"
                />
                <button
                  type="submit"
                  className="px-4 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl flex items-center justify-center transition shrink-0"
                >
                  Pin Anchor
                </button>
              </div>
            </form>
          )}
        </div>

        {/* PREMIUM MODULE 2: Dynamic SOS Brain State Tuner */}
        <div className="bento-card bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 p-5 space-y-4 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center pb-0.5">
            <h4 className="text-[11px] font-black tracking-widest uppercase text-rose-500 dark:text-rose-400 flex items-center space-x-1.5 font-mono">
              <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>SOS Cognitive Reset</span>
            </h4>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">
              Mental First Aid
            </span>
          </div>

          {sosState === 'none' ? (
            <div className="space-y-3">
              <p className="text-[11px] opacity-75 leading-normal">
                Experiencing focus inertia, high anxiety, or circular looping? Choose your immediate mental barrier to reset your nervous system:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { triggerHapticFeedback('medium'); setSosState('overwhelmed'); }}
                  className="py-2.5 px-1 bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/20 text-[10px] font-bold rounded-xl transition cursor-pointer flex flex-col items-center justify-center space-y-1"
                >
                  <span>🤯</span>
                  <span>Overwhelmed</span>
                </button>
                <button
                  onClick={() => { triggerHapticFeedback('medium'); setSosState('understimulated'); }}
                  className="py-2.5 px-1 bg-amber-500/10 hover:bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold rounded-xl transition cursor-pointer flex flex-col items-center justify-center space-y-1"
                >
                  <span>🥱</span>
                  <span>Brain Foggy</span>
                </button>
                <button
                  onClick={() => { triggerHapticFeedback('medium'); setSosState('distracted'); }}
                  className="py-2.5 px-1 bg-[#6C63FF]/10 hover:bg-[#6C63FF]/15 text-[#6C63FF] dark:text-indigo-300 border border-[#6C63FF]/20 text-[10px] font-bold rounded-xl transition cursor-pointer flex flex-col items-center justify-center space-y-1"
                >
                  <span>🔄</span>
                  <span>Distracted</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-black/25 rounded-2xl space-y-3.5 border border-slate-200/50 dark:border-white/5 animate-fade-in relative">
              <button 
                onClick={() => { triggerHapticFeedback('light'); setSosState('none'); }}
                className="absolute top-3.5 right-3.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕ Exit Reset
              </button>

              {sosState === 'overwhelmed' && (
                <div className="space-y-3.5 text-center py-1">
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-widest text-[#6C63FF] uppercase font-black font-mono">BROWN NOISE SHIELD ACTIVE</span>
                    <h5 className="font-bold text-sm">Quiet Box Breathing</h5>
                  </div>
                  
                  {/* Breathe dynamic ring */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <div className={`absolute w-16 h-16 rounded-full bg-[#4CAF50]/15 transition-all duration-[900ms] ${
                        sosBreatheMode === 'Inhale' 
                          ? 'scale-125 opacity-100 blur-xs' 
                          : sosBreatheMode === 'Exhale' 
                            ? 'scale-90 opacity-40' 
                            : 'scale-100 opacity-75'
                      }`} />
                      <span className="text-xl font-black font-mono z-10 text-slate-800 dark:text-white">
                        {sosBreathingCount}
                      </span>
                    </div>
                  </div>

                  <strong className="text-xs font-bold text-[#4CAF55] block animate-pulse">
                    {sosBreatheMode === 'Inhale' && "👃 Inhale..."}
                    {sosBreatheMode === 'Hold' && "🧘 Hold Still..."}
                    {sosBreatheMode === 'Exhale' && "💨 Exhale softly..."}
                    {sosBreatheMode === 'Rest' && "✨ Resting interval..."}
                  </strong>
                  <p className="text-[10px] opacity-70 leading-relaxed px-4">
                    Brownian noise is masking sensory chatter. Close eyes, let go of execution expectations, match the pacer.
                  </p>
                </div>
              )}

              {sosState === 'understimulated' && (
                <div className="space-y-3.5 text-center py-1">
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-widest text-amber-500 uppercase font-black font-mono">10HZ ALPHA FOCUS ALIGNMENT ACTIVE</span>
                    <h5 className="font-bold text-sm">Nervous System Shocker</h5>
                  </div>

                  <div className="py-3 px-4.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold leading-normal">
                    {sosChallengeText}
                  </div>

                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => { triggerHapticFeedback('light'); triggerNewUnderstimulatedChallenge(); }}
                      className="px-3.5 py-1.5 bg-white dark:bg-[#1A1B1F] hover:bg-slate-50 border border-slate-200 dark:border-white/10 text-[10px] font-bold rounded-xl transition cursor-pointer"
                    >
                      🔄 Give Me Different Spark
                    </button>
                    <button
                      onClick={() => { triggerHapticFeedback('success'); setSosState('none'); }}
                      className="px-3.5 py-1.5 bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
                    >
                      🚀 Activated, back to focus
                    </button>
                  </div>
                </div>
              )}

              {sosState === 'distracted' && (
                <div className="space-y-3 text-center py-1">
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-widest text-violet-500 uppercase font-black font-mono">ATTENTION TRANSFER VALVE</span>
                    <h5 className="font-bold text-sm">Exhaust & Burn Thread</h5>
                  </div>
                  <p className="text-[10.5px] opacity-75">
                    What shiny thought or worry is looping inside your mind currently? Type it here to externalize and dissolve it from working memory:
                  </p>
                  <div className="flex space-x-2 max-w-xs mx-auto">
                    <input
                      type="text"
                      id="burn-input"
                      placeholder="e.g. checking reddit or that email query..."
                      className="flex-1 h-9.5 px-3 bg-white dark:bg-black/25 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/5 outline-none"
                    />
                    <button
                      onClick={() => {
                        triggerHapticFeedback('warning');
                        const inp = document.getElementById('burn-input') as HTMLInputElement;
                        if (inp) inp.value = '';
                        triggerHapticFeedback('success');
                        setSosState('none');
                        alert("Dissolved correctly! Your working memory is now clean. Return to your focal anchor.");
                      }}
                      className="px-4 h-9.5 bg-stone-900 dark:bg-stone-100 dark:text-black hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                    >
                      🔥 Melt It
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PREMIUM MODULE 3: Apple Style Tactile ASMR Fidget Board */}
        <div className="bento-card bg-slate-50/50 dark:bg-[#151619]/40 border border-slate-200 dark:border-white/5 p-4.5 rounded-2xl space-y-3 shadow-xs select-none">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#8888AA] flex items-center space-x-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-violet-500 fill-violet-500" />
              <span>Haptic Focus ASMR Fidget Board</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-[#8888AA] font-mono">Clicks: {fidgetCount}</span>
          </div>

          {/* Interactive button domes */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Click Switch', vibration: 'light' as const, emoji: '🟢' },
              { label: 'Tactile Dome', vibration: 'medium' as const, emoji: '🔴' },
              { label: 'Heavy Lock', vibration: 'warning' as const, emoji: '🔵' },
              { label: 'Success Ping', vibration: 'success' as const, emoji: '✨' }
            ].map((f, i) => (
              <button
                key={i}
                onClick={() => handleFidgetClick(f.vibration)}
                className={`py-2 px-1 rounded-xl bg-white dark:bg-[#0F1012] border transition-all duration-100 flex flex-col items-center justify-center space-y-1 cursor-pointer select-none active:scale-95 ${
                  fidgetActiveIndex === i 
                    ? 'border-[#6C63FF] translate-y-0.5 shadow-inner scale-95' 
                    : 'border-slate-250 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-xs'
                }`}
              >
                <span className="text-base leading-none select-none">{f.emoji}</span>
                <span className="text-[8px] font-bold opacity-60 leading-none truncate w-full px-0.5">{f.label}</span>
              </button>
            ))}
          </div>

          {/* Satisfying tactile slider */}
          <div className="space-y-1.5 pt-1 origin-top transition">
            <div className="flex justify-between items-center text-[9px] font-bold opacity-60">
              <span>Apple Friction Dial Slider (Drag to discharge energy)</span>
              <span>Pos: {sliderPosition}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderFidgetDrag}
              className="w-full h-1 bg-slate-250 dark:bg-black/20 rounded-lg appearance-none cursor-pointer accent-[#6C63FF]"
            />
          </div>

          {/* Split separator */}
          <div className="h-[1px] bg-slate-250/65 dark:bg-white/5 my-2" />

          {/* Interactive Silicone Bubble Pop Toy Grid */}
          <div className="space-y-1.5 pt-1.5">
            <div className="flex justify-between items-center text-[9px] font-bold opacity-70">
              <span className="flex items-center space-x-1.5">
                <span>🔴</span>
                <span>Tactile Silicone Bubble Wrap Popper</span>
              </span>
              <button 
                onClick={handleResetPops}
                className="text-[8px] bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 px-1.5 py-0.5 rounded text-[#6C63FF] font-black uppercase font-mono tracking-wider cursor-pointer"
              >
                Reset Popper
              </button>
            </div>

            <div className="grid grid-cols-8 gap-1.5 bg-slate-100 dark:bg-black/15 p-2 rounded-xl">
              {popStates.map((popped, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePopClick(idx)}
                  className={`aspect-square w-full rounded-full transition-all duration-100 cursor-pointer flex items-center justify-center border relative ${
                    popped 
                      ? 'bg-gradient-to-br from-violet-500/25 to-indigo-500/10 border-indigo-500/25 shadow-inner scale-90 translate-y-0.5' 
                      : 'bg-white dark:bg-[#151619] border-slate-200 dark:border-white/5 active:scale-95 shadow-xs hover:border-violet-500/30'
                  }`}
                  title="Pop!"
                >
                  {/* Visual popping dimple indicator */}
                  <span className={`w-2 h-2 rounded-full transition-all duration-100 ${
                    popped ? 'bg-indigo-500 scale-75' : 'bg-[#6C63FF]/40 border border-[#6C63FF]/15 animate-pulse'
                  }`} />
                </button>
              ))}
            </div>
            <p className="text-[8px] opacity-65 text-center leading-none mt-1">Popping bubbles triggers micro-haptics & dynamic sound frequencies to trigger tiny dopamine releases.</p>
          </div>
        </div>

        {/* 2. Today's Routine Card */}
        {activeRoutine ? (
          <div className="relative overflow-hidden bento-brand-card p-5.5 text-white shadow-lg">
            {/* Sparkles backdrop */}
            <div className="absolute right-2 -bottom-2 opacity-15 text-8xl">
              {activeRoutine.emoji}
            </div>

            <div className="flex justify-between items-start mb-2">
              <span className="px-2.5 py-1 bg-black/25 rounded-full text-[10px] font-black uppercase tracking-wider">
                ACTIVE PLAN
              </span>
              <span className="text-xs font-mono font-bold text-white/90">
                {completedSteps} / {stepsCount} steps completed
              </span>
            </div>

            <h3 className="text-xl font-bold font-display flex items-center space-x-1.5">
              <span>{activeRoutine.emoji}</span>
              <span>{activeRoutine.name}</span>
            </h3>

            {/* Micro Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-white/95 mb-1.5">
                <span>Routine Progress</span>
                <span>{routineProgressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(4, routineProgressPct)}%` }}
                />
              </div>
            </div>

            {/* Start Buttons */}
            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => {
                  triggerHapticFeedback('medium');
                  onSelectRoutineForTimer(activeRoutine.id);
                  onNavigateTab('focus');
                }}
                className="flex-1 h-11 bg-white hover:bg-gray-100 text-[#4F46E5] font-bold text-xs rounded-xl flex items-center justify-center transition active:scale-[0.98] shadow-md"
              >
                {completedSteps === 0 ? "Start Routine" : "Continue Routine"}
              </button>
              
              <button
                onClick={() => {
                  triggerHapticFeedback('light');
                  onNavigateTab('routines');
                }}
                className="px-3 bg-black/15 hover:bg-black/25 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition"
              >
                Steps List
              </button>
            </div>
          </div>
        ) : (
          <div className="bento-card text-center space-y-4">
            <div className="text-4xl text-center select-none">📋</div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display">Create your first ADHD routine</h3>
              <p className="bento-desc px-4">Break your morning or evening chores into simple, small steps that prevent freeze state.</p>
            </div>
            <button
              onClick={() => { triggerHapticFeedback('light'); onNavigateTab('routines'); }}
              className="px-5 py-2.5 bg-[#6C63FF] hover:bg-[#5b52e0] text-xs font-bold text-white rounded-xl transition"
            >
              + Design My First Plan
            </button>
          </div>
        )}

        {/* 3. Quick Tasks Checklist Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="bento-label flex items-center space-x-1.5">
              <span>📋</span>
              <span>Today's Short Tasks</span>
            </h3>
            <button
              onClick={() => { triggerHapticFeedback('light'); setTaskModalOpen(true); }}
              className="flex items-center space-x-1 text-xs font-bold text-[#6C63FF] hover:text-[#5b52e0]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Quick task list scroll container in Bento alignment */}
          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`bento-card relative w-44 shrink-0 p-4.5 border flex flex-col justify-between h-28 ${
                    task.is_completed ? 'opacity-60 saturate-50' : 'shadow-sm'
                  }`}
                >
                  {/* Priority indicator dot */}
                  <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'
                  }`} />

                  {/* Task Content click */}
                  <div 
                    onClick={() => { triggerHapticFeedback('light'); toggleTask(task.id); }}
                    className="flex-1 cursor-pointer pr-4"
                  >
                    <p className={`text-xs font-semibold leading-snug line-clamp-2 ${
                      task.is_completed ? 'line-through opacity-50' : ''
                    }`}>
                      {task.title}
                    </p>
                  </div>

                  {/* Footer - check trigger */}
                  <div className="flex justify-between items-center text-[10px] mt-2">
                    <span className="font-mono opacity-60 capitalize font-bold">{task.priority}</span>
                    <button
                      onClick={() => { triggerHapticFeedback('light'); toggleTask(task.id); }}
                      className="text-[#6C63FF] hover:text-[#5b52e0] transition outline-none"
                    >
                      {task.is_completed ? (
                        <CheckSquare className="w-4.5 h-4.5 text-[#4CAF50] fill-[#4CAF50]/10" />
                      ) : (
                        <Square className="w-4.5 h-4.5 opacity-40 hover:opacity-100" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-6 bento-card flex flex-col items-center justify-center text-xs opacity-80 min-h-28">
                <CheckSquare className="w-6 h-6 mb-1.5 opacity-30" />
                No tasks logged. Tap "+ Add Task" to set.
              </div>
            )}

            {/* Quick add card trigger */}
            <button
              onClick={() => { triggerHapticFeedback('light'); setTaskModalOpen(true); }}
              className="w-28 shrink-0 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-white/5 hover:border-[#6C63FF]/30 flex flex-col items-center justify-center text-[#8888AA] hover:text-[#6C63FF] shrink-0 h-28 space-y-1 bg-white/20 dark:bg-black/10 transition"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">New Task</span>
            </button>
          </div>
        </div>

        {/* 4. Recent Achievement Alert */}
        {recentAchievement && (
          <div className="bento-card flex items-center space-x-3.5 shadow-sm animate-fade-in">
            <div className="text-3xl filter drop-shadow-[0_4px_8px_rgba(255,152,0,0.3)] select-none">
              {recentAchievement.emoji}
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest block font-mono">
                MEDAL RECENTLY SECURED
              </span>
              <strong className="text-xs font-bold block mt-0.5 font-display flex items-center space-x-1">
                <span>{recentAchievement.name}</span>
                <span className="text-orange-400">🔥</span>
              </strong>
              <p className="bento-desc mt-0.5">{recentAchievement.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-55" />
          </div>
        )}

        {/* 5. Streak Calendar Mini-grid */}
        {/* 5. Streak Calendar Mini-grid */}
        <div className="bento-card bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="bento-label flex items-center space-x-1.5 font-bold tracking-widest text-[#6C63FF]">
              <Calendar className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span>Weekly Consistency Map</span>
            </h4>
            <span className="text-[10px] font-bold text-[#4CAF50] font-sans">
              Daily Streak Active
            </span>
          </div>

          <div className="flex justify-between px-1">
            {last7DaysOfCalendar().map((day) => (
              <div key={day.key} className="flex flex-col items-center space-y-1.5">
                <span className={`text-[10px] font-bold font-sans ${day.isToday ? 'text-[#6C63FF]' : 'opacity-60'}`}>
                  {day.name}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all text-sm leading-none font-bold select-none ${
                  day.active 
                    ? 'bg-gradient-to-tr from-[#6C63FF] to-[#8F43FF] border-transparent text-white shadow shadow-[#6C63FF]/20' 
                    : 'bg-black/5 dark:bg-[#1e1f24] border-slate-200 dark:border-white/5 opacity-55 text-[9px]'
                }`}>
                  {day.active ? '🔥' : '•'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Premium Highlight (Replaces spam banners) */}
        {!isPremium && (
          <div className="bento-card border border-[#6C63FF]/25 bg-[#6C63FF]/5 dark:bg-[#6C63FF]/5 px-4.5 py-4 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-[#6C63FF] uppercase tracking-wider block font-mono">FocusFlow Premium Upgrade</span>
              <h5 className="font-bold text-xs">Unlock Intelligent AI Decomposer</h5>
              <p className="text-[10.5px] opacity-75 leading-normal">
                Chunk complex goals into actionable sub-steps dynamically, configure unlimited reminder, and enable advanced sound presets.
              </p>
            </div>
            <button
              onClick={() => { triggerHapticFeedback('light'); onOpenPaywall(); }}
              className="px-4 py-2 bg-[#6C63FF] hover:bg-[#5b52e0] font-bold text-white text-[10px] rounded-xl transition cursor-pointer self-start shadow"
            >
              Learn More
            </button>
          </div>
        )}

      </div>

      {/* Task Modal Container - bottom sheet popup style */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 rounded-t-[28px] rounded-b-[16px] px-5 py-6 space-y-4 text-slate-800 dark:text-white animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold font-display">Create Today's Task</h3>
              <button 
                onClick={() => { triggerHapticFeedback('light'); setTaskModalOpen(false); }}
                className="w-7 h-7 bg-slate-100 dark:bg-[#2A2A4A] flex items-center justify-center text-gray-400 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#8888AA] tracking-wider uppercase block">TASK DESCRIPTION</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Clean physical desk layout 🧹"
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#0c0d10] text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 focus:border-[#6C63FF] text-xs font-semibold rounded-xl outline-none transition"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-[#8888AA] tracking-wider uppercase block">PRIORITY METRIC</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { triggerHapticFeedback('light'); setTaskPriority(p); }}
                      className={`h-9 font-bold text-xs capitalize rounded-xl border transition ${
                        taskPriority === p 
                          ? p === 'high' 
                            ? 'bg-red-500/20 border-red-500 text-red-500 dark:text-red-300' 
                            : p === 'medium'
                              ? 'bg-orange-500/20 border-orange-500 text-orange-500 dark:text-orange-300'
                              : 'bg-gray-500/20 border-gray-500 text-slate-600 dark:text-gray-300'
                          : 'bg-slate-50 dark:bg-[#0c0d10] border-slate-250 dark:border-white/5 text-slate-400 font-medium'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#6C63FF] hover:bg-[#5b52e0] font-bold text-xs text-white rounded-xl transition cursor-pointer mt-2 flex items-center justify-center shadow"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Styled slide animations */}
      <style>{`
         @keyframes slideUp {
           from { transform: translateY(100px); opacity: 0; }
           to { transform: translateY(0); opacity: 1; }
         }
         .animate-slide-up {
           animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
         }
      `}</style>

    </div>
  );
};

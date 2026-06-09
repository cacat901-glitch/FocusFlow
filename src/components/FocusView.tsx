/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { playBellNotification, ambientSoundEngine } from '../utils/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap,
  Info,
  Sliders,
  Wind,
  CloudRain,
  Radio,
  Music,
  Headphones
} from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "You're doing great! 💪",
  "Stay with it 🎯",
  "Almost there! 🔥",
  "ADHD superpower activated ⚡",
  "Just one step at a time 🚶",
  "Progress, not perfection 🌿",
  "Feed your focus, starve distraction 🧠",
  "Micro wins build giant castles 🏰"
];

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

interface FocusViewProps {
  selectedRoutineId: string | null;
  onClearSelectedRoutine: () => void;
  onOpenPaywall: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ 
  selectedRoutineId, 
  onClearSelectedRoutine,
  onOpenPaywall
}) => {
  const { createSession, isPremium, addXP, showToast } = useAppContext();

  // Mode settings
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  
  // Custom Steppers
  const [customFocusDuration, setCustomFocusDuration] = useState(25);
  const [customBreakDuration, setCustomBreakDuration] = useState(5);

  // States
  const [phase, setPhase] = useState<'focus' | 'break' | 'long_break'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // In seconds
  const [totalDuration, setTotalDuration] = useState(25 * 60); // Save starting duration for SVG track
  const [sessionIndex, setSessionIndex] = useState(0); // 0 to 3
  
  // App/Screen controls
  const [isLocked, setIsLocked] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  
  // Visual Celebrations: Confetti list
  const [confettiList, setConfettiList] = useState<ConfettiParticle[]>([]);
  const confettiCounter = useRef(0);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Premium ADHD Sensory & Audio System States
  const [activeAmbiance, setActiveAmbiance] = useState<'none' | 'brown' | 'pink' | 'rain' | 'alpha'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.25);
  const [tickModeEnabled, setTickModeEnabled] = useState(false);
  const [breathingIndicatorText, setBreathingIndicatorText] = useState('Inhale deeply...');
  const [breathingActive, setBreathingActive] = useState(false);
  const [ambientPanelOpen, setAmbientPanelOpen] = useState(false);

  // Sync soundscape play logic
  useEffect(() => {
    if (activeAmbiance !== 'none') {
      ambientSoundEngine.play(activeAmbiance, ambientVolume);
    } else {
      ambientSoundEngine.stop();
    }
    return () => {
      ambientSoundEngine.stop();
    };
  }, [activeAmbiance]);

  // Adjust volume separately
  useEffect(() => {
    ambientSoundEngine.setVolume(ambientVolume);
  }, [ambientVolume]);

  // Metronome tick sound cue each second
  useEffect(() => {
    if (isRunning && tickModeEnabled) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tickCtx = new AudioContextClass();
          const tnow = tickCtx.currentTime;
          const osc = tickCtx.createOscillator();
          const gain = tickCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, tnow);
          
          gain.gain.setValueAtTime(0.003, tnow); // very subtle focus tick anchor
          gain.gain.exponentialRampToValueAtTime(0.0001, tnow + 0.015);
          
          osc.connect(gain);
          gain.connect(tickCtx.destination);
          
          osc.start(tnow);
          osc.stop(tnow + 0.02);
        }
      } catch (e) {
        // fail silently
      }
    }
  }, [timeLeft, isRunning, tickModeEnabled]);

  // Mindful Box Breathing Cycle during rest break: 4s inhale, 4s hold, 4s exhale, 4s reset
  useEffect(() => {
    if (phase !== 'focus' && isRunning) {
      setBreathingActive(true);
      let cycle = 0;
      const labels = ['Inhale deeply... 👃', 'Hold breath... 🧘', 'Exhale softly... 💨', 'Rest quiet... ✨'];
      setBreathingIndicatorText(labels[0]);

      const cycleTimer = setInterval(() => {
        cycle = (cycle + 1) % 4;
        setBreathingIndicatorText(labels[cycle]);
      }, 4000);

      return () => {
        clearInterval(cycleTimer);
        setBreathingActive(false);
      };
    } else {
      setBreathingActive(false);
    }
  }, [phase, isRunning]);

  // Load routine details if directed from dashboard
  const { routines } = useAppContext();
  const activeFocusRoutine = routines.find(r => r.id === selectedRoutineId);

  // Synchronize timer duration on mode change
  useEffect(() => {
    if (isRunning) return; // Prevent reset mid-run

    if (activeFocusRoutine && activeFocusRoutine.steps.length > 0) {
      // If loaded from routine: sum total or let them click step-by-step
      const firstStepDuration = activeFocusRoutine.steps[0].duration_minutes;
      setTimeLeft(firstStepDuration * 60);
      setTotalDuration(firstStepDuration * 60);
      setPhase('focus');
    } else {
      const minutes = timerMode === 'pomodoro' ? 25 : customFocusDuration;
      setTimeLeft(minutes * 60);
      setTotalDuration(minutes * 60);
      setPhase('focus');
    }
  }, [timerMode, customFocusDuration, selectedRoutineId, activeFocusRoutine]);

  // Audio & Quote rotator tick
  useEffect(() => {
    if (isRunning) {
      // Quote rotator every 1.5 minutes or on ticks
      const quoteTimer = setInterval(() => {
        setCurrentQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, 75000);

      return () => clearInterval(quoteTimer);
    }
  }, [isRunning]);

  // Main countdown handle
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // End of phase countdown trigger!
            clearInterval(intervalRef.current!);
            handlePhaseTransition();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase, sessionIndex, timerMode, customFocusDuration, customBreakDuration]);

  // Handle CSS Confetti explosion physics
  useEffect(() => {
    if (confettiList.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setConfettiList((prev) => 
        prev
          .map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return {
              ...p,
              x: p.x + Math.cos(rad) * p.speed,
              y: p.y + Math.sin(rad) * p.speed + 2.5, // Gravity bias
              speed: p.speed * 0.98, // Friction decay
            };
          })
          .filter((p) => p.y < window.innerHeight + 10 && p.x > -10 && p.x < window.innerWidth + 10)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [confettiList]);

  // Trigger DOM confetti explosion
  const explodeConfetti = () => {
    const list: ConfettiParticle[] = [];
    const colors = ['#6C63FF', '#A855F7', '#FF9800', '#4CAF50', '#FF5252', '#FFEB3B'];
    
    // Generate 65 particles radiating from bottom corners and center
    for (let i = 0; i < 70; i++) {
      confettiCounter.current += 1;
      const angle = Math.random() * 80 + 230; // upward expand arc
      const speed = Math.random() * 15 + 10;
      list.push({
        id: confettiCounter.current,
        x: window.innerWidth / 2 + (Math.random() * 40 - 20),
        y: window.innerHeight - 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 5,
        angle,
        speed
      });
    }

    setConfettiList(list);
  };

  // Phase transition router
  const handlePhaseTransition = () => {
    setIsRunning(false);

    if (phase === 'focus') {
      const isPomSessionEnd = timerMode === 'pomodoro';
      const lastCompletedSessionIdx = sessionIndex;

      if (isPomSessionEnd) {
        const nextIdx = sessionIndex + 1;
        setSessionIndex(nextIdx);

        if (nextIdx >= 4) {
          // Completed full Pomodoro set of 4 sessions!
          setPhase('long_break');
          const longBreakMin = 15;
          setTimeLeft(longBreakMin * 60);
          setTotalDuration(longBreakMin * 60);
          setSessionIndex(0); // Reset dots

          // Log complete focus set
          createSession(100, 'pomodoro', true);
          addXP(50, "Full Pomodoro block cleared (4 sprints)! 🎉");
          explodeConfetti();
          triggerHapticFeedback('success');
          if (soundEnabled) playBellNotification('complete');
          
          // Free Users Interstitial Ad mock trigger!
          if (!isPremium) {
            setTimeout(() => {
              showToast('info', 'Consistency Sparked! 📈', 'Want to train completely ad-free? Unlock Premium in Settings!');
            }, 1500);
          }
        } else {
          // Normal focus break
          setPhase('break');
          const breakMin = 5;
          setTimeLeft(breakMin * 60);
          setTotalDuration(breakMin * 60);

          createSession(25, 'pomodoro', true);
          triggerHapticFeedback('success');
          if (soundEnabled) playBellNotification('break');
        }
      } else {
        // Custom focus ended
        setPhase('break');
        const breakMin = customBreakDuration;
        setTimeLeft(breakMin * 60);
        setTotalDuration(breakMin * 60);

        createSession(customFocusDuration, 'custom', true);
        triggerHapticFeedback('success');
        if (soundEnabled) playBellNotification('break');
      }
    } else {
      // Break / Long Break ended, back to Focus!
      setPhase('focus');
      const min = timerMode === 'pomodoro' ? 25 : customFocusDuration;
      setTimeLeft(min * 60);
      setTotalDuration(min * 60);
      triggerHapticFeedback('success');
      if (soundEnabled) playBellNotification('focus');
    }
  };

  // Reset timer
  const handleResetTimer = () => {
    triggerHapticFeedback('medium');
    setIsRunning(false);
    
    if (activeFocusRoutine && activeFocusRoutine.steps.length > 0) {
      const firstStepDuration = activeFocusRoutine.steps[0].duration_minutes;
      setTimeLeft(firstStepDuration * 60);
      setTotalDuration(firstStepDuration * 60);
    } else {
      const min = timerMode === 'pomodoro' ? 25 : customFocusDuration;
      setTimeLeft(min * 60);
      setTotalDuration(min * 60);
    }
    
    setPhase('focus');
  };

  // Skip Phase
  const handleSkipPhase = () => {
    triggerHapticFeedback('light');
    if (confirm("Skip this timer phase? Your focus metrics for this sprint won't be fully logged.")) {
      handlePhaseTransition();
    }
  };

  // Time format text
  const formatTimeText = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // SVG Progress calculation parameters
  const svgRadius = 110;
  const svgCircumference = 2 * Math.PI * svgRadius;
  const progressRatio = timeLeft / totalDuration;
  const strokeDashoffset = isNaN(progressRatio) ? 0 : svgCircumference * (1 - progressRatio);

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-inherit select-none pb-24 flex flex-col justify-between h-full min-h-0 relative">
      
      {/* Visual Confetti overlays */}
      {confettiList.map((p) => (
        <span 
          key={p.id}
          className="fixed pointer-events-none rounded-xs select-none z-50 transition-all duration-75"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.angle}deg)`,
            opacity: 0.95
          }}
        />
      ))}

      {/* Top Title Bar */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-black/5 dark:bg-[#1A1A2E]/20 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <span className="bento-label">MIND SPRINT</span>
          <h2 className="text-xl font-bold font-display mt-0.5 text-slate-800 dark:text-white">Timer Sprints</h2>
        </div>

        {/* Audio control button */}
        <div className="flex space-x-2">
          <button
            onClick={() => { triggerHapticFeedback('light'); setSoundEnabled(!soundEnabled); }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition cursor-pointer ${
              soundEnabled ? 'bg-[#6C63FF]/15 border-[#6C63FF]/30 text-[#6C63FF]' : 'bg-transparent border-slate-200 dark:border-white/10 text-gray-400'
            }`}
            title={soundEnabled ? "Mute bell sounds" : "Enable bells"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Screen lock preventing accidental tab navigation click */}
          <button
            onClick={() => { triggerHapticFeedback('medium'); setIsLocked(!isLocked); }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition cursor-pointer ${
              isLocked ? 'bg-orange-500/15 border-orange-500/35 text-orange-500' : 'bg-transparent border-slate-200 dark:border-white/10 text-gray-400'
            }`}
            title="Lock focus controls"
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-5 py-5 flex-1 flex flex-col justify-between max-w-sm mx-auto w-full">

        {/* Mode Toggles */}
        {!isLocked && (
          <div className="flex bg-slate-100 dark:bg-[#1A1A2E] p-1 rounded-xl border border-slate-200 dark:border-white/5 select-none mx-6 shrink-0 z-10 scale-95 md:scale-100">
            <button
              onClick={() => { triggerHapticFeedback('light'); setTimerMode('pomodoro'); onClearSelectedRoutine(); }}
              className={`flex-1 h-9 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                timerMode === 'pomodoro' && !selectedRoutineId
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 dark:text-[#8888AA] hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => { triggerHapticFeedback('light'); setTimerMode('custom'); onClearSelectedRoutine(); }}
              className={`flex-1 h-9 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                timerMode === 'custom' && !selectedRoutineId
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 dark:text-[#8888AA] hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Custom Sprints
            </button>
          </div>
        )}

        {/* In-use Active Routine Banner */}
        {activeFocusRoutine && (
          <div className="bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-400/20 px-3.5 py-2 rounded-xl text-center text-xs text-indigo-700 dark:text-indigo-200 mt-2 flex items-center justify-between shrink-0 scale-95 mx-4">
            <div className="flex items-center space-x-2">
              <span>🚀</span>
              <span className="font-bold truncate max-w-[140px]">Routine: {activeFocusRoutine.name}</span>
            </div>
            <button 
              onClick={() => { triggerHapticFeedback('light'); onClearSelectedRoutine(); }} 
              className="text-[10px] hover:underline font-mono text-slate-400 dark:text-[#8888AA] uppercase cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Custom Steppers row shown ONLY if custom mode */}
        {timerMode === 'custom' && !selectedRoutineId && !isLocked && (
          <div className="grid grid-cols-2 gap-3 shrink-0 scale-90 mx-2">
            {/* Focus duration stepper */}
            <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-2.5 rounded-2xl flex flex-col items-center">
              <span className="bento-label block">Focus block</span>
              <div className="flex items-center space-x-3 mt-1.5 bg-slate-100 dark:bg-black/25 px-2 py-0.5 rounded-lg select-none text-slate-800 dark:text-white">
                <button
                  type="button"
                  onClick={() => { triggerHapticFeedback('light'); setCustomFocusDuration(Math.max(5, customFocusDuration - 5)); }}
                  className="px-1.5 font-extrabold text-sm hover:opacity-70"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold text-inherit">{customFocusDuration}m</span>
                <button
                  type="button"
                  onClick={() => { triggerHapticFeedback('light'); setCustomFocusDuration(customFocusDuration + 5); }}
                  className="px-1.5 font-extrabold text-sm hover:opacity-70"
                >
                  +
                </button>
              </div>
            </div>

            {/* Break duration stepper */}
            <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-2.5 rounded-2xl flex flex-col items-center">
              <span className="bento-label block">Break block</span>
              <div className="flex items-center space-x-3 mt-1.5 bg-slate-100 dark:bg-black/25 px-2 py-0.5 rounded-lg select-none text-slate-800 dark:text-white">
                <button
                  type="button"
                  onClick={() => { triggerHapticFeedback('light'); setCustomBreakDuration(Math.max(1, customBreakDuration - 1)); }}
                  className="px-1.5 font-extrabold text-sm hover:opacity-70"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold text-inherit">{customBreakDuration}m</span>
                <button
                  type="button"
                  onClick={() => { triggerHapticFeedback('light'); setCustomBreakDuration(customBreakDuration + 1); }}
                  className="px-1.5 font-extrabold text-sm hover:opacity-70"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Circular SVG Timer Stage */}
        <div className="relative flex items-center justify-center py-6 select-none shrink-0 scale-95 md:scale-100">
          
          {/* Box Breathing Soothing Radial Ripple Circle (pulsates dynamically based on cycle state) */}
          {breathingActive && (
            <div className={`absolute w-44 h-44 rounded-full bg-[#4CAF50]/10 dark:bg-[#4CAF50]/15 transition-all duration-[3800ms] ease-in-out ${
              breathingIndicatorText.includes('Inhale') 
                ? 'scale-125 opacity-100 blur-xs' 
                : breathingIndicatorText.includes('Hold')
                  ? 'scale-115 opacity-80'
                  : breathingIndicatorText.includes('Exhale')
                    ? 'scale-90 opacity-40 blur-none'
                    : 'scale-100 opacity-60'
            }`} />
          )}

          {/* SVG Progress Ring */}
          <svg className="w-64 h-64 -rotate-90 select-none z-10">
            {/* Dark track circle */}
            <circle
              cx="128"
              cy="128"
              r={svgRadius}
              className="stroke-slate-100 dark:stroke-zinc-800"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Animated primary progress ring */}
            <circle
              cx="128"
              cy="128"
              r={svgRadius}
              className={`transition-all duration-300 ${
                phase === 'focus' ? 'stroke-[#6C63FF]' : 'stroke-[#4CAF50]'
              }`}
              strokeWidth="8"
              strokeDasharray={svgCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time digits centered */}
          <div className="absolute text-center flex flex-col items-center justify-center select-none z-20">
            {/* Running tag status */}
            <span className={`text-[10px] font-black tracking-[4px] uppercase ${
              phase === 'focus' ? 'text-violet-500' : 'text-[#4CAF50]'
            }`}>
              {phase === 'focus' ? 'FOCUS 🎯' : phase === 'break' ? 'BREAK 🌿' : 'RELAX 🛋️'}
            </span>

            {/* Heavy clock typography */}
            <span className="text-4xl md:text-5xl font-black font-mono tracking-tight text-slate-800 dark:text-white mt-1 select-all h-20 flex items-center">
              {formatTimeText(timeLeft)}
            </span>

            {/* Motivational sub-quote / Breathing instructions */}
            {isRunning && (
              <span className="text-[10px] font-semibold text-slate-400 dark:text-[#8888AA] tracking-wide mt-1 animate-fade-in block h-4 max-w-[180px] truncate leading-none">
                {breathingActive ? breathingIndicatorText : MOTIVATIONAL_QUOTES[currentQuoteIdx]}
              </span>
            )}
          </div>
        </div>

        {/* 4-set dots panel */}
        {timerMode === 'pomodoro' && (
          <div className="flex items-center justify-center space-x-3.5 shrink-0 my-1">
            {[0, 1, 2, 3].map((idx) => {
              const completed = idx < sessionIndex;
              const current = idx === sessionIndex && isRunning;
              return (
                <div 
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                    completed 
                      ? 'bg-[#6C63FF] border-[#6C63FF] scale-110 shadow shadow-[#6C63FF]/35' 
                      : current
                        ? 'bg-transparent border-[#6C63FF] animate-pulse scale-105'
                        : 'bg-transparent border-slate-300 dark:border-white/10'
                  }`}
                  title={`${idx + 1} of 4 pomodoros`}
                />
              );
            })}
          </div>
        )}

        {/* ADHD Sensory Shield Collapsible block */}
        {!isLocked && (
          <div className="bento-card border border-slate-205 dark:border-white/5 bg-slate-50/50 dark:bg-[#151619]/60 px-4 py-3 rounded-2xl space-y-2.5 mx-2 shadow-xs scale-95 select-none shrink-0">
            <div 
              onClick={() => { triggerHapticFeedback('light'); setAmbientPanelOpen(!ambientPanelOpen); }}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-[#6C63FF]" />
                <span className="text-[11px] font-black tracking-wider uppercase opacity-85">ADHD Sensory Shield</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded font-bold opacity-60">
                  {activeAmbiance === 'none' ? 'Inert' : activeAmbiance.toUpperCase()}
                </span>
                <span className="text-xs transition-transform duration-200" style={{ transform: ambientPanelOpen ? 'rotate(90deg)' : 'none' }}>
                  ❯
                </span>
              </div>
            </div>

            {ambientPanelOpen && (
              <div className="space-y-3.5 pt-1.5 scale-95 origin-top transition-all duration-200">
                {/* Active loop triggers */}
                <span className="text-[9px] font-bold text-slate-400 dark:text-[#8888AA] tracking-widest block font-mono uppercase">Mindful Backdrop Nodes</span>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'none', label: 'Off', icon: '🔇' },
                    { id: 'brown', label: 'Brown', icon: '🎚️' },
                    { id: 'pink', label: 'Pink', icon: '💨' },
                    { id: 'rain', label: 'Rain', icon: '🌧️' },
                    { id: 'alpha', label: 'Alpha', icon: '⚛️' }
                  ].map((amb) => (
                    <button
                      key={amb.id}
                      onClick={() => {
                        triggerHapticFeedback('light');
                        setActiveAmbiance(amb.id as any);
                      }}
                      className={`py-1 px-1 rounded-xl border flex flex-col items-center justify-center space-y-1 transition text-[9px] font-bold cursor-pointer ${
                        activeAmbiance === amb.id
                          ? 'bg-[#6C63FF] border-transparent text-white'
                          : 'bg-white dark:bg-black/15 border-slate-200 dark:border-white/5 hover:border-[#6C63FF]/30'
                      }`}
                    >
                      <span className="text-sm select-none">{amb.icon}</span>
                      <span className="truncate w-full max-w-[34px]">{amb.label}</span>
                    </button>
                  ))}
                </div>

                {/* Ambient dynamic sound volume level controls */}
                {activeAmbiance !== 'none' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[9px] font-bold opacity-75 animate-fade-in">
                      <span className="flex items-center space-x-1.5">
                        <Sliders className="w-3 h-3 text-[#6C63FF]" />
                        <span>Dynamic audio focus envelope</span>
                      </span>
                      <span>{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.80"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-black/25 rounded-lg appearance-none cursor-pointer accent-[#6C63FF]"
                    />
                  </div>
                )}

                {/* Split line separator */}
                <div className="h-[1px] bg-slate-200 dark:bg-white/5" />

                {/* Satisfying keyboard tick cue metronome */}
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold block">Focus Beat Metronome</span>
                    <p className="text-[9px] opacity-60 leading-none">Delivers a tiny audio tick every second</p>
                  </div>
                  <button
                    onClick={() => { triggerHapticFeedback('light'); setTickModeEnabled(!tickModeEnabled); }}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-[9px] tracking-wide uppercase transition cursor-pointer ${
                      tickModeEnabled 
                        ? 'bg-[#6C63FF] border-transparent text-white' 
                        : 'bg-white dark:bg-black/15 border-slate-200 dark:border-white/10 opacity-70'
                    }`}
                  >
                    {tickModeEnabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls Layout Panel */}
        <div className="flex items-center justify-center space-x-7 shrink-0 z-20">
          
          {/* RESET BUTTON */}
          <button
            onClick={handleResetTimer}
            disabled={isLocked}
            className={`w-11 h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white rounded-full flex items-center justify-center border border-slate-200 dark:border-white/5 transition cursor-pointer ${
              isLocked ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 dark:text-[#8888AA]'
            }`}
            title="Reset schedule clock"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* PLAY/PAUSE BIG BUTTON */}
          <button
            onClick={() => {
              triggerHapticFeedback('medium');
              setIsRunning(!isRunning);
            }}
            className={`w-18 h-18 text-white rounded-full flex items-center justify-center shadow-lg transition active:scale-[0.96] hover:scale-105 cursor-pointer ${
              isLocked 
                ? 'bg-gray-400 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                : phase === 'focus'
                  ? 'bg-[#6C63FF] hover:bg-[#5b52e0] shadow-[#6C63FF]/25'
                  : 'bg-[#4CAF50] hover:bg-[#3d943f] shadow-[#4CAF50]/25'
            }`}
            disabled={isLocked}
            aria-label={isRunning ? "Pause Timer" : "Start Timer"}
          >
            {isRunning ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            )}
          </button>

          {/* SKIP BUTTON */}
          <button
            onClick={handleSkipPhase}
            disabled={isLocked}
            className={`w-11 h-11 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-white rounded-full flex items-center justify-center border border-slate-200 dark:border-white/5 transition cursor-pointer ${
              isLocked ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 dark:text-[#8888AA]'
            }`}
            title="Skip phase forward"
            aria-label="Skip Phase"
          >
            <SkipForward className="w-4 h-4" />
          </button>

        </div>

      </div>

      <style>{`
        @keyframes bouncePlay {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .animate-pulse-play {
          animation: bouncePlay 2s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};

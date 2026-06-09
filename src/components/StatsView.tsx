/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Flame, 
  Clock, 
  Award, 
  CheckCircle, 
  Lock, 
  TrendingUp, 
  ChevronRight,
  Info 
} from 'lucide-react';

interface StatsViewProps {
  onOpenPaywall: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ onOpenPaywall }) => {
  const { streak, sessions, tasks, achievements, isPremium } = useAppContext();

  // 1. Calculate focused totals
  const completedFocusSessions = sessions.filter(s => s.completed);
  const totalFocusMin = completedFocusSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalFocusHrsText = totalFocusMin >= 60 
    ? `${Math.floor(totalFocusMin / 60)}h ${totalFocusMin % 60}m` 
    : `${totalFocusMin} min`;

  const avgSessionMin = completedFocusSessions.length > 0 
    ? Math.round(totalFocusMin / completedFocusSessions.length) 
    : 0;

  // 2. Weekly Focus Minutes data (simulation from populated sessions list)
  const getWeeklyStatsForChart = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    // Create an array for the last 7 days starting from 6 days ago up to today
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = days[d.getDay()];

      // Filter local sessions on that date matching dStr
      const minutesOnDay = sessions
        .filter((s) => s.completed && s.created_at.startsWith(dStr))
        .reduce((sum, s) => sum + s.duration_minutes, 0);

      chartData.push({
        label: dayLabel,
        minutes: minutesOnDay,
        isToday: i === 0,
        tempHeight: Math.min(100, Math.max(5, (minutesOnDay / 90) * 100)) // Max height bias is 90 mins focus on bar
      });
    }
    return chartData;
  };

  const chartData = getWeeklyStatsForChart();

  // 3. Task totals
  const completedTasksCount = tasks.filter(t => t.is_completed).length;
  const activeTasksCount = tasks.filter(t => !t.is_completed).length;

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-inherit select-none pb-24 h-full">
      
      {/* Page Title */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-black/5 dark:bg-[#1A1A2E]/20 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <span className="bento-label">CONSISTENCY ANALYTICS</span>
          <h2 className="text-xl font-bold font-display mt-0.5">Brain Stats</h2>
        </div>
        
        {/* Total Earned XP display */}
        <div className="px-3.5 py-1.5 bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center space-x-1 shadow-sm">
          <span className="text-xs font-black text-indigo-500 dark:text-indigo-400">🏆 {useAppContext().profile?.total_xp || 0} XP</span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* 1. Streak detailed tracker card */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-4.5 flex items-center justify-around text-center shadow-sm">
          {/* Active Streak */}
          <div className="space-y-1">
            <span className="bento-label">CURRENT FIRE</span>
            <div className="flex items-center justify-center space-x-1.5 text-orange-500 font-display">
              <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
              <span className="text-2xl font-black">{streak?.current_streak || 0}</span>
            </div>
            <span className="text-[10px] opacity-60 block font-medium">Days Continuous</span>
          </div>

          <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />

          {/* All-time longest streak */}
          <div className="space-y-1">
            <span className="bento-label">LONGEST SPARK</span>
            <div className="flex items-center justify-center space-x-1 text-yellow-500 font-display">
              <Award className="w-5 h-5 fill-yellow-500" />
              <span className="text-2xl font-black">{streak?.longest_streak || 0}</span>
            </div>
            <span className="text-[10px] opacity-60 block font-medium">Record Days</span>
          </div>

          <div className="w-px h-10 bg-slate-200 dark:bg-white/10" />

          {/* Sessions complete count */}
          <div className="space-y-1">
            <span className="bento-label">TOTAL LOGS</span>
            <div className="flex items-center justify-center space-x-1 text-green-500 font-display">
              <CheckCircle className="w-5 h-5 fill-green-500" />
              <span className="text-2xl font-black">{completedFocusSessions.length}</span>
            </div>
            <span className="text-[10px] opacity-60 block font-medium">Sprints Active</span>
          </div>
        </div>

        {/* 2. Custom Pure SVG Weekly bar chart */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-4.5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="bento-label flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[#6C63FF]" />
              <span>Weekly Focus Minutes</span>
            </h3>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold flex items-center bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/15 shadow-inner">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {totalFocusHrsText} total
            </span>
          </div>

          {/* Visual SVG Core Chart layout */}
          <div className="relative pt-4 pb-2">
            <div className="flex justify-between items-end h-32 px-2 border-b border-slate-200 dark:border-white/10">
              {chartData.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 space-y-2 group cursor-pointer h-full justify-end">
                  
                  {/* Floating tooltip on hover */}
                  <span className="text-[9px] font-mono font-bold text-white bg-black/85 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 -translate-y-1 scale-95 leading-none block shadow z-15">
                    {day.minutes}m
                  </span>

                  {/* Render Visual Bar */}
                  <div 
                    className={`w-5.5 rounded-t-lg transition-all duration-500 ${
                      day.isToday 
                        ? 'bg-gradient-to-t from-[#6C63FF] to-[#A855F7] shadow-sm' 
                        : day.minutes > 0 
                          ? 'bg-[#6C63FF]/60 hover:bg-[#6C63FF]' 
                          : 'bg-slate-100 dark:bg-zinc-800'
                    }`}
                    style={{ height: `${day.tempHeight}%` }}
                  />

                  {/* Day Label */}
                  <span className={`text-[9px] font-mono font-bold tracking-wide ${
                    day.isToday ? 'text-[#6C63FF]' : 'opacity-55'
                  }`}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Focus Cards details row */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-3.5 shadow-sm">
            <span className="bento-label">AVG SESSION TIME</span>
            <strong className="text-lg mt-1 block font-mono">{avgSessionMin} mins</strong>
            <p className="bento-desc mt-0.5">Perfect length to bypass cognitive burnout.</p>
          </div>

          <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] p-3.5 shadow-sm">
            <span className="bento-label">PLANNER TASKS DONE</span>
            <strong className="text-lg mt-1 block font-mono text-green-500 dark:text-green-400">
              {completedTasksCount} <span className="text-[11px] opacity-55 font-sans font-bold">completed</span>
            </strong>
            <p className="bento-desc mt-0.5">{activeTasksCount} pending items waiting on today's catalog.</p>
          </div>
        </div>

        {/* 4. Achievements Matrix */}
        <div className="space-y-3.5 relative">
          
          <div className="flex justify-between items-center">
            <h3 className="bento-label flex items-center space-x-1.5">
              <span>🏆</span>
              <span>ADHD Micro Achievements</span>
            </h3>
            <span className="text-[10px] opacity-60 font-semibold">
              Unlocked ({achievements.filter(a => a.isUnlocked).length} / {achievements.length})
            </span>
          </div>

          {/* Grid Container */}
          <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${!isPremium ? 'filter blur-xs select-none' : ''}`}>
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                className={`bento-card border p-3.5 rounded-2xl text-center flex flex-col items-center justify-between transition-all duration-200 h-36 ${
                  ach.isUnlocked 
                    ? 'bg-white dark:bg-[#151619] border-indigo-500/25 shadow-sm' 
                    : 'bg-transparent border-slate-150 dark:border-white/5 opacity-40 shadow-inner'
                }`}
              >
                {/* Badge Emoji */}
                <span className={`text-3xl leading-none block filter select-none ${
                   ach.isUnlocked ? 'grayscale-0 drop-shadow' : 'grayscale'
                }`}>
                  {ach.isUnlocked ? ach.emoji : '🔒'}
                </span>

                <div className="mt-2.5">
                  <strong className="text-xs font-bold font-display block leading-none truncate w-full px-1">{ach.name}</strong>
                  <span className="text-[9px] font-mono font-black text-indigo-500 dark:text-indigo-400 block mt-1 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/15 py-0.5 rounded-lg px-1">{ach.conditionDescription}</span>
                </div>

                <span className="text-[9px] font-bold opacity-60 block leading-tight mt-1 truncate w-full px-1">
                  {ach.isUnlocked ? `+${ach.xpReward} XP Earned` : `Locked (Reward +${ach.xpReward} XP)`}
                </span>

              </div>
            ))}
          </div>

          {/* Lock Screen overlay if subscriptions status === 'free' */}
          {!isPremium && (
            <div className="absolute inset-x-0 bottom-0 top-7 backdrop-blur-md bg-white/90 dark:bg-[#0c0d10]/95 z-25 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-slate-200 dark:border-white/5">
              <div className="w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-[#6C63FF] mb-3.5">
                <Lock className="w-5 h-5 fill-violet-600/5" />
              </div>
              <strong className="text-slate-800 dark:text-white text-sm font-bold font-display block">Achievements Locker Sealed</strong>
              <p className="text-xs text-slate-500 dark:text-[#8888AA] px-4 leading-relaxed mt-1.5 max-w-xs">
                Unlock the Premium bundle to log complete history metrics, and unseal all 8 custom ADHD consistency badges with XP!
              </p>
              <button
                onClick={() => { triggerHapticFeedback('light'); onOpenPaywall(); }}
                className="mt-4 px-4 h-10 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] font-bold text-[11px] uppercase tracking-wider text-white rounded-xl shadow transition active:scale-[0.98] cursor-pointer"
              >
                Upgrade to Premium
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

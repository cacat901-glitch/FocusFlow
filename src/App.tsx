/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { OnboardingView } from './components/OnboardingView';
import { AuthView } from './components/AuthView';
import { HomeView } from './components/HomeView';
import { RoutinesView } from './components/RoutinesView';
import { FocusView } from './components/FocusView';
import { StatsView } from './components/StatsView';
import { SettingsView } from './components/SettingsView';
import { PaywallModal } from './components/PaywallModal';
import { triggerHapticFeedback } from './utils/haptics';
import { 
  Sparkles, 
  Layers, 
  Smartphone, 
  Laptop, 
  Maximize2, 
  Info,
  Calendar,
  Zap,
  Bookmark,
  Bell,
  CheckCircle2,
  X 
} from 'lucide-react';

function ContainerRouter() {
  const { 
    user, 
    onboardingCompleted, 
    toasts, 
    dismissToast,
    isPremium 
  } = useAppContext();

  // Screen/State indicators
  const [activeTab, setActiveTab] = useState<'home' | 'routines' | 'focus' | 'stats' | 'settings'>('home');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  // Appearance setting state (Dark / Light mode switcher)
  const [lightThemeActive, setLightThemeActive] = useState(false);

  // Emulator versus Responsive Fullscreen view toggler
  const [emulatorMode, setEmulatorMode] = useState(true);

  // Handle direct routine launch button
  const handleSelectRoutineForTimer = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setActiveTab('focus');
  };

  const handleClearSelectedRoutine = () => {
    setSelectedRoutineId(null);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    triggerHapticFeedback('light');
    setActiveTab(tab);
  };

  // Determine current component node to fit in smartphone screen or web view
  const renderSubViewNode = () => {
    if (!onboardingCompleted) {
      return <OnboardingView />;
    }
    if (!user) {
      return <AuthView />;
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeView 
            onNavigateTab={handleTabChange} 
            onSelectRoutineForTimer={handleSelectRoutineForTimer}
            onOpenPaywall={() => setPaywallOpen(true)}
          />
        );
      case 'routines':
        return (
          <RoutinesView 
            onOpenPaywall={() => setPaywallOpen(true)} 
            onSelectRoutineForTimer={handleSelectRoutineForTimer}
            onNavigateTab={handleTabChange}
          />
        );
      case 'focus':
        return (
          <FocusView 
            selectedRoutineId={selectedRoutineId}
            onClearSelectedRoutine={handleClearSelectedRoutine}
            onOpenPaywall={() => setPaywallOpen(true)}
          />
        );
      case 'stats':
        return <StatsView onOpenPaywall={() => setPaywallOpen(true)} />;
      case 'settings':
        return (
          <SettingsView 
            onOpenPaywall={() => setPaywallOpen(true)} 
            onThemeInvertToggle={() => setLightThemeActive(!lightThemeActive)}
            lightThemeActive={lightThemeActive}
          />
        );
      default:
        return <HomeView onNavigateTab={handleTabChange} onSelectRoutineForTimer={handleSelectRoutineForTimer} onOpenPaywall={() => setPaywallOpen(true)} />;
    }
  };

  // Dynamic Theme Styling variables calculated based on lightThemeActive switcher
  const themeStyles = {
    bg: lightThemeActive ? 'bg-[#f1f3f5]' : 'bg-[#0c0d0e]',
    textColor: lightThemeActive ? 'text-slate-800' : 'text-white',
    tabBarBg: lightThemeActive ? 'bg-white border-t border-slate-200 shadow-md shadow-black/5' : 'bg-[#151619] border-t border-white/5'
  };

  return (
    <div className={`min-h-screen flex flex-col xl:flex-row font-sans relative overflow-x-hidden antialiased select-none transition-colors duration-300 ${
      lightThemeActive ? "light-theme bg-[#f1f3f5]" : "dark-theme bg-[#07070F]"
    }`}>
      
      {/* 1. Left Sidebar explaining coping tricks for ADHD users */}
      <aside className={`w-full xl:w-96 shrink-0 p-6 flex flex-col justify-between space-y-6 border-b xl:border-b-0 xl:border-r transition-all duration-300 ${
        lightThemeActive 
          ? "bg-white border-slate-205 text-slate-800 shadow-sm" 
          : "bg-[#101021]/80 xl:bg-[#101021]/40 border-[#22223b]/55 text-gray-100"
      }`}>
        
        {/* Core Product Presentation */}
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <span className="text-4xl filter drop-shadow-[0_4px_10px_rgba(108,99,255,0.25)] block leading-none">🧠</span>
            <div>
              <h1 className={`text-2xl font-black font-display tracking-tight flex items-center space-x-2 ${
                lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'
              }`}>
                <span>FocusFlow</span>
                <span className="text-[10px] bg-[#6C63FF]/15 border border-[#6C63FF]/20 text-[#6C63FF] dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider scale-95 font-sans">Active</span>
              </h1>
              <p className={`text-[11px] font-bold tracking-wider uppercase font-mono mt-0.5 ${
                lightThemeActive ? 'text-slate-400' : 'text-[#8888AA]'
              }`}>Mindful Routine Planner</p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed font-sans ${lightThemeActive ? 'text-slate-500' : 'text-[#8888AA]'}`}>
            FocusFlow breaks down overwhelming routines into quiet, manageable micro-steps with inline sprint timers to help you bypass task freeze or execution fatigue seamlessly.
          </p>

          <div className={`h-px ${lightThemeActive ? 'bg-slate-200' : 'bg-[#22223b]/40'}`} />

          {/* Calm Mindful Advice Block */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold font-display tracking-widest text-[#6C63FF] uppercase flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Mindful Choreography</span>
            </h3>

            <ul className={`space-y-3 text-[11px] leading-relaxed ${lightThemeActive ? 'text-slate-500' : 'text-[#8888AA]'}`}>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 shrink-0 mt-0.5">✦</span>
                <span><strong className={lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'}>Intelligent Sequencing:</strong> Group simple hygiene duties directly in front of sensory rewards (e.g., favorite tea or music) to bridge inertia gaps.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-500 shrink-0 mt-0.5">✦</span>
                <span><strong className={lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'}>Balanced Intervals:</strong> Fast, dedicated action blocks separated by quiet breathing rests preserve executive energy reserves.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-orange-550 shrink-0 mt-0.5">✦</span>
                <span><strong className={lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'}>Visual Anchors:</strong> Tracking consistency streaks visually stimulates direct, non-anxious daily motivation.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Workspace Layout Controls */}
        <div className="pt-4 space-y-3">
          <span className={`text-[10px] font-bold tracking-widest uppercase block font-mono ${
            lightThemeActive ? 'text-slate-400' : 'text-[#8888AA]'
          }`}>APPLICATION LAYOUT</span>
          
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
            lightThemeActive ? 'bg-slate-100 border-slate-200' : 'bg-[#1A1A2E]/55 border-[#2A2A4A]/55'
          }`}>
            <button
              onClick={() => { triggerHapticFeedback('light'); setEmulatorMode(true); }}
              className={`h-9 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition ${
                emulatorMode 
                  ? 'bg-[#6C63FF] text-white shadow shadow-[#6C63FF]/20' 
                  : lightThemeActive ? 'text-slate-500 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </button>

            <button
              onClick={() => { triggerHapticFeedback('light'); setEmulatorMode(false); }}
              className={`h-9 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition ${
                !emulatorMode 
                  ? 'bg-[#6C63FF] text-white shadow shadow-[#6C63FF]/20' 
                  : lightThemeActive ? 'text-slate-500 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Fluid Web</span>
            </button>
          </div>
          
          <div className={`p-3 rounded-xl text-[10px] flex items-start space-x-2 leading-relaxed border ${
            lightThemeActive ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-indigo-950/15 border-indigo-500/10 text-[#8888AA]'
          }`}>
            <Info className="w-4 h-4 text-[#6C63FF] shrink-0 mt-0.5" />
            <p>
              Switch target layout to <strong className={lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'}>Fluid Web</strong> to expand the experience, or stay on <strong className={lightThemeActive ? 'text-slate-800 font-bold' : 'text-white'}>Mobile Phone</strong> to see the exact iOS responsive aspect-ratio boundaries.
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Primary Live Stage Area */}
      <main className="flex-1 flex items-center justify-center p-4 xl:p-8 min-w-0">
        
        {emulatorMode ? (
          /* Real physical looking smartphone frame to demonstrate mobile design beautifully */
          <div className={`relative w-[375px] h-[780px] rounded-[48px] p-3 border-[6px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            lightThemeActive ? "bg-slate-200 border-slate-300" : "bg-[#1A1A2E] border-[#3E3A52]/60"
          }`}>
            
            {/* Top camera Notch sensor pill simulation */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6.5 bg-black rounded-b-2xl z-50 flex items-center justify-center select-none cursor-default">
              <span className="w-2.5 h-2.5 bg-indigo-950 rounded-full inline-block border border-gray-900 absolute right-7" />
              <span className="w-1.5 h-1.5 bg-violet-950 rounded-full inline-block absolute right-7" />
            </div>

            {/* Simulated Phone Status Bar */}
            <div className={`pt-2.5 px-6 pb-2.5 flex justify-between items-center text-[10px] font-bold font-sans select-none z-50 shrink-0 ${
              lightThemeActive ? 'text-slate-800' : 'text-gray-400'
            }`}>
              <span className="font-sans">9:41</span>
              <div className="flex items-center space-x-1 font-sans text-[9px] opacity-80">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Core Router Window pane */}
            <div className={`flex-1 rounded-[32px] overflow-hidden flex flex-col relative ${themeStyles.bg} ${themeStyles.textColor}`}>
              {renderSubViewNode()}

              {/* Primary Mobile Bottom Tabs row - rendered if authenticated and onboarding completed */}
              {onboardingCompleted && user && (
                <nav className={`absolute bottom-0 inset-x-0 h-18 px-3.5 flex justify-between items-center z-40 select-none ${themeStyles.tabBarBg}`}>
                  
                  {/* HOME TAB */}
                  <button
                    onClick={() => handleTabChange('home')}
                    className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 py-1 cursor-pointer select-none outline-none ${
                      activeTab === 'home' 
                        ? 'text-[#6C63FF]' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none filter">🌅</span>
                    <span className="text-[9px] font-bold tracking-wide uppercase">Home</span>
                  </button>

                  {/* ROUTINES TAB */}
                  <button
                    onClick={() => handleTabChange('routines')}
                    className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 py-1 cursor-pointer select-none outline-none ${
                      activeTab === 'routines' 
                        ? 'text-[#6C63FF]' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none filter">📋</span>
                    <span className="text-[9px] font-bold tracking-wide uppercase">Routines</span>
                  </button>

                  {/* CENTRAL FLOATING FOCUS TIMER TAB */}
                  <div className="flex justify-center items-center flex-1 h-full -translate-y-4 select-none relative z-50">
                    <button
                      onClick={() => handleTabChange('focus')}
                      className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all outline-none border border-white/5 ${
                        activeTab === 'focus'
                          ? 'bg-gradient-to-tr from-[#6C63FF] to-[#A855F7] shadow-[#6C63FF]/35 scale-105'
                          : 'bg-[#6C63FF] hover:bg-[#5b52e0] shadow-[#6C63FF]/20'
                      }`}
                      title="Sprint timer"
                    >
                      <span className="text-2xl filter drop-shadow leading-none">🎯</span>
                    </button>
                  </div>

                  {/* STATS TAB */}
                  <button
                    onClick={() => handleTabChange('stats')}
                    className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 py-1 cursor-pointer select-none outline-none ${
                      activeTab === 'stats' 
                        ? 'text-[#6C63FF]' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none filter">📊</span>
                    <span className="text-[9px] font-bold tracking-wide uppercase">Stats</span>
                  </button>

                  {/* SETTINGS TAB */}
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 py-1 cursor-pointer select-none outline-none ${
                      activeTab === 'settings' 
                        ? 'text-[#6C63FF]' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-800' : 'text-[#8888AA] hover:text-white'
                    }`}
                  >
                    <span className="text-xl shrink-0 leading-none filter">⚙️</span>
                    <span className="text-[9px] font-bold tracking-wide uppercase">Setup</span>
                  </button>

                </nav>
              )}
            </div>

            {/* Apple Home navigation indicator bar simulation at bottom of smartphone */}
            <div className="h-5 flex items-center justify-center select-none pointer-events-none">
              <span className={`w-32 h-1 rounded-full ${
                lightThemeActive ? 'bg-slate-300' : 'bg-gray-600'
              }`} />
            </div>

          </div>
        ) : (
          /* Expandable Fullscreen fluid responsive web app widget container */
          <div className={`w-full max-w-xl aspect-square h-[80vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between border transition-all duration-300 ${
            lightThemeActive ? 'bg-white border-slate-200' : 'bg-[#151619] border-white/5'
          }`}>
            
            {/* Fluid title navigation bar top */}
            <div className={`px-5 py-3 h-12 flex items-center justify-between text-xs border-b ${
              lightThemeActive ? 'bg-slate-50 border-slate-200 text-slate-500 font-semibold' : 'bg-[#0f0f12] border-white/5 text-[#8888AA]'
            }`}>
              <span className="font-bold">FocusFlow Live Workspace</span>
              <span className="font-mono text-[10px]">Development version 1.0.0</span>
            </div>

            {/* Core Screen */}
            <div className={`flex-1 overflow-hidden flex flex-col relative ${themeStyles.bg} ${themeStyles.textColor}`}>
              {renderSubViewNode()}

              {/* Bottom fluid browser dashboard buttons tab bar */}
              {onboardingCompleted && user && (
                <nav className={`h-16 px-4 flex justify-between items-center shrink-0 z-40 shadow-xl ${themeStyles.tabBarBg}`}>
                  <button
                    onClick={() => handleTabChange('home')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition ${
                      activeTab === 'home' 
                        ? 'bg-[#6C63FF]/15 text-[#6C63FF] font-bold' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-850' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">🌅</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Home</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('routines')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition ${
                      activeTab === 'routines' 
                        ? 'bg-[#6C63FF]/15 text-[#6C63FF] font-bold' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-855' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">📋</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Routines</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('focus')}
                    className={`flex items-center space-x-1 px-4 py-2 text-white rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] font-bold shadow-lg shadow-[#6C63FF]/20 active:scale-95 transition`}
                  >
                    <span className="text-sm">🎯</span>
                    <span className="text-xs uppercase tracking-wider">Timer Sprint</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('stats')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition ${
                      activeTab === 'stats' 
                        ? 'bg-[#6C63FF]/15 text-[#6C63FF] font-bold' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-850' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">📊</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Stats</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl transition ${
                      activeTab === 'settings' 
                        ? 'bg-[#6C63FF]/15 text-[#6C63FF] font-bold' 
                        : lightThemeActive ? 'text-slate-400 hover:text-slate-850' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">⚙️</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Setup</span>
                  </button>
                </nav>
              )}
            </div>

          </div>
        )}

      </main>

      {/* 3. In-app Toaster custom alerts manager representing dynamic popups inside frame */}
      <div className="fixed top-5 right-5 z-[100] max-w-xs space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl flex items-start space-x-3 shadow-2xl animate-toast-slide-in relative select-none w-72 border ${
              lightThemeActive 
                ? 'bg-white border-slate-200 text-slate-800' 
                : 'bg-[#151619] border-white/5 text-white shadow-inner shadow-black/25'
            }`}
          >
            {/* Icon categorization indicator */}
            <span className="text-2xl shrink-0 mt-0.5 select-none leading-none">
              {toast.type === 'success' ? '🏆' : toast.type === 'info' ? 'ℹ️' : toast.type === 'warning' ? '⚠️' : '🚨'}
            </span>

            {/* Alert contents */}
            <div className="flex-1">
              <strong className="text-xs font-bold block text-white font-display leading-tight">{toast.title}</strong>
              <p className="text-[10px] text-[#8888AA] mt-1 pr-6 leading-normal">{toast.message}</p>
            </div>

            {/* Close */}
            <button 
              onClick={() => { triggerHapticFeedback('light'); dismissToast(toast.id); }}
              className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 4. Full screen interactive paywall model handles */}
      {paywallOpen && (
        <PaywallModal onClose={() => setPaywallOpen(false)} />
      )}

      {/* Custom Keyframed layout effects */}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120px) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .animate-toast-slide-in {
          animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ContainerRouter />
    </AppProvider>
  );
}

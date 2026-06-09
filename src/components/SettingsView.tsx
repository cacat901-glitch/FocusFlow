/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  User, 
  Settings, 
  Bell, 
  ChevronRight, 
  CreditCard, 
  Volume2, 
  Smartphone,
  Eye, 
  Sparkles, 
  LogOut, 
  Check, 
  Info,
  X 
} from 'lucide-react';

const AVATARS_OPTIONS = ['🧠', '⚡', '💡', '🌟', '🍀', '🌈', '🔥', '💧', '🪴', '🧘', '🎧', '🎮', '🦄', '🦁', '🦊', '🦉'];

interface SettingsViewProps {
  onOpenPaywall: () => void;
  onThemeInvertToggle: () => void;
  lightThemeActive: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onOpenPaywall, 
  onThemeInvertToggle,
  lightThemeActive
}) => {
  const { 
    user, 
    profile, 
    updateProfile, 
    isPremium, 
    signOut, 
    showToast 
  } = useAppContext();

  // Dialog state: edit avatar
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [activeAvatar, setActiveAvatar] = useState(profile?.avatar_emoji || '🧠');

  // App Toggles (Local simulation variables in component state)
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [ambientSounds, setAmbientSounds] = useState(true);
  const [pushReminders, setPushReminders] = useState(true);

  // Focus Default Parameters
  const [defFocusDuration, setDefFocusDuration] = useState(25);
  const [defBreakDuration, setDefBreakDuration] = useState(5);

  const handleSaveProfileChanges = () => {
    if (!displayName.trim()) {
      triggerHapticFeedback('error');
      showToast('error', 'Error Saving', 'Display name cannot be left blank.');
      return;
    }
    updateProfile(displayName.trim(), activeAvatar);
    triggerHapticFeedback('success');
  };

  const handleRatingClick = () => {
    triggerHapticFeedback('success');
    showToast('success', 'Thank You!', 'FocusFlow ratings processed! We appreciate your 5-star feedback! ⭐⭐⭐⭐⭐');
  };

  const handleLegalClick = (docType: string) => {
    triggerHapticFeedback('light');
    alert(`FocusFlow ${docType} Document - Standard Sandbox Notice:\n\nAll details are strictly saved locally to protect your data privacy. Your account is secured. No telemetry logged.`);
  };

  const handleToggleHaptics = (val: boolean) => {
    setHapticsEnabled(val);
    triggerHapticFeedback(val ? 'success' : 'light');
    showToast('info', val ? 'Haptic feedback on' : 'Haptic feedback off', val ? 'Tactile mechanism fully calibrated.' : 'Haptics silenced.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent text-inherit select-none pb-24 h-full">
      
      {/* Page Title */}
      <div className="px-5 pt-6 pb-4 flex justify-between items-center bg-black/5 dark:bg-[#1A1A2E]/20 border-b border-slate-200/50 dark:border-white/5">
        <div>
          <span className="bento-label">APPLICATION SETTINGS</span>
          <h2 className="text-xl font-bold font-display mt-0.5">Settings</h2>
        </div>
        
        {/* Sign Out Shortcut top corner */}
        <button
          onClick={() => { if(confirm("Are you sure you want to sign out?")) signOut(); }}
          className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold border border-red-500/20 hover:border-transparent text-[10px] uppercase rounded-xl transition flex items-center space-x-1 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">

        {/* 1. Account Profile Panel */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] rounded-2xl p-4.5 space-y-4 shadow-sm">
          <h3 className="bento-label flex items-center space-x-1.5 px-0.5">
            <User className="w-4 h-4 text-[#6C63FF]" />
            <span>Profile details</span>
          </h3>

          <div className="flex items-center space-x-4">
            {/* Tappable Avatar Picker trigger */}
            <div 
              onClick={() => { triggerHapticFeedback('light'); setAvatarModalOpen(true); }}
              className="relative w-15 h-15 bg-slate-50 dark:bg-black/15 border border-slate-200 dark:border-white/5 hover:border-[#6C63FF] rounded-2xl flex items-center justify-center text-4.5xl cursor-pointer transition select-none filter leading-none pt-1 group active:scale-[0.98]"
              title="Change avatar emoji"
            >
              {activeAvatar}
              {/* small pen indicator overlay */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#6C63FF] rounded-full border border-white dark:border-[#1A1A2E] flex items-center justify-center text-[9px] text-white">
                ✏️
              </span>
            </div>

            {/* Editing Inputs */}
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full h-9 px-3 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white border border-slate-200 dark:border-white/5 hover:border-[#6C63FF] text-xs font-semibold rounded-lg outline-none transition"
              />
              <span className="text-[10px] font-mono text-slate-450 dark:text-[#8888AA] font-bold block truncate max-w-xs pl-1">
                Auth: {user?.email || 'offline-sandbox@domain.com'}
              </span>
            </div>
            
            {/* Save profile badge */}
            <button
              onClick={handleSaveProfileChanges}
              className="px-3 h-9 bg-[#6C63FF] hover:bg-[#5b52e0] text-white font-bold text-xs rounded-lg transition cursor-pointer shadow-sm"
            >
              Save
            </button>
          </div>
        </div>

        {/* 2. Premium membership promo badge */}
        {isPremium ? (
          <div className="bg-gradient-to-br from-indigo-950/20 to-violet-950/20 dark:from-indigo-950/40 dark:to-violet-950/40 border border-[#A855F7]/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3.5">
              <span className="text-3xl select-none filter drop-shadow-[0_4px_8px_rgba(168,85,247,0.3)] leading-none block">⭐</span>
              <div>
                <strong className="text-slate-800 dark:text-white text-sm font-bold block font-display flex items-center space-x-1.5">
                  <span>Premium Active Membership</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-ping" />
                </strong>
                <p className="text-[11px] text-violet-600 dark:text-[#A855F7] mt-0.5 font-semibold">Self-renewing entitlement calibrated.</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
        ) : (
          <div 
            onClick={() => { triggerHapticFeedback('light'); onOpenPaywall(); }}
            className="bg-gradient-to-br from-[#6C63FF] to-[#A855F7] hover:opacity-95 rounded-2xl p-4.5 text-white flex items-center justify-between cursor-pointer shadow-lg shadow-[#6C63FF]/15 group transition"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-3xl select-none leading-none block">👑</span>
              <div>
                <strong className="text-xs font-bold uppercase tracking-wider block">⭐ UPGRADE TO PREMIUM ⭐</strong>
                <p className="text-xs font-medium text-white/90 leading-snug mt-0.5">
                  Design unlimited plans, alarm remotes, tracing stats, and mute distracting ads.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white shrink-0 group-hover:translate-x-1 transition" />
          </div>
        )}

        {/* 3. Focus steppers default params config */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] rounded-2xl p-4.5 space-y-4 shadow-sm">
          <h3 className="bento-label flex items-center space-x-1.5 px-0.5">
            <Settings className="w-4 h-4 text-[#6C63FF]" />
            <span>Focus Configuration Defaults</span>
          </h3>

          <div className="space-y-4.5 pt-1">
            {/* Default focus length */}
            <div className="flex justify-between items-center text-xs">
              <div className="pr-4">
                <span className="font-bold block">Focus Duration Defaults</span>
                <span className="text-[10px] opacity-60">Initial block size inside Pomodoro set.</span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-black/20 px-2.5 py-1 rounded-lg text-slate-800 dark:text-white">
                <button
                  onClick={() => { triggerHapticFeedback('light'); setDefFocusDuration(Math.max(5, defFocusDuration - 5)); }}
                  className="font-bold hover:opacity-80"
                >
                  -
                </button>
                <span className="font-mono font-bold w-12 text-center text-inherit">{defFocusDuration}m</span>
                <button
                  onClick={() => { triggerHapticFeedback('light'); setDefFocusDuration(defFocusDuration + 5); }}
                  className="font-bold hover:opacity-80"
                >
                  +
                </button>
              </div>
            </div>

            {/* Default split break */}
            <div className="flex justify-between items-center text-xs">
              <div className="pr-4">
                <span className="font-bold block">Break Duration Defaults</span>
                <span className="text-[10px] opacity-60">Short rest break inside session blocks.</span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-black/20 px-2.5 py-1 rounded-lg text-slate-800 dark:text-white">
                <button
                  onClick={() => { triggerHapticFeedback('light'); setDefBreakDuration(Math.max(1, defBreakDuration - 1)); }}
                  className="font-bold hover:opacity-80"
                >
                  -
                </button>
                <span className="font-mono font-bold w-12 text-center text-inherit">{defBreakDuration}m</span>
                <button
                  onClick={() => { triggerHapticFeedback('light'); setDefBreakDuration(defBreakDuration + 1); }}
                  className="font-bold hover:opacity-80"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Toggles list */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] rounded-2xl p-4.5 space-y-4 shadow-sm">
          <h3 className="bento-label flex items-center space-x-1.5 px-0.5">
            <Smartphone className="w-4 h-4 text-[#6C63FF]" />
            <span>Tactile & Sensory feedback</span>
          </h3>

          <div className="space-y-4 pt-1">
            {/* Haptics Toggler */}
            <div className="flex justify-between items-center">
              <div className="pr-4">
                <label className="text-xs font-bold block">Calibrate Haptics Clicker</label>
                <span className="text-[10px] opacity-60 block leading-snug">Tap actions spark vibration signals representing physical mechanism.</span>
              </div>
              <button
                onClick={() => handleToggleHaptics(!hapticsEnabled)}
                className={`w-11 h-6 rounded-full p-0.5 border cursor-pointer transition shrink-0 ${
                  hapticsEnabled ? 'bg-[#4CAF50] border-[#4CAF50] flex justify-end' : 'bg-slate-200 dark:bg-[#0F0F1A] border-slate-350 dark:border-[#2A2A4A] flex justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full block shadow" />
              </button>
            </div>

            {/* Sounds Toggler */}
            <div className="flex justify-between items-center">
              <div className="pr-4">
                <label className="text-xs font-bold block">Ambient Transition Chimes</label>
                <span className="text-[10px] opacity-60 block leading-snug">Ring uplifting musical chords on focus or break transitions.</span>
              </div>
              <button
                onClick={() => { triggerHapticFeedback('light'); setAmbientSounds(!ambientSounds); }}
                className={`w-11 h-6 rounded-full p-0.5 border cursor-pointer transition shrink-0 ${
                  ambientSounds ? 'bg-[#4CAF50] border-[#4CAF50] flex justify-end' : 'bg-slate-200 dark:bg-[#0F0F1A] border-slate-350 dark:border-[#2A2A4A] flex justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full block shadow" />
              </button>
            </div>

            {/* Reminder notifications Toggler */}
            <div className="flex justify-between items-center">
              <div className="pr-4">
                <label className="text-xs font-bold block">Push Routine Reminders</label>
                <span className="text-[10px] opacity-60 block leading-snug">Push alarms when it's time to trigger morning routine.</span>
              </div>
              <button
                onClick={() => { triggerHapticFeedback('light'); setPushReminders(!pushReminders); }}
                className={`w-11 h-6 rounded-full p-0.5 border cursor-pointer transition shrink-0 ${
                  pushReminders ? 'bg-[#4CAF50] border-[#4CAF50] flex justify-end' : 'bg-slate-200 dark:bg-[#0F0F1A] border-slate-350 dark:border-[#2A2A4A] flex justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full block shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. Appearance list */}
        <div className="bento-card border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151619] rounded-2xl p-4.5 space-y-4 shadow-sm">
          <h3 className="bento-label flex items-center space-x-1.5 px-0.5">
            <Eye className="w-4 h-4 text-[#6C63FF]" />
            <span>Theme appearance presets</span>
          </h3>

          <div className="flex justify-between items-center">
            <div className="pr-4">
              <span className="font-bold text-xs block">ADHD Dark & Light Polarities</span>
              <span className="text-[10px] opacity-60 block leading-snug">
                Dark mode is highly advised for deep visual clarity, but you can invert anytime.
              </span>
            </div>

            {/* Appearance Mode toggle */}
            <button
              onClick={() => { triggerHapticFeedback('light'); onThemeInvertToggle(); }}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition duration-200 outline-none cursor-pointer ${
                lightThemeActive
                  ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                  : 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
              }`}
            >
              {lightThemeActive ? "☀ LIGHT MODE Active" : "🌙 DARK MODE Active"}
            </button>
          </div>
        </div>

        {/* 6. Ratings & Support linkages links */}
        <div className="bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 rounded-2xl p-1 shadow-sm select-none divide-y divide-slate-100 dark:divide-white/5">
          <button 
            onClick={handleRatingClick}
            className="w-full text-left px-3.5 py-3.5 flex justify-between items-center text-xs font-semibold hover:bg-slate-50 dark:hover:bg-black/15 transition outline-none rounded-t-xl cursor-pointer"
          >
            <span>Rate FocusFlow ⭐⭐⭐⭐⭐</span>
            <ChevronRight className="w-4 h-4 opacity-55" />
          </button>

          <button 
            onClick={() => {
              triggerHapticFeedback('light');
              showToast('success', 'Privacy Policy Check', 'All data is saved strictly locally inside secure device Sandbox keys. Zero tracking telemetry logged.');
            }}
            className="w-full text-left px-3.5 py-3.5 flex justify-between items-center text-xs font-semibold hover:bg-slate-50 dark:hover:bg-black/15 transition outline-none cursor-pointer"
          >
            <span>Privacy Policy</span>
            <ChevronRight className="w-4 h-4 opacity-55" />
          </button>

          <button 
            onClick={() => {
              triggerHapticFeedback('light');
              showToast('success', 'Terms of Service Calibrated', 'Licensed under standard offline utility terms. All profile and logic parameters are local private assets.');
            }}
            className="w-full text-left px-3.5 py-3.5 flex justify-between items-center text-xs font-semibold hover:bg-slate-50 dark:hover:bg-black/15 transition outline-none rounded-b-xl cursor-pointer"
          >
            <span>Terms of Service</span>
            <ChevronRight className="w-4 h-4 opacity-55" />
          </button>
        </div>

        {/* Informational Sandbox notice */}
        <p className="text-[9px] text-slate-400 dark:text-[#555577] text-center px-4 leading-normal">
          FocusFlow Developer Build 1.0.0 (Vite React Client Tier). All data models are synchronized locally to protect user privacy.
        </p>

      </div>

      {/* Avatar Modal Picker Sheet */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#151619] border border-slate-200 dark:border-white/5 rounded-t-[28px] rounded-b-[16px] px-5 py-6 space-y-4 text-slate-800 dark:text-white animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold font-display">Pick Profile Avatar</h3>
              <button 
                onClick={() => { triggerHapticFeedback('light'); setAvatarModalOpen(false); }}
                className="w-7 h-7 bg-slate-100 dark:bg-[#2A2A4A] flex items-center justify-center text-gray-400 hover:text-slate-800 dark:hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 p-2 bg-slate-50 dark:bg-black/15 border border-slate-200 dark:border-white/5 rounded-2xl">
              {AVATARS_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => { 
                    triggerHapticFeedback('light'); 
                    setActiveAvatar(av); 
                    setAvatarModalOpen(false); 
                    showToast('success', 'Avatar selected!', `Avatar changed to: ${av}`);
                  }}
                  className={`h-14 flex items-center justify-center text-3xl rounded-xl transition cursor-pointer ${
                    activeAvatar === av ? 'bg-[#6C63FF]/20 border border-[#6C63FF]' : 'hover:bg-slate-100 dark:hover:bg-[#1A1A2E]'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide anim classes style */}
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

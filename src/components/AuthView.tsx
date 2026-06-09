/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAppContext();
  
  // Choose sub-view: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form handling status
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Focus tracking for premium inputs styling
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const clearForm = () => {
    setErrorMsg(null);
    setResetSuccess(false);
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg(null);
    
    if (!email.trim() || !password) {
      triggerHapticFeedback('error');
      setErrorMsg('Please fill in all inputs.');
      return;
    }

    setBusy(true);
    triggerHapticFeedback('light');
    
    const err = await signIn(email, password);
    if (err) {
      triggerHapticFeedback('error');
      setErrorMsg(err);
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg(null);

    if (!email.trim() || !password || !confirmPassword) {
      triggerHapticFeedback('error');
      setErrorMsg('Please fill in all inputs.');
      return;
    }

    if (password.length < 8) {
      triggerHapticFeedback('error');
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      triggerHapticFeedback('error');
      setErrorMsg('Passwords do not match');
      return;
    }

    setBusy(true);
    triggerHapticFeedback('light');

    const err = await signUp(email, password);
    if (err) {
      triggerHapticFeedback('error');
      setErrorMsg(err);
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg(null);

    if (!email.trim()) {
      triggerHapticFeedback('error');
      setErrorMsg('Please input your registered email first.');
      return;
    }

    setBusy(true);
    triggerHapticFeedback('light');
    
    try {
      await resetPassword(email);
      setResetSuccess(true);
      triggerHapticFeedback('success');
    } catch (e) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A] text-white px-6 py-10 justify-between select-none">
      {/* Header Container */}
      <div className="flex flex-col items-center justify-center text-center mt-6">
        <div className="text-6xl mb-3 leading-none filter drop-shadow-[0_10px_15px_rgba(108,99,255,0.3)] animate-pulse-subtle">
          🧠
        </div>
        <h1 className="text-3xl font-black font-display tracking-tight text-white">
          FocusFlow
        </h1>
        <p className="text-xs font-mono font-medium text-[#8888AA] tracking-widest uppercase mt-1">
          ADHD Planner Engine
        </p>
      </div>

      {/* Main Core Form Card */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-1">
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-white mb-1">Welcome back</h2>
              <p className="text-[#8888AA] text-xs">Let's clear the clutter. No overwhelm today.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs text-center font-medium animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8888AA] tracking-wider block">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="yourname@domain.com"
                  className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-sm font-medium rounded-xl border transition-all duration-200 outline-none ${
                    focusedField === 'email' ? 'border-[#6C63FF] shadow-lg shadow-[#6C63FF]/10' : 'border-[#2A2A4A] hover:border-[#3A3A6A]'
                  }`}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#8888AA] tracking-wider">PASSWORD</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); clearForm(); triggerHapticFeedback('light'); }}
                  className="text-xs text-[#8888AA] hover:text-[#6C63FF] font-medium transition"
                  tabIndex={-1}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-sm font-medium rounded-xl border transition-all duration-200 outline-none ${
                    focusedField === 'password' ? 'border-[#6C63FF] shadow-lg shadow-[#6C63FF]/10' : 'border-[#2A2A4A] hover:border-[#3A3A6A]'
                  }`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-14 bg-[#6C63FF] hover:bg-[#5b52e0] text-sm font-semibold rounded-2xl flex items-center justify-center transition duration-200 active:scale-[0.98] shadow-lg shadow-[#6C63FF]/20"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-display text-white mb-1">Create Account</h2>
              <p className="text-[#8888AA] text-xs">Unlock an ADHD-friendly lifestyle with step timers.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs text-center font-medium animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8888AA] tracking-wider block">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="yourname@domain.com"
                  className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-xs font-medium rounded-xl border transition-all duration-200 outline-none ${
                    focusedField === 'email' ? 'border-[#6C63FF]' : 'border-[#2A2A4A]'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8888AA] tracking-wider block">CHOOSE PASSWORD</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 8 characters"
                  className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-xs font-medium rounded-xl border transition-all duration-200 outline-none ${
                    focusedField === 'password' ? 'border-[#6C63FF]' : 'border-[#2A2A4A]'
                  }`}
                />
              </div>
              <p className="text-[10px] text-[#8888AA] mt-1 pl-1">Requirement: Minimum length of 8+ characters.</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8888AA] tracking-wider block">CONFIRM PASSWORD</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repeat chosen password"
                  className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-xs font-medium rounded-xl border transition-all duration-200 outline-none ${
                    focusedField === 'confirmPassword' ? 'border-[#6C63FF]' : 'border-[#2A2A4A]'
                  }`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-14 bg-[#6C63FF] hover:bg-[#5b52e0] text-sm font-semibold rounded-2xl flex items-center justify-center transition duration-200 active:scale-[0.98] mt-2 shadow-lg shadow-[#6C63FF]/20"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center space-x-2 -ml-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); clearForm(); triggerHapticFeedback('light'); }}
                  className="p-1 text-[#8888AA] hover:text-white transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-[#8888AA] font-bold">Back to Login</span>
              </div>
              <h2 className="text-xl font-bold font-display text-white mb-1">Reset Password</h2>
              <p className="text-[#8888AA] text-xs">Enter your email and we'll send you an instant recovery link.</p>
            </div>

            {resetSuccess ? (
              <div className="p-5 bg-green-950/40 border border-green-900/50 rounded-2xl text-center space-y-3 animate-fade-in">
                <div className="text-4xl">📧</div>
                <h3 className="font-bold text-white text-sm">Check your inbox</h3>
                <p className="text-xs text-green-300 leading-relaxed">
                  We sent a secure validation recovery link to <b className="text-white">{email}</b>. Follow instructions to unlock.
                </p>
                <button
                  onClick={() => { setMode('login'); clearForm(); triggerHapticFeedback('light'); }}
                  className="w-full h-10 mt-2 bg-[#2A2A4A] hover:bg-[#3e3e6b] text-xs font-semibold rounded-xl transition"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs text-center font-medium animate-shake">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#8888AA] tracking-wider block">EMAIL ADDRESS</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8888AA]">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="yourname@domain.com"
                      className={`w-full h-[52px] pl-12 pr-4 bg-[#1A1A2E] text-white placeholder-[#555577] text-sm font-medium rounded-xl border transition-all duration-200 outline-none ${
                        focusedField === 'email' ? 'border-[#6C63FF]' : 'border-[#2A2A4A]'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-14 bg-[#6C63FF] hover:bg-[#5b52e0] text-sm font-semibold rounded-2xl flex items-center justify-center transition duration-200 active:scale-[0.98] shadow-lg shadow-[#6C63FF]/20"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col items-center justify-center space-y-2 mt-6">
        {mode === 'login' && (
          <div className="text-xs text-[#8888AA]">
            New to FocusFlow?{' '}
            <button
              onClick={() => { setMode('signup'); clearForm(); triggerHapticFeedback('light'); }}
              className="text-[#6C63FF] font-bold hover:underline"
            >
              Create an account
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div className="text-xs text-[#8888AA]">
            Already have an account?{' '}
            <button
              onClick={() => { setMode('login'); clearForm(); triggerHapticFeedback('light'); }}
              className="text-[#6C63FF] font-bold hover:underline"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseSubtle {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 10px 15px rgba(108,99,255,0.4)); }
          50% { opacity: 0.9; transform: scale(1.05); filter: drop-shadow(0 15px 25px rgba(108,99,255,0.6)); }
        }
        .animate-pulse-subtle {
          animation: pulseSubtle 4s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s;
        }
      `}</style>
    </div>
  );
};

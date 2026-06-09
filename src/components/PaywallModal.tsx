/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { X, Check, Star, Shield, Zap, Sparkles } from 'lucide-react';

interface PaywallModalProps {
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
  const { purchaseMonthly, purchaseYearly, restorePurchases } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    triggerHapticFeedback('medium');
    try {
      if (selectedPlan === 'monthly') {
        await purchaseMonthly();
      } else {
        await purchaseYearly();
      }
      onClose();
    } catch (e) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    triggerHapticFeedback('light');
    try {
      await restorePurchases();
      onClose();
    } catch (e) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Paywall Container */}
      <div className="relative w-full max-w-sm h-[90vh] bg-[#0F0F1A] border border-[#2A2A4A] rounded-[32px] overflow-y-auto px-6 py-8 flex flex-col justify-between text-white">
        
        {/* Close Button */}
        <button 
          onClick={() => { triggerHapticFeedback('light'); onClose(); }} 
          className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center bg-[#1A1A2E] hover:bg-[#2A2A4A] text-gray-400 hover:text-white rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Splash */}
        <div className="text-center mt-4">
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[#6C63FF] mb-4 animate-bounce-subtle">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black font-display text-white tracking-tight leading-tight">
            Unlock Your Full ADHD Potential ⭐️
          </h2>
          <p className="text-[#8888AA] text-xs mt-1.5 leading-relaxed max-w-xs mx-auto">
            Design beautiful micro-routines, trace long focus streaks, and eliminate distracting ad breaks. Priced fairly.
          </p>
        </div>

        {/* Feature List */}
        <div className="my-6 space-y-3 bg-[#1A1A2E]/50 border border-[#2A2A4A]/60 rounded-2xl p-4">
          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-white">Unlimited Routines & Steps</strong>
              <p className="text-[#8888AA] text-[11px]">Free tier limits morning/afternoon/night plans to 3 routines.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-white">Full Analytics Logs & Badges</strong>
              <p className="text-[#8888AA] text-[11px]">Track weekly focus minutes, check off milestones & achievements.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-white">Pure Ad-Free Environment</strong>
              <p className="text-[#8888AA] text-[11px]">No interrupting banner or interstitial ads during intense sessions.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-white">ADHD Body Doubling Mode</strong>
              <p className="text-[#8888AA] text-[11px]">Ambient virtual work circles to boost focus (Coming soon!).</p>
            </div>
          </div>
        </div>

        {/* Plan Selectors */}
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          {/* Monthly Card */}
          <button
            onClick={() => { triggerHapticFeedback('light'); setSelectedPlan('monthly'); }}
            className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 outline-none ${
              selectedPlan === 'monthly'
                ? 'bg-[#1A1A2E] border-[#6C63FF] shadow-lg shadow-[#6C63FF]/5'
                : 'bg-[#1A1A2E]/40 border-[#2A2A4A] hover:border-[#3A3A6A]'
            }`}
          >
            <span className="text-[10px] text-[#8888AA] font-bold tracking-wider uppercase block">MONTHLY</span>
            <div className="mt-1">
              <span className="text-xl font-bold font-display text-white">$4.99</span>
              <span className="text-[11px] text-[#8888AA]">/mo</span>
            </div>
            <span className="text-[10px] text-[#8888AA] font-semibold mt-2.5">3-Day Trial</span>
          </button>

          {/* Yearly Card */}
          <button
            onClick={() => { triggerHapticFeedback('light'); setSelectedPlan('yearly'); }}
            className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 outline-none ${
              selectedPlan === 'yearly'
                ? 'bg-[#1A1A2E] border-[#A855F7] shadow-lg shadow-[#A855F7]/10'
                : 'bg-[#1A1A2E]/40 border-[#2A2A4A] hover:border-[#3A3A6A]'
            }`}
          >
            {/* Save badge */}
            <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-orange-600 border border-orange-500 text-[9px] font-black tracking-wider uppercase text-white rounded-md scale-95 shadow-lg shadow-orange-600/20">
              SAVE 50% 🔥
            </span>
            <span className="text-[10px] text-[#8888AA] font-bold tracking-wider uppercase block">YEARLY</span>
            <div className="mt-1">
              <span className="text-xl font-bold font-display text-white">$29.99</span>
              <span className="text-[11px] text-[#8888AA]">/yr</span>
            </div>
            <span className="text-[10px] text-orange-400 font-semibold mt-2.5">Only $2.50 /mo</span>
          </button>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] hover:opacity-90 text-sm font-bold text-white rounded-2xl flex items-center justify-center transition active:scale-[0.98] shadow-lg shadow-[#6C63FF]/25"
          >
            {loading ? "Activating entitlement..." : `Start 3-Day Free Trial`}
          </button>

          {/* Restore & Small-print */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              onClick={handleRestore}
              className="text-[11px] text-[#8888AA] hover:text-white transition font-medium underline"
            >
              Restore Purchases
            </button>
            <p className="text-[9px] text-[#555577] text-center px-4 leading-normal">
              Cancel anytime. Billed via Google Play / iOS App Store. Continued subscriptions auto-renew at state price.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

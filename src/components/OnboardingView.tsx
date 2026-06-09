/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { triggerHapticFeedback } from '../utils/haptics';
import { Brain, Timer, Flame, ChevronRight } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { completeOnboarding } = useAppContext();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      emoji: '🧠',
      icon: <Brain className="w-14 h-14 text-[#6C63FF]" />,
      title: "Built for ADHD Brains",
      subtitle: "No judgment. No overwhelm. Just simple steps that actually work."
    },
    {
      emoji: '⏱️',
      icon: <Timer className="w-14 h-14 text-[#A855F7]" />,
      title: "Focus in Sprints",
      subtitle: "Short bursts with breaks. The way your brain naturally works best."
    },
    {
      emoji: '🔥',
      icon: <Flame className="w-14 h-14 text-orange-500" />,
      title: "Build Real Streaks",
      subtitle: "Small wins every day. Watch your consistency grow."
    }
  ];

  const handleNext = () => {
    triggerHapticFeedback('light');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    triggerHapticFeedback('medium');
    completeOnboarding();
  };

  const handleDotClick = (index: number) => {
    triggerHapticFeedback('light');
    setCurrentSlide(index);
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A] text-white px-6 py-8 justify-between select-none">
      {/* Top Header Row with Skip button */}
      <div className="flex justify-end h-8">
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={handleSkip} 
            className="text-sm font-medium text-[#8888AA] hover:text-[#6C63FF] transition duration-200"
          >
            Skip
          </button>
        )}
      </div>

      {/* Slide Carrier */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {/* Animated Slide Elements */}
        <div key={currentSlide} className="animate-fade-in flex flex-col items-center">
          {/* Visual Container */}
          <div className="text-8xl mb-6 select-none leading-none filter drop-shadow-[0_10px_20px_rgba(108,99,255,0.15)] animate-bounce-subtle">
            {slides[currentSlide].emoji}
          </div>

          <div className="p-4 bg-[#1A1A2E] rounded-3xl border border-[#2A2A4A] mb-8">
            {slides[currentSlide].icon}
          </div>

          <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-4">
            {slides[currentSlide].title}
          </h2>

          <p className="text-[#8888AA] text-sm md:text-base leading-relaxed max-w-xs font-sans">
            {slides[currentSlide].subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Controls Panel */}
      <div className="flex flex-col items-center space-y-6">
        {/* Dot Indicators */}
        <div className="flex space-x-2.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-7 bg-[#6C63FF]' : 'w-2.5 bg-[#2A2A4A]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full h-14 bg-[#6C63FF] hover:bg-[#5b52e0] font-semibold text-white rounded-2xl flex items-center justify-center space-x-2 transition duration-200 active:scale-[0.98] shadow-lg shadow-[#6C63FF]/20"
        >
          <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
          {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Extra style handles to avoid bundle load discrepancies */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

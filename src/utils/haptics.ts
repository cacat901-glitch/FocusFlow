/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tactical haptic feedback simulator.
 * Vibrates real Android devices (if opened in tab) and produces subtle audio-clicks for general desktop browsers.
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'success' | 'warning' | 'error' = 'light') {
  try {
    // 1. Mobile Physical Vibration attempt
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') {
        navigator.vibrate(15);
      } else if (type === 'medium') {
        navigator.vibrate(35);
      } else if (type === 'success') {
        navigator.vibrate([30, 50, 30]);
      } else if (type === 'warning') {
        navigator.vibrate([50, 30, 50]);
      } else if (type === 'error') {
        navigator.vibrate([60, 60, 60]);
      }
    }

    // 2. Synthesize a tactile sound click representing a physical mechanism
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const hCtx = new AudioContextClass();
      const now = hCtx.currentTime;
      const osc = hCtx.createOscillator();
      const gainNode = hCtx.createGain();

      osc.type = 'sine';
      osc.connect(gainNode);
      gainNode.connect(hCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(180, now);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else {
        // Subtle click (light or medium)
        const pitch = type === 'medium' ? 680 : 880;
        const volume = type === 'medium' ? 0.025 : 0.015;
        const decay = type === 'medium' ? 0.04 : 0.025;
        
        osc.frequency.setValueAtTime(pitch, now);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        osc.start(now);
        osc.stop(now + decay + 0.01);
      }
    }
  } catch (error) {
    // Graceful fallback for silent/uninterrupted flows
  }
}

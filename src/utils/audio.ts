/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Beautiful dynamic synthesizer chimes using Web Audio API. This allows crisp sound notifications
 * that work instantly in standard browsers and layout frames without external asset loading issues.
 */

export function playBellNotification(type: 'focus' | 'break' | 'complete' = 'focus') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'focus') {
      // Crisp 2-tone uplifting chime
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0.12, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 1.3);
      });
    } else if (type === 'break') {
      // Low descending relaxing chime
      const notes = [440.00, 349.23]; // A4, F4
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0.12, now + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 1.6);
      });
    } else {
      // 'complete' - Celestial major chord ring
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Gorgeous C major triad chime)
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Warmer, flute-like tone
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.08, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 2.6);
      });
    }
  } catch (error) {
    console.warn("AudioContext failed to initialize or play sound:", error);
  }
}

// ---------------------------------------------------------
// Premium ADHD Ambient Shield Soundscape Synthesizer
// ---------------------------------------------------------

let ambientCtx: AudioContext | null = null;
let noiseSourceNode: AudioBufferSourceNode | null = null;
let alphaOscLeft: OscillatorNode | null = null;
let alphaOscRight: OscillatorNode | null = null;
let rainFilter: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;
let rainTimer: NodeJS.Timeout | null = null;

// Generate White Noise Buffer
function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Generate Pink Noise Buffer (Kellet's refined filter method)
function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.12; 
  }
  return buffer;
}

// Generate Brown Noise Buffer (Integrator-filtered random walk)
function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.8; // Boost gain level slightly
  }
  return buffer;
}

// Setup and start ambient sound synthesizers
export const ambientSoundEngine = {
  play(type: 'brown' | 'pink' | 'rain' | 'alpha', initialVolume: number = 0.4) {
    try {
      this.stop();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      ambientCtx = new AudioContextClass();
      const now = ambientCtx.currentTime;

      // Master Gain for smooth volume control
      masterGain = ambientCtx.createGain();
      masterGain.gain.setValueAtTime(initialVolume, now);
      masterGain.connect(ambientCtx.destination);

      if (type === 'brown' || type === 'pink' || type === 'rain') {
        const buffer = type === 'brown' ? createBrownNoiseBuffer(ambientCtx) : createPinkNoiseBuffer(ambientCtx);
        
        noiseSourceNode = ambientCtx.createBufferSource();
        noiseSourceNode.buffer = buffer;
        noiseSourceNode.loop = true;

        if (type === 'rain') {
          // Custom resonance rain acoustics
          // Route noise source through a bandpass filter that fluctuates softly
          rainFilter = ambientCtx.createBiquadFilter();
          rainFilter.type = 'peaking';
          rainFilter.frequency.setValueAtTime(800, now);
          rainFilter.Q.setValueAtTime(1.5, now);
          rainFilter.gain.setValueAtTime(4, now);

          noiseSourceNode.connect(rainFilter);
          rainFilter.connect(masterGain);

          // Simulate rain crackling/patters dynamically inside audio envelope
          const triggerPatter = () => {
            if (!ambientCtx || !masterGain) return;
            const delay = Math.random() * 150 + 50; // fast random patters
            const osc = ambientCtx.createOscillator();
            const patterGain = ambientCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1500 + Math.random() * 1000, ambientCtx.currentTime);

            patterGain.gain.setValueAtTime(0.015 + Math.random() * 0.015, ambientCtx.currentTime);
            patterGain.gain.exponentialRampToValueAtTime(0.0001, ambientCtx.currentTime + 0.04);

            osc.connect(patterGain);
            patterGain.connect(masterGain);

            osc.start();
            osc.stop(ambientCtx.currentTime + 0.05);

            rainTimer = setTimeout(triggerPatter, delay);
          };
          triggerPatter();
        } else {
          // Brownian or Pink Noise
          noiseSourceNode.connect(masterGain);
        }

        noiseSourceNode.start(0);

      } else if (type === 'alpha') {
        // Binaural Alpha Beats (10Hz focus modulation)
        // Synthesise real stereo panned binaural oscillations
        const merger = ambientCtx.createChannelMerger(2);

        // Alpha left carrier (150Hz)
        alphaOscLeft = ambientCtx.createOscillator();
        alphaOscLeft.type = 'sine';
        alphaOscLeft.frequency.setValueAtTime(145, now);

        const gainL = ambientCtx.createGain();
        gainL.gain.setValueAtTime(0.65, now);
        alphaOscLeft.connect(gainL);
        merger.connect(masterGain, 0, 0); // connect to channel merger

        // Alpha right carrier (155Hz resulting in beautiful 10Hz brain frequency alignment)
        alphaOscRight = ambientCtx.createOscillator();
        alphaOscRight.type = 'sine';
        alphaOscRight.frequency.setValueAtTime(155, now);

        const gainR = ambientCtx.createGain();
        gainR.gain.setValueAtTime(0.65, now);
        alphaOscRight.connect(gainR);
        merger.connect(masterGain, 0, 1);

        // Add extra low-frequency relaxing sub-swell drone
        const slowSwellNode = ambientCtx.createOscillator();
        slowSwellNode.type = 'sine';
        slowSwellNode.frequency.setValueAtTime(65, now); // soft C2 hum
        const swellGain = ambientCtx.createGain();
        swellGain.gain.setValueAtTime(0.35, now);
        slowSwellNode.connect(swellGain);
        swellGain.connect(masterGain);

        alphaOscLeft.start(0);
        alphaOscRight.start(0);
        slowSwellNode.start(0);

        // Retain nodes for proper stop handle
        (noiseSourceNode as any) = slowSwellNode; // mock container key to clean up on stop
      }
    } catch (err) {
      console.warn("Soundscape engine play error:", err);
    }
  },

  setVolume(volume: number) {
    if (masterGain && ambientCtx) {
      try {
        masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ambientCtx.currentTime);
      } catch (e) {
        console.warn("Could not set volume level:", e);
      }
    }
  },

  stop() {
    try {
      if (rainTimer) {
        clearTimeout(rainTimer);
        rainTimer = null;
      }
      if (noiseSourceNode) {
        noiseSourceNode.stop();
        noiseSourceNode.disconnect();
        noiseSourceNode = null;
      }
      if (alphaOscLeft) {
        alphaOscLeft.stop();
        alphaOscLeft.disconnect();
        alphaOscLeft = null;
      }
      if (alphaOscRight) {
        alphaOscRight.stop();
        alphaOscRight.disconnect();
        alphaOscRight = null;
      }
      if (rainFilter) {
        rainFilter.disconnect();
        rainFilter = null;
      }
      if (masterGain) {
        masterGain.disconnect();
        masterGain = null;
      }
      if (ambientCtx) {
        if (ambientCtx.state !== 'closed') {
          ambientCtx.close();
        }
        ambientCtx = null;
      }
    } catch (e) {
      // already stopped or not initialised
    }
  }
};


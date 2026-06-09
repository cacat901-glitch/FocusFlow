/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_xp: number;
  created_at: string;
}

export interface RoutineStep {
  id: string;
  routine_id: string;
  title: string;
  duration_minutes: number;
  order_index: number;
  emoji: string;
  created_at: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  time_of_day: TimeOfDay;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_time: string; // "HH:MM" format
  reminder_days: string[]; // ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  created_at: string;
  steps: RoutineStep[];
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  due_date: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  type: 'pomodoro' | 'custom';
  completed: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null; // YYYY-MM-DD
  updated_at: string;
}

export type SubscriptionStatus = 'free' | 'premium';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  conditionDescription: string;
}

export const ADHD_COLOR_PALETTE = {
  Primary: '#6C63FF',      // purple
  Background: '#0F0F1A',   // very dark
  Card: '#1A1A2E',
  CardBorder: '#2A2A4A',
  Text: '#FFFFFF',
  TextMuted: '#8888AA',
  Success: '#4CAF50',
  Warning: '#FF9800',
  Error: '#FF5252',
  Accent: '#A855F7',
};

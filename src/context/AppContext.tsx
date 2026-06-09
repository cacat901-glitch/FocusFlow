/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Routine, 
  RoutineStep, 
  Task, 
  FocusSession, 
  Streak, 
  SubscriptionStatus, 
  Achievement,
  TimeOfDay
} from '../types';
import { triggerHapticFeedback } from '../utils/haptics';
import { playBellNotification } from '../utils/audio';

// Custom Toast System to support beautiful toast feedback in frame view
export interface CustomToast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface AppContextType {
  // Auth State
  user: { email: string } | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<string | null>;
  signUp: (email: string, pass: string) => Promise<string | null>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<boolean>;

  // Onboarding State
  onboardingCompleted: boolean;
  completeOnboarding: () => void;

  // Profile State
  profile: UserProfile | null;
  updateProfile: (displayName: string, avatarEmoji: string) => void;
  addXP: (amount: number, reason?: string) => void;

  // Routines State
  routines: Routine[];
  createRoutine: (name: string, emoji: string, time_of_day: TimeOfDay) => boolean;
  updateRoutine: (id: string, updates: Partial<Omit<Routine, 'id' | 'steps'>>) => void;
  deleteRoutine: (id: string) => void;
  createStep: (routineId: string, title: string, duration_minutes: number, emoji: string) => void;
  updateStep: (routineId: string, stepId: string, title: string, duration_minutes: number, emoji: string) => void;
  deleteStep: (routineId: string, stepId: string) => void;
  reorderSteps: (routineId: string, newSteps: RoutineStep[]) => void;

  // Tasks State
  tasks: Task[];
  createTask: (title: string, priority: 'low' | 'medium' | 'high') => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Focus Timer Sessions
  sessions: FocusSession[];
  createSession: (duration_minutes: number, type: 'pomodoro' | 'custom', completed: boolean) => void;

  // Streaks
  streak: Streak | null;
  incrementStreak: () => void;

  // Subscriptions (RevenueCat Mock)
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
  purchaseMonthly: () => Promise<boolean>;
  purchaseYearly: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;

  // Achievements List
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;

  // Custom Toast Toaster triggers
  toasts: CustomToast[];
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial templates
const DEFAULT_ROUTINES = (userId: string): Routine[] => [
  {
    id: 'routine-morning-1',
    user_id: userId,
    name: 'Morning Wake-up',
    emoji: '🌅',
    time_of_day: 'morning',
    is_active: true,
    reminder_enabled: true,
    reminder_time: '08:00',
    reminder_days: ['M', 'T', 'W', 'T', 'F'],
    created_at: new Date().toISOString(),
    steps: [
      { id: 'step-m1', routine_id: 'routine-morning-1', title: 'Hydrate (Big Glass of Water)', duration_minutes: 2, order_index: 0, emoji: '💧', created_at: new Date().toISOString() },
      { id: 'step-m2', routine_id: 'routine-morning-1', title: 'Stretch & Open Blinds', duration_minutes: 5, order_index: 1, emoji: '🧘', created_at: new Date().toISOString() },
      { id: 'step-m3', routine_id: 'routine-morning-1', title: 'Shower & Fresh Clothes', duration_minutes: 15, order_index: 2, emoji: '🚿', created_at: new Date().toISOString() }
    ]
  },
  {
    id: 'routine-evening-1',
    user_id: userId,
    name: 'Evening Wind-down',
    emoji: '🌙',
    time_of_day: 'evening',
    is_active: true,
    reminder_enabled: true,
    reminder_time: '21:30',
    reminder_days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    created_at: new Date().toISOString(),
    steps: [
      { id: 'step-e1', routine_id: 'routine-evening-1', title: 'Prepare clothes for tomorrow', duration_minutes: 3, order_index: 0, emoji: '👕', created_at: new Date().toISOString() },
      { id: 'step-e2', routine_id: 'routine-evening-1', title: 'Gratitude Journal (3 quick items)', duration_minutes: 5, order_index: 1, emoji: '📝', created_at: new Date().toISOString() },
      { id: 'step-e3', routine_id: 'routine-evening-1', title: 'Deep breathing loop', duration_minutes: 5, order_index: 2, emoji: '🌿', created_at: new Date().toISOString() }
    ]
  }
];

const DEFAULT_TASKS = (userId: string): Task[] => [
  { id: 'task-1', user_id: userId, title: 'Finish onboarding tutorial 🧠', is_completed: true, due_date: new Date().toISOString().split('T')[0], priority: 'high', created_at: new Date().toISOString() },
  { id: 'task-2', user_id: userId, title: 'Complete first 15-min Focus session', is_completed: false, due_date: new Date().toISOString().split('T')[0], priority: 'medium', created_at: new Date().toISOString() },
  { id: 'task-3', user_id: userId, title: 'Plan morning routine emoji set', is_completed: false, due_date: new Date().toISOString().split('T')[0], priority: 'low', created_at: new Date().toISOString() }
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_flame', name: 'First Flame', description: 'Maintained a 3-day consistency streak.', emoji: '🔥', xpReward: 50, isUnlocked: false, conditionDescription: '3-day streak' },
  { id: 'rocket_start', name: 'Rocket Start', description: 'Maintained a 7-day consistency streak.', emoji: '🚀', xpReward: 100, isUnlocked: false, conditionDescription: '7-day streak' },
  { id: 'diamond_mind', name: 'Diamond Mind', description: 'Achieved an epic 30-day consistency streak.', emoji: '💎', xpReward: 500, isUnlocked: false, conditionDescription: '30-day streak' },
  { id: 'focus_machine', name: 'Focus Machine', description: 'Log a total of 10 hours focused.', emoji: '⏱️', xpReward: 150, isUnlocked: false, conditionDescription: '10 total hours focused' },
  { id: 'task_master', name: 'Task Master', description: 'Complete 50 standard daily planner tasks.', emoji: '✅', xpReward: 100, isUnlocked: false, conditionDescription: 'Complete 50 tasks' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete morning routine 7 separate times.', emoji: '🌅', xpReward: 75, isUnlocked: false, conditionDescription: 'Morning routine 7x' },
  { id: 'sharp_shooter', name: 'Sharp Shooter', description: 'Unlock 10 logged Pomodoro focus sessions.', emoji: '🎯', xpReward: 100, isUnlocked: false, conditionDescription: '10 focus sessions' },
  { id: 'consistency_king', name: 'Consistency King', description: 'Maintained an incredible 14-day consistency streak.', emoji: '👑', xpReward: 200, isUnlocked: false, conditionDescription: '14-day streak' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toaster Toast messages state
  const [toasts, setToasts] = useState<CustomToast[]>([]);

  const showToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Auth Status
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // Core Data Lists
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free');

  // Load Initial State from LocalStorage
  useEffect(() => {
    const initStorage = () => {
      try {
        const storedUser = localStorage.getItem('focusflow_user');
        const storedOnboarding = localStorage.getItem('focusflow_onboarding');
        const storedStatus = localStorage.getItem('focusflow_subscription_status');
        
        if (storedOnboarding === 'completed') {
          setOnboardingCompleted(true);
        }
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Load Profile
          const storedProfile = localStorage.getItem(`focusflow_profile_${parsedUser.email}`);
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
          } else {
            const newProf: UserProfile = {
              id: 'prof-uid',
              user_id: 'user-uid',
              display_name: parsedUser.email.split('@')[0],
              avatar_emoji: '🧠',
              total_xp: 0,
              created_at: new Date().toISOString()
            };
            setProfile(newProf);
            localStorage.setItem(`focusflow_profile_${parsedUser.email}`, JSON.stringify(newProf));
          }

          // Load Routines
          const storedRoutines = localStorage.getItem(`focusflow_routines_${parsedUser.email}`);
          if (storedRoutines) {
            setRoutines(JSON.parse(storedRoutines));
          } else {
            const defRoutines = DEFAULT_ROUTINES(parsedUser.email);
            setRoutines(defRoutines);
            localStorage.setItem(`focusflow_routines_${parsedUser.email}`, JSON.stringify(defRoutines));
          }

          // Load Tasks
          const storedTasks = localStorage.getItem(`focusflow_tasks_${parsedUser.email}`);
          if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
          } else {
            const defTasks = DEFAULT_TASKS(parsedUser.email);
            setTasks(defTasks);
            localStorage.setItem(`focusflow_tasks_${parsedUser.email}`, JSON.stringify(defTasks));
          }

          // Load Sessions
          const storedSessions = localStorage.getItem(`focusflow_sessions_${parsedUser.email}`);
          if (storedSessions) {
            setSessions(JSON.parse(storedSessions));
          } else {
            // Generate some dummy completed focus sessions for the stats page to look gorgeous originally
            const todayStr = new Date();
            const dummySessions: FocusSession[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(todayStr.getDate() - i);
              const dateStr = d.toISOString().split('T')[0];
              // Add random focus minutes (except today is logged on the fly)
              const minutes = i === 0 ? 0 : Math.floor(Math.random() * 45) + 15;
              if (minutes > 0) {
                dummySessions.push({
                  id: `dummy-focus-${i}`,
                  user_id: parsedUser.email,
                  duration_minutes: minutes,
                  type: 'pomodoro',
                  completed: true,
                  created_at: `${dateStr}T10:00:00.000Z`
                });
              }
            }
            setSessions(dummySessions);
            localStorage.setItem(`focusflow_sessions_${parsedUser.email}`, JSON.stringify(dummySessions));
          }

          // Load Streak
          const storedStreak = localStorage.getItem(`focusflow_streak_${parsedUser.email}`);
          if (storedStreak) {
            setStreak(JSON.parse(storedStreak));
          } else {
            const defStreak: Streak = {
              id: 'streak-uid',
              user_id: parsedUser.email,
              current_streak: 5, // Welcoming initial state to feel accomplished!
              longest_streak: 12,
              last_active_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            };
            setStreak(defStreak);
            localStorage.setItem(`focusflow_streak_${parsedUser.email}`, JSON.stringify(defStreak));
          }

          // Load Achievements configuration
          const storedAchievements = localStorage.getItem(`focusflow_achievements_${parsedUser.email}`);
          if (storedAchievements) {
            setAchievements(JSON.parse(storedAchievements));
          } else {
            setAchievements(DEFAULT_ACHIEVEMENTS);
          }
        }
        
        if (storedStatus) {
          setSubscriptionStatus(storedStatus as SubscriptionStatus);
        } else {
          setSubscriptionStatus('free');
        }
      } catch (e) {
        console.error("Local storage initialization failed", e);
      } finally {
        setLoading(false);
      }
    };

    initStorage();
  }, [user?.email]);

  // Sync state helpers
  const saveProfile = (newProf: UserProfile) => {
    if (!user) return;
    setProfile(newProf);
    localStorage.setItem(`focusflow_profile_${user.email}`, JSON.stringify(newProf));
  };

  const saveRoutines = (newRoutines: Routine[]) => {
    if (!user) return;
    setRoutines(newRoutines);
    localStorage.setItem(`focusflow_routines_${user.email}`, JSON.stringify(newRoutines));
  };

  const saveTasks = (newTasks: Task[]) => {
    if (!user) return;
    setTasks(newTasks);
    localStorage.setItem(`focusflow_tasks_${user.email}`, JSON.stringify(newTasks));
  };

  const saveSessions = (newSessions: FocusSession[]) => {
    if (!user) return;
    setSessions(newSessions);
    localStorage.setItem(`focusflow_sessions_${user.email}`, JSON.stringify(newSessions));
  };

  const saveStreak = (newStreak: Streak) => {
    if (!user) return;
    setStreak(newStreak);
    localStorage.setItem(`focusflow_streak_${user.email}`, JSON.stringify(newStreak));
  };

  const saveAchievementsData = (newAchievements: Achievement[]) => {
    if (!user) return;
    setAchievements(newAchievements);
    localStorage.setItem(`focusflow_achievements_${user.email}`, JSON.stringify(newAchievements));
  };

  // Check achievements conditions on modifications
  const runAchievementsDiagnostic = (
    currentXP: number,
    currentStreakCount: number,
    allSessions: FocusSession[],
    allTasks: Task[]
  ) => {
    if (!user) return;

    let achievementsUpdated = false;
    const updatedAchievements = achievements.map((ach) => {
      if (ach.isUnlocked) return ach;

      let unlockConditionMet = false;
      
      switch (ach.id) {
        case 'first_flame':
          unlockConditionMet = currentStreakCount >= 3;
          break;
        case 'rocket_start':
          unlockConditionMet = currentStreakCount >= 7;
          break;
        case 'diamond_mind':
          unlockConditionMet = currentStreakCount >= 30;
          break;
        case 'consistency_king':
          unlockConditionMet = currentStreakCount >= 14;
          break;
        case 'focus_machine':
          const totalMinutes = allSessions
            .filter((s) => s.completed)
            .reduce((sum, s) => sum + s.duration_minutes, 0);
          unlockConditionMet = totalMinutes >= 600; // 10 hours
          break;
        case 'task_master':
          const completedCount = allTasks.filter((t) => t.is_completed).length;
          unlockConditionMet = completedCount >= 50;
          break;
        case 'early_bird':
          // Mocking condition count: check focus count or general morning completions
          const mockCompletionsLocalSet = parseInt(localStorage.getItem(`completion_count_morning_${user.email}`) || '0', 10);
          unlockConditionMet = mockCompletionsLocalSet >= 7;
          break;
        case 'sharp_shooter':
          const sessionsCount = allSessions.filter((s) => s.completed).length;
          unlockConditionMet = sessionsCount >= 10;
          break;
        default:
          break;
      }

      if (unlockConditionMet) {
        achievementsUpdated = true;
        // Trigger rewards and celebratory cues!
        triggerHapticFeedback('success');
        playBellNotification('complete');
        showToast(
          'success',
          `🏆 Achievement Unlocked: ${ach.emoji} ${ach.name}!`,
          `Congratulations! You earned +${ach.xpReward} XP: "${ach.description}"`
        );
        return {
          ...ach,
          isUnlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }

      return ach;
    });

    if (achievementsUpdated) {
      saveAchievementsData(updatedAchievements);
      
      // Award XP from unlocked achievements
      const newlyUnlockedRewardXp = updatedAchievements
        .filter((ach, idx) => ach.isUnlocked && !achievements[idx].isUnlocked)
        .reduce((sum, ach) => sum + ach.xpReward, 0);
        
      if (newlyUnlockedRewardXp > 0 && profile) {
        const nextProfile = {
          ...profile,
          total_xp: profile.total_xp + newlyUnlockedRewardXp
        };
        saveProfile(nextProfile);
      }
    }
  };

  // Auth Functions
  const signIn = async (email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email.includes('@')) {
          setLoading(false);
          resolve('Invalid Email address format');
          return;
        }
        if (pass.length < 6) {
          setLoading(false);
          resolve('Password must be at least 6 characters');
          return;
        }

        const authenticatedUser = { email: email.trim().toLowerCase() };
        setUser(authenticatedUser);
        localStorage.setItem('focusflow_user', JSON.stringify(authenticatedUser));
        triggerHapticFeedback('success');
        setLoading(false);
        resolve(null);
      }, 700);
    });
  };

  const signUp = async (email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email.includes('@')) {
          setLoading(false);
          resolve('Invalid Email address format');
          return;
        }
        if (pass.length < 8) {
          setLoading(false);
          resolve('Password must be at least 8 characters long');
          return;
        }

        const authenticatedUser = { email: email.trim().toLowerCase() };
        setUser(authenticatedUser);
        localStorage.setItem('focusflow_user', JSON.stringify(authenticatedUser));
        triggerHapticFeedback('success');
        setLoading(false);
        resolve(null);
      }, 800);
    });
  };

  const signOut = () => {
    setUser(null);
    setProfile(null);
    setRoutines([]);
    setTasks([]);
    setSessions([]);
    setStreak(null);
    localStorage.removeItem('focusflow_user');
    triggerHapticFeedback('medium');
    showToast('info', 'Signed Out', 'You have been safely signed out. Keep focused!');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    triggerHapticFeedback('light');
    showToast('success', 'Reset Email Sent', `We sent a reset link to ${email}. Check your spam fold. `);
    return true;
  };

  // Onboarding complete
  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem('focusflow_onboarding', 'completed');
    triggerHapticFeedback('success');
  };

  // Profile modifications
  const updateProfile = (displayName: string, avatarEmoji: string) => {
    if (!profile) return;
    const nextProf = {
      ...profile,
      display_name: displayName,
      avatar_emoji: avatarEmoji
    };
    saveProfile(nextProf);
    triggerHapticFeedback('light');
    showToast('success', 'Profile Updated', 'Your ADHD brain dashboard avatar and display name are saved!');
  };

  const addXP = (amount: number, reason?: string) => {
    if (!profile) return;
    const nextProf = {
      ...profile,
      total_xp: profile.total_xp + amount
    };
    saveProfile(nextProf);
    triggerHapticFeedback('success');
    showToast('success', `+${amount} XP Generated! 🎉`, reason || 'Consistency is your superpower.');
    
    // Evaluate if any achievement condition met
    runAchievementsDiagnostic(nextProf.total_xp, streak?.current_streak || 0, sessions, tasks);
  };

  // Routines CRUD
  const createRoutine = (name: string, emoji: string, time_of_day: TimeOfDay): boolean => {
    // ADHD Check: free tier limits
    if (subscriptionStatus === 'free' && routines.length >= 3) {
      triggerHapticFeedback('error');
      // Let caller handle showing locking modal
      return false;
    }

    if (!user) return false;

    const newRoutine: Routine = {
      id: `rout-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.email,
      name,
      emoji,
      time_of_day,
      is_active: true,
      reminder_enabled: false,
      reminder_time: '09:00',
      reminder_days: ['M', 'T', 'W', 'T', 'F'],
      created_at: new Date().toISOString(),
      steps: []
    };

    const nextRoutines = [...routines, newRoutine];
    saveRoutines(nextRoutines);
    addXP(15, 'Created a newly structured routine draft!');
    triggerHapticFeedback('success');
    return true;
  };

  const updateRoutine = (id: string, updates: Partial<Omit<Routine, 'id' | 'steps'>>) => {
    const nextRoutines = routines.map((r) => {
      if (r.id === id) {
        return { ...r, ...updates };
      }
      return r;
    });
    saveRoutines(nextRoutines);
    triggerHapticFeedback('light');
  };

  const deleteRoutine = (id: string) => {
    const nextRoutines = routines.filter((r) => r.id !== id);
    saveRoutines(nextRoutines);
    triggerHapticFeedback('medium');
    showToast('warning', 'Routine Deleted', 'Successfully cleaned up routine from your database.');
  };

  const createStep = (routineId: string, title: string, duration_minutes: number, emoji: string) => {
    const nextRoutines = routines.map((r) => {
      if (r.id === routineId) {
        const order = r.steps.length;
        const newStep: RoutineStep = {
          id: `step-${Math.random().toString(36).substr(2, 9)}`,
          routine_id: routineId,
          title,
          duration_minutes,
          order_index: order,
          emoji,
          created_at: new Date().toISOString()
        };
        return {
          ...r,
          steps: [...r.steps, newStep]
        };
      }
      return r;
    });
    saveRoutines(nextRoutines);
    addXP(5, `Added focus sprint step: "${title}"`);
    triggerHapticFeedback('light');
  };

  const updateStep = (routineId: string, stepId: string, title: string, duration_minutes: number, emoji: string) => {
    const nextRoutines = routines.map((r) => {
      if (r.id === routineId) {
        const updatedSteps = r.steps.map((st) => {
          if (st.id === stepId) {
            return { ...st, title, duration_minutes, emoji };
          }
          return st;
        });
        return {
          ...r,
          steps: updatedSteps
        };
      }
      return r;
    });
    saveRoutines(nextRoutines);
    triggerHapticFeedback('light');
  };

  const deleteStep = (routineId: string, stepId: string) => {
    const nextRoutines = routines.map((r) => {
      if (r.id === routineId) {
        const remainingSteps = r.steps
          .filter((st) => st.id !== stepId)
          .map((st, index) => ({ ...st, order_index: index })); // fix order
        return {
          ...r,
          steps: remainingSteps
        };
      }
      return r;
    });
    saveRoutines(nextRoutines);
    triggerHapticFeedback('medium');
  };

  const reorderSteps = (routineId: string, newSteps: RoutineStep[]) => {
    const nextRoutines = routines.map((r) => {
      if (r.id === routineId) {
        const standardizedSteps = newSteps.map((st, index) => ({
          ...st,
          order_index: index
        }));
        return {
          ...r,
          steps: standardizedSteps
        };
      }
      return r;
    });
    saveRoutines(nextRoutines);
    triggerHapticFeedback('light');
  };

  // Planner Tasks CRUD
  const createTask = (title: string, priority: 'low' | 'medium' | 'high') => {
    if (!user) return;
    const newTask: Task = {
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.email,
      title,
      is_completed: false,
      due_date: new Date().toISOString().split('T')[0],
      priority,
      created_at: new Date().toISOString()
    };
    const nextTasks = [newTask, ...tasks];
    saveTasks(nextTasks);
    triggerHapticFeedback('light');
    showToast('success', 'Task Created', `"${title}" has been pinned to today's board.`);
  };

  const toggleTask = (id: string) => {
    let completedState = false;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        completedState = !t.is_completed;
        return { ...t, is_completed: completedState };
      }
      return t;
    });
    saveTasks(nextTasks);
    triggerHapticFeedback(completedState ? 'success' : 'light');
    
    if (completedState) {
      addXP(10, 'Completed daily task checklist item!');
    } else {
      showToast('info', 'Task Restored', 'Checked item has been undone.');
    }

    // Diagnostics rechecks
    if (profile) {
      runAchievementsDiagnostic(profile.total_xp, streak?.current_streak || 0, sessions, nextTasks);
    }
  };

  const deleteTask = (id: string) => {
    const nextTasks = tasks.filter((t) => t.id !== id);
    saveTasks(nextTasks);
    triggerHapticFeedback('medium');
    showToast('info', 'Task Removed', 'Task cleared from temporary registry.');
  };

  // Focus Sessions Logger
  const createSession = (duration_minutes: number, type: 'pomodoro' | 'custom', completed: boolean) => {
    if (!user) return;
    const newSess: FocusSession = {
      id: `session-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.email,
      duration_minutes,
      type,
      completed,
      created_at: new Date().toISOString()
    };
    const nextSessions = [newSess, ...sessions];
    saveSessions(nextSessions);

    if (completed) {
      // Completed! Add large XP payload!
      const bonusXp = type === 'pomodoro' ? 50 : Math.round(duration_minutes * 1.5);
      addXP(bonusXp, `Completed ${duration_minutes}-min session! ADHD superpower activated! ⚡`);
      incrementStreak();
    }
    
    // Evaluate achievements
    if (profile) {
      runAchievementsDiagnostic(profile.total_xp, streak?.current_streak || 0, nextSessions, tasks);
    }
  };

  // Streak Incrementor
  const incrementStreak = () => {
    if (!streak) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let current = streak.current_streak;
    let longest = streak.longest_streak;

    if (streak.last_active_date === todayStr) {
      // Already active today, nothing to change
      return;
    }

    // Check if last active was yesterday (continuous) or older
    const lastActive = streak.last_active_date;
    let continuous = false;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        continuous = true;
      }
    } else {
      continuous = true;
    }

    if (continuous) {
      current += 1;
    } else {
      current = 1; // broken, reset to 1
    }

    if (current > longest) {
      longest = current;
    }

    const nextStreak = {
      ...streak,
      current_streak: current,
      longest_streak: longest,
      last_active_date: todayStr,
      updated_at: new Date().toISOString()
    };

    saveStreak(nextStreak);
    
    if (current > streak.current_streak) {
      showToast('success', `🔥 ${current}-Day Streak!`, "You are on absolute consistency fire! Keep it rolling.");
    }
  };

  // Subscriptions purchase mocks (RevenueCat implementation)
  const purchaseMonthly = async (): Promise<boolean> => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setSubscriptionStatus('premium');
        localStorage.setItem('focusflow_subscription_status', 'premium');
        setLoading(false);
        triggerHapticFeedback('success');
        playBellNotification('complete');
        showToast('success', '👑 Premium Active!', 'Thank you! Premium has been unlocked. Unlimited routines + Ad free!');
        resolve(true);
      }, 1000);
    });
  };

  const purchaseYearly = async (): Promise<boolean> => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setSubscriptionStatus('premium');
        localStorage.setItem('focusflow_subscription_status', 'premium');
        setLoading(false);
        triggerHapticFeedback('success');
        playBellNotification('complete');
        showToast('success', '👑 Premium Active!', 'Outstanding choice! Annual membership is activated (3 days trial started)');
        resolve(true);
      }, 1000);
    });
  };

  const restorePurchases = async (): Promise<boolean> => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setSubscriptionStatus('premium');
        localStorage.setItem('focusflow_subscription_status', 'premium');
        setLoading(false);
        triggerHapticFeedback('success');
        showToast('success', 'Purchases Restored', 'We recovered your previous active entitlement and premium state!');
        resolve(true);
      }, 800);
    });
  };

  const unlockAchievement = (id: string) => {
    const updatedAchievements = achievements.map((ach) => {
      if (ach.id === id && !ach.isUnlocked) {
        return { ...ach, isUnlocked: true, unlockedAt: new Date().toISOString() };
      }
      return ach;
    });
    saveAchievementsData(updatedAchievements);
    triggerHapticFeedback('success');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        onboardingCompleted,
        completeOnboarding,
        profile,
        updateProfile,
        addXP,
        routines,
        createRoutine,
        updateRoutine,
        deleteRoutine,
        createStep,
        updateStep,
        deleteStep,
        reorderSteps,
        tasks,
        createTask,
        toggleTask,
        deleteTask,
        sessions,
        createSession,
        streak,
        incrementStreak,
        subscriptionStatus,
        isPremium: subscriptionStatus === 'premium',
        purchaseMonthly,
        purchaseYearly,
        restorePurchases,
        achievements,
        unlockAchievement,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used inside an AppProvider');
  }
  return context;
};

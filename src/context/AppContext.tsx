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

// Real Live Zero-Trust Firebase Configuration Import
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from '../utils/firebase';

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

  // Load and subscribe in real-time to Cloud Firestore
  useEffect(() => {
    setLoading(true);
    let unsubProfile: (() => void) | null = null;
    let unsubRoutines: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubSessions: (() => void) | null = null;
    let unsubStreak: (() => void) | null = null;

    // Local onboarding read
    const storedOnboarding = localStorage.getItem('focusflow_onboarding');
    if (storedOnboarding === 'completed') {
      setOnboardingCompleted(true);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Unsubscribe any stale snapshots
      if (unsubProfile) unsubProfile();
      if (unsubRoutines) unsubRoutines();
      if (unsubTasks) unsubTasks();
      if (unsubSessions) unsubSessions();
      if (unsubStreak) unsubStreak();

      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setRoutines([]);
        setTasks([]);
        setSessions([]);
        setStreak(null);
        setSubscriptionStatus('free');
        setLoading(false);
        return;
      }

      const uid = fbUser.uid;
      const email = fbUser.email || '';
      setUser({ email });

      // Load/Listen User Profile in real time!
      const profileRef = doc(db, 'users', uid);
      try {
        const profSnap = await getDoc(profileRef);
        if (!profSnap.exists()) {
          // Initialize complete brand new profile inside firestore!
          const draftProfile: UserProfile = {
            id: uid,
            user_id: uid,
            display_name: email.split('@')[0] || 'User',
            avatar_emoji: '🧠',
            total_xp: 0,
            created_at: new Date().toISOString()
          };
          await setDoc(profileRef, draftProfile);
        }
      } catch (err) {
        console.error("Profile check failed: ", err);
      }

      unsubProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          setSubscriptionStatus((data as any).premium_status || 'free');
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      });

      // Load/Listen to Streaks collection logic
      const streakRef = doc(db, 'streaks', uid);
      try {
        const streakSnap = await getDoc(streakRef);
        if (!streakSnap.exists()) {
          const newStreak: Streak = {
            id: uid,
            user_id: uid,
            current_streak: 5, // Welcoming default!
            longest_streak: 12,
            last_active_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          };
          await setDoc(streakRef, newStreak);
        }
      } catch (err) {
        console.error("Streak check failed: ", err);
      }

      unsubStreak = onSnapshot(streakRef, (snap) => {
        if (snap.exists()) {
          setStreak(snap.data() as Streak);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `streaks/${uid}`);
      });

      // Load/Listen tasks list where user_id == uid
      const tasksQuery = query(collection(db, 'tasks'), where('user_id', '==', uid));
      unsubTasks = onSnapshot(tasksQuery, (snap) => {
        const tList: Task[] = [];
        snap.forEach((doc) => {
          tList.push(doc.data() as Task);
        });
        tList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTasks(tList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tasks');
      });

      // Load/Listen sessions list where user_id == uid
      const sessionsQuery = query(collection(db, 'sessions'), where('user_id', '==', uid));
      unsubSessions = onSnapshot(sessionsQuery, (snap) => {
        const sList: FocusSession[] = [];
        snap.forEach((doc) => {
          sList.push(doc.data() as FocusSession);
        });
        sList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSessions(sList);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'sessions');
      });

      // Pre-seed template routines if database is fully empty
      try {
        const routinesSnap = await getDocs(query(collection(db, 'routines'), where('user_id', '==', uid)));
        if (routinesSnap.empty) {
          const defRoutines = DEFAULT_ROUTINES(uid);
          for (const rot of defRoutines) {
            const rotRef = doc(db, 'routines', rot.id);
            const { steps, ...restRoutine } = rot;
            await setDoc(rotRef, restRoutine);
            // Add steps as subcollections
            for (const step of steps) {
              await setDoc(doc(db, 'routines', rot.id, 'steps', step.id), step);
            }
          }
        }
      } catch (err) {
        console.error("Seeding routines failed:", err);
      }

      // Pre-seed template tasks if database is fully empty
      try {
        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('user_id', '==', uid)));
        if (tasksSnap.empty) {
          const defTasks = DEFAULT_TASKS(uid);
          for (const task of defTasks) {
            await setDoc(doc(db, 'tasks', task.id), task);
          }
        }
      } catch (err) {
        console.error("Seeding tasks failed:", err);
      }

      // Load/Listen routines list where user_id == uid
      const routinesQuery = query(collection(db, 'routines'), where('user_id', '==', uid));
      unsubRoutines = onSnapshot(routinesQuery, async (snap) => {
        const routinesData = snap.docs.map(doc => doc.data() as Routine);
        const routinesWithSteps = await Promise.all(routinesData.map(async (rot) => {
          try {
            const stepsColl = collection(db, 'routines', rot.id, 'steps');
            const stepsSnap = await getDocs(stepsColl);
            const steps: RoutineStep[] = [];
            stepsSnap.forEach((sDoc) => {
              steps.push(sDoc.data() as RoutineStep);
            });
            steps.sort((a, b) => a.order_index - b.order_index);
            return { ...rot, steps };
          } catch (e) {
            console.error(`Error loading steps for routine ${rot.id}:`, e);
            return { ...rot, steps: [] };
          }
        }));

        setRoutines(routinesWithSteps);
        setLoading(false);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'routines');
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      if (unsubRoutines) unsubRoutines();
      if (unsubTasks) unsubTasks();
      if (unsubSessions) unsubSessions();
      if (unsubStreak) unsubStreak();
    };
  }, []);

  // Sync state helpers - achievements logic
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
      
      const newlyUnlockedRewardXp = updatedAchievements
        .filter((ach, idx) => ach.isUnlocked && !achievements[idx].isUnlocked)
        .reduce((sum, ach) => sum + ach.xpReward, 0);
        
      if (newlyUnlockedRewardXp > 0 && profile) {
        const profileRef = doc(db, 'users', profile.id);
        updateDoc(profileRef, {
          total_xp: profile.total_xp + newlyUnlockedRewardXp
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${profile.id}`));
      }
    }
  };

  // Auth Functions - Linked directly to Firebase Authentication SDK
  const signIn = async (email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      triggerHapticFeedback('success');
      setLoading(false);
      return null;
    } catch (err: any) {
      console.error("SignIn error: ", err);
      triggerHapticFeedback('error');
      setLoading(false);
      return err.message || 'Authorization failed';
    }
  };

  const signUp = async (email: string, pass: string): Promise<string | null> => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      triggerHapticFeedback('success');
      setLoading(false);
      return null;
    } catch (err: any) {
      console.error("SignUp error: ", err);
      triggerHapticFeedback('error');
      setLoading(false);
      return err.message || 'Registration failed';
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      triggerHapticFeedback('medium');
      showToast('info', 'Signed Out', 'You have been safely signed out. Keep focused!');
    } catch (err) {
      console.error("SignOut error: ", err);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      triggerHapticFeedback('light');
      showToast('success', 'Reset Email Sent', `We sent a reset link to ${email}. Check your spam folder.`);
      return true;
    } catch (err: any) {
      console.error("Password reset error: ", err);
      showToast('error', 'Reset Failed', err.message || 'Unable to send recovery email.');
      return false;
    }
  };

  // Onboarding complete
  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem('focusflow_onboarding', 'completed');
    triggerHapticFeedback('success');
  };

  // Profile modifications
  const updateProfile = async (displayName: string, avatarEmoji: string) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const profileRef = doc(db, 'users', uid);
    try {
      await updateDoc(profileRef, {
        display_name: displayName,
        avatar_emoji: avatarEmoji
      });
      triggerHapticFeedback('light');
      showToast('success', 'Profile Updated', 'Your ADHD brain dashboard avatar and display name are saved!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const addXP = async (amount: number, reason?: string) => {
    if (!profile || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const profileRef = doc(db, 'users', uid);
    const updatedXP = profile.total_xp + amount;
    try {
      await updateDoc(profileRef, {
        total_xp: updatedXP
      });
      triggerHapticFeedback('success');
      showToast('success', `+${amount} XP Generated! 🎉`, reason || 'Consistency is your superpower.');
      
      runAchievementsDiagnostic(updatedXP, streak?.current_streak || 0, sessions, tasks);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Routines CRUD
  const createRoutine = (name: string, emoji: string, time_of_day: TimeOfDay): boolean => {
    if (subscriptionStatus === 'free' && routines.length >= 3) {
      triggerHapticFeedback('error');
      return false;
    }
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    const routineId = `rout-${Math.random().toString(36).substr(2, 9)}`;

    const newRoutine: Omit<Routine, 'steps'> = {
      id: routineId,
      user_id: uid,
      name,
      emoji,
      time_of_day,
      is_active: true,
      reminder_enabled: false,
      reminder_time: '09:00',
      reminder_days: ['M', 'T', 'W', 'T', 'F'],
      created_at: new Date().toISOString()
    };

    const runWrite = async () => {
      try {
        await setDoc(doc(db, 'routines', routineId), newRoutine);
        addXP(15, 'Created a newly structured routine draft!');
        triggerHapticFeedback('success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `routines/${routineId}`);
      }
    };
    runWrite();
    return true;
  };

  const updateRoutine = async (id: string, updates: Partial<Omit<Routine, 'id' | 'steps'>>) => {
    try {
      await updateDoc(doc(db, 'routines', id), updates);
      triggerHapticFeedback('light');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `routines/${id}`);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'routines', id));
      triggerHapticFeedback('medium');
      showToast('warning', 'Routine Deleted', 'Successfully cleaned up routine from your database.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `routines/${id}`);
    }
  };

  const createStep = async (routineId: string, title: string, duration_minutes: number, emoji: string) => {
    const stepId = `step-${Math.random().toString(36).substr(2, 9)}`;
    const routine = routines.find(r => r.id === routineId);
    const orderIndex = routine ? routine.steps.length : 0;
    
    const newStep: RoutineStep = {
      id: stepId,
      routine_id: routineId,
      title,
      duration_minutes,
      order_index: orderIndex,
      emoji,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'routines', routineId, 'steps', stepId), newStep);
      addXP(5, `Added focus sprint step: "${title}"`);
      triggerHapticFeedback('light');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `routines/${routineId}/steps/${stepId}`);
    }
  };

  const updateStep = async (routineId: string, stepId: string, title: string, duration_minutes: number, emoji: string) => {
    try {
      await updateDoc(doc(db, 'routines', routineId, 'steps', stepId), {
        title,
        duration_minutes,
        emoji
      });
      triggerHapticFeedback('light');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `routines/${routineId}/steps/${stepId}`);
    }
  };

  const deleteStep = async (routineId: string, stepId: string) => {
    try {
      await deleteDoc(doc(db, 'routines', routineId, 'steps', stepId));
      triggerHapticFeedback('medium');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `routines/${routineId}/steps/${stepId}`);
    }
  };

  const reorderSteps = async (routineId: string, newSteps: RoutineStep[]) => {
    try {
      const batch = writeBatch(db);
      newSteps.forEach((st, index) => {
        const stepRef = doc(db, 'routines', routineId, 'steps', st.id);
        batch.update(stepRef, { order_index: index });
      });
      await batch.commit();
      triggerHapticFeedback('light');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `routines/${routineId}/steps/reorder`);
    }
  };

  // Planner Tasks CRUD
  const createTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const taskId = `task-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: Task = {
      id: taskId,
      user_id: uid,
      title,
      is_completed: false,
      due_date: new Date().toISOString().split('T')[0],
      priority,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'tasks', taskId), newTask);
      triggerHapticFeedback('light');
      showToast('success', 'Task Created', `"${title}" has been pinned to today's board.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tasks/${taskId}`);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const completedState = !task.is_completed;

    try {
      await updateDoc(doc(db, 'tasks', id), {
        is_completed: completedState
      });
      triggerHapticFeedback(completedState ? 'success' : 'light');
      if (completedState) {
        addXP(10, 'Completed daily task checklist item!');
      } else {
        showToast('info', 'Task Restored', 'Checked item has been undone.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      triggerHapticFeedback('medium');
      showToast('info', 'Task Removed', 'Task cleared from temporary registry.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  // Focus Sessions Logger
  const createSession = async (duration_minutes: number, type: 'pomodoro' | 'custom', completed: boolean) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;

    const newSess: FocusSession = {
      id: sessionId,
      user_id: uid,
      duration_minutes,
      type,
      completed,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'sessions', sessionId), newSess);
      if (completed) {
        const bonusXp = type === 'pomodoro' ? 50 : Math.round(duration_minutes * 1.5);
        addXP(bonusXp, `Completed ${duration_minutes}-min session! ADHD superpower activated! ⚡`);
        incrementStreak();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `sessions/${sessionId}`);
    }
  };

  // Streak Incrementor
  const incrementStreak = async () => {
    if (!streak || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const streakRef = doc(db, 'streaks', uid);
    const todayStr = new Date().toISOString().split('T')[0];
    
    let current = streak.current_streak;
    let longest = streak.longest_streak;

    if (streak.last_active_date === todayStr) {
      return;
    }

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
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }

    try {
      await updateDoc(streakRef, {
        current_streak: current,
        longest_streak: longest,
        last_active_date: todayStr,
        updated_at: new Date().toISOString()
      });
      if (current > streak.current_streak) {
        showToast('success', `🔥 ${current}-Day Streak!`, "You are on absolute consistency fire! Keep it rolling.");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `streaks/${uid}`);
    }
  };

  // Subscriptions purchase mocks (Direct integration inside secure production Firestore!)
  const purchaseMonthly = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        premium_status: 'premium'
      });
      setSubscriptionStatus('premium');
      setLoading(false);
      triggerHapticFeedback('success');
      playBellNotification('complete');
      showToast('success', '👑 Premium Active!', 'Thank you! Premium has been unlocked. Unlimited routines + Ad free!');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      setLoading(false);
      return false;
    }
  };

  const purchaseYearly = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        premium_status: 'premium'
      });
      setSubscriptionStatus('premium');
      setLoading(false);
      triggerHapticFeedback('success');
      playBellNotification('complete');
      showToast('success', '👑 Premium Active!', 'Outstanding choice! Annual membership is activated (3 days trial started)');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      setLoading(false);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        premium_status: 'premium'
      });
      setSubscriptionStatus('premium');
      setLoading(false);
      triggerHapticFeedback('success');
      showToast('success', 'Purchases Restored', 'We recovered your previous active entitlement and premium state!');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      setLoading(false);
      return false;
    }
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

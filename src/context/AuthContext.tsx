import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole, QuizAttempt, Quiz, ArenaConfig } from '../types/bibleArena';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { quizService } from '../services/quizService';

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  userRole: UserRole;
  isSupabaseReady: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string, groupAffiliation?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  userAttempts: QuizAttempt[];
  recordAttempt: (attempt: Omit<QuizAttempt, 'id' | 'date'>) => void;
  customQuizzes: Quiz[];
  publishCustomQuiz: (quiz: Quiz) => Promise<void>;
  hostedArenas: ArenaConfig[];
  createArena: (arena: ArenaConfig) => void;
  saveAvatar: (avatarId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  activeToast: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const defaultGuestProfile: UserProfile = {
  id: 'guest-session',
  name: 'Guest Player',
  nickname: 'Guest',
  avatar: 'hero-david',
  role: 'guest',
  totalPoints: 0,
  quizzesCompleted: 0,
  accuracy: 0,
  streakDays: 0,
  rank: undefined,
  hostedArenasCount: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('biblearena_user_profile');
      if (saved) {
        return JSON.parse(saved);
      }
      return defaultGuestProfile;
    } catch {
      return defaultGuestProfile;
    }
  });

  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('biblearena_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customQuizzes, setCustomQuizzes] = useState<Quiz[]>(() => {
    try {
      const saved = localStorage.getItem('biblearena_custom_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hostedArenas, setHostedArenas] = useState<ArenaConfig[]>(() => {
    try {
      const saved = localStorage.getItem('biblearena_hosted_arenas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Sync Supabase Auth session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check existing session
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (data.session?.user) {
        fetchProfile(data.session.user.id, data.session.user.email || '');
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(defaultGuestProfile);
          try {
            localStorage.removeItem('biblearena_user_profile');
          } catch {}
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch Supabase Profile
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          nickname: data.nickname,
          email: data.email || email,
          avatar: data.avatar || '🕊️',
          role: data.role || 'member',
          groupAffiliation: data.group_affiliation,
          totalPoints: data.total_points || 0,
          quizzesCompleted: data.quizzes_completed || 0,
          accuracy: data.accuracy || 0,
          streakDays: data.streak_days || 0,
          hostedArenasCount: data.hosted_arenas_count || 0,
        };
        setCurrentUser(profile);
      } else {
        const nick = email.split('@')[0] || 'Member';
        const cleanName = nick.charAt(0).toUpperCase() + nick.slice(1);
        const newProf: UserProfile = {
          id: userId,
          name: cleanName,
          nickname: cleanName,
          email,
          avatar: '🕊️',
          role: 'member',
          totalPoints: 0,
          quizzesCompleted: 0,
          accuracy: 0,
          streakDays: 0,
          hostedArenasCount: 0,
        };
        setCurrentUser(newProf);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('biblearena_user_profile', JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('biblearena_attempts', JSON.stringify(userAttempts));
    } catch {}
  }, [userAttempts]);

  useEffect(() => {
    try {
      localStorage.setItem('biblearena_custom_quizzes', JSON.stringify(customQuizzes));
    } catch {}
  }, [customQuizzes]);

  useEffect(() => {
    try {
      localStorage.setItem('biblearena_hosted_arenas', JSON.stringify(hostedArenas));
    } catch {}
  }, [hostedArenas]);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const clearToast = () => setActiveToast(null);

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      showToast('Supabase connection required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed')) {
          showToast('Email not confirmed yet. In your Supabase Dashboard under Authentication -> Providers -> Email, turn OFF "Confirm email" to log in immediately.');
        } else {
          showToast(`Sign in error: ${error.message}`);
        }
        return false;
      }

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email || email);
        showToast(`Welcome back, ${email.split('@')[0]}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(`Sign in failed: ${err.message}`);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    groupAffiliation?: string
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      showToast('Supabase connection required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
      return false;
    }

    const cleanNick = name.split(' ')[0] || name;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            name: name.trim(),
            nickname: cleanNick,
            group_affiliation: groupAffiliation || null,
          },
        },
      });

      if (error) {
        const errMsg = error.message.toLowerCase();

        // If rate limit or already registered, attempt direct login in case account was already created
        if (errMsg.includes('rate limit') || errMsg.includes('already registered')) {
          const loginAttempt = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: pass,
          });

          if (loginAttempt.data?.user) {
            await fetchProfile(loginAttempt.data.user.id, loginAttempt.data.user.email || email);
            showToast(`Welcome to BibleArena, ${name}! Logged in successfully.`);
            return true;
          }

          if (loginAttempt.error?.message.toLowerCase().includes('email not confirmed')) {
            showToast('Email rate limit reached: Supabase free SMTP limits email sends. In Supabase Dashboard (Auth -> Providers -> Email), toggle OFF "Confirm email" for instant login.');
            return false;
          }

          showToast('Email rate limit exceeded by Supabase free mailer. To fix: In Supabase Dashboard -> Auth -> Providers -> Email, turn OFF "Confirm email" to enable instant registration.');
          return false;
        }

        showToast(`Sign up error: ${error.message}`);
        return false;
      }

      if (data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name.trim(),
            nickname: cleanNick,
            email: email.trim(),
            group_affiliation: groupAffiliation || null,
            role: 'member',
            total_points: 0,
            quizzes_completed: 0,
            accuracy: 0,
            streak_days: 0,
            hosted_arenas_count: 0,
          });
        } catch {}

        await fetchProfile(data.user.id, data.user.email || email);

        if (!data.session) {
          showToast(`Account registered! Note: Email confirmation is currently required by Supabase. Turn OFF "Confirm email" in Supabase Auth to enable instant auto-login.`);
        } else {
          showToast(`Account created! Welcome to BibleArena, ${name}!`);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(`Registration error: ${err.message}`);
      return false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(defaultGuestProfile);
    showToast('Signed out. Continuing as Guest.');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      showToast('Supabase connection required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.');
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      showToast(`Reset error: ${error.message}`);
      return false;
    }
    showToast('Password reset link sent to your email!');
    return true;
  };

  const recordAttempt = (attempt: Omit<QuizAttempt, 'id' | 'date'>) => {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `att-${Date.now()}`,
      date: 'Just now',
    };
    setUserAttempts((prev) => [newAttempt, ...prev]);

    setCurrentUser((prev) => {
      const addedPoints = attempt.score * 100 + (attempt.percentage === 100 ? 150 : 0);
      const totalQuizzes = prev.quizzesCompleted + 1;
      const newAccuracy = Math.round((prev.accuracy * prev.quizzesCompleted + attempt.percentage) / totalQuizzes);
      return {
        ...prev,
        quizzesCompleted: totalQuizzes,
        totalPoints: prev.totalPoints + addedPoints,
        accuracy: newAccuracy,
        streakDays: prev.streakDays === 0 ? 1 : prev.streakDays,
      };
    });
  };

  const publishCustomQuiz = async (quiz: Quiz) => {
    try {
      const quizId = await quizService.saveQuiz(quiz, currentUser.id !== 'guest-session' ? currentUser.id : undefined);
      const savedQuiz = { ...quiz, id: quizId };
      setCustomQuizzes((prev) => [savedQuiz, ...prev]);
      showToast(`Quiz "${quiz.title}" published! Available in library.`);
    } catch (err: any) {
      showToast(`Quiz saved locally: ${err.message}`);
      setCustomQuizzes((prev) => [quiz, ...prev]);
    }
  };

  const createArena = (arena: ArenaConfig) => {
    setHostedArenas((prev) => [arena, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      hostedArenasCount: (prev.hostedArenasCount || 0) + 1,
    }));
    showToast(`Arena "${arena.title}" created with PIN ${arena.pin}!`);
  };

  const saveAvatar = async (avatarId: string): Promise<void> => {
    setCurrentUser((prev) => {
      const updated = { ...prev, avatar: avatarId };
      try {
        localStorage.setItem('biblearena_user_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (isSupabaseConfigured && currentUser.role !== 'guest' && currentUser.id !== 'guest-session') {
      try {
        await supabase
          .from('profiles')
          .update({ avatar: avatarId, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Failed to sync avatar to Supabase:', err);
      }
    }

    showToast('Faith avatar updated successfully!');
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('biblearena_user_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (isSupabaseConfigured && currentUser.role !== 'guest' && currentUser.id !== 'guest-session') {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.name) payload.name = updates.name;
        if (updates.nickname) payload.nickname = updates.nickname;
        if (updates.avatar) payload.avatar = updates.avatar;
        if (updates.groupAffiliation) payload.group_affiliation = updates.groupAffiliation;

        await supabase
          .from('profiles')
          .update(payload)
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Failed to sync profile to Supabase:', err);
      }
    }

    showToast('Profile details updated!');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser.role !== 'guest',
        userRole: currentUser.role,
        isSupabaseReady: isSupabaseConfigured,
        login,
        register,
        logout,
        resetPassword,
        userAttempts,
        recordAttempt,
        customQuizzes,
        publishCustomQuiz,
        hostedArenas,
        createArena,
        saveAvatar,
        updateProfile,
        activeToast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

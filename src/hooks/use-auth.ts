import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null
        }));

        // Fetch profile if user is signed in
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (error) {
                console.error('Error fetching profile:', error);
                return;
              }

              setAuthState(prev => ({
                ...prev,
                profile,
                loading: false
              }));
            } catch (error) {
              console.error('Error in profile fetch:', error);
              setAuthState(prev => ({ ...prev, loading: false }));
            }
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            loading: false
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null
      }));

      if (!session) {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        if (error.message.includes('already_registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
          return { error };
        }
        toast.error(error.message);
        return { error };
      }

      if (data.user && !data.session) {
        toast.success('Verifique seu email para confirmar o cadastro.');
      }

      return { data };
    } catch (error: any) {
      toast.error('Erro inesperado ao criar conta');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
          return { error };
        }
        toast.error(error.message);
        return { error };
      }

      toast.success('Login realizado com sucesso!');
      return { data };
    } catch (error: any) {
      toast.error('Erro inesperado ao fazer login');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return { error };
      }
      toast.success('Logout realizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro inesperado ao fazer logout');
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Link de recuperação enviado para seu email');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro inesperado ao enviar email de recuperação');
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) return { error: new Error('User not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) {
        toast.error(error.message);
        return { error };
      }

      setAuthState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null
      }));

      toast.success('Perfil atualizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      toast.error('Erro inesperado ao atualizar perfil');
      return { error };
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isAdmin: authState.profile?.role === 'admin',
    isAuthenticated: !!authState.user
  };
}
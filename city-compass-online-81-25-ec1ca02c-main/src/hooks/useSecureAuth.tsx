
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type UserProfile = Tables<'usuarios'>;
type TipoConta = 'usuario' | 'empresa' | 'admin_cidade' | 'admin_geral';

interface SecurityContext {
  lastActivity: number;
  sessionValid: boolean;
  ipAddress?: string;
}

interface AdditionalSignUpData {
  telefone?: string;
  nomeEmpresa?: string;
  endereco?: string;
  descricao?: string;
}

export const useSecureAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [securityContext, setSecurityContext] = useState<SecurityContext>({
    lastActivity: Date.now(),
    sessionValid: true
  });
  const { toast } = useToast();

  // Rate limiting for auth attempts
  const [authAttempts, setAuthAttempts] = useState<{ [key: string]: number }>({});
  
  const checkRateLimit = useCallback((email: string): boolean => {
    const now = Date.now();
    const attempts = authAttempts[email] || 0;
    
    // Reset attempts after 15 minutes
    if (attempts > 0 && now - attempts > 15 * 60 * 1000) {
      setAuthAttempts(prev => ({ ...prev, [email]: 0 }));
      return true;
    }
    
    // Max 5 attempts per 15 minutes
    return attempts < 5;
  }, [authAttempts]);

  const recordAuthAttempt = useCallback((email: string) => {
    setAuthAttempts(prev => ({
      ...prev,
      [email]: (prev[email] || 0) + 1
    }));
  }, []);

  // Session validation with activity tracking
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('❌ Session validation failed:', error);
        return false;
      }

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('⏰ Session expired');
        await supabase.auth.signOut();
        return false;
      }

      // Check for session timeout (30 minutes of inactivity)
      const timeSinceLastActivity = Date.now() - securityContext.lastActivity;
      if (timeSinceLastActivity > 30 * 60 * 1000) {
        console.log('⏰ Session timeout due to inactivity');
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou por inatividade. Faça login novamente.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 Session validation error:', error);
      return false;
    }
  }, [securityContext.lastActivity, toast]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    setSecurityContext(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
  }, []);

  // Enhanced profile creation with security logging
  const createUserProfile = useCallback(async (
    userId: string, 
    authUser: User, 
    tipoConta: TipoConta = 'usuario', 
    additionalData?: AdditionalSignUpData
  ) => {
    try {
      console.log('👤 Creating secure user profile for:', userId, 'Type:', tipoConta);
      
      // Log security event
      await supabase.functions.invoke('log-security-event', {
        body: {
          event_type: 'user_creation',
          user_id: userId,
          metadata: {
            account_type: tipoConta,
            email: authUser.email,
            ip_address: securityContext.ipAddress
          }
        }
      });

      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: userId,
          nome: authUser.user_metadata?.nome || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          email: authUser.email || '',
          tipo_conta: tipoConta,
          telefone: additionalData?.telefone || authUser.user_metadata?.telefone
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return null;
      }

      console.log('✅ Secure profile created successfully:', data.nome);
      return data;
    } catch (error) {
      console.error('💥 Error creating secure user profile:', error);
      return null;
    }
  }, [securityContext.ipAddress]);

  const fetchProfile = useCallback(async (userId: string, authUser: User) => {
    try {
      console.log('🔍 Fetching secure profile for user:', userId);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
      }

      if (data) {
        console.log('✅ Secure profile found:', data.nome);
        return data;
      } else {
        console.log('⚠️ No profile found, creating default...');
        return await createUserProfile(userId, authUser);
      }
    } catch (error) {
      console.error('💥 Error in fetchProfile:', error);
      return null;
    }
  }, [createUserProfile]);

  // Enhanced sign in with security features
  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting secure sign in for:', email);
    
    // Rate limiting check
    if (!checkRateLimit(email)) {
      toast({
        title: "Muitas tentativas",
        description: "Muitas tentativas de login. Tente novamente em 15 minutos.",
        variant: "destructive"
      });
      return { error: new Error('Rate limit exceeded') };
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Secure sign in error:', error);
        recordAuthAttempt(email);
        
        // Log failed attempt
        await supabase.functions.invoke('log-security-event', {
          body: {
            event_type: 'login_failed',
            metadata: {
              email,
              error: error.message,
              ip_address: securityContext.ipAddress
            }
          }
        });

        setLoading(false);
        return { error };
      }
      
      // Log successful login
      await supabase.functions.invoke('log-security-event', {
        body: {
          event_type: 'login_success',
          user_id: data.user?.id,
          metadata: {
            email,
            ip_address: securityContext.ipAddress
          }
        }
      });

      console.log('✅ Secure sign in successful');
      updateActivity();
      
      // Buscar perfil do usuário para possível redirecionamento apenas no login explícito
      if (data.user) {
        const userProfile = await fetchProfile(data.user.id, data.user);
        if (userProfile) {
          // Redirecionar apenas usuários empresa/admin da página inicial
          const currentPath = window.location.pathname;
          if (currentPath === '/') {
            if (userProfile.tipo_conta === 'empresa') {
              setTimeout(() => window.location.href = '/empresa-dashboard', 100);
            } else if (userProfile.tipo_conta === 'admin_geral' || userProfile.tipo_conta === 'admin_cidade') {
              setTimeout(() => window.location.href = '/admin', 100);
            }
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('💥 Unexpected secure sign in error:', error);
      recordAuthAttempt(email);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    nome: string, 
    tipoConta: TipoConta = 'usuario',
    additionalData?: AdditionalSignUpData
  ) => {
    setLoading(true);
    try {
      // Enhanced password validation
      if (password.length < 8) {
        return { error: new Error('A senha deve ter pelo menos 8 caracteres') };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo_conta: tipoConta,
            ...additionalData
          },
          emailRedirectTo: `${window.location.origin}/`
        },
      });

      if (!error) {
        // Log signup event
        await supabase.functions.invoke('log-security-event', {
          body: {
            event_type: 'signup_success',
            metadata: {
              email,
              account_type: tipoConta,
              ip_address: securityContext.ipAddress
            }
          }
        });
      }

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Secure signing out...');
    setLoading(true);
    try {
      // Log logout event
      if (user) {
        await supabase.functions.invoke('log-security-event', {
          body: {
            event_type: 'logout',
            user_id: user.id,
            metadata: {
              ip_address: securityContext.ipAddress
            }
          }
        });
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Secure sign out error:', error);
      } else {
        console.log('✅ Secure sign out successful');
        setProfile(null);
        setSecurityContext({
          lastActivity: Date.now(),
          sessionValid: false
        });
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Activity tracking for session management
  useEffect(() => {
    const handleActivity = () => updateActivity();
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Session validation interval
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const isValid = await validateSession();
      setSecurityContext(prev => ({
        ...prev,
        sessionValid: isValid
      }));
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user, validateSession]);

  // Main auth initialization
  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const initializeSecureAuth = async () => {
      if (initialized || isInitializing) return;
      isInitializing = true;

      try {
        console.log('🔐 Initializing secure authentication...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          isInitializing = false;
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id, session.user);
            if (mounted) {
              setProfile(userProfile);
              updateActivity();
            }
          }
          
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('💥 Initialize secure auth error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
      isInitializing = false;
    };

    if (!initialized) {
      initializeSecureAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Secure auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        if (event === 'INITIAL_SESSION' && initialized) {
          console.log('⏭️ Skipping duplicate INITIAL_SESSION');
          return;
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            if (mounted) {
              const userProfile = await fetchProfile(session.user.id, session.user);
              if (mounted) {
                setProfile(userProfile);
                setLoading(false);
                updateActivity();
              }
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
          setSecurityContext(prev => ({
            ...prev,
            sessionValid: false
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized, fetchProfile, updateActivity]);

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    securityContext,
    validateSession,
    updateActivity
  };
};

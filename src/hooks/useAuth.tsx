
import { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';
import { supabaseCache } from '@/lib/supabaseCache';

type UserProfile = Tables<'usuarios'>;
type TipoConta = 'usuario' | 'empresa' | 'admin_cidade' | 'admin_geral';

interface AdditionalSignUpData {
  telefone?: string;
  nomeEmpresa?: string;
  endereco?: string;
  descricao?: string;
}

const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const createUserProfile = useCallback(async (userId: string, authUser: User, tipoConta: TipoConta = 'usuario', additionalData?: AdditionalSignUpData) => {
    try {
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

      return data;
    } catch (error) {
      console.error('💥 Error creating user profile:', error);
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, authUser: User): Promise<UserProfile | null> => {
    try {
      // Check cache first
      const cacheKey = `user-profile-${userId}`;
      const cachedProfile = supabaseCache.get<UserProfile>(cacheKey);
      
      if (cachedProfile) {
        return cachedProfile;
      }
      
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
        // Cache for 30 minutes for better performance
        supabaseCache.set(cacheKey, data, 1800);
        return data;
      } else {
        const newProfile = await createUserProfile(userId, authUser);
        if (newProfile) {
          supabaseCache.set(cacheKey, newProfile, 1800);
        }
        return newProfile;
      }
    } catch (error) {
      console.error('💥 Error in fetchProfile:', error);
      return null;
    }
  }, [createUserProfile]);

  const redirectAfterLogin = useCallback((userProfile: UserProfile, isExplicitLogin = false) => {
    // Só redireciona se for um login explícito (não automático)
    if (!isExplicitLogin) return;
    
    const currentPath = window.location.pathname;
    
    // Só redireciona se estiver na página inicial
    if (currentPath !== '/') return;
    
    // Redireciona usuários com empresas para o dashboard
    if (userProfile.tipo_conta === 'empresa') {
      window.location.href = '/empresa-dashboard';
    } else if (userProfile.tipo_conta === 'admin_geral' || userProfile.tipo_conta === 'admin_cidade') {
      window.location.href = '/admin';
    }
    // Usuários normais ficam na página atual
  }, []);

  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const initializeAuth = async () => {
      if (initializedRef.current || isInitializing) return;
      isInitializing = true;
      initializedRef.current = true;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            setLoading(false);
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
            }
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Initialize error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
      isInitializing = false;
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'INITIAL_SESSION') return;

        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Debounce profile fetching to avoid multiple rapid requests
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          
          fetchTimeoutRef.current = setTimeout(async () => {
            if (mounted) {
              const userProfile = await fetchProfile(session.user.id, session.user);
              if (mounted) {
                setProfile(userProfile);
                setLoading(false);
              }
            }
          }, 50); // Reduced debounce time for faster response
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        setLoading(false);
        return { error };
      }
      
      // Buscar perfil do usuário para redirecionamento apenas no login explícito
      if (data.user) {
        const userProfile = await fetchProfile(data.user.id, data.user);
        if (userProfile) {
          redirectAfterLogin(userProfile, true); // true indica login explícito
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('💥 Unexpected sign in error:', error);
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            // Papéis privilegiados nunca são escolhidos pelo navegador.
            tipo_conta: 'usuario',
            tipo_conta_solicitada: tipoConta,
            ...additionalData
          },
          emailRedirectTo: `${window.location.origin}/`
        },
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
      } else {
        setProfile(null);
        window.location.href = '/';
      }
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
};

type AuthContextValue = ReturnType<typeof useAuthState>;
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return auth;
};

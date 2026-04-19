import { supabase } from './supabase';
import { storesApi } from './api';
import type { Usuario, AuthState } from '@/types';

/**
 * Registers a new user with email and password
 */
export async function register(
  email: string,
  password: string,
  nombre: string,
  telefono: string
): Promise<AuthState> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user) {
      // Create user profile in the database
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        email,
        nombre,
        telefono,
        tipo: 'usuario',
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || email,
          nombre,
          telefono,
          tipo: 'usuario',
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      };
    }

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

/**
 * Logs in a user with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<AuthState> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user) {
      // Fetch user profile from the database
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      return {
        user: profile || {
          id: authData.user.id,
          email: authData.user.email || email,
          nombre: authData.user.user_metadata?.nombre || 'Usuario',
          telefono: authData.user.user_metadata?.telefono || '',
          tipo: 'usuario',
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      };
    }

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

/**
 * Logs out the current user
 */
export async function logout(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Gets the current session
 */
export async function getCurrentSession(): Promise<AuthState> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData.session) {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      return {
        user: profile || {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email || '',
          nombre: sessionData.session.user.user_metadata?.nombre || 'Usuario',
          telefono: sessionData.session.user.user_metadata?.telefono || '',
          tipo: 'usuario',
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        isLoading: false,
      };
    }

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
}

/**
 * Updates the user's profile
 */
export async function updateUserProfile(
  updates: Partial<Pick<Usuario, 'nombre' | 'telefono' | 'direccion' | 'foto_url'>>
): Promise<AuthState> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      throw new Error('No active session');
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', sessionData.session.user.id);

    if (error) {
      throw new Error(error.message);
    }

    // Update auth metadata as well
    if (updates.nombre) {
      await supabase.auth.updateUser({
        data: { nombre: updates.nombre },
      });
    }

    return getCurrentSession();
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

/**
 * Sends a password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

/**
 * Updates the user's password
 */
export async function updatePassword(newPassword: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
}

/**
 * Signs in with Google
 */
export async function signInWithGoogle(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Gets the ID of the current authenticated user
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.user.id || null;
  } catch (error) {
    console.error('Get current user ID error:', error);
    return null;
  }
}

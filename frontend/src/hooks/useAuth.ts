'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';

export function useAuthCheck(requireAuth: boolean = false) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
  };
}

export function useRequireAuth(redirectTo: string = '/login') {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
}

export function useRequireRole(
  role: 'usuario' | 'tienda' | 'admin',
  redirectTo: string = '/'
) {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.tipo !== role && user?.tipo !== 'admin') {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, role, redirectTo, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRequiredRole: user?.tipo === role || user?.tipo === 'admin',
  };
}

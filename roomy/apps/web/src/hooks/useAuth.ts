import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // If auth is required and user is not authenticated
    if (requireAuth && !isAuthenticated && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
    
    // If auth is NOT required (like login page), but user IS authenticated
    if (!requireAuth && isAuthenticated && pathname.startsWith('/auth')) {
      router.push('/discover');
    }

    // Force quiz completion before discover
    if (isAuthenticated && user && !user.quizCompleted && pathname !== '/quiz') {
      router.push('/quiz');
    }

  }, [isAuthenticated, requireAuth, pathname, router, user]);

  return { user, isAuthenticated, logout };
}

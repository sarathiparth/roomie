'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      router.push('/auth/login');
      return;
    }

    if (accessToken && refreshToken) {
      // Fetch user profile immediately with the new token
      api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
        .then((res) => {
          setAuth(res.data.data, accessToken, refreshToken);
          // Redirect logic
          if (!res.data.data.quizCompleted) {
            router.push('/quiz');
          } else {
            router.push('/discover');
          }
        })
        .catch(() => {
          toast.error('Failed to resolve profile');
          router.push('/auth/login');
        });
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CallbackContent />
    </Suspense>
  );
}

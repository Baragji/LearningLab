// apps/web/src/components/auth/ProtectedRoute.tsx
import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  // ▶️ Hook now always runs, before any returns:
  useEffect(() => {
    if (!authIsLoading && !user) {
      console.log('ProtectedRoute: Ingen bruger, omdirigerer til /login');
      router.replace('/login');
    }
  }, [authIsLoading, user, router]);

  // ⏳ While auth state is initializing:
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="p-8 text-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0
                 5.373 0 12h4zm2 5.291A7.962
                 7.962 0 014 12H0c0 3.042 1.135
                 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-lg text-gray-700">Verificerer adgang...</p>
        </div>
      </div>
    );
  }

  // ✅ If we have a user, render the protected content:
  if (user) {
    return <>{children}</>;
  }

  // 🔄 Otherwise (not loading & no user), show a redirecting spinner:
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="p-8 text-center">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0
               5.373 0 12h4zm2 5.291A7.962
               7.962 0 014 12H0c0 3.042 1.135
               5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-lg text-gray-700">Omdirigerer...</p>
      </div>
    </div>
  );
}

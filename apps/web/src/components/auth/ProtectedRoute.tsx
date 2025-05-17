// apps/web/src/components/auth/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode; // Den komponent/side, der skal beskyttes
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  // Mens AuthContext initialiserer og tjekker for bruger/token, vis en loading-tilstand.
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="p-8 text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-700">Verificerer adgang...</p>
        </div>
      </div>
    );
  }

  // Når AuthContext er færdig med at loade:
  // Hvis der ikke er en bruger, omdiriger til login-siden.
  // Vi bruger useEffect i selve komponenten for at undgå fejl under server-side rendering (SSR)
  // eller static generation, hvor routeren måske ikke er fuldt initialiseret.
  React.useEffect(() => {
    if (!authIsLoading && !user) {
      console.log('ProtectedRoute: Ingen bruger, omdirigerer til /login');
      router.replace('/login');
    }
  }, [authIsLoading, user, router]);

  // Hvis der er en bruger (og vi ikke længere loader), render den beskyttede komponent (children).
  if (user) {
    return <>{children}</>;
  }

  // Hvis brugeren ikke er logget ind og omdirigering endnu ikke er sket (eller som fallback),
  // kan vi returnere null eller en anden loading-indikator for at undgå at flashe den ubeskyttede side.
  // Ofte vil useEffect-hooken ovenfor håndtere omdirigeringen hurtigt.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="p-8 text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-700">Omdirigerer...</p>
        </div>
      </div>
  ); // Eller return null;
}

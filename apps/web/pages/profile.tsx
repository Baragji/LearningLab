// apps/web/pages/profile.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// En simpel type for brugerdata, som vi forventer fra backend
interface UserProfile {
  id: number;
  email: string;
  name?: string;
  role: string;
  // Tilføj andre felter efter behov
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hent access token fra localStorage
    const token = localStorage.getItem('accessToken');

    if (!token) {
      // Hvis der ikke er et token, omdiriger til login-siden
      console.log('Intet token fundet, omdirigerer til login...');
      router.replace('/login'); // Brug replace for ikke at tilføje /profile til browserhistorikken
      return;
    }

    // Funktion til at hente brugerprofil fra backend
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token er ugyldigt eller udløbet
            localStorage.removeItem('accessToken'); // Fjern ugyldigt token
            console.error('Ugyldigt eller udløbet token. Omdirigerer til login.');
            router.replace('/login');
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Kunne ikke hente profil.');
        }

        const profileData: UserProfile = await response.json();
        setUser(profileData);
        console.log('Profil hentet:', profileData);

      } catch (err: any) {
        console.error('Fejl ved hentning af profil:', err);
        setError(err.message);
        // Overvej at fjerne token og omdirigere, hvis fejlen skyldes token-problemer
        // localStorage.removeItem('accessToken');
        // router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]); // Kør kun useEffect én gang ved mount, og når router ændres

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="p-8 text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-700">Henter profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600">Fejl</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Gå til Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // Dette skulle ikke ske, hvis loading er færdig og der ikke er fejl, men som en fallback:
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
            <p className="text-lg text-gray-700">Kunne ikke indlæse brugerprofil.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-inter p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Velkommen til din Profil!
        </h1>
        <div className="mt-6 border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Fulde Navn</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name || 'Ikke angivet'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Emailadresse</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Rolle</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.role}</dd>
            </div>
            {/* Tilføj flere felter her efter behov */}
          </dl>
        </div>
        <div className="mt-6 text-center">
            <button
                onClick={() => {
                    localStorage.removeItem('accessToken');
                    console.log('Token fjernet, logger ud...');
                    router.push('/login');
                }}
                className="px-6 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring focus:ring-red-300 focus:ring-opacity-80"
            >
                Log ud
            </button>
        </div>
      </div>
    </div>
  );
}

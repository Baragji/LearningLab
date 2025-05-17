// apps/web/pages/profile.tsx
import React, { useEffect } from 'react'; // Fjernet useState, da vi bruger context
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext'; // Importer useAuth hook'en

// UserProfile interface er ikke længere nødvendig her, da User typen kommer fra AuthContext

export default function ProfilePage() {
  const router = useRouter();
  // Hent user, token, isLoading (fra AuthContext), og logout funktion fra useAuth
  const { user, token, isLoading: authIsLoading, logout } = useAuth();

  // useEffect til at håndtere omdirigering, hvis brugeren ikke er logget ind,
  // eller hvis token forsvinder (f.eks. efter en fejl i AuthContext).
  // authIsLoading sikrer, at vi ikke omdirigerer, før AuthContext har haft en chance for at initialisere.
  useEffect(() => {
    if (!authIsLoading && !user) {
      // Hvis vi ikke loader, og der ikke er en bruger (eller token), omdiriger til login
      console.log('ProfilePage: Ingen bruger fundet efter initial load, omdirigerer til login.');
      router.replace('/login');
    }
  }, [user, authIsLoading, router, token]); // Lyt også på token for en sikkerheds skyld

  // Viser en global loading-spinner, mens AuthContext initialiserer eller logger ind.
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <div className="p-8 text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg text-gray-700">Indlæser...</p>
        </div>
      </div>
    );
  }

  // Hvis brugeren ikke er logget ind (og vi ikke længere loader),
  // vil useEffect ovenfor have omdirigeret.
  // Men som en ekstra sikkerhed, hvis vi når hertil uden en bruger, vis intet eller en fejl.
  if (!user) {
    // Dette state burde ideelt set ikke nås, hvis useEffect fungerer korrekt.
    // Man kan returnere null eller en mere specifik fejlside/komponent.
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
            <p className="text-lg text-gray-700">Du skal være logget ind for at se denne side.</p>
      </div>
    );
  }

  // Hvis vi har en bruger, vis profilsiden
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-inter p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Velkommen til din Profil!
        </h1>
        <div className="mt-6 border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.id}</dd>
            </div>
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
                onClick={logout} // Brug logout funktionen fra AuthContext
                className="px-6 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-red-600 rounded-lg hover:bg-red-500 focus:outline-none focus:ring focus:ring-red-300 focus:ring-opacity-80"
            >
                Log ud
            </button>
        </div>
      </div>
    </div>
  );
}

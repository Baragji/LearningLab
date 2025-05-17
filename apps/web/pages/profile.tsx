// apps/web/pages/profile.tsx
import React from 'react'; // useEffect er fjernet, da ProtectedRoute håndterer det
import { useAuth } from '../src/context/AuthContext';
import ProtectedRoute from '../src/components/auth/ProtectedRoute'; // Importer ProtectedRoute

// Den faktiske indholdskomponent for profilsiden
function ProfilePageContent() {
  const { user, logout } = useAuth();

  // På dette tidspunkt, hvis ProfilePageContent renderes,
  // har ProtectedRoute allerede sikret, at brugeren er logget ind,
  // og at authIsLoading er false.
  // Vi kan derfor trygt antage, at 'user' ikke er null.
  if (!user) {
    // Denne fallback burde sjældent rammes, hvis ProtectedRoute fungerer korrekt.
    // Det er en ekstra sikkerhedsforanstaltning.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
        <p className="text-lg text-gray-700">Fejl: Brugerdata ikke tilgængelige, selvom ruten er beskyttet.</p>
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

// Default export er nu en wrapper-komponent, der anvender ProtectedRoute
export default function WrappedProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

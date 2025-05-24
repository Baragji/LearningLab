// apps/web/src/screens/auth/login/login.tsx
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Importer useAuth hook'en
// useRouter er ikke længere nødvendig her, da AuthContext håndterer omdirigering efter login

export function LoginScreen() {
  // const router = useRouter(); // Fjernet, da AuthContext håndterer omdirigering
  const { login, isLoading: authIsLoading, user } = useAuth(); // Hent login funktion og auth loading state fra context

  // Lokal state for inputfelter og specifikke fejl for denne formular
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null); // Lokal fejl state for denne formular

  // Omdiriger hvis brugeren allerede er logget ind
  // Dette er en simpel måde at forhindre adgang til login-siden, hvis man allerede er logget ind.
  // En mere robust løsning ville være en "public only" route.
  // useEffect(() => {
  //   if (user) {
  //     router.push('/profile'); // Eller en anden default side efter login
  //   }
  // }, [user, router]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); // Nulstil formularfejl

    try {
      console.log('LoginScreen: Forsøger login via AuthContext med:', { email, password });
      await login(email, password); // Kald login funktionen fra AuthContext
      // AuthContext's login funktion håndterer nu token lagring, bruger state opdatering, og omdirigering.
      console.log('LoginScreen: Login succesfuld (håndteret af AuthContext).');
    } catch (err: any) {
      console.error('LoginScreen: Login fejl fanget:', err);
      setFormError(err.message || 'Login fejlede. Tjek din email og adgangskode.');
    }
    // authIsLoading fra context vil styre knappens disabled state
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Log ind på Læringsplatformen
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email felt */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Emailadresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={authIsLoading} // Deaktiver input hvis auth operation er i gang
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="din@email.com"
            />
          </div>

          {/* Password felt */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Adgangskode
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={authIsLoading} // Deaktiver input hvis auth operation er i gang
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Din adgangskode"
            />
          </div>

          {/* Fejlmeddelelse for formularen */}
          {formError && (
            <div role="alert" className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
              {formError}
            </div>
          )}

          {/* Submit knap */}
          <div>
            <button
              type="submit"
              disabled={authIsLoading} // Brug authIsLoading fra context
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {authIsLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Log ind'
              )}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Har du ikke en konto?{' '}
          <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Opret dig her
          </a>
        </p>
        <p className="text-sm text-center text-gray-600">
          <a href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Glemt adgangskode?
          </a>
        </p>
      </div>
    </div>
  );
}

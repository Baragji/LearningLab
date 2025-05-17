// apps/web/src/screens/auth/login/login.tsx
import React, { useState, FormEvent } from 'react';
// Importer evt. din Button fra ui-pakken, hvis du vil bruge den, ellers en standard HTML-knap.
// import { Button } from 'ui';
// Importer useRouter fra next/router for at kunne omdirigere
import { useRouter } from 'next/router';

export function LoginScreen() {
  const router = useRouter(); // Initialiser routeren
  // State for at holde styr på inputfelternes værdier
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // State for at håndtere loading status under API kald
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for at vise fejlmeddelelser fra API'et
  const [error, setError] = useState<string | null>(null);

  // Funktion til at håndtere formularindsendelse
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Forhindrer standard browser-opførsel for formularindsendelse (side-reload)
    setIsLoading(true); // Sæt loading til true
    setError(null); // Nulstil eventuelle tidligere fejl

    try {
      console.log('Login forsøg med:', { email, password });

      // Implementer API kald til backend her
      const response = await fetch('/api/auth/login', { // Bemærk: /api/ prefix håndteres af Nginx
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Håndter fejl fra API'et
        const errorData = await response.json();
        // Prøv at fange den specifikke fejlbesked fra NestJS's UnauthorizedException eller ValidationPipe
        let errorMessage = 'Login fejlede. Tjek din email og adgangskode.'; // Standard fejlbesked
        if (errorData && errorData.message) {
          if (Array.isArray(errorData.message)) { // For class-validator fejl
            errorMessage = errorData.message.join(', ');
          } else { // For andre fejl (f.eks. UnauthorizedException)
            errorMessage = errorData.message;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login succes:', data);
      
      // **NÆSTE SKRIDT: Gem token, opdater auth state, og omdiriger**
      if (data.access_token) {
        // Simpel token-lagring i localStorage (diskuter sikkerhed senere)
        localStorage.setItem('accessToken', data.access_token);
        console.log('Access token gemt i localStorage.');

        // Omdiriger til en profilside eller dashboard (eksempel)
        // Du skal oprette denne side, f.eks. /profile
        router.push('/profile'); 
      } else {
        throw new Error('Access token blev ikke modtaget fra serveren.');
      }

    } catch (err: any) {
      console.error('Login fejl:', err);
      setError(err.message || 'Der opstod en uventet fejl.');
    } finally {
      setIsLoading(false); // Sæt loading til false, uanset succes eller fejl
    }
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
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Din adgangskode"
            />
          </div>

          {/* Fejlmeddelelse */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Submit knap */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
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

// For at denne side kan vises i Next.js, skal du have en fil i `apps/web/pages/login.tsx` (eller lignende),
// der importerer og renderer denne LoginScreen komponent.
// F.eks. i apps/web/pages/login.tsx:
//
// import { LoginScreen } from '../src/screens/auth/login/login';
//
// export default function LoginPage() {
//   return <LoginScreen />;
// }

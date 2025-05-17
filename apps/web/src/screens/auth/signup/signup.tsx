// apps/web/src/screens/auth/signup/signup.tsx
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
// Vi kan overveje at bruge useAuth() her, hvis vi vil logge brugeren ind automatisk efter signup,
// men lad os starte simpelt og bare omdirigere til login.
// import { useAuth } from '../../../context/AuthContext';

export function SignupScreen() {
  const router = useRouter();
  // const { login } = useAuth(); // Hvis du vil logge ind automatisk

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Adgangskoderne matcher ikke.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/signup', { // Kalder dit backend signup endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name || undefined, email, password }), // Send name kun hvis det er udfyldt
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Registrering fejlede.';
        if (errorData && errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        }
        throw new Error(errorMessage);
      }

      // const userData = await response.json(); // Brugerdata fra backend efter oprettelse
      console.log('Registrering succesfuld');
      setSuccessMessage('Din konto er blevet oprettet! Du bliver nu sendt til login-siden.');
      
      // Omdiriger til login-siden efter en kort pause, så brugeren kan se succesbeskeden.
      setTimeout(() => {
        router.push('/login');
      }, 3000); // 3 sekunders forsinkelse

      // Alternativt: Log brugeren direkte ind
      // try {
      //   await login(email, password); // Antager at din AuthContext's login er tilgængelig
      //   // router.push('/profile'); // AuthContext's login håndterer omdirigering
      // } catch (loginError: any) {
      //   setError(`Konto oprettet, men automatisk login fejlede: ${loginError.message}. Prøv at logge ind manuelt.`);
      // }

    } catch (err: any) {
      console.error('Registreringsfejl:', err);
      setError(err.message || 'Der opstod en uventet fejl under registrering.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Opret en ny konto
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Navn felt (valgfrit) */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Navn (valgfrit)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="Dit fulde navn"
            />
          </div>

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
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="Vælg en stærk adgangskode"
            />
          </div>

          {/* Bekræft Password felt */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Bekræft adgangskode
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="Gentag din adgangskode"
            />
          </div>
          
          {/* Fejlmeddelelse */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Succesmeddelelse */}
          {successMessage && (
            <div className="p-3 text-sm text-green-700 bg-green-100 border border-green-400 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Submit knap */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !!successMessage} // Deaktiver også hvis succesbesked vises
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  {/* ... spinner SVG ... */}
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Opret konto'
              )}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Har du allerede en konto?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log ind her
          </a>
        </p>
      </div>
    </div>
  );
}

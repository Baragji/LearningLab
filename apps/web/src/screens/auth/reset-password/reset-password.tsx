// apps/web/src/screens/auth/reset-password/reset-password.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { token: queryToken } = router.query; // Hent token fra URL query parameter

  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sæt token fra URL, når komponenten mounter, hvis det findes
  useEffect(() => {
    if (queryToken && typeof queryToken === 'string') {
      setToken(queryToken);
    }
  }, [queryToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError('De nye adgangskoder matcher ikke.');
      setIsLoading(false);
      return;
    }

    if (!token) {
        setError('Password reset token mangler. Prøv at anmode om et nyt nulstillingslink.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', { // Kalder dit backend endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword, confirmPassword }), // confirmPassword sendes med, da backend DTO forventer det
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Nulstilling af adgangskode fejlede.';
        if (data && data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else {
            errorMessage = data.message;
          }
        }
        throw new Error(errorMessage);
      }
      
      console.log('Nulstilling af adgangskode succesfuld:', data);
      setSuccessMessage(data.message || 'Din adgangskode er blevet nulstillet! Du bliver nu sendt til login-siden.');
      
      // Omdiriger til login-siden efter en kort pause
      setTimeout(() => {
        router.push('/login');
      }, 3000); // 3 sekunders forsinkelse

    } catch (err: any) {
      console.error('Fejl ved nulstilling af adgangskode:', err);
      setError(err.message || 'Der opstod en uventet fejl.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Nulstil Adgangskode
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token felt (kan være skjult eller forudfyldt fra URL) */}
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700"
            >
              Nulstillings-token
            </label>
            <input
              id="token"
              name="token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading || !!successMessage || !!queryToken} // Deaktiver hvis token kommer fra URL
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
              placeholder="Indsæt dit token her"
            />
             {queryToken && <p className="mt-1 text-xs text-gray-500">Token hentet fra URL.</p>}
          </div>

          {/* Nyt Password felt */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Ny Adgangskode
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading || !!successMessage}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="Din nye adgangskode"
            />
          </div>

          {/* Bekræft Nyt Password felt */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Bekræft Ny Adgangskode
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || !!successMessage}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50"
              placeholder="Gentag ny adgangskode"
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
              disabled={isLoading || !!successMessage}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Nulstil Adgangskode'
              )}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Husker du din adgangskode?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log ind
          </a>
        </p>
      </div>
    </div>
  );
}

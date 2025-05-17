// apps/web/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

// Definer en type for brugerobjektet, som vi forventer fra backend
// Denne type matcher den, vi brugte i ProfilePage og den, som vores /api/auth/profile returnerer
interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  // Tilføj andre felter, som dit backend /api/auth/profile endpoint returnerer
}

// Definer typen for værdierne i vores AuthContext
interface AuthContextType {
  user: User | null; // Den aktuelle bruger eller null, hvis ikke logget ind
  token: string | null; // JWT token
  isLoading: boolean; // Til at vise loading state under auth operationer
  login: (email: string, password: string) => Promise<void>; // Funktion til at logge ind
  logout: () => void; // Funktion til at logge ud
  // Vi kan tilføje signup, forgotPassword, resetPassword funktioner her senere
}

// Opret AuthContext med en default værdi (typisk undefined eller null)
// Vi bruger 'undefined' for at kunne tjekke, om provideren er brugt korrekt.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Definer props for AuthProvider
interface AuthProviderProps {
  children: ReactNode; // Gør det muligt at wrappe andre komponenter
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start med loading true for at tjekke initial auth state
  const router = useRouter();

  // Funktion til at hente brugerprofil baseret på et token
  const fetchUserProfile = async (currentToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        // Hvis token er ugyldigt/udløbet, log ud
        if (response.status === 401) {
          console.error('AuthContext: Ugyldigt token ved hentning af profil. Logger ud.');
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
        }
        throw new Error('Kunne ikke hente brugerprofil');
      }
      const userData: User = await response.json();
      setUser(userData);
      setToken(currentToken); // Sørg for at token state også er sat
      console.log('AuthContext: Brugerprofil hentet og sat:', userData);
    } catch (error) {
      console.error('AuthContext: Fejl ved hentning af brugerprofil:', error);
      localStorage.removeItem('accessToken'); // Ryd token ved fejl
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // useEffect til at tjekke for token i localStorage ved app-start (kun én gang)
  useEffect(() => {
    console.log('AuthContext: Initialiserer auth state...');
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      console.log('AuthContext: Token fundet i localStorage, forsøger at hente profil.');
      fetchUserProfile(storedToken);
    } else {
      console.log('AuthContext: Intet token fundet i localStorage.');
      setIsLoading(false); // Ingen token, så vi er ikke i gang med at loade bruger
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Tomt dependency array sikrer, at dette kun kører ved mount

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login fejlede');
      }

      const data: { access_token: string } = await response.json();
      localStorage.setItem('accessToken', data.access_token);
      console.log('AuthContext: Token gemt efter login.');
      await fetchUserProfile(data.access_token); // Hent og sæt brugerprofil efter login
      router.push('/profile'); // Omdiriger til profil efter succesfuldt login
    } catch (error: any) {
      console.error('AuthContext: Login fejl:', error);
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      throw error; // Kast fejlen videre, så LoginScreen kan fange den og vise den
    }
    // setIsLoading(false) håndteres i fetchUserProfile's finally block
  };

  const logout = () => {
    console.log('AuthContext: Logger ud...');
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    router.push('/login'); // Omdiriger til login-siden efter logout
  };

  // Værdien, der gøres tilgængelig for alle consumers af context'en
  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for nem adgang til AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth skal bruges inden i en AuthProvider');
  }
  return context;
}

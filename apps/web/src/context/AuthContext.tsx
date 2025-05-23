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
  token: string | null; // JWT access token
  refreshToken: string | null; // JWT refresh token
  isLoading: boolean; // Til at vise loading state under auth operationer
  login: (email: string, password: string) => Promise<void>; // Funktion til at logge ind
  logout: () => void; // Funktion til at logge ud
  signup: (name: string | undefined, email: string, password: string) => Promise<void>; // Funktion til at oprette en ny bruger
  forgotPassword: (email: string) => Promise<string>; // Funktion til at anmode om nulstilling af adgangskode
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<string>; // Funktion til at nulstille adgangskode
  refreshAccessToken: () => Promise<boolean>; // Funktion til at forny access token
}

// Opret AuthContext med en default værdi (typisk undefined eller null)
// Vi bruger 'undefined' for at kunne tjekke, om provideren er brugt korrekt.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Definer props for AuthProvider
interface AuthProviderProps {
  children: ReactNode; // Gør det muligt at wrappe andre komponenter
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start med loading true for at tjekke initial auth state
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const router = useRouter();

  // Funktion til at hente brugerprofil baseret på et token
  const fetchUserProfile = async (currentToken: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/profile`, {
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
      
      // Gem brugerdata i localStorage for offline brug
      localStorage.setItem('userData', JSON.stringify(userData));
      
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
  
  // Funktion til at dekode JWT token og få udløbstidspunkt
  const getTokenExpiration = (token: string): number => {
    try {
      // Simpel JWT dekodning uden bibliotek
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.exp * 1000; // Konverter til millisekunder
    } catch (error) {
      console.error('Fejl ved dekodning af token:', error);
      return Date.now() + 15 * 60 * 1000; // Default 15 minutter fra nu
    }
  };

  // Funktion til at forny access token ved brug af refresh token
  const refreshAccessToken = async () => {
    if (!refreshToken) return false;
    
    try {
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke forny token');
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      
      // Gem nyt access token
      localStorage.setItem('accessToken', newAccessToken);
      setToken(newAccessToken);
      
      // Opdater udløbstidspunkt
      const newExpiresAt = getTokenExpiration(newAccessToken);
      setTokenExpiresAt(newExpiresAt);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Fejl ved fornyelse af token:', error);
      // Ved fejl, log brugeren ud
      logout();
      setIsLoading(false);
      return false;
    }
  };

  // useEffect til at tjekke for tokens i localStorage ved app-start
  useEffect(() => {
    console.log('AuthContext: Initialiserer auth state...');
    const storedToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      console.log('AuthContext: Token fundet i localStorage, forsøger at hente profil.');
      
      // Sæt tokens og udløbstidspunkt
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      
      // Beregn udløbstidspunkt
      const expiresAt = getTokenExpiration(storedToken);
      setTokenExpiresAt(expiresAt);
      
      // Hvis token er udløbet og vi har et refresh token, forny det
      if (Date.now() >= expiresAt && storedRefreshToken) {
        console.log('AuthContext: Token er udløbet, forsøger at forny med refresh token.');
        refreshAccessToken().then(success => {
          if (success) {
            fetchUserProfile(token!);
          }
        });
      } else {
        // Ellers brug det eksisterende token
        fetchUserProfile(storedToken);
      }
    } else {
      console.log('AuthContext: Intet token fundet i localStorage.');
      setIsLoading(false); // Ingen token, så vi er ikke i gang med at loade bruger
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Tomt dependency array sikrer, at dette kun kører ved mount
  
  // useEffect til at håndtere automatisk fornyelse af token før det udløber
  useEffect(() => {
    if (!token || !tokenExpiresAt) return;
    
    // Beregn tid til udløb i millisekunder
    const timeUntilExpiry = tokenExpiresAt - Date.now();
    
    // Hvis token udløber om mindre end 5 minutter, forny det
    if (timeUntilExpiry < 5 * 60 * 1000) {
      refreshAccessToken();
      return;
    }
    
    // Ellers planlæg fornyelse 5 minutter før udløb
    const refreshTimeout = setTimeout(() => {
      console.log('AuthContext: Planlægger fornyelse af token 5 minutter før udløb.');
      refreshAccessToken();
    }, timeUntilExpiry - 5 * 60 * 1000);
    
    return () => clearTimeout(refreshTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenExpiresAt]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login fejlede';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Kunne ikke parse fejlsvar som JSON:', parseError);
          errorMessage = `Login fejlede med status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: { access_token: string; refresh_token: string } = await response.json();
      
      // Gem tokens i localStorage
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      
      // Opdater state
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      
      // Beregn udløbstidspunkt
      const expiresAt = getTokenExpiration(data.access_token);
      setTokenExpiresAt(expiresAt);
      
      console.log('AuthContext: Tokens gemt efter login.');
      await fetchUserProfile(data.access_token); // Hent og sæt brugerprofil efter login
      router.push('/profile'); // Omdiriger til profil efter succesfuldt login
    } catch (error: any) {
      console.error('AuthContext: Login fejl:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setTokenExpiresAt(null);
      setUser(null);
      setIsLoading(false);
      throw error; // Kast fejlen videre, så LoginScreen kan fange den og vise den
    }
    // setIsLoading(false) håndteres i fetchUserProfile's finally block
  };

  const logout = () => {
    console.log('AuthContext: Logger ud...');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setToken(null);
    setRefreshToken(null);
    setTokenExpiresAt(null);
    setUser(null);
    router.push('/login'); // Omdiriger til login-siden efter logout
  };

  // Signup funktion
  const signup = async (name: string | undefined, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Brug baseUrl fra miljøvariabel eller fallback til relativ sti
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Registrering fejlede.';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(', ');
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (parseError) {
          console.error('Kunne ikke parse fejlsvar som JSON:', parseError);
          errorMessage = `Registrering fejlede med status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      console.log('AuthContext: Registrering succesfuld');
      // Vi kunne automatisk logge brugeren ind her, men lad os holde det simpelt
      // og lade brugeren logge ind manuelt
    } catch (error: any) {
      console.error('AuthContext: Registreringsfejl:', error);
      throw error; // Kast fejlen videre, så SignupScreen kan fange den og vise den
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password funktion
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Anmodning om nulstilling af adgangskode fejlede.';
        try {
          const data = await response.json();
          if (data && data.message) {
            if (Array.isArray(data.message)) {
              errorMessage = data.message.join(', ');
            } else {
              errorMessage = data.message;
            }
          }
        } catch (parseError) {
          console.error('Kunne ikke parse fejlsvar som JSON:', parseError);
          errorMessage = `Anmodning om nulstilling af adgangskode fejlede med status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Kunne ikke parse succesfuldt svar som JSON:', parseError);
        data = { message: 'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.' };
      }
      
      console.log('AuthContext: Anmodning om glemt adgangskode succesfuld');
      return data.message || 'Hvis din email findes i systemet, vil du modtage et link til at nulstille dit password.';
    } catch (error: any) {
      console.error('AuthContext: Fejl ved glemt adgangskode:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password funktion
  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('De nye adgangskoder matcher ikke.');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      if (!response.ok) {
        let errorMessage = 'Nulstilling af adgangskode fejlede.';
        try {
          const data = await response.json();
          if (data && data.message) {
            if (Array.isArray(data.message)) {
              errorMessage = data.message.join(', ');
            } else {
              errorMessage = data.message;
            }
          }
        } catch (parseError) {
          console.error('Kunne ikke parse fejlsvar som JSON:', parseError);
          errorMessage = `Nulstilling af adgangskode fejlede med status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Kunne ikke parse succesfuldt svar som JSON:', parseError);
        data = { message: 'Din adgangskode er blevet nulstillet! Du bliver nu sendt til login-siden.' };
      }
      
      console.log('AuthContext: Nulstilling af adgangskode succesfuld');
      return data.message || 'Din adgangskode er blevet nulstillet! Du bliver nu sendt til login-siden.';
    } catch (error: any) {
      console.error('AuthContext: Fejl ved nulstilling af adgangskode:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Værdien, der gøres tilgængelig for alle consumers af context'en
  const value = {
    user,
    token,
    refreshToken,
    isLoading,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
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

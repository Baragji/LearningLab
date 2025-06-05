"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Define a type for the user object we expect from the backend
interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  // Add other fields that your backend /api/auth/profile endpoint returns
}

// Define the type for our AuthContext values
interface AuthContextType {
  user: User | null; // The current user or null if not logged in
  token: string | null; // JWT access token
  refreshToken: string | null; // JWT refresh token
  isLoading: boolean; // To show loading state during auth operations
  isAuthenticated: boolean; // Whether the user is authenticated
  apiClient?: any; // API client for making requests
  login: (email: string, password: string) => Promise<void>; // Function to log in
  logout: () => void; // Function to log out
  signup: (
    name: string | undefined,
    email: string,
    password: string,
  ) => Promise<void>; // Function to create a new user
  forgotPassword: (email: string) => Promise<string>; // Function to request password reset
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<string>; // Function to reset password
  refreshAccessToken: () => Promise<boolean>; // Function to renew access token
}

// Create AuthContext with a default value (typically undefined or null)
// We use 'undefined' to be able to check if the provider is used correctly.
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Define props for AuthProvider
interface AuthProviderProps {
  children: ReactNode; // Makes it possible to wrap other components
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true to check initial auth state
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [apiClient, setApiClient] = useState<any>(null);
  const router = useRouter();

  // Computed property for isAuthenticated
  const isAuthenticated = !!user;

  // Function to fetch user profile based on a token
  const fetchUserProfile = async (currentToken: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      console.log(
        "AuthContext: Fetching user profile from:",
        `${baseUrl}/auth/profile`,
      );

      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        // If token is invalid/expired, log out
        if (response.status === 401) {
          console.error(
            "AuthContext: Invalid token when fetching profile. Logging out.",
          );
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setToken(null);
          setRefreshToken(null);
          setUser(null);
        }
        throw new Error(
          `Could not fetch user profile: ${response.status} ${response.statusText}`,
        );
      }

      const userData: User = await response.json();
      setUser(userData);
      setToken(currentToken); // Make sure token state is also set

      // Save user data in localStorage for offline use
      localStorage.setItem("userData", JSON.stringify(userData));

      console.log("AuthContext: User profile fetched and set:", userData);
    } catch (error) {
      console.error("AuthContext: Error fetching user profile:", error);
      localStorage.removeItem("accessToken"); // Clear token on error
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to decode JWT token and get expiration time
  const getTokenExpiration = (token: string): number => {
    try {
      // Simple JWT decoding without library
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const payload = JSON.parse(jsonPayload);
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error("Error decoding token:", error);
      return Date.now() + 15 * 60 * 1000; // Default 15 minutes from now
    }
  };

  // Function to renew access token using refresh token
  const refreshAccessToken = async () => {
    if (!refreshToken) return false;

    try {
      setIsLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      console.log(
        "AuthContext: Attempting to renew token with API URL:",
        baseUrl,
      );

      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(
          `Could not renew token: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      // Save new access token
      localStorage.setItem("accessToken", newAccessToken);
      setToken(newAccessToken);

      // Update expiration time
      const newExpiresAt = getTokenExpiration(newAccessToken);
      setTokenExpiresAt(newExpiresAt);

      console.log("AuthContext: Token renewed successfully");
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("AuthContext: Error renewing token:", error);
      // On error, log the user out
      logout();
      setIsLoading(false);
      return false;
    }
  };

  // useEffect to check for tokens in localStorage at app start
  useEffect(() => {
    console.log("AuthContext: Initializing auth state...");
    const storedToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedToken) {
      console.log(
        "AuthContext: Token found in localStorage, attempting to fetch profile.",
      );

      // Set tokens and expiration time
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);

      // Calculate expiration time
      const expiresAt = getTokenExpiration(storedToken);
      setTokenExpiresAt(expiresAt);

      // If token is expired and we have a refresh token, renew it
      if (Date.now() >= expiresAt && storedRefreshToken) {
        console.log(
          "AuthContext: Token is expired, attempting to renew with refresh token.",
        );
        refreshAccessToken().then((success) => {
          if (success) {
            fetchUserProfile(token!);
          }
        });
      } else {
        // Otherwise use the existing token
        fetchUserProfile(storedToken);
      }
    } else {
      console.log("AuthContext: No token found in localStorage.");
      setIsLoading(false); // No token, so we're not loading a user
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs on mount

  // useEffect to handle automatic token renewal before it expires
  useEffect(() => {
    if (!token || !tokenExpiresAt) return;

    // Calculate time until expiry in milliseconds
    const timeUntilExpiry = tokenExpiresAt - Date.now();

    // If token expires in less than 5 minutes, renew it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      refreshAccessToken();
      return;
    }

    // Otherwise schedule renewal 5 minutes before expiry
    const refreshTimeout = setTimeout(
      () => {
        console.log(
          "AuthContext: Scheduling token renewal 5 minutes before expiry.",
        );
        refreshAccessToken();
      },
      timeUntilExpiry - 5 * 60 * 1000,
    );

    return () => clearTimeout(refreshTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenExpiresAt]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      console.log("AuthContext: Attempting login with API URL:", baseUrl);

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies if the server sends them
        mode: "cors", // Explicit CORS mode
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError);
          errorMessage = `Login failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data: { access_token: string; refresh_token: string } =
        await response.json();

      // Save tokens in localStorage
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);

      // Update state
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);

      // Calculate expiration time
      const expiresAt = getTokenExpiration(data.access_token);
      setTokenExpiresAt(expiresAt);

      console.log("AuthContext: Tokens saved after login.");
      await fetchUserProfile(data.access_token); // Fetch and set user profile after login
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setTokenExpiresAt(null);
      setUser(null);
      setIsLoading(false);
      throw error; // Throw the error further so LoginScreen can catch it and display it
    }
    // setIsLoading(false) is handled in fetchUserProfile's finally block
  };

  const logout = () => {
    console.log("AuthContext: Logging out...");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    setToken(null);
    setRefreshToken(null);
    setTokenExpiresAt(null);
    setUser(null);
    router.push("/login"); // Redirect to login page after logout
  };

  // Signup function
  const signup = async (
    name: string | undefined,
    email: string,
    password: string,
  ) => {
    setIsLoading(true);
    try {
      // Use baseUrl from environment variable or fallback to relative path
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Registration failed.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            if (Array.isArray(errorData.message)) {
              errorMessage = errorData.message.join(", ");
            } else {
              errorMessage = errorData.message;
            }
          }
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError);
          errorMessage = `Registration failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      console.log("AuthContext: Registration successful");
      // We could automatically log the user in here, but let's keep it simple
      // and let the user log in manually
    } catch (error: any) {
      console.error("AuthContext: Registration error:", error);
      throw error; // Throw the error further so SignupScreen can catch it and display it
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = "Password reset request failed.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError);
          errorMessage = `Password reset request failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("AuthContext: Password reset email sent");
      return data.message || "Password reset email sent. Check your inbox.";
    } catch (error: any) {
      console.error("AuthContext: Forgot password error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password function
  const resetPassword = async (
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) => {
    setIsLoading(true);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        let errorMessage = "Password reset failed.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError);
          errorMessage = `Password reset failed with status ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("AuthContext: Password reset successful");
      return (
        data.message ||
        "Password has been reset successfully. You can now log in with your new password."
      );
    } catch (error: any) {
      console.error("AuthContext: Reset password error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create API client with auth headers
  useEffect(() => {
    if (token) {
      // Here you could initialize an API client with the token
      // For example, if using axios:
      // const client = axios.create({
      //   baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   }
      // });
      // setApiClient(client);
    }
  }, [token]);

  // Provide the auth context value to children
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        isAuthenticated,
        apiClient,
        login,
        logout,
        signup,
        forgotPassword,
        resetPassword,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

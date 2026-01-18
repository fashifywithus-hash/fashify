import { useState, useEffect, createContext, useContext } from "react";
import { apiClient } from "@/config/api";

interface User {
  id: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate it
    const token = apiClient.getToken();
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const data = await apiClient.post<{ user: User }>("/api/auth/me", {});
      setUser(data.user);
    } catch (error) {
      // Token is invalid, remove it
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<{
        user: User;
        token: string;
      }>("/api/auth/signup", { email, password });

      apiClient.setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.error || "Failed to create account") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<{
        user: User;
        token: string;
      }>("/api/auth/signin", { email, password });

      apiClient.setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.error || "Invalid email or password") };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.post("/api/auth/signout");
    } catch (error) {
      // Continue with signout even if API call fails
    } finally {
      apiClient.setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

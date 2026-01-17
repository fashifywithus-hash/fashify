import { useState, useEffect, createContext, useContext } from "react";
import { apiClient, AuthResponse } from "@/lib/api";

interface BackendAuthContextType {
  backendUserId: string | null;
  loading: boolean;
  signupOrLogin: (email: string, password: string) => Promise<{ error: Error | null; user?: AuthResponse }>;
  setBackendUserId: (userId: string | null) => void;
  clearBackendAuth: () => void;
}

const BackendAuthContext = createContext<BackendAuthContextType | undefined>(undefined);

const BACKEND_USER_ID_KEY = 'fashify_backend_user_id';

export const BackendAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [backendUserId, setBackendUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load backend user ID from localStorage
    const storedUserId = localStorage.getItem(BACKEND_USER_ID_KEY);
    if (storedUserId) {
      setBackendUserIdState(storedUserId);
    }
    setLoading(false);
  }, []);

  const setBackendUserId = (userId: string | null) => {
    setBackendUserIdState(userId);
    if (userId) {
      localStorage.setItem(BACKEND_USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(BACKEND_USER_ID_KEY);
    }
  };

  const signupOrLogin = async (email: string, password: string) => {
    try {
      const response = await apiClient.signupOrLogin(email, password);
      
      if (response.success && response.data) {
        setBackendUserId(response.data.id);
        return { error: null, user: response.data };
      } else {
        return { 
          error: new Error(response.message || 'Authentication failed'), 
        };
      }
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Authentication failed'), 
      };
    }
  };

  const clearBackendAuth = () => {
    setBackendUserId(null);
  };

  return (
    <BackendAuthContext.Provider value={{ 
      backendUserId, 
      loading, 
      signupOrLogin, 
      setBackendUserId,
      clearBackendAuth 
    }}>
      {children}
    </BackendAuthContext.Provider>
  );
};

export const useBackendAuth = () => {
  const context = useContext(BackendAuthContext);
  if (context === undefined) {
    throw new Error("useBackendAuth must be used within a BackendAuthProvider");
  }
  return context;
};

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithWallet: (walletAddress: string, signature: string, nonce: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const { toast } = useToast();

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setAuthState({
          user: parsedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.username}!`,
        });

        return true;
      } else {
        toast({
          title: "Login failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loginWithWallet = async (walletAddress: string, signature: string, nonce: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiRequest('POST', '/api/auth/login', {
        walletAddress,
        signature,
        nonce,
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({
          title: "Wallet connected",
          description: `Welcome, ${data.user.username}!`,
        });

        return true;
      } else {
        toast({
          title: "Wallet authentication failed",
          description: data.error || "Invalid signature",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Wallet login error:', error);
      toast({
        title: "Wallet authentication failed",
        description: error.message || "An error occurred during wallet authentication",
        variant: "destructive",
      });
      return false;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiRequest('POST', '/api/auth/register', {
        email,
        password,
        username,
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({
          title: "Registration successful",
          description: `Welcome to BlockRegistry, ${data.user.username}!`,
        });

        return true;
      } else {
        toast({
          title: "Registration failed",
          description: data.error || "Failed to create account",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
      return false;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const refreshAuth = async () => {
    // In a real app, you might want to refresh the token or verify it's still valid
    const token = localStorage.getItem('auth_token');
    if (!token) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      loginWithWallet,
      register,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { create } from 'zustand';
import { authApi, setToken, removeToken, getToken } from '../api';

export interface User {
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  picture?: string;
  role: string;
  sub_role?: string;
  wallet_balance: number;
  wallet_held?: number;
  status: string;
  kyc_status?: string;
  avg_rating?: number;
  total_trips?: number;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone: string; role?: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const { user, token } = await authApi.login({ email, password });
      
      await setToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  },

  register: async (data) => {
    try {
      const { user, token } = await authApi.register(data);
      
      await setToken(token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  },

  forgotPassword: async (email: string) => {
    try {
      // El backend responde igual exista o no el email (no revela cuentas).
      await authApi.forgotPassword({ email });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 'No se pudo enviar el correo de recuperación'
      );
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore errors
    }
    await removeToken();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authApi.getMe();
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      await removeToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  },

  refreshUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user });
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },
}));

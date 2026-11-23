import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  quickSwitchRole: (role: 'ADMIN' | 'KITCHEN_STAFF' | 'WAITER' | 'CUSTOMER') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => false,
  logout: () => {},
  hasRole: () => false,
  quickSwitchRole: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lowkey_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      if (token.startsWith('demo-jwt-token-')) {
        const saved = localStorage.getItem('lowkey_demo_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser({
              id: parsed.id,
              username: parsed.username,
              email: parsed.email,
              fullName: parsed.fullName,
              roles: parsed.roles as any[],
            });
            setIsLoading(false);
            return;
          } catch (e) {
            console.error(e);
          }
        }
      }

      authApi.getMe()
        .then((res) => {
          if (res.data && res.data.username) {
            setUser({
              id: res.data.id,
              username: res.data.username,
              email: res.data.email,
              fullName: res.data.fullName,
              roles: res.data.roles as any[],
            });
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ username, password: pass });
      const data: AuthResponse = res.data;
      localStorage.setItem('lowkey_token', data.token);
      setToken(data.token);
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles as any[],
      });
      return true;
    } catch (e) {
      console.error('Login error', e);
      return false;
    }
  };

  const quickSwitchRole = (role: 'ADMIN' | 'KITCHEN_STAFF' | 'WAITER' | 'CUSTOMER') => {
    let uname = 'customer';
    let fullName = 'Guest Diner';
    let email = 'customer@lowkeycafe.com';
    let roles = ['ROLE_CUSTOMER'];

    if (role === 'ADMIN') {
      uname = 'admin';
      fullName = 'Cafe General Manager';
      email = 'admin@lowkeycafe.com';
      roles = ['ROLE_ADMIN'];
    } else if (role === 'KITCHEN_STAFF') {
      uname = 'kitchen';
      fullName = 'Head Chef Mario';
      email = 'kitchen@lowkeycafe.com';
      roles = ['ROLE_KITCHEN_STAFF'];
    } else if (role === 'WAITER') {
      uname = 'waiter';
      fullName = 'Lead Waiter Alex';
      email = 'waiter@lowkeycafe.com';
      roles = ['ROLE_WAITER'];
    }

    const mockAuth: AuthResponse = {
      token: `demo-jwt-token-${uname}-${Date.now()}`,
      type: 'Bearer',
      id: uname === 'admin' ? 1 : uname === 'kitchen' ? 2 : uname === 'waiter' ? 3 : 4,
      username: uname,
      email,
      fullName,
      roles,
    };

    localStorage.setItem('lowkey_token', mockAuth.token);
    localStorage.setItem('lowkey_demo_user', JSON.stringify(mockAuth));
    setToken(mockAuth.token);
    setUser({
      id: mockAuth.id,
      username: mockAuth.username,
      email: mockAuth.email,
      fullName: mockAuth.fullName,
      roles: mockAuth.roles as any[],
    });
  };

  const logout = () => {
    localStorage.removeItem('lowkey_token');
    localStorage.removeItem('lowkey_demo_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((r) => r === role || r === `ROLE_${role}`);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, quickSwitchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

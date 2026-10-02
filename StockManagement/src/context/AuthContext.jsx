import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken && !user) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(savedToken);
            localStorage.setItem('auth_user', JSON.stringify(res.user));
          }
        } catch (e) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          setUser(null);
          setToken(null);
        }
      }
    };
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      if (!identifier || !password) {
        throw new Error('Please enter both username/email and password');
      }

      const response = await authApi.login({
        identifier: identifier.trim(),
        username: identifier.trim(),
        password
      });

      if (response.success && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('auth_token', response.token);
        return { success: true, user: response.user, token: response.token };
      }
      throw new Error(response.message || 'Invalid username/email or password');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Invalid username/email or password';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }, []);

  const hasRole = useCallback((role) => {
    if (!user || !user.role) return false;
    return user.role.toUpperCase() === String(role).toUpperCase();
  }, [user]);

  const isAuthenticated = !!(user && token);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isFaculty = user?.role?.toUpperCase() === 'FACULTY';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isFaculty,
        hasRole,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

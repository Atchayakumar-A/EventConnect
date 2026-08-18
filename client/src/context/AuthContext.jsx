import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('eventconnect_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
        setPreferences(data.preferences);
        setHasPreferences(data.hasPreferences);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('eventconnect_token');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('eventconnect_token', data.token);
    setUser(data.user);
    setPreferences(data.preferences);
    setHasPreferences(data.hasPreferences);
    return data;
  };

  const signup = async (name, email, password, role) => {
    const data = await api.post('/auth/signup', { name, email, password, role });
    localStorage.setItem('eventconnect_token', data.token);
    setUser(data.user);
    setPreferences(null);
    setHasPreferences(false);
    return data;
  };

  const savePreferences = async (prefs) => {
    const data = await api.post('/auth/preferences', prefs);
    setPreferences(data.preferences);
    setHasPreferences(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('eventconnect_token');
    setUser(null);
    setPreferences(null);
    setHasPreferences(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        hasPreferences,
        loading,
        login,
        signup,
        savePreferences,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

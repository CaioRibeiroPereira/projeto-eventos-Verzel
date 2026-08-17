"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as api from "@/lib/api";

const TOKEN_KEY = "auth_token";

interface AuthContextValue {
  user: api.User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<api.User>;
  logout: () => void;
  setUser: (user: api.User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    api
      .me(stored)
      .then((loggedUser) => {
        setUser(loggedUser);
        setToken(stored);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { access_token } = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    const loggedUser = await api.me(access_token);
    setUser(loggedUser);
    setToken(access_token);
    return loggedUser;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

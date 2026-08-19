"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import * as api from "@/lib/api";

type Area = "organizer" | "gate" | "customer";

// Cada área guarda a própria sessão, em vez de compartilhar um único
// token — assim dá pra estar logado como cliente, organizador e portaria
// ao mesmo tempo (abas diferentes ou até na mesma aba).
function resolveArea(pathname: string): Area {
  if (pathname.startsWith("/organizador")) return "organizer";
  if (pathname.startsWith("/portaria")) return "gate";
  return "customer";
}

function tokenKeyFor(area: Area) {
  return `auth_token_${area}`;
}

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
  const pathname = usePathname();
  const area = resolveArea(pathname ?? "/");
  const [user, setUser] = useState<api.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const stored = localStorage.getItem(tokenKeyFor(area));
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    api
      .me(stored)
      .then((loggedUser) => {
        setUser(loggedUser);
        setToken(stored);
      })
      .catch(() => {
        localStorage.removeItem(tokenKeyFor(area));
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [area]);

  async function login(email: string, password: string) {
    const { access_token } = await api.login(email, password);
    localStorage.setItem(tokenKeyFor(area), access_token);
    const loggedUser = await api.me(access_token);
    setUser(loggedUser);
    setToken(access_token);
    return loggedUser;
  }

  function logout() {
    localStorage.removeItem(tokenKeyFor(area));
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

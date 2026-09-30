"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, authStorage, UserSession, registerUnauthorizedHandler } from "./api";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    organizationName: string
  ) => Promise<void>;
  googleLogin: (
    idToken: string,
    email?: string,
    fullName?: string,
    organizationName?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    // Register unauthorized 401 callback
    registerUnauthorizedHandler(() => {
      logout();
    });

    const savedToken = authStorage.getToken();
    const savedUser = authStorage.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      
      // Background validation against /auth/me to verify token validity
      api.get<{
        id: string;
        email: string;
        full_name?: string;
      }>("/auth/me")
        .then((me) => {
          const updated: UserSession = {
            ...savedUser,
            full_name: me.full_name || savedUser.full_name,
            email: me.email || savedUser.email,
          };
          authStorage.setUser(updated);
          setUser(updated);
        })
        .catch(() => {
          // Token expired or invalid — 401 interceptor in api.ts will have cleared storage
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      organization_id?: string;
    }>("/auth/login", { email, password });

    authStorage.setToken(res.access_token);
    setToken(res.access_token);

    let userDetails: UserSession = {
      id: res.user_id,
      email: res.email,
      organization_id: res.organization_id,
      full_name: res.email.split("@")[0],
    };

    try {
      const me = await api.get<{
        id: string;
        email: string;
        full_name?: string;
      }>("/auth/me");
      userDetails = {
        ...userDetails,
        full_name: me.full_name || userDetails.full_name,
      };
    } catch {
      // Fallback to basic session info
    }

    authStorage.setUser(userDetails);
    setUser(userDetails);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    organizationName: string
  ) => {
    const res = await api.post<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      organization_id?: string;
    }>("/auth/register", {
      email,
      password,
      full_name: fullName,
      organization_name: organizationName,
    });

    authStorage.setToken(res.access_token);
    setToken(res.access_token);

    const userDetails: UserSession = {
      id: res.user_id,
      email: res.email,
      full_name: fullName,
      organization_id: res.organization_id,
      organization_name: organizationName,
    };

    authStorage.setUser(userDetails);
    setUser(userDetails);
  };

  const googleLogin = async (
    idToken: string,
    email?: string,
    fullName?: string,
    organizationName?: string
  ) => {
    const res = await api.post<{
      access_token: string;
      token_type: string;
      user_id: string;
      email: string;
      organization_id?: string;
    }>("/auth/google", {
      id_token: idToken,
      email,
      full_name: fullName,
      organization_name: organizationName,
    });

    authStorage.setToken(res.access_token);
    setToken(res.access_token);

    let userDetails: UserSession = {
      id: res.user_id,
      email: res.email,
      full_name: fullName || res.email.split("@")[0],
      organization_id: res.organization_id,
      organization_name: organizationName,
    };

    try {
      const me = await api.get<{
        id: string;
        email: string;
        full_name?: string;
      }>("/auth/me");
      userDetails = {
        ...userDetails,
        full_name: me.full_name || userDetails.full_name,
      };
    } catch {
      // Fallback
    }

    authStorage.setUser(userDetails);
    setUser(userDetails);
  };

  const refreshUser = async () => {
    try {
      const me = await api.get<{
        id: string;
        email: string;
        full_name?: string;
      }>("/auth/me");
      if (user) {
        const updated = {
          ...user,
          full_name: me.full_name || user.full_name,
          email: me.email || user.email,
        };
        authStorage.setUser(updated);
        setUser(updated);
      }
    } catch {
      // Token expired
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

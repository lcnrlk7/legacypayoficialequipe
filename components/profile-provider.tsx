"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

export interface Profile {
  id: string;
  name: string;
  email: string;
  kyc_status: string;
  balance: number;
  route_type: string;
  is_admin: boolean;
  [key: string]: unknown;
}

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, token, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        console.error("Profile API error:", res.status);
        // Usar dados do token como fallback
        setProfile({
          id: user.id,
          name: user.name || "Usuário",
          email: user.email,
          kyc_status: user.kyc_status || "pending",
          balance: 0,
          route_type: "black",
          is_admin: user.role === "admin"
        });
        return;
      }

      const data = await res.json();
      if (data.profile) {
        setProfile({
          ...data.profile,
          balance: Number(data.profile.balance) || 0
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      // Fallback para dados do token
      setProfile({
        id: user.id,
        name: user.name || "Usuário",
        email: user.email,
        kyc_status: user.kyc_status || "pending",
        balance: 0,
        route_type: "black",
        is_admin: user.role === "admin"
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  // Buscar perfil quando autenticação estiver pronta
  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  // Função para atualizar o perfil (refetch)
  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  // Função para atualizar apenas o saldo localmente (otimistic update)
  const updateBalance = useCallback((newBalance: number) => {
    setProfile(prev => prev ? { ...prev, balance: Number(newBalance) } : null);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, refreshProfile, updateBalance }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

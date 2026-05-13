"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminNav } from "../components/nav";
import { RolesManager } from "../components/roles-manager";

export default function RolesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch("/api/admin/superadmin/roles");
        if (!response.ok) {
          router.push("/lp-x7k9m2-internal/login");
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error("[v0] Access check error:", error);
        router.push("/lp-x7k9m2-internal/login");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <SuperAdminNav activeTab="roles" />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Gerenciador de Roles</h1>
            <p className="text-muted-foreground mt-1">Configure permissões e funções</p>
          </div>

          <RolesManager />
        </div>
      </main>
    </div>
  );
}

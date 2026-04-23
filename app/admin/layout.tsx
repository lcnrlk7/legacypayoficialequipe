import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const session = await verifyAuth(token);
  if (!session) {
    redirect("/auth/login");
  }

  // Verificar se é admin
  const sql = neon(process.env.DATABASE_URL!);
  const profiles = await sql`
    SELECT is_admin FROM profiles WHERE id = ${session.userId}
  `;

  if (!profiles[0]?.is_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">{children}</main>
    </div>
  );
}

import { sql } from "@/lib/db";
import { AdminUsersContent, User } from "@/components/admin/users-content";

export default async function AdminUsersPage() {
  const users = await sql`
    SELECT * FROM profiles
    ORDER BY created_at DESC
  `;

  return <AdminUsersContent users={(users || []) as User[]} />;
}

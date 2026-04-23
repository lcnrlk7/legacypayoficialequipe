import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ApiContent } from "@/components/dashboard/api-content";

interface ApiProfile {
  api_key: string;
  webhook_url: string;
}

export default async function ApiPage() {
  const session = await getSession();

  if (!session) {
    return <ApiContent profile={null} userId="" />;
  }

  const profiles = await sql`
    SELECT api_key, webhook_url FROM profiles 
    WHERE id = ${session.userId}
  `;

  return <ApiContent profile={(profiles[0] as ApiProfile) || null} userId={session.userId} />;
}

import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PixKeysContent, PixKey } from "@/components/dashboard/pix-keys-content";

export default async function PixKeysPage() {
  const session = await getSession();

  if (!session) {
    return <PixKeysContent pixKeys={[]} userId="" />;
  }

  const pixKeys = await sql`
    SELECT * FROM pix_keys 
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
  `;

  return <PixKeysContent pixKeys={(pixKeys || []) as PixKey[]} userId={session.userId} />;
}

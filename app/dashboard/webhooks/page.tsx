import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { WebhooksContent, WebhookLog } from "@/components/dashboard/webhooks-content";

export default async function WebhooksPage() {
  const session = await getSession();

  if (!session) {
    return <WebhooksContent webhookUrl={null} webhookLogs={[]} userId="" />;
  }

  const profiles = await sql`
    SELECT webhook_url FROM profiles WHERE id = ${session.userId}
  `;

  const webhookLogs = await sql`
    SELECT * FROM webhook_logs 
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return (
    <WebhooksContent
      webhookUrl={profiles[0]?.webhook_url as string | null}
      webhookLogs={(webhookLogs || []) as WebhookLog[]}
      userId={session.userId}
    />
  );
}

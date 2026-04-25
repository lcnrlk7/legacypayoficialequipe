import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { DashboardContent, Profile, Transaction, PixKey } from "@/components/dashboard/dashboard-content"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect("/auth/login")
  }

  const profiles = await sql`
    SELECT * FROM profiles WHERE id = ${session.userId}
  `
  const profile = profiles[0] as Profile

  const transactions = await sql`
    SELECT * FROM transactions 
    WHERE user_id = ${session.userId} 
    ORDER BY created_at DESC 
    LIMIT 10
  `

  const pixKeys = await sql`
    SELECT * FROM pix_keys WHERE user_id = ${session.userId}
  `

  return (
    <DashboardContent
      profile={profile}
      transactions={(transactions || []) as Transaction[]}
      pixKeys={(pixKeys || []) as PixKey[]}
    />
  )
}

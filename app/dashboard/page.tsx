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
  
  // Calculate total_revenue from completed transactions
  const revenueResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_revenue 
    FROM transactions 
    WHERE user_id = ${session.userId} 
    AND type = 'received' 
    AND status = 'completed'
  `
  
  const profile = {
    ...profiles[0],
    total_revenue: parseFloat(revenueResult[0]?.total_revenue || 0)
  } as Profile

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

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
  
  // Calculate total_revenue from completed transactions (pix_in is the income type)
  const revenueResult = await sql`
    SELECT COALESCE(SUM(amount), 0) as total_revenue 
    FROM transactions 
    WHERE user_id = ${session.userId} 
    AND type IN ('pix_in', 'received', 'deposit', 'sale')
    AND status = 'completed'
  `
  
  const profile = {
    ...profiles[0],
    total_revenue: parseFloat(revenueResult[0]?.total_revenue || 0)
  } as Profile

  // Get ALL transactions for stats calculation (not just 10)
  const transactions = await sql`
    SELECT * FROM transactions 
    WHERE user_id = ${session.userId} 
    ORDER BY created_at DESC
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

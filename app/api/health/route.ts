import { NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'

export async function GET() {
  const status = {
    database: { configured: false, connected: false, tables: 0 },
    vapid: { publicKey: false, privateKey: false },
    blob: { configured: false },
    timestamp: new Date().toISOString()
  }

  // Check database
  status.database.configured = isDatabaseConfigured()
  
  if (status.database.configured) {
    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      status.database.connected = true
      status.database.tables = parseInt(result[0].count, 10)
    } catch (error) {
      console.error('[Health] Database error:', error)
    }
  }

  // Check VAPID keys
  status.vapid.publicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  status.vapid.privateKey = !!process.env.VAPID_PRIVATE_KEY

  // Check Blob
  status.blob.configured = !!process.env.BLOB_READ_WRITE_TOKEN

  const allHealthy = 
    status.database.connected && 
    status.vapid.publicKey && 
    status.vapid.privateKey && 
    status.blob.configured

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    ...status
  }, { status: allHealthy ? 200 : 503 })
}

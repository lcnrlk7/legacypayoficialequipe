import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Lazy initialization - only create connection when actually needed
let _sql: NeonQueryFunction<false, false> | null = null

// Create a reusable SQL client with lazy initialization
function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

// Export sql as a function that lazily initializes the connection
// This maintains backward compatibility with existing code using `sql`
export const sql: NeonQueryFunction<false, false> = ((
  strings: TemplateStringsArray,
  ...values: unknown[]
) => {
  return getSql()(strings, ...values)
}) as NeonQueryFunction<false, false>

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

// Helper for transactions (Neon doesn't support transactions in serverless mode, 
// but we can use this pattern for consistency)
export async function withTransaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  // In serverless Neon, each query is its own transaction
  // For complex transactions, consider using Neon's connection pooling
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return callback(neon(process.env.DATABASE_URL))
}

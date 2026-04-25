import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está definida')
    process.exit(1)
  }

  console.log('🔌 Conectando ao banco de dados Neon...')
  
  const sql = neon(databaseUrl)

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '001-create-tables.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8')

    console.log('📄 Executando migration...')
    
    // Split by semicolons but handle edge cases
    const statements = sqlContent
      .split(/;(?=\s*(?:--|CREATE|INSERT|DROP|ALTER|DO|$))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql(statement)
          console.log('✅ Executado com sucesso')
        } catch (err) {
          // Ignore "already exists" errors
          const error = err as Error
          if (!error.message?.includes('already exists') && 
              !error.message?.includes('duplicate key')) {
            console.error('⚠️ Erro (continuando):', error.message?.substring(0, 100))
          }
        }
      }
    }

    console.log('\n✅ Migration concluída com sucesso!')
    
    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('\n📊 Tabelas criadas:')
    tables.forEach((t: { table_name: string }) => {
      console.log(`   - ${t.table_name}`)
    })

  } catch (error) {
    console.error('❌ Erro na migration:', error)
    process.exit(1)
  }
}

runMigration()

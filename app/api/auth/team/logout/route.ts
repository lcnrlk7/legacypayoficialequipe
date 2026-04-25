import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const TEAM_COOKIE_NAME = 'team_session'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(TEAM_COOKIE_NAME)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Team logout error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}

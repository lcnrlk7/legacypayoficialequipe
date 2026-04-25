import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ role: null });
    }

    // Check admin_team for role
    const adminTeam = await sql`
      SELECT role FROM admin_team 
      WHERE user_id = ${session.userId} AND is_active = true
    `;

    if (adminTeam.length > 0) {
      return NextResponse.json({ role: adminTeam[0].role });
    }

    // Check if user is_admin in profiles
    const profiles = await sql`
      SELECT is_admin FROM profiles WHERE id = ${session.userId}
    `;

    if (profiles.length > 0 && profiles[0].is_admin) {
      return NextResponse.json({ role: "ceo" });
    }

    return NextResponse.json({ role: null });
  } catch (error) {
    console.error("[v0] Error checking role:", error);
    return NextResponse.json({ role: null });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUser, getFullUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    // Get full user data
    const user = await getFullUser(sessionUser.id);
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        kyc_status: user.kyc_status,
        phone: user.phone,
        document: user.document,
        document_type: user.document_type,
      },
    });
  } catch (error) {
    console.error("[v0] Error getting session:", error);
    return NextResponse.json({ user: null });
  }
}

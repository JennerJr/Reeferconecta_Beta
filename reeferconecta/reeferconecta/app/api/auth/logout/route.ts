import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth-session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json({ error: "Erro ao encerrar sessão" }, { status: 500 });
  }
}

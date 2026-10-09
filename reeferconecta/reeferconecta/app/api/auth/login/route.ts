import { NextRequest, NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";
import { createSession } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = input.email?.trim().toLowerCase();

    // Na demo sem login, se nenhum e-mail for passado ou se qualquer usuário da lista for selecionado, autentica com sucesso
    const targetUser = email ? localStore.getUserByEmail(email) : localStore.getDefaultUser();

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    await createSession({
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role || "dev",
      primaryRole: targetUser.primaryRole,
      imageUrl: targetUser.imageUrl || "",
    });

    return NextResponse.json({ success: true, user: targetUser });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Erro no serviço de login" }, { status: 500 });
  }
}

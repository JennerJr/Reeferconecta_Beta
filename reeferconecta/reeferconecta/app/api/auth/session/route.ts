import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateSessionUser, createSession } from "@/lib/auth-session";
import { localStore } from "@/lib/local-store";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[GET /api/auth/session]", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// Permite alternar o usuário ou setor ativo em tempo real na demonstração
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { userId?: string; role?: string };
    if (body.userId) {
      const user = localStore.getUserById(body.userId);
      if (user) {
        await createSession({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          primaryRole: user.primaryRole,
          imageUrl: user.imageUrl,
        });
        return NextResponse.json({ success: true, user });
      }
    }

    const currentUser = await getSessionUser();
    if (currentUser && body.role) {
      const updated = { ...currentUser, role: body.role };
      await updateSessionUser(updated);
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/auth/session]", error);
    return NextResponse.json({ error: "Erro ao alternar sessão" }, { status: 500 });
  }
}

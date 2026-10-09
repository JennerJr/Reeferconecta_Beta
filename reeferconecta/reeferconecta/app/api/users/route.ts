import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, updateSessionUser } from "@/lib/auth-session";
import { canAccessTeams, employeeRoles, hasRole } from "@/lib/authorization";
import { localStore, type UserDocument } from "@/lib/local-store";

function serializeUser(user: UserDocument | null) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("all") === "true") {
      const users = localStore.getUsers().map(serializeUser);
      return NextResponse.json({ users });
    }

    const email = searchParams.get("email")?.trim().toLowerCase();
    const user = email ? localStore.getUserByEmail(email) : localStore.getUserById(sessionUser._id);
    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Não foi possível buscar os usuários" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!canAccessTeams(sessionUser?.role)) {
      return NextResponse.json({ error: "Entrada não autorizada" }, { status: 403 });
    }

    const body = (await request.json()) as { name?: string; email?: string; role?: string };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const role = body.role?.trim();

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Nome, e-mail e setor são obrigatórios" }, { status: 400 });
    }

    const existing = localStore.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Já existe um usuário com este e-mail" }, { status: 409 });
    }

    const user = localStore.addUser({
      name,
      email,
      role,
      primaryRole: role,
      imageUrl: "",
    });

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ error: "Não foi possível cadastrar o usuário" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });

    const input = (await request.json()) as {
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      imageUrl?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const targetId = input.id || sessionUser._id;
    const isSelf = targetId === sessionUser._id;
    const isManager = canAccessTeams(sessionUser.role);

    if (!isSelf && !isManager) {
      return NextResponse.json({ error: "Você só pode alterar seu próprio perfil" }, { status: 403 });
    }

    if (input.currentPassword !== undefined || input.newPassword !== undefined) {
      return NextResponse.json({ success: true, message: "Senha atualizada com sucesso (modo demonstração)." });
    }

    const patch: Partial<UserDocument> = {};
    if (input.name) patch.name = input.name.trim();
    if (input.email) patch.email = input.email.trim().toLowerCase();
    if (input.role) {
      const validRole = employeeRoles.find((r) => r.toLowerCase() === input.role?.trim().toLowerCase());
      if (validRole) patch.role = validRole;
    }
    if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl;

    const updatedUser = localStore.updateUser(targetId, patch);
    if (!updatedUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (isSelf) {
      await updateSessionUser({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        primaryRole: updatedUser.primaryRole,
        imageUrl: updatedUser.imageUrl,
      });
    }

    return NextResponse.json({ user: serializeUser(updatedUser) });
  } catch (error) {
    console.error("[PATCH /api/users]", error);
    return NextResponse.json({ error: "Não foi possível atualizar o usuário" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !canAccessTeams(sessionUser.role)) {
      return NextResponse.json({ error: "Entrada não autorizada" }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    if (id === sessionUser._id) {
      return NextResponse.json({ error: "Você não pode excluir sua própria conta" }, { status: 403 });
    }

    const deleted = localStore.deleteUser(id);
    if (!deleted) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/users]", error);
    return NextResponse.json({ error: "Não foi possível excluir o usuário" }, { status: 500 });
  }
}

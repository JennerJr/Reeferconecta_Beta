import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canDeleteChamados, canManagePieces, canViewAllChamados } from "@/lib/authorization";
import { localStore, type ChamadoDocument, type ChamadoHistory } from "@/lib/local-store";
import { randomUUID } from "node:crypto";

function getCurrentDateTimeLocal(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const chamados = localStore.getChamados().sort((a, b) => a.id - b.id);
    const canViewAll = canViewAllChamados(user.role);
    const name = user.name.trim().toLowerCase();
    const visible = canViewAll ? chamados : chamados.filter((c) => c.pedidoPor?.trim().toLowerCase() === name);

    return NextResponse.json(visible, { status: 200 });
  } catch (err) {
    console.error("[GET /api/chamados]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível listar os chamados" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const piece = (await request.json()) as Partial<ChamadoDocument>;
    if (!piece.titulo?.trim() || !piece.descricao?.trim()) {
      return NextResponse.json({ erro: "Título e descrição são obrigatórios." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const history: ChamadoHistory = {
      id: randomUUID(),
      action: "created",
      details: "Chamado Aberto",
      userName: user.name || "Usuário",
      criadoEm: now,
    };

    const doc = localStore.addChamado({
      titulo: piece.titulo.trim(),
      descricao: piece.descricao.trim(),
      status: piece.status || "aberto",
      pedidoPor: piece.pedidoPor?.trim() || user.name,
      criadoEm: piece.criadoEm || getCurrentDateTimeLocal(),
      history: [history],
    });

    return NextResponse.json({ success: true, chamado: doc }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chamados]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível salvar o chamado" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!canManagePieces(user?.role)) {
      return NextResponse.json({ erro: "Entrada não autorizada" }, { status: 403 });
    }

    const input = (await request.json()) as Partial<ChamadoDocument>;
    const id = Number(input.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ erro: "ID do chamado inválido" }, { status: 400 });
    }

    const current = localStore.getChamadoById(id);
    if (!current) {
      return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });
    }

    const history: ChamadoHistory = {
      id: randomUUID(),
      action: "updated",
      details: `Chamado atualizado para status: ${input.status || current.status}`,
      userName: user?.name || "Usuário",
      criadoEm: new Date().toISOString(),
    };

    const updated = localStore.updateChamado(id, {
      titulo: input.titulo ?? current.titulo,
      descricao: input.descricao ?? current.descricao,
      status: input.status ?? current.status,
      pedidoPor: input.pedidoPor ?? current.pedidoPor,
      history: [...(current.history ?? []), history],
    });

    return NextResponse.json({ success: true, chamado: updated }, { status: 200 });
  } catch (err) {
    console.error("[PUT /api/chamados]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível atualizar o chamado" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!canDeleteChamados(user?.role)) {
      return NextResponse.json({ erro: "Entrada não autorizada" }, { status: 403 });
    }

    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id)) {
      return NextResponse.json({ erro: "ID do chamado inválido" }, { status: 400 });
    }

    const deleted = localStore.deleteChamado(id);
    if (!deleted) {
      return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/chamados]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível remover o chamado" }, { status: 500 });
  }
}

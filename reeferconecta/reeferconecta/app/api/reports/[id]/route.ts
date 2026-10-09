import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canDeleteAnyReport } from "@/lib/authorization";
import { localStore } from "@/lib/local-store";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as {
      responsavelReparo?: string;
      ordemServico?: string;
      descricaoReparo?: string;
      situacaoAtual?: string;
    };

    const existing = localStore.getStandaloneReports().find((r) => r.id === id);
    if (!existing) return NextResponse.json({ erro: "Relatório não encontrado." }, { status: 404 });

    const isEnc = user.role.trim().toLowerCase() === "enc" || user.role.trim().toLowerCase() === "dev" || user.role.trim().toLowerCase() === "master";
    const isAuthor = (existing.tecnicoResponsavel || existing.responsavelReparo || "").trim().toLowerCase() === user.name.trim().toLowerCase();
    if (!isEnc && !isAuthor) return NextResponse.json({ erro: "Você não pode editar este relatório." }, { status: 403 });

    const situacaoAtual = body.situacaoAtual?.trim() || existing.situacaoAtual;
    const ordemServico = body.ordemServico?.trim() || undefined;
    const responsavelReparo = body.responsavelReparo?.trim() || existing.responsavelReparo;
    const descricaoReparo = body.descricaoReparo !== undefined ? body.descricaoReparo.trim() : existing.descricaoReparo;

    const updated = localStore.updateStandaloneReport(id, {
      responsavelReparo,
      ordemServico,
      descricaoReparo,
      situacaoAtual,
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error("[PATCH /api/reports/[id]]", error);
    return NextResponse.json({ erro: "Não foi possível salvar a edição." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const { id } = await params;
    const existing = localStore.getStandaloneReports().find((r) => r.id === id);
    if (!existing) return NextResponse.json({ erro: "Relatório não encontrado." }, { status: 404 });

    const isAuthor = (existing.tecnicoResponsavel || existing.responsavelReparo || "").trim().toLowerCase() === user.name.trim().toLowerCase();
    if (!canDeleteAnyReport(user.role) && !isAuthor) {
      return NextResponse.json({ erro: "Você não pode excluir este relatório." }, { status: 403 });
    }

    localStore.deleteStandaloneReport(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/reports/[id]]", error);
    return NextResponse.json({ erro: "Não foi possível excluir o relatório." }, { status: 500 });
  }
}

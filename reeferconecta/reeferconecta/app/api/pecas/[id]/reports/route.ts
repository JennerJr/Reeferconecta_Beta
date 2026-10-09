import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canDeleteAnyReport } from "@/lib/authorization";
import { localStore, type PieceReport } from "@/lib/local-store";
import { notifyReportSubmitted } from "@/lib/notifications";
import { randomUUID } from "node:crypto";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ erro: "ID da peça inválido" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<PieceReport> & { qc?: string; notify?: boolean };
    const responsavelReparo = user.name.trim();
    const descricaoReparo = body.descricaoReparo?.trim() || undefined;
    const submittedSituation = body.situacaoAtual?.trim();

    if (!responsavelReparo || !submittedSituation || !body.qc?.trim()) {
      return NextResponse.json({ erro: "Preencha o QC, responsável e situação." }, { status: 400 });
    }

    const piece = localStore.getPieceById(id);
    if (!piece) {
      return NextResponse.json({ erro: "Peça não encontrada" }, { status: 404 });
    }

    const isAlmoxDelivery = submittedSituation === "Enviado para o mesmo" || /^Entregue para:/i.test(submittedSituation);
    const replacement = submittedSituation === "Sem condições de reparo" || isAlmoxDelivery
      ? submittedSituation
      : "OK";
    const situacaoAtual = isAlmoxDelivery
      ? submittedSituation
      : piece.situacaoAtual?.replace(/^Em reparo\b/i, replacement) || submittedSituation;

    const report: PieceReport = {
      id: randomUUID(),
      responsavelReparo,
      descricaoReparo,
      situacaoAtual,
      ordemServico: body.ordemServico?.trim() || undefined,
      resistencia: body.resistencia?.trim() ? `${body.resistencia.trim()} Ω` : undefined,
      surge: body.surge?.trim() || undefined,
      mega: body.mega?.trim() ? `${body.mega.trim()} Ω` : undefined,
      simulador: body.simulador?.trim() || undefined,
      corrente: body.corrente?.trim() ? `${body.corrente.trim()} A` : undefined,
      transformador: body.transformador?.trim() ? `${body.transformador.trim()} V AC` : undefined,
      inspeçãoVisual: body.inspeçãoVisual?.trim() || undefined,
      serialNumberReport: body.serialNumberReport?.trim() || undefined,
      estatorTrocado: body.estatorTrocado?.trim() || undefined,
      scroll: body.scroll?.trim() || undefined,
      reparoFalange: body.reparoFalange?.trim() || undefined,
      analiseMecanica: body.analiseMecanica?.trim() || undefined,
      testeFuncionamento: body.testeFuncionamento?.trim() || undefined,
      outroTesteFuncionamento: body.outroTesteFuncionamento?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    localStore.addPieceReport(id, report, situacaoAtual);

    if (body.notify !== false) {
      await notifyReportSubmitted(
        responsavelReparo,
        user.role,
        `${responsavelReparo} enviou um relatório para a peça QC ${piece.qc}.`,
      );
    }

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pecas/:id/reports]", error);
    return NextResponse.json({ erro: "Não foi possível salvar o relatório" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const reportId = request.nextUrl.searchParams.get("reportId");
    if (!Number.isInteger(id) || !reportId) {
      return NextResponse.json({ erro: "Parâmetros inválidos." }, { status: 400 });
    }

    const piece = localStore.getPieceById(id);
    if (!piece) return NextResponse.json({ erro: "Peça não encontrada" }, { status: 404 });

    const report = piece.reports?.find((r) => r.id === reportId);
    if (!report) return NextResponse.json({ erro: "Relatório não encontrado" }, { status: 404 });

    const isAuthor = report.responsavelReparo.trim().toLowerCase() === user.name.trim().toLowerCase();
    if (!canDeleteAnyReport(user.role) && !isAuthor) {
      return NextResponse.json({ erro: "Você não tem permissão para excluir este relatório" }, { status: 403 });
    }

    localStore.deletePieceReport(id, reportId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/pecas/:id/reports]", error);
    return NextResponse.json({ erro: "Não foi possível excluir o relatório" }, { status: 500 });
  }
}

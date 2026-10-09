import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { localStore, type StandaloneReport } from "@/lib/local-store";
import { notifyReportSubmitted } from "@/lib/notifications";
import { getCustomCatalogParts } from "@/lib/catalog-store";
import { getSetorForComponente } from "@/lib/catalog";
import { randomUUID } from "node:crypto";

const semCondicoesSetoresRestritosParaAlmox = new Set(["lab.eletronica", "lab.elétrica", "cereco"]);

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const standaloneReports = localStore.getStandaloneReports();
    const pieces = localStore.getPieces();

    const role = user.role.trim().toLowerCase();
    const canViewAll = role === "enc" || role === "dev" || role === "master";
    const canViewAllStandalone = canViewAll || role === "almox";
    const name = user.name.trim().toLowerCase();

    const matchesUser = (report: { responsavelReparo?: string; tecnicoResponsavel?: string; rebobinadoPor?: string }) =>
      [report.responsavelReparo, report.tecnicoResponsavel, report.rebobinadoPor].some(
        (value) => value?.trim().toLowerCase() === name,
      );

    const visibleStandalone = canViewAllStandalone
      ? standaloneReports
      : standaloneReports.filter(matchesUser);

    const pieceReports = pieces.flatMap((piece) =>
      (piece.reports ?? [])
        .filter((report) => canViewAll || role === "almox" || matchesUser(report))
        .map((report) => ({
          ...report,
          pieceId: piece.id,
          pieceName: piece.nome ?? "Peça sem nome",
          fabricante: piece.fabricante ?? "Não informado",
          qc: piece.qc ?? "",
        })),
    );

    const isSemCondicoes = (status?: string) => status?.trim().toLowerCase().startsWith("sem condições") ?? false;
    const customParts = role === "almox" ? await getCustomCatalogParts() : [];

    const reports = [
      ...pieceReports,
      ...visibleStandalone.map((report) => ({
        ...report,
        pieceId: undefined,
        pieceName: report.nomePeca || "Report sem peça",
        fabricante: report.fabricante || "Não informado",
        qc: "",
      })),
    ]
      .filter((report) => {
        if (role !== "almox" || !isSemCondicoes(report.situacaoAtual)) return true;
        const setor = getSetorForComponente(report.pieceName, customParts);
        return !semCondicoesSetoresRestritosParaAlmox.has(setor);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[GET /api/reports]", error);
    return NextResponse.json({ erro: "Não foi possível carregar os relatórios." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ erro: "Sessão não encontrada" }, { status: 401 });

    const body = (await request.json()) as { reports?: Partial<StandaloneReport>[] };
    const inputs = body.reports ?? [];
    if (!inputs.length || inputs.length > 50) {
      return NextResponse.json({ erro: "Envie entre 1 e 50 relatórios." }, { status: 400 });
    }

    const createdList: StandaloneReport[] = [];
    for (const input of inputs) {
      const nomePeca = input.nomePeca?.trim();
      const situacaoAtual = input.situacaoAtual?.trim();
      if (!nomePeca || !situacaoAtual) {
        return NextResponse.json({ erro: "Preencha o nome da peça e a situação." }, { status: 400 });
      }

      createdList.push({
        id: randomUUID(),
        nomePeca,
        fabricante: input.fabricante?.trim() || "Não informado",
        ordemServico: input.ordemServico?.trim() || undefined,
        descricaoReparo: input.descricaoReparo?.trim() || undefined,
        responsavelReparo: input.responsavelReparo?.trim() || user.name.trim(),
        tecnicoResponsavel: user.name.trim(),
        situacaoAtual,
        resistencia: input.resistencia?.trim() || undefined,
        surge: input.surge?.trim() || undefined,
        mega: input.mega?.trim() || undefined,
        simulador: input.simulador?.trim() || undefined,
        corrente: input.corrente?.trim() || undefined,
        transformador: input.transformador?.trim() || undefined,
        rebobinadoPor: input.rebobinadoPor?.trim() || undefined,
        inspeçãoVisual: input.inspeçãoVisual?.trim() || undefined,
        serialNumberReport: input.serialNumberReport?.trim() || undefined,
        estatorTrocado: input.estatorTrocado?.trim() || undefined,
        scroll: input.scroll?.trim() || undefined,
        reparoFalange: input.reparoFalange?.trim() || undefined,
        analiseMecanica: input.analiseMecanica?.trim() || undefined,
        testeFuncionamento: input.testeFuncionamento?.trim() || undefined,
        outroTesteFuncionamento: input.outroTesteFuncionamento?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    localStore.addStandaloneReports(createdList);

    const actorName = user.name.trim();
    const summary = createdList.length > 1
      ? `${actorName} enviou ${createdList.length} relatórios sem QC.`
      : `${actorName} enviou um relatório sem QC${createdList[0].ordemServico ? ` (OS ${createdList[0].ordemServico})` : ""}.`;
    await notifyReportSubmitted(actorName, user.role, summary);

    return NextResponse.json({ success: true, reports: createdList }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/reports]", error);
    return NextResponse.json({ erro: "Não foi possível salvar os relatórios." }, { status: 500 });
  }
}

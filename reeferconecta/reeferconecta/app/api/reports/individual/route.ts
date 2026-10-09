import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canAccessTeams } from "@/lib/authorization";
import { localStore } from "@/lib/local-store";
import PDFDocument from "pdfkit";

const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 90;

function drawHeader(doc: PDFKit.PDFDocument, userName: string, startDate: string, endDate: string) {
  doc.rect(0, 0, doc.page.width, HEADER_HEIGHT).fill("#1e293b");

  doc
    .fillColor("#ef4444")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("REEFERCONECTA", PAGE_MARGIN, 20);

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Relatório Individual de Reparos", PAGE_MARGIN, 34);

  doc
    .fillColor("#94a3b8")
    .font("Helvetica")
    .fontSize(9)
    .text(`Técnico: ${userName}  |  Período: ${startDate} a ${endDate}`, PAGE_MARGIN, 56);
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number, columns: { label: string; width: number }[]) {
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);
  doc.rect(PAGE_MARGIN, y, totalWidth, 24).fill("#334155");

  let x = PAGE_MARGIN;
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  columns.forEach((col) => {
    doc.text(col.label, x + 6, y + 7, { width: col.width - 12 });
    x += col.width;
  });
  return y + 24;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  startY: number,
  reparos: { pieceName: string; situacaoAtual: string; createdAt: string }[],
) {
  const columns = [
    { label: "Peça", width: 220 },
    { label: "Situação", width: 160 },
    { label: "Data", width: 135 },
  ];
  const rowHeight = 24;
  let y = drawTableHeader(doc, startY, columns);

  doc.font("Helvetica").fontSize(9);
  reparos.forEach((reparo, index) => {
    if (y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      y = drawTableHeader(doc, PAGE_MARGIN, columns);
      doc.font("Helvetica").fontSize(9);
    }

    doc
      .rect(PAGE_MARGIN, y, columns.reduce((s, c) => s + c.width, 0), rowHeight)
      .fill(index % 2 === 0 ? "#f8fafc" : "#ffffff");

    let x = PAGE_MARGIN;
    doc.fillColor("#0f172a");
    doc.text(reparo.pieceName, x + 6, y + 7, { width: columns[0].width - 12 });
    x += columns[0].width;
    doc.text(reparo.situacaoAtual, x + 6, y + 7, { width: columns[1].width - 12 });
    x += columns[1].width;
    doc.text(new Date(reparo.createdAt).toLocaleString("pt-BR"), x + 6, y + 7, { width: columns[2].width - 12 });

    y += rowHeight;
  });

  return y;
}

function drawPieSlice(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string,
) {
  const points: [number, number][] = [[cx, cy]];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps);
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  doc.polygon(...points).fill(color);
}

function drawPieChart(
  doc: PDFKit.PDFDocument,
  startY: number,
  segments: { label: string; value: number; color: string }[],
) {
  const radius = 55;
  const cx = PAGE_MARGIN + radius + 10;
  const cy = startY + radius;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  if (total === 0) {
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(10)
      .text("Sem dados suficientes para o gráfico.", PAGE_MARGIN, startY + radius);
    return startY + radius * 2 + 20;
  }

  let angle = -Math.PI / 2;
  segments.forEach((seg) => {
    const sliceAngle = (seg.value / total) * Math.PI * 2;
    if (seg.value > 0) drawPieSlice(doc, cx, cy, radius, angle, angle + sliceAngle, seg.color);
    angle += sliceAngle;
  });

  const legendX = cx + radius + 30;
  let legendY = startY + 10;
  segments.forEach((seg) => {
    const percent = total > 0 ? Math.round((seg.value / total) * 100) : 0;
    doc.rect(legendX, legendY, 10, 10).fill(seg.color);
    doc
      .fillColor("#0f172a")
      .font("Helvetica")
      .fontSize(10)
      .text(`${seg.label}: ${seg.value} (${percent}%)`, legendX + 16, legendY - 1);
    legendY += 20;
  });

  return startY + radius * 2 + 20;
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");

    if (!userId || !startDate || !endDate) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    if (!canAccessTeams(sessionUser.role) && userId !== sessionUser._id) {
      return NextResponse.json({ error: "Você só pode gerar relatórios dos seus próprios dados" }, { status: 403 });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }

    const targetUser = localStore.getUserById(userId) || localStore.getUsers().find((u) => u.name === userId);
    if (!targetUser?.name) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const userNameLower = targetUser.name.trim().toLowerCase();
    const pieces = localStore.getPieces();

    const reparosComQC = pieces.flatMap((piece) =>
      (piece.reports ?? [])
        .filter((report) => report.responsavelReparo?.trim().toLowerCase() === userNameLower)
        .filter((report) => {
          const createdAt = report.createdAt ? new Date(report.createdAt) : null;
          return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= start && createdAt <= end;
        })
        .map((report) => ({
          pieceName: piece.nome?.trim() || "Peça sem nome",
          situacaoAtual: report.situacaoAtual?.trim() || "—",
          createdAt: report.createdAt,
        })),
    );

    const reportsSemQC = localStore.getStandaloneReports()
      .filter((report) => report.responsavelReparo?.trim().toLowerCase() === userNameLower)
      .filter((report) => {
        const createdAt = report.createdAt ? new Date(report.createdAt) : null;
        return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= start && createdAt <= end;
      })
      .map((report) => ({
        pieceName: report.nomePeca?.trim() || "Peça sem nome",
        situacaoAtual: report.situacaoAtual?.trim() || "—",
        createdAt: report.createdAt,
      }));

    const reparos = [...reparosComQC, ...reportsSemQC].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const okCount = reparos.filter((r) => r.situacaoAtual.trim().toLowerCase().startsWith("ok")).length;
    const irreparableCount = reparos.filter(
      (r) => r.situacaoAtual.trim().toLowerCase() === "sem condições de reparo",
    ).length;

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawHeader(doc, targetUser.name, startDate, endDate);

      const chartBottomY = drawPieChart(doc, HEADER_HEIGHT + 20, [
        { label: "Peças OK", value: okCount, color: "#22c55e" },
        { label: "Sem condição de reparo", value: irreparableCount, color: "#ef4444" },
      ]);

      if (reparos.length === 0) {
        doc
          .fillColor("#64748b")
          .font("Helvetica")
          .fontSize(11)
          .text("Nenhum reparo encontrado para o período selecionado.", PAGE_MARGIN, chartBottomY);
      } else {
        const finalY = drawTable(doc, chartBottomY, reparos);
        doc
          .fillColor("#ef4444")
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(`Total de reparos no período: ${reparos.length}`, PAGE_MARGIN, finalY + 15);
      }

      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${targetUser.name.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/individual]", error);
    return NextResponse.json({ error: "Não foi possível gerar o relatório." }, { status: 500 });
  }
}

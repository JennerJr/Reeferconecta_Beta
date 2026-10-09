import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canDeletePecas, canManagePieces } from "@/lib/authorization";
import { getSetorForComponente, normalizeSetor } from "@/lib/catalog";
import { getCustomCatalogParts } from "@/lib/catalog-store";
import { localStore, type PieceDocument, type PieceHistory } from "@/lib/local-store";
import { randomUUID } from "node:crypto";

const sectorOnlyRoles = ["lab.eletronica", "lab.elétrica", "cereco"];

function generateQC(piece: { fabricante?: string }, nextId: number): string {
  const currentYear = new Date().getFullYear();
  const prefix = (piece.fabricante?.slice(0, 3) || "PEC").toUpperCase();
  const formattedId = String(nextId).padStart(2, "0");
  return `${prefix}-${formattedId}-${currentYear}`;
}

function getCurrentDateTimeLocal(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function validatePiece(piece: Partial<PieceDocument>): string[] {
  const errors: string[] = [];
  const required: Array<[keyof PieceDocument, string]> = [
    ["nome", "Nome"],
    ["fabricante", "Fabricante"],
    ["localidade", "Localidade"],
    ["tecnicoResponsavel", "Técnico responsável"],
    ["situacaoAtual", "Situação atual"],
  ];
  for (const [field, label] of required) {
    if (!piece[field] || !String(piece[field]).trim()) {
      errors.push(`O campo ${label} é obrigatório`);
    }
  }
  return errors;
}

// GET /api/pecas — lista todas as peças
export async function GET(request: NextRequest) {
  try {
    const pieces = localStore.getPieces().sort((a, b) => (a.id || 0) - (b.id || 0));
    const sessionUser = await getSessionUser();
    const role = sessionUser?.role.trim().toLowerCase();
    const needsSectorFilter = Boolean(role && sectorOnlyRoles.includes(role));
    const customParts = needsSectorFilter ? await getCustomCatalogParts() : [];
    const sectorPieces = needsSectorFilter
      ? pieces.filter((piece) => getSetorForComponente(piece.nome, customParts) === normalizeSetor(role))
      : pieces;

    if (request.nextUrl.searchParams.get("reports") !== "visible") {
      return NextResponse.json(sectorPieces, { status: 200 });
    }

    const canViewAllReports = role === "enc" || role === "dev" || role === "master" || role === "almox";
    const currentUserName = sessionUser?.name.trim().toLowerCase() ?? "";
    const visiblePieces = canViewAllReports
      ? sectorPieces
      : sectorPieces.map((piece) => ({
          ...piece,
          reports: piece.reports?.filter(
            (report) => report.responsavelReparo?.trim().toLowerCase() === currentUserName,
          ),
        }));

    return NextResponse.json(visiblePieces, { status: 200 });
  } catch (err) {
    console.error("[GET /api/pecas]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível listar as peças" }, { status: 500 });
  }
}

// POST /api/pecas — cadastra nova peça
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!canManagePieces(user?.role)) {
      return NextResponse.json({ erro: "Entrada não autorizada" }, { status: 403 });
    }

    const piece = (await request.json()) as Partial<PieceDocument>;
    piece.dataChegada = piece.dataChegada || getCurrentDateTimeLocal();

    const errors = validatePiece(piece);
    if (errors.length) {
      return NextResponse.json({ erro: errors.join("; ") }, { status: 400 });
    }

    const allPieces = localStore.getPieces();
    const maxId = allPieces.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const nextId = maxId + 1;
    const qc = piece.qc?.trim() || generateQC(piece, nextId);
    const now = new Date().toISOString();

    const history: PieceHistory = {
      id: randomUUID(),
      action: "created",
      details: "Entrada da peça registrada",
      userName: user?.name || "Usuário",
      createdAt: now,
    };

    const doc = localStore.addPiece({
      nome: piece.nome,
      serialNumber: piece.serialNumber,
      fabricante: piece.fabricante,
      localidade: piece.localidade,
      tecnicoResponsavel: piece.tecnicoResponsavel,
      dataChegada: piece.dataChegada,
      situacaoAtual: piece.situacaoAtual,
      imagemUrl: piece.imagemUrl,
      dataSaida: piece.dataSaida,
      qc,
      createdAt: now,
      history: [history],
      reports: [],
    });

    return NextResponse.json({ success: true, qc, peca: doc }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pecas]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível salvar a peça" }, { status: 500 });
  }
}

// PUT /api/pecas — atualiza peça existente
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!canManagePieces(user?.role)) {
      return NextResponse.json({ erro: "Entrada não autorizada" }, { status: 403 });
    }

    const input = (await request.json()) as Partial<PieceDocument>;
    const id = Number(input.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ erro: "ID da peça inválido" }, { status: 400 });
    }

    const current = localStore.getPieceById(id);
    if (!current) {
      return NextResponse.json({ erro: "Peça não encontrada" }, { status: 404 });
    }

    const updated: Partial<PieceDocument> = {
      nome: input.nome ?? current.nome,
      serialNumber: input.serialNumber ?? current.serialNumber,
      fabricante: input.fabricante ?? current.fabricante,
      localidade: input.localidade ?? current.localidade,
      tecnicoResponsavel: input.tecnicoResponsavel ?? current.tecnicoResponsavel,
      dataChegada: input.dataChegada ?? current.dataChegada,
      situacaoAtual: input.situacaoAtual ?? current.situacaoAtual,
      imagemUrl: input.imagemUrl ?? current.imagemUrl,
      dataSaida: input.dataSaida ?? current.dataSaida,
    };

    const errors = validatePiece(updated);
    if (errors.length) {
      return NextResponse.json({ erro: errors.join("; ") }, { status: 400 });
    }

    const historyEntry: PieceHistory = {
      id: randomUUID(),
      action: "updated",
      details: "Dados da peça atualizados",
      userName: user?.name || "Usuário",
      createdAt: new Date().toISOString(),
    };

    const finalPiece = localStore.updatePiece(id, {
      ...updated,
      history: [...(current.history ?? []), historyEntry],
    });

    return NextResponse.json({ success: true, peca: finalPiece }, { status: 200 });
  } catch (err) {
    console.error("[PUT /api/pecas]", err);
    return NextResponse.json({ success: false, erro: "Não foi possível atualizar a peça" }, { status: 500 });
  }
}

// DELETE /api/pecas — remove peça existente
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!canDeletePecas(user?.role)) {
      return NextResponse.json({ erro: "Entrada não autorizada" }, { status: 403 });
    }

    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id)) {
      return NextResponse.json({ erro: "ID da peça inválido" }, { status: 400 });
    }

    const deleted = localStore.deletePiece(id);
    if (!deleted) {
      return NextResponse.json({ erro: "Peça não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/pecas]", err);
    return NextResponse.json({ erro: "Não foi possível remover a peça" }, { status: 500 });
  }
}

import { localStore } from "@/lib/local-store";

export type AvailableQuantity = { comQc: number; semQc: number; total: number };

function isOk(status?: string) {
  return status?.trim().toLowerCase().startsWith("ok") ?? false;
}

// Soma peças "com QC" (pecas) e "sem QC" (reports) marcadas como OK para um nome de peça.
export async function getAvailableQuantities(nomes: string[]): Promise<Map<string, AvailableQuantity>> {
  const pieces = localStore.getPieces();
  const reports = localStore.getStandaloneReports();

  const result = new Map<string, AvailableQuantity>();
  for (const nome of nomes) {
    const normalizedNome = nome.trim().toLowerCase();
    if (result.has(normalizedNome)) continue;
    const comQc = pieces.filter(
      (piece) => piece.nome?.trim().toLowerCase() === normalizedNome && isOk(piece.situacaoAtual),
    ).length;
    const semQc = reports.filter(
      (report) => report.nomePeca?.trim().toLowerCase() === normalizedNome && isOk(report.situacaoAtual),
    ).length;
    result.set(normalizedNome, { comQc, semQc, total: comQc + semQc });
  }
  return result;
}

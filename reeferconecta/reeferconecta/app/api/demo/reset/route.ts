import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";

export async function POST() {
  try {
    localStore.resetToDemoData();
    return NextResponse.json({ success: true, message: "Dados de demonstração restaurados com sucesso." });
  } catch (error) {
    console.error("[POST /api/demo/reset]", error);
    return NextResponse.json({ error: "Erro ao restaurar dados da demonstração" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

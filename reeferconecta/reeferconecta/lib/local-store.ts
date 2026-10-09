import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { catalogParts as staticCatalogParts, type CatalogEntry } from "@/lib/catalog";

export type PieceReport = {
  id: string;
  responsavelReparo: string;
  descricaoReparo?: string;
  situacaoAtual: string;
  ordemServico?: string;
  resistencia?: string;
  surge?: string;
  mega?: string;
  simulador?: string;
  corrente?: string;
  transformador?: string;
  rebobinadoPor?: string;
  inspeçãoVisual?: string;
  serialNumberReport?: string;
  estatorTrocado?: string;
  scroll?: string;
  reparoFalange?: string;
  analiseMecanica?: string;
  testeFuncionamento?: string;
  outroTesteFuncionamento?: string;
  createdAt: string;
};

export type PieceHistory = {
  id: string;
  action: "created" | "updated" | "report";
  details: string;
  userName: string;
  createdAt: string;
};

export type PieceDocument = {
  id: number;
  nome?: string;
  serialNumber?: string;
  fabricante?: string;
  localidade?: string;
  tecnicoResponsavel?: string;
  partNumber?: string;
  dataChegada?: string;
  situacaoAtual?: string;
  qc?: string;
  imagemUrl?: string;
  dataSaida?: string;
  createdAt?: string;
  reports?: PieceReport[];
  history?: PieceHistory[];
};

export type StandaloneReport = {
  id: string;
  fabricante?: string;
  ordemServico?: string;
  nomePeca?: string;
  pieceId?: number;
  descricaoReparo?: string;
  responsavelReparo?: string;
  tecnicoResponsavel?: string;
  situacaoAtual: string;
  entregueParaNome?: string;
  resistencia?: string;
  surge?: string;
  mega?: string;
  simulador?: string;
  corrente?: string;
  transformador?: string;
  rebobinadoPor?: string;
  inspeçãoVisual?: string;
  serialNumberReport?: string;
  estatorTrocado?: string;
  scroll?: string;
  reparoFalange?: string;
  analiseMecanica?: string;
  testeFuncionamento?: string;
  outroTesteFuncionamento?: string;
  createdAt: string;
};

export type ChamadoHistory = {
  id: string;
  action: "created" | "updated" | "report";
  details: string;
  userName: string;
  criadoEm: string;
};

export type ChamadoDocument = {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
  pedidoPor: string;
  criadoEm: string;
  history?: ChamadoHistory[];
};

export type PedidoItem = {
  nome: string;
  quantidadeSolicitada: number;
  quantidadeDisponivel: number;
  estoqueInsuficiente: boolean;
};

export type PedidoResposta = {
  viavel: boolean;
  comentario?: string;
  respondidoPor: string;
  respondidoEm: string;
};

export type PedidoDocument = {
  id: number;
  setor: string;
  setorLabel: string;
  observacao?: string;
  dataAte?: string;
  itens: PedidoItem[];
  estoqueInsuficiente: boolean;
  status: "pendente" | "atendido" | "cancelado";
  solicitante: string;
  createdAt: string;
  resposta?: PedidoResposta;
};

export type UserDocument = {
  _id: string;
  name: string;
  email: string;
  role: string;
  primaryRole?: string;
  imageUrl: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomCatalogPart = CatalogEntry & { id: string; createdAt: string };

export type NotificationDocument = {
  id: string;
  message: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  readBy: string[];
  type?: "report" | "pedido";
  recipientUserIds?: string[];
};

export type LocalDatabase = {
  pieces: PieceDocument[];
  standaloneReports: StandaloneReport[];
  chamados: ChamadoDocument[];
  pedidos: PedidoDocument[];
  users: UserDocument[];
  customCatalogParts: CustomCatalogPart[];
  hiddenCatalogParts: string[];
  notifications: NotificationDocument[];
  sessions: Record<string, UserDocument>;
};

const DB_FILE_PATH = path.join(os.tmpdir(), "reeferconecta-demo-db.json");

const initialSeedUsers: UserDocument[] = [
  {
    _id: "user-demo-admin",
    name: "Carlos Mendes (Demo)",
    email: "admin@reeferconecta.com",
    role: "dev",
    primaryRole: "dev",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-enc-1",
    name: "Roberto Silveira",
    email: "roberto.silveira@reeferbras.com",
    role: "enc",
    primaryRole: "enc",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-almox-1",
    name: "Mariana Costa",
    email: "mariana.costa@reeferbras.com",
    role: "almox",
    primaryRole: "almox",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-eletronica-1",
    name: "Juliana Fernandes",
    email: "juliana.fernandes@reeferbras.com",
    role: "lab.eletronica",
    primaryRole: "lab.eletronica",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-eletrica-1",
    name: "Eduardo Lima",
    email: "eduardo.lima@reeferbras.com",
    role: "lab.elétrica",
    primaryRole: "lab.elétrica",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "user-cereco-1",
    name: "Ricardo Alves",
    email: "ricardo.alves@reeferbras.com",
    role: "cereco",
    primaryRole: "cereco",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const nowIso = new Date().toISOString();
const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000).toISOString();

const initialSeedPieces: PieceDocument[] = [
  {
    id: 1,
    nome: "Controlador MicroLink 3 (Yellow Label)",
    serialNumber: "CAR-ML3-98214",
    fabricante: "Carrier",
    localidade: "Santos/SP",
    tecnicoResponsavel: "Carlos Mendes",
    dataChegada: threeDaysAgo,
    situacaoAtual: "OK",
    qc: "CAR-01-2026",
    createdAt: threeDaysAgo,
    reports: [
      {
        id: "rep-001",
        responsavelReparo: "Juliana Fernandes",
        descricaoReparo: "Ressoldagem da ponte retificadora e substituição de capacitor eletrolítico de filtragem.",
        situacaoAtual: "OK",
        ordemServico: "10480",
        createdAt: twoDaysAgo,
      },
    ],
    history: [
      {
        id: "hist-001",
        action: "created",
        details: "Entrada da peça registrada no almoxarifado",
        userName: "Mariana Costa",
        createdAt: threeDaysAgo,
      },
      {
        id: "hist-002",
        action: "report",
        details: "Report criado. Situação: OK. Ressoldagem concluída e teste em bancada aprovado.",
        userName: "Juliana Fernandes",
        createdAt: twoDaysAgo,
      },
    ],
  },
  {
    id: 2,
    nome: "Compressor Scroll",
    serialNumber: "DAI-CP-33109",
    fabricante: "Daikin",
    localidade: "Itajaí/SC",
    tecnicoResponsavel: "Ricardo Alves",
    dataChegada: twoDaysAgo,
    situacaoAtual: "Em reparo - Estoque",
    qc: "DAI-02-2026",
    createdAt: twoDaysAgo,
    history: [
      {
        id: "hist-003",
        action: "created",
        details: "Entrada da peça registrada no almoxarifado",
        userName: "Mariana Costa",
        createdAt: twoDaysAgo,
      },
    ],
  },
  {
    id: 3,
    nome: "Válvula de Expansão Eletrônica",
    serialNumber: "SC-EEV-77124",
    fabricante: "Star Cool",
    localidade: "Paranaguá/PR",
    tecnicoResponsavel: "Eduardo Lima",
    dataChegada: threeDaysAgo,
    situacaoAtual: "OK",
    qc: "STA-03-2026",
    createdAt: threeDaysAgo,
    reports: [
      {
        id: "rep-002",
        responsavelReparo: "Eduardo Lima",
        descricaoReparo: "Limpeza ultra-sônica, aferição do motor de passo e vedação.",
        situacaoAtual: "OK",
        ordemServico: "10492",
        createdAt: oneDayAgo,
      },
    ],
    history: [
      {
        id: "hist-004",
        action: "created",
        details: "Entrada registrada",
        userName: "Mariana Costa",
        createdAt: threeDaysAgo,
      },
    ],
  },
  {
    id: 4,
    nome: "Carregador de Bateria",
    serialNumber: "CAR-PW-55018",
    fabricante: "Carrier",
    localidade: "Santos/SP",
    tecnicoResponsavel: "Juliana Fernandes",
    dataChegada: twoDaysAgo,
    situacaoAtual: "OK",
    qc: "CAR-04-2026",
    createdAt: twoDaysAgo,
    reports: [
      {
        id: "rep-003",
        responsavelReparo: "Juliana Fernandes",
        descricaoReparo: "Substituição do fusível de proteção e teste de carga em bateria de teste.",
        situacaoAtual: "OK",
        ordemServico: "10505",
        createdAt: oneDayAgo,
      },
    ],
  },
  {
    id: 5,
    nome: "Motor do Evaporador",
    serialNumber: "TK-MOT-12890",
    fabricante: "Thermo King",
    localidade: "Manaus/AM",
    tecnicoResponsavel: "Eduardo Lima",
    dataChegada: twoDaysAgo,
    situacaoAtual: "Sem condições de reparo",
    qc: "THE-05-2026",
    createdAt: twoDaysAgo,
    reports: [
      {
        id: "rep-004",
        responsavelReparo: "Eduardo Lima",
        descricaoReparo: "Curto-circuito interno com queima total do enrolamento estatórico e deformação do eixo.",
        situacaoAtual: "Sem condições de reparo",
        ordemServico: "10512",
        createdAt: oneDayAgo,
      },
    ],
  },
  {
    id: 6,
    nome: "Sensor de Temperatura",
    serialNumber: "DAI-SN-90142",
    fabricante: "Daikin",
    localidade: "Itapoa/SC",
    tecnicoResponsavel: "Helio",
    dataChegada: oneDayAgo,
    situacaoAtual: "Em reparo - Devolver para o mesmo",
    qc: "DAI-06-2026",
    createdAt: oneDayAgo,
  },
  {
    id: 7,
    nome: "Transformador",
    serialNumber: "CAR-TR-66321",
    fabricante: "Carrier",
    localidade: "Belém/PA",
    tecnicoResponsavel: "Eduardo Lima",
    dataChegada: threeDaysAgo,
    situacaoAtual: "OK",
    qc: "CAR-07-2026",
    createdAt: threeDaysAgo,
    reports: [
      {
        id: "rep-005",
        responsavelReparo: "Eduardo Lima",
        descricaoReparo: "Isolação testada com megômetro, tensão de secundário aferida em 24.1V AC.",
        situacaoAtual: "OK",
        ordemServico: "10520",
        resistencia: "4.2 Ω",
        transformador: "24.1 V AC",
        createdAt: oneDayAgo,
      },
    ],
  },
  {
    id: 8,
    nome: "Display MicroLink 3",
    serialNumber: "CAR-KB-88192",
    fabricante: "Carrier",
    localidade: "Santos/SP",
    tecnicoResponsavel: "Mariana Costa",
    dataChegada: twoDaysAgo,
    situacaoAtual: "Entregue para: Roberto Silveira",
    qc: "CAR-08-2026",
    createdAt: twoDaysAgo,
  },
];

const initialSeedStandaloneReports: StandaloneReport[] = [
  {
    id: "standalone-001",
    fabricante: "Carrier",
    ordemServico: "10530",
    nomePeca: "Controlador MicroLink 2i",
    descricaoReparo: "Troca do cristal oscilador de clock e teste de comunicação serial.",
    responsavelReparo: "Juliana Fernandes",
    tecnicoResponsavel: "Juliana Fernandes",
    situacaoAtual: "OK",
    createdAt: oneDayAgo,
  },
  {
    id: "standalone-002",
    fabricante: "Daikin",
    ordemServico: "10531",
    nomePeca: "Compressor Scroll",
    descricaoReparo: "Substituição do anel guia e bucha excêntrica com teste de pressurização em 350 Psi.",
    responsavelReparo: "Ricardo Alves",
    tecnicoResponsavel: "Ricardo Alves",
    situacaoAtual: "OK",
    inspeçãoVisual: "BIELA / BUCHA / PISTÕES",
    analiseMecanica: "Anel Guia do SCROLL / Bucha Exêntrica",
    testeFuncionamento: "Pressurização / 320 Psi à 400 Psi",
    createdAt: twoDaysAgo,
  },
  {
    id: "standalone-003",
    fabricante: "Thermo King",
    ordemServico: "10532",
    nomePeca: "Transformador",
    descricaoReparo: "Rebobinamento secundário concluído com verniz eletroisolante e secagem em estufa.",
    responsavelReparo: "Eduardo Lima",
    tecnicoResponsavel: "Eduardo Lima",
    situacaoAtual: "OK",
    resistencia: "3.8 Ω",
    mega: "500 Ω",
    transformador: "24.0 V AC",
    createdAt: oneDayAgo,
  },
];

const initialSeedChamados: ChamadoDocument[] = [
  {
    id: 1,
    titulo: "Alarme AL24 intermitente em container Carrier",
    descricao: "Sensor de temperatura de sucção apresentando leitura instável durante teste PTI no terminal. Necessário inspeção em bancada.",
    status: "aberto",
    pedidoPor: "Carlos Mendes",
    criadoEm: twoDaysAgo,
    history: [
      {
        id: "cham-hist-001",
        action: "created",
        details: "Chamado Aberto",
        userName: "Carlos Mendes",
        criadoEm: twoDaysAgo,
      },
    ],
  },
  {
    id: 2,
    titulo: "Revisão e limpeza de banco de capacitores",
    descricao: "Manutenção preventiva em 5 placas MicroLink recebidas do lote de devolução do armazém.",
    status: "ok",
    pedidoPor: "Juliana Fernandes",
    criadoEm: threeDaysAgo,
    history: [
      {
        id: "cham-hist-002",
        action: "created",
        details: "Chamado Aberto",
        userName: "Juliana Fernandes",
        criadoEm: threeDaysAgo,
      },
      {
        id: "cham-hist-003",
        action: "updated",
        details: "Status alterado para OK após inspeção e substituição dos capacitores estufados.",
        userName: "Juliana Fernandes",
        criadoEm: oneDayAgo,
      },
    ],
  },
  {
    id: 3,
    titulo: "Vazamento de óleo em retentor de compressor Daikin",
    descricao: "Detectado vazamento excessivo na vedação durante teste sob pressão. Aguardando junta e selo novos.",
    status: "naoRealizado",
    pedidoPor: "Ricardo Alves",
    criadoEm: oneDayAgo,
  },
];

const initialSeedPedidos: PedidoDocument[] = [
  {
    id: 1,
    setor: "labeletronica",
    setorLabel: "Laboratório de Eletrônica",
    observacao: "Peças para montagem imediata de controladores MicroLink para atendimento do porto.",
    dataAte: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
    itens: [
      {
        nome: "Carregador de Bateria",
        quantidadeSolicitada: 1,
        quantidadeDisponivel: 1,
        estoqueInsuficiente: false,
      },
      {
        nome: "Controlador MicroLink 3 (Yellow Label)",
        quantidadeSolicitada: 1,
        quantidadeDisponivel: 1,
        estoqueInsuficiente: false,
      },
    ],
    estoqueInsuficiente: false,
    status: "pendente",
    solicitante: "Juliana Fernandes",
    createdAt: twoDaysAgo,
  },
  {
    id: 2,
    setor: "labeletrica",
    setorLabel: "Laboratório de Elétrica",
    observacao: "Transformador para reposição na bancada de ensaios elétricos.",
    dataAte: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
    itens: [
      {
        nome: "Transformador",
        quantidadeSolicitada: 1,
        quantidadeDisponivel: 2,
        estoqueInsuficiente: false,
      },
    ],
    estoqueInsuficiente: false,
    status: "atendido",
    solicitante: "Eduardo Lima",
    createdAt: threeDaysAgo,
    resposta: {
      viavel: true,
      comentario: "Peça separada e disponibilizada na prateleira de entrega do almoxarifado.",
      respondidoPor: "Mariana Costa",
      respondidoEm: oneDayAgo,
    },
  },
];

const initialSeedNotifications: NotificationDocument[] = [
  {
    id: "notif-001",
    message: "Juliana Fernandes criou um pedido de peças para Laboratório de Eletrônica.",
    actorName: "Juliana Fernandes",
    actorRole: "lab.eletronica",
    createdAt: twoDaysAgo,
    readBy: [],
    type: "pedido",
  },
  {
    id: "notif-002",
    message: "Eduardo Lima enviou um relatório para a peça QC CAR-07-2026.",
    actorName: "Eduardo Lima",
    actorRole: "lab.elétrica",
    createdAt: oneDayAgo,
    readBy: [],
    type: "report",
  },
  {
    id: "notif-003",
    message: "Ricardo Alves enviou um relatório sem QC (OS 10531).",
    actorName: "Ricardo Alves",
    actorRole: "cereco",
    createdAt: twoDaysAgo,
    readBy: [],
    type: "report",
  },
];

function createFreshDatabase(): LocalDatabase {
  return {
    pieces: JSON.parse(JSON.stringify(initialSeedPieces)),
    standaloneReports: JSON.parse(JSON.stringify(initialSeedStandaloneReports)),
    chamados: JSON.parse(JSON.stringify(initialSeedChamados)),
    pedidos: JSON.parse(JSON.stringify(initialSeedPedidos)),
    users: JSON.parse(JSON.stringify(initialSeedUsers)),
    customCatalogParts: [],
    hiddenCatalogParts: [],
    notifications: JSON.parse(JSON.stringify(initialSeedNotifications)),
    sessions: {
      "demo-session-default": JSON.parse(JSON.stringify(initialSeedUsers[0])),
    },
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __reeferLocalDb?: LocalDatabase;
};

function saveDb(db: LocalDatabase) {
  globalForDb.__reeferLocalDb = db;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    // Em ambientes serverless read-only estritos onde /tmp falha, estado em memória continua ativo
  }
}

function loadDb(): LocalDatabase {
  if (globalForDb.__reeferLocalDb) {
    return globalForDb.__reeferLocalDb;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(content) as LocalDatabase;
      if (Array.isArray(parsed.pieces) && Array.isArray(parsed.users)) {
        globalForDb.__reeferLocalDb = parsed;
        return parsed;
      }
    }
  } catch (err) {
    // Fallback para novo seed se o arquivo estiver corrompido
  }

  const fresh = createFreshDatabase();
  saveDb(fresh);
  return fresh;
}

export const localStore = {
  resetToDemoData(): LocalDatabase {
    const fresh = createFreshDatabase();
    saveDb(fresh);
    return fresh;
  },

  // Sessions
  getSession(sessionId: string): UserDocument | null {
    const db = loadDb();
    return db.sessions[sessionId] ?? null;
  },

  setSession(sessionId: string, user: UserDocument) {
    const db = loadDb();
    db.sessions[sessionId] = user;
    saveDb(db);
  },

  deleteSession(sessionId: string) {
    const db = loadDb();
    delete db.sessions[sessionId];
    saveDb(db);
  },

  getDefaultUser(): UserDocument {
    const db = loadDb();
    return db.users[0] ?? initialSeedUsers[0];
  },

  // Pieces
  getPieces(): PieceDocument[] {
    const db = loadDb();
    return db.pieces;
  },

  getPieceById(id: number): PieceDocument | null {
    const db = loadDb();
    return db.pieces.find((p) => p.id === id) ?? null;
  },

  addPiece(piece: Omit<PieceDocument, "id">): PieceDocument {
    const db = loadDb();
    const maxId = db.pieces.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const newDoc: PieceDocument = {
      ...piece,
      id: maxId + 1,
    };
    db.pieces.push(newDoc);
    saveDb(db);
    return newDoc;
  },

  updatePiece(id: number, patch: Partial<PieceDocument>): PieceDocument | null {
    const db = loadDb();
    const index = db.pieces.findIndex((p) => p.id === id);
    if (index === -1) return null;
    db.pieces[index] = { ...db.pieces[index], ...patch, id };
    saveDb(db);
    return db.pieces[index];
  },

  deletePiece(id: number): boolean {
    const db = loadDb();
    const initialLen = db.pieces.length;
    db.pieces = db.pieces.filter((p) => p.id !== id);
    if (db.pieces.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Piece Reports
  addPieceReport(pieceId: number, report: PieceReport, updatedStatus?: string): { piece: PieceDocument; report: PieceReport } | null {
    const db = loadDb();
    const index = db.pieces.findIndex((p) => p.id === pieceId);
    if (index === -1) return null;
    const piece = db.pieces[index];
    const reports = [...(piece.reports ?? []), report];
    const history: PieceHistory = {
      id: randomUUID(),
      action: "report",
      details: `Report criado. Situação: ${report.situacaoAtual}${report.descricaoReparo ? `. Descrição: ${report.descricaoReparo}` : ""}`,
      userName: report.responsavelReparo,
      createdAt: report.createdAt,
    };
    const updatedPiece: PieceDocument = {
      ...piece,
      situacaoAtual: updatedStatus ?? report.situacaoAtual,
      reports,
      history: [...(piece.history ?? []), history],
    };
    db.pieces[index] = updatedPiece;
    saveDb(db);
    return { piece: updatedPiece, report };
  },

  deletePieceReport(pieceId: number, reportId: string): boolean {
    const db = loadDb();
    const index = db.pieces.findIndex((p) => p.id === pieceId);
    if (index === -1) return false;
    const piece = db.pieces[index];
    const filtered = (piece.reports ?? []).filter((r) => r.id !== reportId);
    if (filtered.length !== (piece.reports?.length ?? 0)) {
      db.pieces[index] = { ...piece, reports: filtered };
      saveDb(db);
      return true;
    }
    return false;
  },

  // Standalone Reports
  getStandaloneReports(): StandaloneReport[] {
    const db = loadDb();
    return db.standaloneReports;
  },

  addStandaloneReports(reports: StandaloneReport[]) {
    const db = loadDb();
    db.standaloneReports.push(...reports);
    saveDb(db);
    return reports;
  },

  updateStandaloneReport(id: string, patch: Partial<StandaloneReport>): StandaloneReport | null {
    const db = loadDb();
    const index = db.standaloneReports.findIndex((r) => r.id === id);
    if (index === -1) return null;
    db.standaloneReports[index] = { ...db.standaloneReports[index], ...patch, id };
    saveDb(db);
    return db.standaloneReports[index];
  },

  deleteStandaloneReport(id: string): boolean {
    const db = loadDb();
    const initialLen = db.standaloneReports.length;
    db.standaloneReports = db.standaloneReports.filter((r) => r.id !== id);
    if (db.standaloneReports.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Chamados
  getChamados(): ChamadoDocument[] {
    const db = loadDb();
    return db.chamados;
  },

  getChamadoById(id: number): ChamadoDocument | null {
    const db = loadDb();
    return db.chamados.find((c) => c.id === id) ?? null;
  },

  addChamado(chamado: Omit<ChamadoDocument, "id">): ChamadoDocument {
    const db = loadDb();
    const maxId = db.chamados.reduce((max, c) => Math.max(max, c.id || 0), 0);
    const newDoc: ChamadoDocument = {
      ...chamado,
      id: maxId + 1,
    };
    db.chamados.push(newDoc);
    saveDb(db);
    return newDoc;
  },

  updateChamado(id: number, patch: Partial<ChamadoDocument>): ChamadoDocument | null {
    const db = loadDb();
    const index = db.chamados.findIndex((c) => c.id === id);
    if (index === -1) return null;
    db.chamados[index] = { ...db.chamados[index], ...patch, id };
    saveDb(db);
    return db.chamados[index];
  },

  deleteChamado(id: number): boolean {
    const db = loadDb();
    const initialLen = db.chamados.length;
    db.chamados = db.chamados.filter((c) => c.id !== id);
    if (db.chamados.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Pedidos
  getPedidos(): PedidoDocument[] {
    const db = loadDb();
    return db.pedidos;
  },

  getPedidoById(id: number): PedidoDocument | null {
    const db = loadDb();
    return db.pedidos.find((p) => p.id === id) ?? null;
  },

  addPedido(pedido: Omit<PedidoDocument, "id">): PedidoDocument {
    const db = loadDb();
    const maxId = db.pedidos.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const newDoc: PedidoDocument = {
      ...pedido,
      id: maxId + 1,
    };
    db.pedidos.push(newDoc);
    saveDb(db);
    return newDoc;
  },

  updatePedidoResposta(id: number, resposta: PedidoResposta): PedidoDocument | null {
    const db = loadDb();
    const index = db.pedidos.findIndex((p) => p.id === id);
    if (index === -1) return null;
    db.pedidos[index] = { ...db.pedidos[index], resposta };
    saveDb(db);
    return db.pedidos[index];
  },

  deletePedido(id: number): boolean {
    const db = loadDb();
    const initialLen = db.pedidos.length;
    db.pedidos = db.pedidos.filter((p) => p.id !== id);
    if (db.pedidos.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Users
  getUsers(): UserDocument[] {
    const db = loadDb();
    return db.users;
  },

  getUserById(id: string): UserDocument | null {
    const db = loadDb();
    return db.users.find((u) => u._id === id) ?? null;
  },

  getUserByEmail(email: string): UserDocument | null {
    const db = loadDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  addUser(user: Omit<UserDocument, "_id" | "createdAt" | "updatedAt">): UserDocument {
    const db = loadDb();
    const now = new Date().toISOString();
    const newDoc: UserDocument = {
      ...user,
      _id: `user-${randomUUID().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(newDoc);
    saveDb(db);
    return newDoc;
  },

  updateUser(id: string, patch: Partial<UserDocument>): UserDocument | null {
    const db = loadDb();
    const index = db.users.findIndex((u) => u._id === id);
    if (index === -1) return null;
    db.users[index] = {
      ...db.users[index],
      ...patch,
      _id: id,
      updatedAt: new Date().toISOString(),
    };
    // Atualiza eventuais sessões ativas com esse usuário
    for (const sid of Object.keys(db.sessions)) {
      if (db.sessions[sid]._id === id) {
        db.sessions[sid] = db.users[index];
      }
    }
    saveDb(db);
    return db.users[index];
  },

  deleteUser(id: string): boolean {
    const db = loadDb();
    const initialLen = db.users.length;
    db.users = db.users.filter((u) => u._id !== id);
    if (db.users.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  // Custom Catalog
  getCustomCatalogParts(fabricante?: string): CustomCatalogPart[] {
    const db = loadDb();
    if (!fabricante) return db.customCatalogParts;
    return db.customCatalogParts.filter((p) => p.fabricante === fabricante);
  },

  addCustomCatalogPart(part: Omit<CustomCatalogPart, "id" | "createdAt">): CustomCatalogPart {
    const db = loadDb();
    const newPart: CustomCatalogPart = {
      ...part,
      id: `custom-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    db.customCatalogParts.push(newPart);
    saveDb(db);
    return newPart;
  },

  deleteCustomCatalogPart(id: string): boolean {
    const db = loadDb();
    const initialLen = db.customCatalogParts.length;
    db.customCatalogParts = db.customCatalogParts.filter((p) => p.id !== id);
    if (db.customCatalogParts.length !== initialLen) {
      saveDb(db);
      return true;
    }
    return false;
  },

  hideStaticCatalogPart(fabricante: string, descricao: string) {
    const db = loadDb();
    const key = `${fabricante}::${descricao.trim().toLowerCase()}`;
    if (!db.hiddenCatalogParts.includes(key)) {
      db.hiddenCatalogParts.push(key);
      saveDb(db);
    }
  },

  getAllCatalogParts(): Array<CatalogEntry & { source: "static" | "custom"; id?: string }> {
    const db = loadDb();
    const hiddenSet = new Set(db.hiddenCatalogParts);
    const staticItems = staticCatalogParts
      .filter((p) => !hiddenSet.has(`${p.fabricante}::${p.descricao.trim().toLowerCase()}`))
      .map((p) => ({ ...p, source: "static" as const }));
    const customItems = db.customCatalogParts.map((p) => ({ ...p, source: "custom" as const, id: p.id }));
    return [...staticItems, ...customItems].sort((a, b) => a.descricao.localeCompare(b.descricao));
  },

  // Notifications
  getNotifications(userId: string, isReceiver: boolean): NotificationDocument[] {
    const db = loadDb();
    return db.notifications
      .filter((n) => {
        if (!isReceiver) {
          return n.recipientUserIds?.includes(userId);
        }
        return !n.recipientUserIds || n.recipientUserIds.includes(userId);
      })
      .slice(0, 50);
  },

  addNotification(notif: Omit<NotificationDocument, "id" | "createdAt" | "readBy">) {
    const db = loadDb();
    const newNotif: NotificationDocument = {
      ...notif,
      id: `notif-${randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    db.notifications.unshift(newNotif);
    if (db.notifications.length > 100) {
      db.notifications = db.notifications.slice(0, 100);
    }
    saveDb(db);
    return newNotif;
  },

  markNotificationRead(id: string, userId: string) {
    const db = loadDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif && !notif.readBy.includes(userId)) {
      notif.readBy.push(userId);
      saveDb(db);
    }
  },

  markAllNotificationsRead(userId: string) {
    const db = loadDb();
    for (const notif of db.notifications) {
      if (!notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
    }
    saveDb(db);
  },

  // Dashboard raw collections helper
  getDashboardCollections() {
    const db = loadDb();
    return {
      pieces: db.pieces,
      users: db.users,
      reports: db.standaloneReports,
    };
  },
};

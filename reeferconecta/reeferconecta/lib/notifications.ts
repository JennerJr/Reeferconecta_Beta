import { localStore, type NotificationDocument as StoredNotification } from "@/lib/local-store";
import { normalizeSetor } from "@/lib/catalog";

export type NotificationType = "report" | "pedido";
export type NotificationDocument = StoredNotification;

const notifiedRoles = ["enc", "almox"];

// Avisa ENC e almoxarifado quando um relatório é enviado por outro setor.
export async function notifyReportSubmitted(actorName: string, actorRole: string, message: string) {
  if (notifiedRoles.includes(actorRole.trim().toLowerCase())) return;
  localStore.addNotification({
    message,
    actorName,
    actorRole,
    type: "report",
  });
}

// Consolida o envio de vários relatórios de uma vez em uma única notificação.
export async function notifyBatchReportsSubmitted(actorName: string, actorRole: string, count: number) {
  await notifyReportSubmitted(actorName, actorRole, `${actorName} enviou ${count} relatórios.`);
}

// Avisa ENC e almoxarifado quando um novo pedido de peças é criado.
export async function notifyPedidoCreated(actorName: string, actorRole: string, message: string) {
  localStore.addNotification({
    message,
    actorName,
    actorRole,
    type: "pedido",
  });
}

export async function notifyUser(
  userId: string,
  message: string,
  actorName: string,
  actorRole: string,
  type?: NotificationType,
) {
  localStore.addNotification({
    message,
    actorName,
    actorRole,
    type,
    recipientUserIds: [userId],
  });
}

// Avisa individualmente cada pessoa do setor informado quando um pedido é criado para esse setor.
export async function notifySectorUsers(
  setor: string,
  message: string,
  actorName: string,
  actorRole: string,
  excludeUserId?: string,
) {
  const users = localStore.getUsers();
  const recipientIds = users
    .filter((candidate) => normalizeSetor(String(candidate.role)) === setor && candidate._id !== excludeUserId)
    .map((candidate) => candidate._id);

  await Promise.all(recipientIds.map((userId) => notifyUser(userId, message, actorName, actorRole, "pedido")));
}

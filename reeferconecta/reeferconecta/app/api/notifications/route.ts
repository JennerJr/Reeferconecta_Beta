import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { canReceiveReportNotifications } from "@/lib/authorization";
import { localStore } from "@/lib/local-store";
import { notifyBatchReportsSubmitted } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });

    const isReceiver = canReceiveReportNotifications(user.role);
    const notifications = localStore.getNotifications(user._id, isReceiver).map((notif) => ({
      id: notif.id,
      message: notif.message,
      createdAt: notif.createdAt,
      read: notif.readBy.includes(user._id),
      type: notif.type,
    }));

    const unreadCount = notifications.filter((n) => !n.read).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Não foi possível carregar as notificações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });

    const input = (await request.json()) as { count?: number };
    const count = Number(input.count);
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
    }

    await notifyBatchReportsSubmitted(user.name.trim(), user.role, count);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/notifications]", error);
    return NextResponse.json({ error: "Não foi possível registrar a notificação" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });

    const input = (await request.json()) as { id?: string; all?: boolean };
    if (input.all) {
      localStore.markAllNotificationsRead(user._id);
    } else if (input.id) {
      localStore.markNotificationRead(input.id, user._id);
    } else {
      return NextResponse.json({ error: "Informe o id da notificação ou all" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/notifications]", error);
    return NextResponse.json({ error: "Não foi possível atualizar as notificações" }, { status: 500 });
  }
}

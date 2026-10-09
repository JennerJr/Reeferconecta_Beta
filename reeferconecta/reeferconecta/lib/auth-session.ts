import { cookies } from "next/headers";
import { localStore, type UserDocument } from "@/lib/local-store";

const sessionCookie = "reeferconecta_session";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  primaryRole?: string;
  imageUrl: string;
};

export async function createSession(user: AuthUser) {
  const sessionId = `session-${user._id}-${Date.now()}`;
  localStore.setSession(sessionId, {
    ...user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(sessionCookie)?.value;
    if (sessionId) {
      const user = localStore.getSession(sessionId);
      if (user) {
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          primaryRole: user.primaryRole,
          imageUrl: user.imageUrl,
        };
      }
    }
  } catch {
    // Falha silenciosa em contextos estáticos
  }

  // Fallback demo user — SemLogin: sempre retorna o usuário demo administrativo se não houver cookie
  const defaultUser = localStore.getDefaultUser();
  return {
    _id: defaultUser._id,
    name: defaultUser.name,
    email: defaultUser.email,
    role: defaultUser.role,
    primaryRole: defaultUser.primaryRole,
    imageUrl: defaultUser.imageUrl,
  };
}

export async function updateSessionUser(user: AuthUser) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(sessionCookie)?.value;
    if (sessionId) {
      localStore.setSession(sessionId, {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    localStore.updateUser(user._id, user);
  } catch {
    // Ignore
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(sessionCookie)?.value;
    if (sessionId) {
      localStore.deleteSession(sessionId);
    }
    cookieStore.delete(sessionCookie);
  } catch {
    // Ignore
  }
}
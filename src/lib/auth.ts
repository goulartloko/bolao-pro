import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
export type UserRole = "ADMIN" | "PLAYER";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "bolao_secret_fallback_key_2026";
export const AUTH_COOKIE_NAME = "bolao_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pixKey?: string | null;
  pixKeyType?: string | null;
  avatar?: string | null;
  favoriteTeam?: string | null;
}

// Criptografia de Senha
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Geração e Validação de Token JWT
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Obter usuário da sessão atual nos Server Components / Server Actions / API Routes
export async function getCurrentUser(customToken?: string): Promise<SafeUser | null> {
  try {
    let token = customToken;
    if (!token) {
      try {
        const cookieStore = cookies();
        token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
      } catch {
        // cookies() indisponível fora do request scope
      }
    }

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return null;
    }

    let user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        pixKey: true,
        pixKeyType: true,
        avatar: true,
        favoriteTeam: true,
      },
    });

    if (!user && payload.email) {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          pixKey: true,
          pixKeyType: true,
          avatar: true,
          favoriteTeam: true,
        },
      });
    }

    return user as SafeUser | null;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

// Helper para validar permissão de Admin
export async function requireAdmin(customToken?: string): Promise<SafeUser> {
  const user = await getCurrentUser(customToken);
  if (!user || user.role !== "ADMIN") {
    throw new Error("Acesso não autorizado. Apenas administradores podem realizar esta ação.");
  }
  return user;
}

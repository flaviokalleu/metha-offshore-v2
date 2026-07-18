import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET as string;

export type AuthUser = {
  id: string;
  email: string;
  perfil: string;
  nome: string;
};

export function signAccessToken(user: AuthUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyAccessToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifyAccessToken(header.slice(7));
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) throw new ApiError(401, "Token obrigatório ou inválido");
  return user;
}

export function requireAdmin(req: NextRequest): AuthUser {
  const user = requireAuth(req);
  if (user.perfil !== "admin") throw new ApiError(403, "Acesso restrito a administradores");
  return user;
}

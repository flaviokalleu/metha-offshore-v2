import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req) => {
  requireAuth(req);
  const { refresh_token } = await req.json().catch(() => ({}));
  if (refresh_token) {
    await prisma.refreshToken.updateMany({ where: { token: refresh_token }, data: { revogado: true } });
  }
  return NextResponse.json({ message: "Sessão encerrada" });
});

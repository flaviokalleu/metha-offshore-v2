import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (req) => {
  requireAuth(req);
  const rows = await prisma.manobraCatalogo.findMany({
    where: { ativa: true },
    orderBy: [{ modulo: "asc" }, { ordem: "asc" }],
  });
  return NextResponse.json(rows);
});

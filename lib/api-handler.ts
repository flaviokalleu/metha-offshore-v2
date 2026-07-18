import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Bloqueia alterações quando a ADF já foi fechada (status finalizada). */
export async function assertAdfAberta(adfId: string) {
  const adf = await prisma.adf.findUnique({ where: { id: adfId }, select: { status: true } });
  if (!adf) throw new ApiError(404, "ADF não encontrada");
  if (adf.status === "finalizada") throw new ApiError(403, "ADF fechada. Reabra a ADF para fazer alterações.");
}

type Handler = (req: NextRequest, ctx: any) => Promise<NextResponse>;

export function withErrorHandling(handler: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ error: "Registro já existe (violação de unicidade)" }, { status: 409 });
      }
      console.error(e);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  };
}

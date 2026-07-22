-- CreateTable
CREATE TABLE "termos_instrutores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrutorId" TEXT NOT NULL,
    "cidade" TEXT NOT NULL DEFAULT 'Rio de Janeiro',
    "assinaturaImg" TEXT,
    "assinadoEm" DATETIME,
    "enviadoEm" DATETIME,
    "atualizadoEm" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "termos_instrutores_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "instrutores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "termos_instrutores_instrutorId_key" ON "termos_instrutores"("instrutorId");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_adf_candidatos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT NOT NULL,
    "candidatoNome" TEXT NOT NULL,
    "candidatoRegistroTmc" TEXT NOT NULL,
    "candidatoEmail" TEXT,
    "nivelIrata" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "resultado" TEXT,
    "aprovado" BOOLEAN,
    "qtdDiscLeves" INTEGER NOT NULL DEFAULT 0,
    "qtdDiscGraves" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "assinaturaCandidato" TEXT,
    "assinaturaCandidatoEm" DATETIME,
    "assinaturaInstrutor" TEXT,
    "assinaturaInstrutorEm" DATETIME,
    "cienciaDocumentos" BOOLEAN NOT NULL DEFAULT false,
    "cienciaDocumentosEm" DATETIME,
    "finalizadaEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "adf_candidatos_adfId_fkey" FOREIGN KEY ("adfId") REFERENCES "adfs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_adf_candidatos" ("adfId", "aprovado", "assinaturaCandidato", "assinaturaCandidatoEm", "assinaturaInstrutor", "assinaturaInstrutorEm", "atualizadoEm", "candidatoEmail", "candidatoNome", "candidatoRegistroTmc", "cienciaDocumentos", "cienciaDocumentosEm", "criadoEm", "finalizadaEm", "id", "nivelIrata", "qtdDiscGraves", "qtdDiscLeves", "resultado", "status") SELECT "adfId", "aprovado", "assinaturaCandidato", "assinaturaCandidatoEm", "assinaturaInstrutor", "assinaturaInstrutorEm", "atualizadoEm", "candidatoEmail", "candidatoNome", "candidatoRegistroTmc", "cienciaDocumentos", "cienciaDocumentosEm", "criadoEm", "finalizadaEm", "id", "nivelIrata", "qtdDiscGraves", "qtdDiscLeves", "resultado", "status" FROM "adf_candidatos";
DROP TABLE "adf_candidatos";
ALTER TABLE "new_adf_candidatos" RENAME TO "adf_candidatos";
CREATE TABLE "new_adfs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroAdf" TEXT NOT NULL,
    "associacaoId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataTermino" DATETIME NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "instrutorAuxiliarId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "adfs_associacaoId_fkey" FOREIGN KEY ("associacaoId") REFERENCES "associacoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adfs_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "instrutores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adfs_instrutorAuxiliarId_fkey" FOREIGN KEY ("instrutorAuxiliarId") REFERENCES "instrutores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adfs_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_adfs" ("associacaoId", "atualizadoEm", "criadoEm", "criadoPor", "dataInicio", "dataTermino", "id", "instrutorAuxiliarId", "instrutorId", "numeroAdf", "status") SELECT "associacaoId", "atualizadoEm", "criadoEm", "criadoPor", "dataInicio", "dataTermino", "id", "instrutorAuxiliarId", "instrutorId", "numeroAdf", "status" FROM "adfs";
DROP TABLE "adfs";
ALTER TABLE "new_adfs" RENAME TO "adfs";
CREATE UNIQUE INDEX "adfs_numeroAdf_key" ON "adfs"("numeroAdf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "associacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "instrutores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "registroIrata" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "registroIrata" TEXT,
    "instrutorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "tentativasLogin" INTEGER NOT NULL DEFAULT 0,
    "ultimoLogin" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpira" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "usuarios_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "instrutores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEm" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "adfs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroAdf" TEXT NOT NULL,
    "associacaoId" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataTermino" DATETIME NOT NULL,
    "instrutorId" TEXT NOT NULL,
    "instrutorAuxiliarId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "criadoPor" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "adfs_associacaoId_fkey" FOREIGN KEY ("associacaoId") REFERENCES "associacoes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adfs_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "instrutores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "adfs_instrutorAuxiliarId_fkey" FOREIGN KEY ("instrutorAuxiliarId") REFERENCES "instrutores" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "adfs_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "adf_candidatos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT NOT NULL,
    "candidatoNome" TEXT NOT NULL,
    "candidatoRegistroTmc" TEXT NOT NULL,
    "candidatoEmail" TEXT,
    "nivelIrata" INTEGER NOT NULL,
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

-- CreateTable
CREATE TABLE "discrepancias_catalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "manobras_catalogo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modulo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoN1" TEXT NOT NULL DEFAULT 'na',
    "tipoN2" TEXT NOT NULL DEFAULT 'na',
    "tipoN3" TEXT NOT NULL DEFAULT 'na',
    "ativa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "avaliacoes_manobras" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidatoId" TEXT NOT NULL,
    "manobraId" TEXT NOT NULL,
    "avaliado" BOOLEAN NOT NULL DEFAULT false,
    "discTipo" TEXT,
    "discCodigos" TEXT,
    "discObservacao" TEXT,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "avaliacoes_manobras_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "adf_candidatos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_manobras_manobraId_fkey" FOREIGN KEY ("manobraId") REFERENCES "manobras_catalogo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "presencas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "diaSemana" TEXT NOT NULL,
    "dataDia" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacao" TEXT,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "presencas_adfId_fkey" FOREIGN KEY ("adfId") REFERENCES "adfs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "presencas_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "adf_candidatos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "briefings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT NOT NULL,
    "itensConfirmados" TEXT NOT NULL DEFAULT '[false,false,false,false,false,false,false,false,false,false,false,false,false]',
    "temasAbordados" TEXT,
    "observacoes" TEXT,
    "assinaturasCandidatos" TEXT NOT NULL DEFAULT '[]',
    "instrutorAssinatura" TEXT,
    "instrutorAssinadoEm" DATETIME,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "briefings_adfId_fkey" FOREIGN KEY ("adfId") REFERENCES "adfs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidentes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT NOT NULL,
    "tipoOcorrencia" TEXT NOT NULL,
    "relato" TEXT NOT NULL,
    "origem" TEXT,
    "medidaAdotada" TEXT,
    "comunicadoDirecao" BOOLEAN NOT NULL DEFAULT false,
    "dataComunicado" DATETIME,
    "assinaturaInstrutor" TEXT,
    "assinaturaCandidato" TEXT,
    "direcaoTipoCorrecao" TEXT,
    "direcaoRelato" TEXT,
    "direcaoData" DATETIME,
    "direcaoCoordenador" TEXT,
    "criadoPor" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "incidentes_adfId_fkey" FOREIGN KEY ("adfId") REFERENCES "adfs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "incidentes_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adfId" TEXT,
    "candidatoId" TEXT,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT,
    "justificativa" TEXT,
    "dadosAnteriores" TEXT,
    "ipAddress" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_adfId_fkey" FOREIGN KEY ("adfId") REFERENCES "adfs" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_log_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "adf_candidatos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "instrutores_registroIrata_key" ON "instrutores"("registroIrata");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_registroIrata_key" ON "usuarios"("registroIrata");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "adfs_numeroAdf_key" ON "adfs"("numeroAdf");

-- CreateIndex
CREATE UNIQUE INDEX "discrepancias_catalogo_tipo_codigo_key" ON "discrepancias_catalogo"("tipo", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_manobras_candidatoId_manobraId_key" ON "avaliacoes_manobras"("candidatoId", "manobraId");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_candidatoId_diaSemana_key" ON "presencas"("candidatoId", "diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "briefings_adfId_key" ON "briefings"("adfId");

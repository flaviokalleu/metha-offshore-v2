-- AlterTable
ALTER TABLE "incidentes" ADD COLUMN "responsavelNome" TEXT;

-- AlterTable
ALTER TABLE "presencas" ADD COLUMN "assinatura" TEXT;
ALTER TABLE "presencas" ADD COLUMN "assinaturaEm" DATETIME;

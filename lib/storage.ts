import { mkdirSync } from "node:fs";
import path from "node:path";

// Usa o mesmo diretório persistente do volume Docker (/app/data em produção).
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const DOCUMENTOS_DIR = path.join(DATA_DIR, "documentos");

export function ensureDocumentosDir() {
  mkdirSync(DOCUMENTOS_DIR, { recursive: true });
}

export function documentoPath(arquivoNome: string) {
  return path.join(DOCUMENTOS_DIR, arquivoNome);
}

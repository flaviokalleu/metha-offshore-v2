import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const discrepancias: { tipo: string; codigo: string; descricao: string }[] = [
  ["leve", "L-a", "Dispositivo de descida não travado ou sem controle do cabo de cauda"],
  ["leve", "L-b", "Conectores de fixação não fixados"],
  ["leve", "L-c", "Queda de equipamentos críticos de proteção pessoal contra quedas"],
  ["leve", "L-d", "Proteção de corda colocada incorretamente"],
  ["leve", "L-e", "Nenhum mosquetão de frenagem usado quando necessário"],
  ["leve", "L-f", "Arnês ajustado incorretamente"],
  ["leve", "L-g", "Faixa de queixo do capacete desabotoada"],
  ["leve", "L-h", "Falta de equipamento crítico de proteção individual na configuração do arnês"],
  ["leve", "L-i", "Emaranhados de cordas"],
  ["leve", "L-j", "Gestão insatisfatória do dispositivo de apoio"],
  ["leve", "L-k", "Talabartes de posicionamento acima do fator de queda 1"],
  ["leve", "L-l", "Folga excessiva em relação a dispositivo de subida como ponto de fixação"],
  ["leve", "L-m", "Tempo considerável gasto para executar a tarefa"],
  ["leve", "L-n", "Técnicas não convencionais ou não treinadas usadas"],
  ["leve", "L-o", "Um pequeno balanço fora de controle"],
  ["leve", "L-p", "Obtenção >= 50% mas < 70% no Exame Teórico (N3 apenas)"],
  ["grave", "G-a", "Apenas um ponto de fixação de segurança durante a suspensão"],
  ["grave", "G-b", "Incapaz de completar a tarefa"],
  ["grave", "G-c", "Período de tempo excessivo"],
  ["grave", "G-d", "Nenhum apoio para proteger contra potencial balanço fora de controle"],
  ["grave", "G-e", "Arnês não seguro"],
  ["grave", "G-f", "Talabartes de ancoragem amarrados ou presos perigosamente"],
  ["grave", "G-g", "Sem capacete em altura"],
  ["grave", "G-h", "Conectores de arnês críticos soltos (elos de parafuso / malhas rápidas)"],
  ["grave", "G-i", "Uso indevido causando danos ao equipamento"],
  ["grave", "G-j", "Escolha inadequada de medidas de proteção de corda"],
  ["grave", "G-k", "Descida descontrolada durante o resgate"],
  ["grave", "G-l", "Dispositivo descendente rosqueado incorretamente e usado dessa maneira"],
  ["grave", "G-m", "Apoios ou dispositivos usados de cabeça para baixo"],
  ["grave", "G-n", "Nenhum acessório de segurança perto de uma borda exposta"],
  ["grave", "G-o", "Folga excessiva em dispositivo de subida como ponto de fixação"],
  ["grave", "G-p", "Questões críticas de segurança"],
  ["grave", "G-q", "Balanço que possa causar ferimentos ao pessoal ou danos ao equipamento"],
  ["grave", "G-r", "Obter menos de 50% no exame teórico (N3 apenas)"],
].map(([tipo, codigo, descricao]) => ({ tipo, codigo, descricao }));

type Manobra = {
  modulo: string;
  ordem: number;
  nome: string;
  tipoN1: string;
  tipoN2: string;
  tipoN3: string;
};

const manobras: Manobra[] = [
  ["Planejamento e Gestão", 1, "Avaliação teórica nível 1", "branca", "na", "na"],
  ["Planejamento e Gestão", 2, "Avaliação teórica nível 2", "na", "branca", "na"],
  ["Planejamento e Gestão", 3, "Avaliação teórica nível 3", "na", "na", "branca"],
  ["Planejamento e Gestão", 4, "Identificação de perigo e análise de risco", "branca", "branca", "branca"],
  ["Planejamento e Gestão", 5, "Planejamento de acesso e resgate", "branca", "branca", "branca"],
  ["Equipamento", 1, "Seleção, cuidado e manutenção do equipamento", "branca", "branca", "branca"],
  ["Equipamento", 2, "Check de pré-uso dos equipamentos", "branca", "branca", "branca"],
  ["Equipamento", 3, "Montagem dos equipamentos e duplo check", "branca", "branca", "branca"],
  ["Equipamento", 4, "Inspeção dos equipamentos", "branca", "branca", "branca"],
  ["Montagem de Acesso", 1, "Seleção de ancoragem", "branca", "branca", "branca"],
  ["Montagem de Acesso", 2, "Nós e manuseio de cordas", "branca", "branca", "branca"],
  ["Montagem de Acesso", 3, "Sistema básico de ancoragem", "branca", "branca", "branca"],
  ["Montagem de Acesso", 4, "Ancoragem Y (N1 curta, N2/N3 longa)", "branca", "branca", "branca"],
  ["Montagem de Acesso", 5, "Prevenção de perigos e proteção de cordas", "branca", "branca", "branca"],
  ["Montagem de Acesso", 6, "Re-ancoragem", "cinza", "branca", "branca"],
  ["Montagem de Acesso", 7, "Desvios", "cinza", "branca", "branca"],
  ["Montagem de Acesso", 8, "Montagem recuperável (salva corda)", "cinza", "branca", "branca"],
  ["Montagem de Acesso", 9, "Trabalho com linhas de retenção", "cinza", "branca", "branca"],
  ["Montagem de Acesso", 10, "Sistemas de trava-queda vertical", "cinza", "branca", "branca"],
  ["Montagem de Acesso", 11, "Linhas tensionadas (tirolesa)", "cinza", "branca", "branca"],
  ["Montagem para Transporte e Resgate", 1, "Sistema de descida", "branca", "branca", "branca"],
  ["Montagem para Transporte e Resgate", 2, "Sistema de içamento", "branca", "branca", "branca"],
  ["Montagem para Transporte e Resgate", 3, "Sistema de transporte cruzado", "cinza", "branca", "branca"],
  ["Montagem para Transporte e Resgate", 4, "Sistema de resgate complexo (com equipe)", "cinza", "branca", "branca"],
  ["Manobras em Corda", 1, "Dispositivos travas-queda", "branca", "branca", "branca"],
  ["Manobras em Corda", 2, "Equipamento de back-up", "branca", "branca", "branca"],
  ["Manobras em Corda", 3, "Descensão", "branca", "branca", "branca"],
  ["Manobras em Corda", 4, "Ascensão", "branca", "branca", "branca"],
  ["Manobras em Corda", 5, "Mudança de sentido", "branca", "branca", "branca"],
  ["Manobras em Corda", 6, "Re-ancoragem (N1 curta, N2/N3 longa)", "branca", "branca", "branca"],
  ["Manobras em Corda", 7, "Descensão utilizando um ascensor", "branca", "na", "na"],
  ["Manobras em Corda", 8, "Ascensão utilizando um descensor", "branca", "na", "na"],
  ["Manobras em Corda", 9, "Desvio simples", "branca", "na", "na"],
  ["Manobras em Corda", 10, "Desvio duplo", "branca", "na", "na"],
  ["Manobras em Corda", 11, "Transferência de cordas", "branca", "na", "na"],
  ["Manobras em Corda", 12, "Passagem por nós em meio de corda", "branca", "na", "na"],
  ["Manobras em Corda", 13, "Passagem por borda de topo", "branca", "na", "na"],
  ["Manobras em Corda", 14, "Passagem por proteção em meio de corda", "branca", "na", "na"],
  ["Manobras em Corda", 15, "Uso do assento de trabalho (conforto)", "branca", "na", "na"],
  ["Técnicas de Escalada", 1, "Escalada horizontal – ancoragem fixa", "branca", "branca", "branca"],
  ["Técnicas de Escalada", 2, "Escalada horizontal – ancoragem móvel", "branca", "branca", "branca"],
  ["Técnicas de Escalada", 3, "Escalada vertical", "na", "branca", "branca"],
  ["Técnicas de Escalada", 4, "Escalada com equipamento de retenção de quedas", "branca", "branca", "branca"],
  ["Resgates em Corda", 1, "Resgate em modo de descida", "branca", "branca", "branca"],
  ["Resgates em Corda", 2, "Resgate em modo de subida", "na", "branca", "branca"],
  ["Resgates em Corda", 3, "Passagem com vítima por desvio simples", "na", "branca", "branca"],
  ["Resgates em Corda", 4, "Passagem com vítima por desvio duplo", "na", "na", "branca"],
  ["Resgates em Corda", 5, "Transferência de corda para corda com vítima", "na", "branca", "branca"],
  ["Resgates em Corda", 6, "Passagem com vítima com fracionamento curto", "na", "branca", "branca"],
  ["Resgates em Corda", 7, "Resgate com vítima em transferência entre cordas", "na", "na", "branca"],
  ["Resgates em Corda", 8, "Passagem com vítimas por nós", "na", "na", "branca"],
  ["Resgates em Corda", 9, "Uso de cordas tensionadas para resgate", "na", "na", "branca"],
].map(([modulo, ordem, nome, tipoN1, tipoN2, tipoN3]) => ({
  modulo: modulo as string,
  ordem: ordem as number,
  nome: nome as string,
  tipoN1: tipoN1 as string,
  tipoN2: tipoN2 as string,
  tipoN3: tipoN3 as string,
}));

async function main() {
  for (const a of [
    { nome: "IRATA Brasil", sigla: "IRATA-BR" },
    { nome: "IRATA Internacional", sigla: "IRATA-INT" },
    { nome: "Treinamento Avulso", sigla: "AVULSO" },
  ]) {
    const existing = await prisma.associacao.findFirst({ where: { nome: a.nome } });
    if (!existing) await prisma.associacao.create({ data: a });
  }

  for (const d of discrepancias) {
    await prisma.discrepanciaCatalogo.upsert({
      where: { tipo_codigo: { tipo: d.tipo, codigo: d.codigo } },
      update: { descricao: d.descricao },
      create: d,
    });
  }

  for (const m of manobras) {
    const existing = await prisma.manobraCatalogo.findFirst({ where: { modulo: m.modulo, ordem: m.ordem } });
    if (!existing) await prisma.manobraCatalogo.create({ data: m });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@methaoffshore.com.br";
  const adminNome = process.env.ADMIN_NOME ?? "Administrador Metha";
  const adminSenha = process.env.ADMIN_SENHA ?? "Admin2026!";
  const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const senhaHash = await bcrypt.hash(adminSenha, 12);
    await prisma.usuario.create({
      data: { nome: adminNome, email: adminEmail, senhaHash, perfil: "admin" },
    });
    console.log(`Admin criado: ${adminEmail}`);
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

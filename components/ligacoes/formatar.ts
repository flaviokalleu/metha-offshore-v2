/** "5511999998888@s.whatsapp.net" → "+55 (11) 99999-8888" */
export function formatarTelefone(jidOuNumero: string) {
  const d = jidOuNumero.split("@")[0].split(":")[0].replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const num = d.slice(4);
    return `+55 (${ddd}) ${num.slice(0, num.length - 4)}-${num.slice(-4)}`;
  }
  return d ? `+${d}` : jidOuNumero;
}

/**
 * Normaliza o que o usuário digitou para o formato internacional.
 * Número brasileiro sem DDI (10 ou 11 dígitos) ganha o 55 na frente.
 */
export function normalizarTelefone(entrada: string) {
  const d = entrada.replace(/\D/g, "");
  if (!entrada.trim().startsWith("+") && (d.length === 10 || d.length === 11)) return `55${d}`;
  return d;
}

export function formatarDuracao(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

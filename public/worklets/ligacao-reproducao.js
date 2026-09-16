// Reprodução do áudio da ligação: recebe PCM 16 kHz mono do servidor e toca na
// taxa nativa do AudioContext (interpolação linear).
//
// Pré-buffer curto (60 ms no início, 40 ms depois de esvaziar): sem ele o buffer
// zera a cada pacote de 20 ms e o áudio sai com estalos. Curto de propósito —
// buffer fundo transformava pequenas falhas de rede em cortes longos.
// Se o atraso acumular (relógio do servidor mais rápido que a placa de som),
// descarta o excesso para a conversa não ficar com eco de atraso.
const TAXA_ENTRADA = 16000;
const ANEL = TAXA_ENTRADA * 2; // 2 s
const ATRASO_MAX = TAXA_ENTRADA * 0.3; // acima de 300 ms acumulados...
const ATRASO_ALVO = TAXA_ENTRADA * 0.08; // ...volta para 80 ms
const PREPARO_INICIAL = TAXA_ENTRADA * 0.06;
const PREPARO_APOS_FALTA = TAXA_ENTRADA * 0.04;

class LigacaoReproducao extends AudioWorkletProcessor {
  constructor() {
    super();
    this.anel = new Float32Array(ANEL);
    this.leitura = 0;
    this.escrita = 0;
    this.disponivel = 0;
    this.frac = 0;
    this.passo = TAXA_ENTRADA / sampleRate;
    this.preparo = PREPARO_INICIAL; // > 0 = acumulando antes de tocar

    this.faltaAmostras = 0;
    this.descartadas = 0;
    this.quanta = 0;
    this.relatarACada = Math.round((sampleRate * 2) / 128); // ~2 s

    this.port.onmessage = (e) => {
      const dados = e.data;
      if (!dados || !dados.length) return;
      for (let i = 0; i < dados.length; i += 1) {
        this.anel[this.escrita] = dados[i];
        this.escrita = (this.escrita + 1) % ANEL;
        if (this.disponivel < ANEL) this.disponivel += 1;
        else this.leitura = (this.leitura + 1) % ANEL;
      }
      if (this.disponivel > ATRASO_MAX) {
        const pular = this.disponivel - ATRASO_ALVO;
        this.leitura = (this.leitura + pular) % ANEL;
        this.disponivel -= pular;
        this.descartadas += pular;
      }
    };
  }

  process(_inputs, outputs) {
    const saida = outputs[0];
    if (!saida || !saida[0]) return true;
    const out = saida[0];

    if (this.preparo > 0 && this.disponivel >= this.preparo) this.preparo = 0;

    for (let i = 0; i < out.length; i += 1) {
      if (this.preparo === 0 && this.disponivel >= 2) {
        const a = this.anel[this.leitura];
        const b = this.anel[(this.leitura + 1) % ANEL];
        out[i] = a + (b - a) * this.frac;
        this.frac += this.passo;
        while (this.frac >= 1 && this.disponivel >= 2) {
          this.frac -= 1;
          this.leitura = (this.leitura + 1) % ANEL;
          this.disponivel -= 1;
        }
      } else {
        out[i] = 0;
        if (this.preparo === 0) this.preparo = PREPARO_APOS_FALTA;
        this.faltaAmostras += 1;
      }
    }
    for (let c = 1; c < saida.length; c += 1) saida[c].set(out);

    this.quanta += 1;
    if (this.quanta >= this.relatarACada) {
      this.port.postMessage({
        faltaMs: Math.round((this.faltaAmostras / sampleRate) * 1000),
        descartadoMs: Math.round((this.descartadas / TAXA_ENTRADA) * 1000),
        bufferMs: Math.round((this.disponivel / TAXA_ENTRADA) * 1000),
      });
      this.faltaAmostras = 0;
      this.descartadas = 0;
      this.quanta = 0;
    }
    return true;
  }
}

registerProcessor("ligacao-reproducao", LigacaoReproducao);

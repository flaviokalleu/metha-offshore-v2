// Captura do microfone para ligações: converte da taxa nativa do AudioContext
// (normalmente 44,1/48 kHz) para 16 kHz mono e envia blocos de 20 ms (320 amostras)
// para a thread principal, que repassa ao servidor pelo data channel WebRTC.
//
// Rodar o AudioContext na taxa nativa (em vez de forçar 16 kHz) evita o erro do
// Firefox ao conectar o microfone num contexto com taxa diferente da do hardware.
const TAXA_SAIDA = 16000;
const BLOCO = 320;

class LigacaoCaptura extends AudioWorkletProcessor {
  constructor() {
    super();
    this.passo = sampleRate / TAXA_SAIDA;
    this.pos = 0; // posição fracionária no bloco de entrada (-1 = última amostra do bloco anterior)
    this.anterior = 0;
    this.saida = new Float32Array(BLOCO);
    this.n = 0;
    this.mudo = false;

    // Passa-baixa (biquad RBJ, 7 kHz) antes de decimar, para não gerar aliasing.
    this.filtrar = sampleRate > TAXA_SAIDA;
    if (this.filtrar) {
      const w0 = (2 * Math.PI * 7000) / sampleRate;
      const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
      const cos = Math.cos(w0);
      const a0 = 1 + alpha;
      this.b0 = (1 - cos) / 2 / a0;
      this.b1 = (1 - cos) / a0;
      this.b2 = this.b0;
      this.a1 = (-2 * cos) / a0;
      this.a2 = (1 - alpha) / a0;
      this.x1 = this.x2 = this.y1 = this.y2 = 0;
    }

    this.port.onmessage = (e) => {
      if (e.data && typeof e.data.mudo === "boolean") this.mudo = e.data.mudo;
    };
  }

  emitir(amostra) {
    this.saida[this.n++] = this.mudo ? 0 : amostra;
    if (this.n === BLOCO) {
      this.port.postMessage(this.saida.slice(0));
      this.n = 0;
    }
  }

  process(inputs) {
    const canal = inputs[0] && inputs[0][0];
    if (!canal || !canal.length) return true;

    let x = canal;
    if (this.filtrar) {
      x = new Float32Array(canal.length);
      for (let i = 0; i < canal.length; i += 1) {
        const y = this.b0 * canal[i] + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1;
        this.x1 = canal[i];
        this.y2 = this.y1;
        this.y1 = y;
        x[i] = y;
      }
    }

    const n = x.length;
    while (this.pos < n - 1) {
      const i = Math.floor(this.pos);
      const f = this.pos - i;
      const a = i < 0 ? this.anterior : x[i];
      this.emitir(a + (x[i + 1] - a) * f);
      this.pos += this.passo;
    }
    this.pos -= n;
    this.anterior = x[n - 1];
    return true;
  }
}

registerProcessor("ligacao-captura", LigacaoCaptura);

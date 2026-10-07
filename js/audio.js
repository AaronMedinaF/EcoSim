// Sonido generado con WebAudio (sin archivos). Música y efectos se pueden apagar por separado.
(function (E) {
  let ctx = null, last = {};
  const A = E.Audio = {
    on: { mus: true, fx: true },
    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); setInterval(() => A.note(), 2600); } catch (e) { ctx = null; }
    },
    tone(f, d, type = 'sine', v = 0.05, at = 0) {
      if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.05);
    },
    noise(d, v) {
      if (!ctx) return;
      const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
      const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = v; s.buffer = b; s.connect(g); g.connect(ctx.destination); s.start();
    },
    note() { if (this.on.mus && ctx) this.tone(E.U.pick([220, 247, 293, 330, 392, 440, 494, 587]), 2.6, 'sine', 0.02); },
    fx(k) {
      if (!ctx || !this.on.fx) return;
      const n = performance.now(); if (last[k] && n - last[k] < 120) return; last[k] = n;
      if (k === 'eat') this.tone(520, 0.07, 'square', 0.015);
      else if (k === 'born') { this.tone(660, 0.12, 'sine', 0.05); this.tone(880, 0.15, 'sine', 0.05, 0.1); }
      else if (k === 'death') this.tone(150, 0.3, 'sawtooth', 0.025);
      else if (k === 'hunt') this.tone(110, 0.25, 'sawtooth', 0.03);
      else if (k === 'storm') this.noise(0.8, 0.12);
      else if (k === 'fire') this.noise(1.2, 0.08);
      else this.tone(330, 0.5, 'triangle', 0.06);
    },
  };
  E.hooks.sound = k => A.fx(k);
})(Eco);

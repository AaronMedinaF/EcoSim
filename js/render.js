// Renderizado 2D en canvas + cámara. El terreno se pinta una vez en un canvas auxiliar.
(function (E) {
  const U = E.U, C = E.CFG, TAU = Math.PI * 2;
  const hash = i => ((i * 2654435761) >>> 0) / 4294967296;
  const FLOWER = ['#ff9ecb', '#ffe45c', '#ff9a3c', '#c9d6dd'], BUSH = [['#6bc24f', '#3d8a34'], ['#58b04a', '#2f7a2f'], ['#b5a042', '#7a6a22'], ['#8fb5a5', '#587d70']];
  E.Render = class {
    constructor(cv) { this.cv = cv; this.g = cv.getContext('2d'); this.cam = { x: C.W / 2, y: C.H / 2, z: 1, f: null, goal: null }; this.terr = document.createElement('canvas'); this.snow = document.createElement('canvas'); this.t = 0; this.resize(); }
    resize() { const d = this.dpr = devicePixelRatio || 1; this.cw = innerWidth; this.ch = innerHeight; this.cv.width = this.cw * d; this.cv.height = this.ch * d; this.fit = Math.min(this.cw / C.W, this.ch / C.H) * 0.98; this.cam.z = Math.max(this.cam.z, this.fit); }
    reset() { this.cam.x = C.W / 2; this.cam.y = C.H / 2; this.cam.z = this.fit; this.cam.f = null; this.cam.goal = null; }
    toWorld(sx, sy) { const c = this.cam; return { x: (sx - this.cw / 2) / c.z + c.x, y: (sy - this.ch / 2) / c.z + c.y }; }
    goTo(x, y, z) { this.cam.f = null; this.cam.goal = { x, y, z: z || Math.max(this.cam.z, 1.8) }; }
    build(w) {
      const T = this.terr, S = this.snow, g = T.getContext('2d'), s = S.getContext('2d'), N = C.CELL;
      T.width = S.width = C.W; T.height = S.height = C.H;
      for (let j = 0; j < w.rows; j++) for (let i = 0; i < w.cols; i++) {
        const k = j * w.cols + i, t = w.tiles[k], x = i * N, y = j * N, h = hash(k + 7);
        g.fillStyle = C.tiles[t].c; g.fillRect(x, y, N + 1, N + 1);
        g.fillStyle = `rgba(${h < 0.5 ? '255,255,255' : '0,0,0'},.05)`; g.fillRect(x, y, N + 1, N + 1);
        if (t === 0 || t === 6) { g.strokeStyle = t === 0 ? 'rgba(40,90,30,.45)' : 'rgba(120,90,20,.4)'; for (let n = 0; n < 6; n++) { const px = x + hash(k * 9 + n) * N, py = y + hash(k * 5 + n + 3) * N; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 1, py - 4); g.stroke(); } }
        else if (t === 1) for (let n = 0; n < 2; n++) { const px = x + 8 + hash(k + n * 13) * 24, py = y + 10 + hash(k * 3 + n) * 22, r = 8 + hash(k + n) * 5; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(px + 3, py + 6, r, r * 0.5, 0, 0, TAU); g.fill(); g.fillStyle = '#5b3b22'; g.fillRect(px - 1.5, py, 3, 7); g.fillStyle = '#2f6b2e'; g.beginPath(); g.arc(px, py - 2, r, 0, TAU); g.fill(); g.fillStyle = '#3f8a3b'; g.beginPath(); g.arc(px - r * 0.3, py - r * 0.5, r * 0.55, 0, TAU); g.fill(); }
        else if (t === 2) { g.fillStyle = 'rgba(160,120,50,.35)'; for (let n = 0; n < 4; n++) g.fillRect(x + hash(k + n) * N, y + hash(k * 7 + n) * N, 2, 2); }
        else if (t === 3) { g.fillStyle = 'rgba(255,255,255,.5)'; for (let n = 0; n < 5; n++) g.fillRect(x + hash(k + n) * N, y + hash(k * 7 + n) * N, 3, 2); }
        else if (t === 4) { g.strokeStyle = 'rgba(255,255,255,.28)'; g.beginPath(); for (let n = 0; n < 2; n++) { const px = x + 6 + hash(k + n) * 24, py = y + 8 + n * 18; g.moveTo(px, py); g.quadraticCurveTo(px + 5, py - 3, px + 10, py); } g.stroke(); }
        else if (t === 5) { g.fillStyle = '#9a9ca2'; g.beginPath(); g.moveTo(x + 6, y + 30); g.lineTo(x + 12, y + 12); g.lineTo(x + 28, y + 10); g.lineTo(x + 34, y + 28); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 14, y + 13, 10, 4); }
        if (t !== 4) { s.fillStyle = 'rgba(245,250,255,.82)'; s.fillRect(x, y, N + 1, N + 1); }
      }
    }
    camUpdate(w, dt) {
      const c = this.cam, k = Math.min(1, 5 * dt);
      if (c.f) { if (c.f.alive === false && !c.f.keep) c.f = null; else { c.x += (c.f.x - c.x) * k; c.y += (c.f.y - c.y) * k; } }
      else if (c.goal) { const o = c.goal; c.x += (o.x - c.x) * k; c.y += (o.y - c.y) * k; c.z += (o.z - c.z) * k; if (Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 4 && Math.abs(o.z - c.z) < 0.02) c.goal = null; }
      c.z = U.clamp(c.z, this.fit, 4);
      const hx = this.cw / 2 / c.z, hy = this.ch / 2 / c.z;
      c.x = hx * 2 >= C.W ? C.W / 2 : U.clamp(c.x, hx, C.W - hx); c.y = hy * 2 >= C.H ? C.H / 2 : U.clamp(c.y, hy, C.H - hy);
    }
    draw(w, dt, sel, showPer) {
      const g = this.g, c = this.cam, d = this.dpr; this.t += dt; this.camUpdate(w, dt);
      g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#0a0e0f'; g.fillRect(0, 0, this.cw, this.ch);
      g.setTransform(d * c.z, 0, 0, d * c.z, d * (this.cw / 2 - c.x * c.z), d * (this.ch / 2 - c.y * c.z));
      g.drawImage(this.terr, 0, 0);
      const s = w.season(), p = w.seasonProg(), sa = s === 3 ? 0.85 : s === 0 ? 0.45 * (1 - p) : s === 2 ? 0.3 * p : 0;
      if (sa > 0.01) { g.globalAlpha = sa; g.drawImage(this.snow, 0, 0); g.globalAlpha = 1; }
      g.fillStyle = C.seasons[s].tint; g.fillRect(0, 0, C.W, C.H);
      const x0 = c.x - this.cw / 2 / c.z - 20, x1 = c.x + this.cw / 2 / c.z + 20, y0 = c.y - this.ch / 2 / c.z - 20, y1 = c.y + this.ch / 2 / c.z + 20;
      const bc = BUSH[s];
      for (const q of w.plants) {
        if (!q.alive || q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue;
        const f = q.hp / q.max, r = 1.5 + 6 * Math.min(1, f), sw = Math.sin(this.t * 1.5 + q.x) * 0.6;
        g.fillStyle = bc[1]; g.beginPath(); g.arc(q.x + sw, q.y, r, 0, TAU); g.fill(); g.fillStyle = bc[0]; g.beginPath(); g.arc(q.x + sw - r * 0.25, q.y - r * 0.25, r * 0.7, 0, TAU); g.fill();
        if (f > 0.9) { g.fillStyle = FLOWER[s]; g.beginPath(); g.arc(q.x + sw + r * 0.3, q.y - r * 0.4, 1.6, 0, TAU); g.fill(); }
      }
      for (const e of w.events) this.zone(g, e);
      if (showPer && sel && sel.alive) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(sel.x, sel.y, sel.per, 0, TAU); g.stroke(); if (sel.target && sel.target.alive) { g.beginPath(); g.moveTo(sel.x, sel.y); g.lineTo(sel.target.x, sel.target.y); g.strokeStyle = 'rgba(255,90,90,.7)'; g.stroke(); } }
      for (const a of w.animals) if (a.alive && a.x > x0 && a.x < x1 && a.y > y0 && a.y < y1) this.animal(g, a, a === sel, c.z);
      this.fx(g, w, dt);
      if (sel && sel.alive) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.setLineDash([4, 3]); g.beginPath(); g.arc(sel.x, sel.y, sel.r + 7 + Math.sin(this.t * 6), 0, TAU); g.stroke(); g.setLineDash([]); g.lineWidth = 1; }
      g.setTransform(d, 0, 0, d, 0, 0); this.weather(g, w);
    }
    zone(g, e) {
      if (e.type === 'fire') { const k = 1 - e.t / e.dur, gr = g.createRadialGradient(e.x, e.y, 5, e.x, e.y, e.r); gr.addColorStop(0, `rgba(255,150,30,${0.5 * k})`); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(e.x, e.y, e.r, 0, TAU); g.fill(); }
      else if (e.type === 'flood') { g.fillStyle = `rgba(60,130,210,${0.35 * (1 - e.t / e.dur)})`; g.beginPath(); g.arc(e.x, e.y, e.r, 0, TAU); g.fill(); }
    }
    animal(g, a, sel, z) {
      const S = C.species[a.sp], k = a.r / 7 * (a.age < 25 ? 0.65 + 0.35 * a.age / 25 : 1), ph = Math.sin(this.t * a.speedNow * 0.18 + a.id) * 1.6;
      g.save(); g.translate(a.x, a.y); g.rotate(a.heading); g.scale(k, k);
      const col = S.color; g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 3, 9, 5, 0, 0, TAU); g.fill();
      g.strokeStyle = '#4a3a2a'; g.lineWidth = 1.2; for (const [lx, o] of [[-5, ph], [5, -ph], [-3, -ph], [3, ph]]) { g.beginPath(); g.moveTo(lx, -3); g.lineTo(lx + o, -6.5); g.moveTo(lx, 3); g.lineTo(lx - o, 6.5); g.stroke(); }
      g.fillStyle = col; g.beginPath();
      if (a.sp === 'deer') { g.ellipse(0, 0, 9, 5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(10, 0, 4, 3, 0, 0, TAU); g.fill(); g.strokeStyle = '#6b4a2a'; g.beginPath(); g.moveTo(10, -2); g.lineTo(13, -7); g.moveTo(12, -5); g.lineTo(15, -6); g.moveTo(10, 2); g.lineTo(13, 7); g.moveTo(12, 5); g.lineTo(15, 6); g.stroke(); g.fillStyle = '#f4efe6'; g.beginPath(); g.arc(-9, 0, 2, 0, TAU); g.fill(); }
      else if (a.sp === 'wolf') { g.ellipse(0, 0, 9, 4.6, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(8, -3); g.lineTo(15, 0); g.lineTo(8, 3); g.fill(); g.fillStyle = '#5c6474'; g.beginPath(); g.moveTo(8, -3); g.lineTo(10, -7); g.lineTo(12, -3); g.moveTo(8, 3); g.lineTo(10, 7); g.lineTo(12, 3); g.fill(); g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(-14, -3, -16, 1); g.stroke(); }
      else if (a.sp === 'rabbit') { g.ellipse(0, 0, 6, 4.5, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(6, 0, 3, 0, TAU); g.fill(); g.fillStyle = '#f1ece2'; g.beginPath(); g.ellipse(5, -3.2, 3, 1.1, -0.5, 0, TAU); g.ellipse(5, 3.2, 3, 1.1, 0.5, 0, TAU); g.fill(); g.beginPath(); g.arc(-6, 0, 2, 0, TAU); g.fill(); }
      else { g.ellipse(0, 0, 8, 4.4, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(9, 0, 3.6, 0, TAU); g.fill(); g.fillStyle = '#3a2a1a'; g.beginPath(); g.moveTo(8, -3); g.lineTo(9, -7); g.lineTo(11, -3); g.moveTo(8, 3); g.lineTo(9, 7); g.lineTo(11, 3); g.fill(); for (const [sx, sy] of [[-3, -2], [0, 2], [-5, 1], [2, -1.5]]) { g.beginPath(); g.arc(sx, sy, 1, 0, TAU); g.fill(); } }
      g.fillStyle = a.tone > 0 ? `rgba(255,255,255,${a.tone})` : `rgba(0,0,0,${-a.tone})`; g.beginPath(); g.ellipse(0, 0, 8, 4.4, 0, 0, TAU); g.fill();
      g.fillStyle = a.state === 'HUNT' ? '#ff2a2a' : '#111'; g.beginPath(); g.arc(a.kind === 'H' ? 11 : 11.5, -1.3, 0.9, 0, TAU); g.arc(a.kind === 'H' ? 11 : 11.5, 1.3, 0.9, 0, TAU); g.fill();
      if (a.sick > 0) { g.strokeStyle = 'rgba(120,255,80,.8)'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.stroke(); }
      g.restore();
      if (a.state === 'FLEE') this.glyph(g, '!', a.x, a.y - a.r - 6, '#ffd54f'); else if (a.state === 'HUNT') this.glyph(g, '⚔', a.x, a.y - a.r - 6, '#ff6a6a'); else if (a.state === 'EAT') this.glyph(g, '·', a.x, a.y - a.r - 4, '#9be37a'); else if (a.state === 'MATE') this.glyph(g, '♥', a.x, a.y - a.r - 6, '#ff78c8');
      if (sel || z > 1.7) { const w = 16, y = a.y + a.r + 5; g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(a.x - w / 2, y, w, 3); const f = a.hp / a.maxHp; g.fillStyle = f > 0.6 ? '#7be07b' : f > 0.3 ? '#ffd54f' : '#ff5c5c'; g.fillRect(a.x - w / 2, y, w * f, 1.5); g.fillStyle = '#5fb4ff'; g.fillRect(a.x - w / 2, y + 1.5, w * a.energy / 100, 1.5); }
    }
    glyph(g, t, x, y, c) { g.font = 'bold 10px system-ui'; g.textAlign = 'center'; g.fillStyle = c; g.fillText(t, x, y); }
    fx(g, w, dt) {
      const F = w.fx; let j = 0;
      for (const p of F) {
        p.l -= dt; if (p.l <= 0) continue; F[j++] = p; const a = p.l / p.m; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.t === 'ring') { g.strokeStyle = p.c; g.globalAlpha = a; g.beginPath(); g.arc(p.x, p.y, 4 + (1 - a) * 22, 0, TAU); g.stroke(); }
        else if (p.t === 'heart') { g.globalAlpha = a; g.fillStyle = p.c; g.font = '9px system-ui'; g.fillText('♥', p.x, p.y); }
        else { g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(p.x, p.y, 2, 2); }
        g.globalAlpha = 1;
      }
      F.length = j;
      for (const e of w.events) if (e.type === 'fire' && w.fx.length < 280) for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, r = Math.random() * e.r * 0.8; w.fx.push({ t: 'flame', x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, vx: 0, vy: -20, l: 0.6, m: 0.6, c: Math.random() < 0.5 ? '#ff8a1a' : '#ffd23a' }); }
    }
    weather(g, w) {
      let rain = 0, fl = 0; for (const e of w.events) { if (e.type === 'rain') rain = 1; if (e.type === 'storm') { rain = 1.4; fl = Math.max(fl, e.fl || 0); } }
      if (rain) { g.strokeStyle = 'rgba(190,210,255,.35)'; g.beginPath(); for (let i = 0; i < 90 * rain; i++) { const x = (i * 97 + this.t * 120) % this.cw, y = (i * 53 + this.t * 700) % this.ch; g.moveTo(x, y); g.lineTo(x - 3, y + 12); } g.stroke(); g.fillStyle = 'rgba(30,40,70,.18)'; g.fillRect(0, 0, this.cw, this.ch); }
      if (fl > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(0.7, fl)})`; g.fillRect(0, 0, this.cw, this.ch); }
      for (const e of w.events) if (e.type === 'heat') { g.fillStyle = 'rgba(255,170,40,.07)'; g.fillRect(0, 0, this.cw, this.ch); } else if (e.type === 'cold') { g.fillStyle = 'rgba(150,200,255,.1)'; g.fillRect(0, 0, this.cw, this.ch); }
    }
  };
})(Eco);

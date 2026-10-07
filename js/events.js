// Clima, desastres, enfermedades e invasiones. Raros a propósito: cuando ocurren, importan.
(function (E) {
  const U = E.U, C = E.CFG;
  const T = {
    rain:    { i: '🌧️', n: 'Lluvia', dur: 45, g: 2, wt: 3 },
    storm:   { i: '⛈️', n: 'Tormenta', dur: 35, g: 1.4, p: 0.75, wt: 2 },
    heat:    { i: '🥵', n: 'Ola de calor', dur: 45, g: 0.7, d: 1.3, wt: 1.5 },
    drought: { i: '🌵', n: 'Sequía', dur: 80, g: 0.25, d: 1.1, wt: 1.5 },
    cold:    { i: '❄️', n: 'Ola de frío', dur: 45, g: 0.5, d: 1.4, wt: 1.5 },
    fire:    { i: '🔥', n: 'Incendio', dur: 14, wt: 1 },
    flood:   { i: '🌊', n: 'Inundación', dur: 30, wt: 1 },
    disease: { i: '🦠', n: 'Enfermedad', dur: 0, wt: 1.2 },
  };
  E.Events = {
    T,
    start(w, type, x, y, r) {
      if (type === 'disease') return this.outbreak(w);
      const t = T[type], e = { type, t: 0, dur: t.dur, x: x ?? U.rand(150, C.W - 150), y: y ?? U.rand(120, C.H - 120), r: r ?? (type === 'fire' ? 70 : type === 'flood' ? 170 : 0), k: 0 };
      w.events.push(e); w.stats.events++; E.Story.event(w, e); return true;
    },
    outbreak(w, sp) {
      const n = {}; for (const a of w.animals) if (a.alive) n[a.sp] = (n[a.sp] || 0) + 1;
      const c = Object.keys(n).filter(s => n[s] >= 6);
      if (!c.length) return false;
      sp = sp && n[sp] >= 3 ? sp : U.pick(c);
      const L = w.animals.filter(a => a.sp === sp && a.alive && !a.sick);
      for (let i = 0, m = Math.max(3, L.length * 0.08 | 0); i < m && L.length; i++) L.splice(Math.random() * L.length | 0, 1)[0].sick = U.rand(40, 80);
      w.disease = { sp, t: w.time }; w.stats.events++; E.Story.event(w, { type: 'disease', sp }); return true;
    },
    invade(w) {
      const inv = Object.keys(C.species).filter(k => C.species[k].invader), free = inv.filter(k => w.cnt[k] === 0), sp = U.pick(free.length ? free : inv);
      const edge = Math.random() < 0.5, x0 = edge ? 30 : C.W - 30, y0 = U.rand(100, C.H - 100);
      for (let i = 0, n = C.species[sp].kind === 'H' ? 14 : 6; i < n; i++) { let x = x0 + U.rand(-30, 30), y = y0 + U.rand(-40, 40); if (!w.walk(x, y)) { const p = w.randWalk(); x = p.x; y = p.y; } E.Animals.create(w, sp, x, y); }
      E.Story.invasion(w, sp, x0, y0);
    },
    hazard(w, a) { for (const e of w.events) if (e.r && Math.hypot(a.x - e.x, a.y - e.y) < e.r + 25) return e; return null; },
    zone(w, e) {
      const q = w.pg.q(e.x, e.y, e.r, w.tmp2);
      for (const p of q) if (p.alive && Math.hypot(p.x - e.x, p.y - e.y) < e.r && Math.random() < (e.type === 'fire' ? 0.5 : 0.3)) { w.rmPlant(p); if (e.type === 'fire') w.spark('flame', p.x, p.y, '#ff7a1a', 2); }
      for (const a of w.ag.q(e.x, e.y, e.r, w.tmp)) if (a.alive && Math.hypot(a.x - e.x, a.y - e.y) < e.r) {
        a.hp -= e.type === 'fire' ? 14 : 3; a.dmg = e.type === 'fire' ? 'incendio' : 'inundación';
        if (a.hp <= 0) w.kill(a, a.dmg);
      }
    },
    update(w, dt) {
      const S = C.seasons[w.season()]; let g = S.g, d = S.d, p = 1;
      for (const e of w.events) {
        const t = T[e.type]; g *= t.g || 1; d *= t.d || 1; p *= t.p || 1; e.t += dt;
        if (e.type === 'fire') e.r = 70 + 90 * Math.min(1, e.t / e.dur * 1.5);
        if (e.r && (e.k -= dt) <= 0) { e.k = 0.5; this.zone(w, e); }
        if (e.type === 'storm' && (e.l = (e.l ?? 6) - dt) <= 0) { e.l = U.rand(6, 14); e.fl = 1; this.lightning(w); }
        if (e.fl > 0) e.fl -= dt * 3;
      }
      w.env.g = g; w.env.d = d; w.env.p = p;
      for (let i = w.events.length - 1; i >= 0; i--) if (w.events[i].t >= w.events[i].dur) { E.Story.eventEnd(w, w.events[i]); w.events.splice(i, 1); }
      if ((w.next -= dt) <= 0) {
        w.next = U.rand(150, 320) / w.D.ev;
        let r = Math.random() * Object.values(T).reduce((s, t) => s + t.wt, 0), k = 'rain';
        for (const key in T) { r -= T[key].wt; if (r <= 0) { k = key; break; } }
        this.start(w, k);
      }
      if (w.day() > 10 && (w.inv -= dt) <= 0) { w.inv = U.rand(500, 900); this.invade(w); }
    },
    // Si una especie se extingue por completo, grupos migratorios repueblan el mapa tras un tiempo.
    migration(w) {
      const H = w.cnt.deer + w.cnt.rabbit, Cn = w.cnt.wolf + w.cnt.lynx, tr = w.tr;
      tr.noH = H === 0 && w.plants.length > 40 ? (tr.noH || 0) + 1 : 0;
      tr.noC = Cn === 0 && H >= 25 ? (tr.noC || 0) + 1 : 0;
      const go = (sp, n, ic, txt) => { const x = Math.random() < 0.5 ? 30 : C.W - 30, y = U.rand(150, C.H - 150); for (let i = 0; i < n; i++) E.Animals.create(w, sp, U.clamp(x + U.rand(-30, 30), 20, C.W - 20), y + U.rand(-40, 40)); E.Story.log(w, ic, txt, null, x, y); E.Story.hist(w, ic, txt); E.Story.doc(w, ic, txt, x, y, null, 3); };
      if (tr.noH > 60) { tr.noH = 0; go('deer', 8, '🦌', 'Una manada migratoria llega a la zona.'); }
      if (tr.noC > 120) { tr.noC = 0; go('wolf', 2, '🐺', 'Una pareja de lobos llega desde el exterior.'); }
    },
    lightning(w) {
      const x = U.rand(100, C.W - 100), y = U.rand(100, C.H - 100); w.spark('ring', x, y, '#fff', 1); E.hooks.sound('storm');
      if (Math.random() < 0.25 && w.fertAt(x, y) > 0) { w.tr.lightFire = 1; this.start(w, 'fire', x, y, 60); }
    },
  };
})(Eco);

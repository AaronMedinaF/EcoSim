// Estadísticas muestreadas, logros (persistentes) y desafíos de cada partida.
(function (E) {
  const U = E.U, C = E.CFG, KEY = 'ecosim3.ach';
  const sum = (w, kind) => { let n = 0; for (const k in w.cnt) if (C.species[k].kind === kind) n += w.cnt[k]; return n; };
  const ACH = [
    { id: 'life', ic: '🌱', n: 'PRIMERA VIDA', d: 'Nace el primer animal en tu mundo.', t: w => w.stats.births >= 1 },
    { id: 'chain', ic: '🐾', n: 'CADENA ALIMENTARIA', d: 'Un depredador caza a su primera presa.', t: w => (w.stats.causes['depredación'] || 0) >= 1 },
    { id: 'evo', ic: '🧬', n: 'EVOLUCIÓN', d: 'Alcanza la generación 5.', t: w => w.stats.maxGen >= 5 },
    { id: 'king', ic: '👑', n: 'REY DE LA JUNGLA', d: 'Un carnívoro llega a 20 presas.', t: w => (w.legend.hunt || { val: 0 }).val >= 20 },
    { id: 'ext', ic: '💀', n: 'EXTINCIÓN', d: 'Una especie desaparece del mundo.', t: w => w.stats.extinct >= 1 },
    { id: 'surv', ic: '🔥', n: 'SUPERVIVIENTE', d: 'Sigue habiendo vida 60 s después de un incendio.', t: w => w.tr.fireEnd && w.time - w.tr.fireEnd > 60 && w.animals.length > 0 },
    { id: 'pan', ic: '🦠', n: 'PANDEMIA', d: '15 animales enfermos a la vez.', t: w => (w.tr.sickPeak || 0) >= 15 },
    { id: 'stable', ic: '🌍', n: 'ECOSISTEMA ESTABLE', d: 'Plantas, herbívoros y carnívoros conviven 10 minutos.', t: w => (w.tr.stable || 0) >= 600 },
    { id: 'b1000', ic: '🏆', n: '1.000 NACIMIENTOS', d: 'Mil nacimientos en un mismo mundo.', t: w => w.stats.births >= 1000 },
    { id: 'g50', ic: '🧬', n: '50 GENERACIONES', d: 'Una estirpe llega a la generación 50.', t: w => w.stats.maxGen >= 50 },
    { id: 'obs', ic: '👀', n: 'OBSERVADOR', d: 'Observa el mismo animal durante 5 minutos.', t: w => (w.tr.watch || 0) >= 300 },
    { id: 'apoc', ic: '☠️', n: 'APOCALIPSIS', d: 'Todos los animales mueren.', secret: 1, t: w => w.stats.deaths >= 50 && w.animals.length === 0 },
    { id: 'zoo', ic: '🦒', n: 'ARCA DE NOÉ', d: 'Cuatro especies conviven a la vez.', secret: 1, t: w => Object.values(w.cnt).filter(n => n > 0).length >= 4 },
    { id: 'bolt', ic: '⚡', n: 'BAJO LA TORMENTA', d: 'Un rayo provoca un incendio.', secret: 1, t: w => w.tr.lightFire },
  ];
  E.Meta = {
    ACH, done: new Set(),
    load() { try { JSON.parse(localStorage.getItem(KEY) || '[]').forEach(i => this.done.add(i)); } catch (e) { /* sin almacenamiento */ } },
    saveAch() { try { localStorage.setItem(KEY, JSON.stringify([...this.done])); } catch (e) { /* sin almacenamiento */ } },
    initChal(w) {
      w.chal = [
        { id: 'h30', txt: 'Mantén 30 herbívoros vivos durante 3 minutos', done: false },
        { id: 'g20', txt: 'Consigue que una especie sobreviva 20 generaciones', done: false },
        { id: 'rec', txt: 'Haz que los herbívoros se recuperen después de una sequía', done: false },
      ];
    },
    check(w) {
      const tr = w.tr, H = sum(w, 'H'), Cn = sum(w, 'C');
      tr.h30 = H >= 30 ? (tr.h30 || 0) + 2 : 0;
      tr.stable = w.plants.length > 20 && H >= 5 && Cn >= 2 ? (tr.stable || 0) + 2 : 0;
      let sick = 0; for (const a of w.animals) if (a.sick > 0) sick++; tr.sickPeak = Math.max(tr.sickPeak || 0, sick);
      const T = { h30: tr.h30 >= 180, g20: w.stats.maxGen >= 20, rec: !!(tr.dr && tr.dr.end && tr.dr.pre >= 5 && H >= tr.dr.pre * 0.9) };
      for (const c of w.chal) if (!c.done && T[c.id]) { c.done = true; E.hooks.toast('🎯', `Desafío completado: ${c.txt}`); E.Story.log(w, '🎯', `Desafío completado: ${c.txt}`); }
      for (const a of ACH) if (!this.done.has(a.id) && a.t(w)) { this.done.add(a.id); this.saveAch(); E.hooks.toast(a.ic, `Logro: ${a.n}`); E.Story.log(w, a.ic, `Logro desbloqueado: ${a.n}`); }
    },
    sample(w) {
      const m = { H: {}, C: {} }, n = { H: 0, C: 0 };
      for (const a of w.animals) { n[a.kind]++; for (const k in a.genes) m[a.kind][k] = (m[a.kind][k] || 0) + a.genes[k]; }
      for (const kd of ['H', 'C']) for (const k in m[kd]) m[kd][k] /= n[kd] || 1;
      w.hist.push({ t: w.time, p: w.plants.length, H: n.H, C: n.C, g: m });
      if (w.hist.length > 400) w.hist.shift();
    },
  };
  E.Meta.load();
})(Eco);

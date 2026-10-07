// Historia automática: registro, hitos, leyendas y avisos para el modo documental.
(function (E) {
  const U = E.U, C = E.CFG;
  const nm = a => `#${a.id}${a.name ? ' ' + a.name : ''}`, lab = a => C.species[a.sp].label;
  const CAUSE = { hambre: 'de hambre', depredación: 'cazado', vejez: 'de vejez', enfermedad: 'por enfermedad', incendio: 'en un incendio', inundación: 'en una inundación' };
  const CATS = {
    fast: ['🏃', 'MÁS RÁPIDO', 'EL VELOCISTA', a => a.genes.speed], per: ['🧠', 'MAYOR PERCEPCIÓN', 'EL VIGÍA', a => a.genes.perception],
    hunt: ['🐺', 'MAYOR DEPREDADOR', 'EL CAZADOR', a => a.kills], kids: ['👶', 'MÁS DESCENDIENTES', 'EL PADRE DE LA MANADA', a => a.offspring],
    long: ['⏳', 'MÁS LONGEVO', 'EL ANCIANO', a => a.age], succ: ['🧬', 'MAYOR ÉXITO EVOLUTIVO', 'EL LINAJE', a => a.desc],
  };
  E.Story = {
    CATS,
    log(w, ic, txt, id, x, y) { w.log.push({ t: w.time, ic, txt, id, x, y }); if (w.log.length > 150) w.log.shift(); w.ver++; },
    hist(w, ic, txt) { w.story.push({ d: w.day(), ic, txt }); w.hver++; },
    doc(w, ic, txt, x, y, id, prio) { w.lastEv = { x, y, id }; w.doc.push({ t: w.time, ic, txt, x, y, id, prio }); if (w.doc.length > 20) w.doc.shift(); },
    birth(w, c, a, m, mut) {
      w.stats.births++; w.stats.maxGen = Math.max(w.stats.maxGen, c.gen);
      const mt = mut ? ` · Mutación: ${mut.p > 0 ? '+' : ''}${(mut.p * 100).toFixed(0)}% ${C.genes[mut.k]}` : '';
      this.log(w, '🧬', `Ha nacido ${nm(c)} · hijo de #${a.id} y #${m.id}${mt}`, c.id, c.x, c.y);
      w.spark('heart', c.x, c.y, '#ff78c8', 4); E.hooks.sound('born');
      if (w.stats.births === 1) this.hist(w, '👶', 'Nace la primera generación.');
      if (mut && Math.abs(mut.p) >= 0.08) this.doc(w, '🧬', `Mutación interesante en ${nm(c)}: ${mut.p > 0 ? '+' : ''}${(mut.p * 100).toFixed(0)}% ${C.genes[mut.k]}.`, c.x, c.y, c.id, 3);
      else if (Math.random() < 0.15) this.doc(w, '👶', `Ha nacido ${lab(c).toLowerCase()} ${nm(c)}.`, c.x, c.y, c.id, 1);
    },
    death(w, a, cause, by) {
      const txt = cause === 'depredación' && by ? `${nm(a)} ha sido cazado por #${by.id}.` : `${nm(a)} ha muerto ${CAUSE[cause] || cause}.`;
      this.log(w, '💀', txt, a.id, a.x, a.y); w.spark('ring', a.x, a.y, '#c0c0c0', 1); E.hooks.sound('death');
      const L = Object.values(w.legend).find(l => l.id === a.id);
      if (L) { L.alive = false; this.legends(w); this.doc(w, '💀', `Muere una leyenda: ${nm(a)} (${CAUSE[cause] || cause}).`, a.x, a.y, a.id, 4); }
      else if (a.age > a.maxAge * 0.85 && a.gen > 2) this.doc(w, '💀', `Muere ${nm(a)}, longevo de la generación ${a.gen}.`, a.x, a.y, a.id, 2);
    },
    hunt(w, a, t) {
      if (w.time - (w.tr.huntLog || -9) > 3) { w.tr.huntLog = w.time; this.log(w, '🐺', `${nm(a)} persigue a ${nm(t)}.`, a.id, a.x, a.y); E.hooks.sound('hunt'); }
      this.doc(w, '🐺', `El ${lab(a).toLowerCase()} ${nm(a)} está persiguiendo a una presa.`, a.x, a.y, a.id, 2);
    },
    event(w, e) {
      if (e.type === 'disease') { this.log(w, '🦠', `Brote de enfermedad entre los ${C.species[e.sp].label.toLowerCase()}s.`); this.hist(w, '🦠', `Una enfermedad afecta a los ${C.species[e.sp].label.toLowerCase()}s.`); E.hooks.toast('🦠', 'Brote de enfermedad'); this.doc(w, '🦠', 'Una enfermedad se propaga entre los animales.', C.W / 2, C.H / 2, null, 4); return; }
      const t = E.Events.T[e.type];
      if (e.type === 'drought') w.tr.dr = { pre: w.cnt.deer + w.cnt.rabbit };
      this.log(w, t.i, `Ha comenzado: ${t.n}.`, null, e.r ? e.x : null, e.y); this.hist(w, t.i, e.type === 'drought' ? 'Una sequía reduce la vegetación.' : `Comienza: ${t.n.toLowerCase()}.`);
      E.hooks.toast(t.i, t.n); E.hooks.sound(e.type === 'fire' || e.type === 'storm' ? e.type : 'event'); this.doc(w, t.i, `${t.n.toUpperCase()} en el ecosistema.`, e.x, e.y, null, 4);
    },
    eventEnd(w, e) {
      const t = E.Events.T[e.type]; this.log(w, '✔️', `Termina: ${t.n}.`);
      if (e.type === 'fire') w.tr.fireEnd = w.time;
      if (e.type === 'drought' && w.tr.dr) w.tr.dr.end = w.time;
    },
    invasion(w, sp, x, y) {
      const s = C.species[sp]; this.log(w, '⚠️', `ESPECIE INVASORA DETECTADA: ${s.label}s.`, null, x, y); this.hist(w, '⚠️', `Llegan especies invasoras: ${s.label}s.`);
      E.hooks.toast('⚠️', `Especie invasora: ${s.label}s`); this.doc(w, '⚠️', `ESPECIE INVASORA DETECTADA: ${s.icon} ${s.label}s.`, x, y, null, 4);
    },
    second(w) {
      if (w.disease && !w.animals.some(a => a.sick > 0)) { this.log(w, '✔️', 'La enfermedad ha desaparecido.'); this.hist(w, '✔️', 'La enfermedad desaparece.'); w.disease = null; }
      E.Events.migration(w);
      if (w.sec % 2 === 0) this.detect(w);
      if (w.sec % 5 === 0) this.legends(w);
      w.sec++;
    },
    detect(w) {
      const gr = { H: 0, C: 0 }; for (const k in w.cnt) gr[C.species[k].kind] += w.cnt[k];
      for (const [key, lbl, n] of [['H', 'herbívoros', gr.H], ['C', 'carnívoros', gr.C]]) for (const m of [50, 100, 200]) if (n >= m && !w.mil[key + m]) { w.mil[key + m] = 1; this.hist(w, '📈', `La población de ${lbl} alcanza ${m}.`); }
      for (const g of [5, 10, 20, 50]) if (w.stats.maxGen >= g && !w.mil['g' + g]) { w.mil['g' + g] = 1; this.hist(w, '🧬', `Se alcanza la generación ${g}.`); }
      const series = { plants: ['plantas', w.plants.length] }; for (const k in C.species) series[k] = [C.species[k].label.toLowerCase() + 's', w.cnt[k]];
      for (const k in series) {
        const [lbl, n] = series[k], win = w.win[k] || (w.win[k] = []); win.push(n); if (win.length > 30) win.shift();
        const mx = Math.max(...win);
        if (n > 0) { w.seen[k] = 1; w.ext[k] = 0; }
        if (n === 0 && w.seen[k] && !w.ext[k] && k !== 'plants') { w.ext[k] = 1; w.stats.extinct++; this.hist(w, '💀', `Se extinguen los ${lbl}.`); this.log(w, '☠️', `Extinción: ${lbl}.`); this.doc(w, '☠️', `EXTINCIÓN: ${lbl}.`, C.W / 2, C.H / 2, null, 4); }
        if (mx >= 12 && n < mx * 0.5 && !w.crash[k]) { w.crash[k] = mx; this.hist(w, '📉', `La población de ${lbl} cae un ${Math.round(100 * (1 - n / mx))}%.`); }
        else if (w.crash[k] && n >= w.crash[k] * 0.8) { delete w.crash[k]; this.hist(w, '🌿', `La población de ${lbl} se recupera.`); }
      }
    },
    // Animales excepcionales (siguen en el historial aunque mueran).
    legends(w) {
      for (const cat in CATS) {
        const f = CATS[cat][3]; let best = null, bv = -1;
        for (const a of w.animals) if (a.alive) { const v = f(a); if (v > bv) { bv = v; best = a; } }
        const cur = w.legend[cat];
        if (!best || bv <= 0) continue;
        if (cur && cur.id === best.id) { Object.assign(cur, this.snap(best, bv)); continue; }
        if (!cur || bv > cur.val * (cat === 'fast' || cat === 'per' ? 1.02 : 1)) {
          w.legend[cat] = this.snap(best, bv);
          if (cur && w.time > 120) { this.log(w, '👑', `${nm(best)} rompe el récord de ${CATS[cat][1].toLowerCase()}.`, best.id, best.x, best.y); this.doc(w, '👑', `${nm(best)} rompe el récord: ${CATS[cat][1].toLowerCase()}.`, best.x, best.y, best.id, 3); }
          if (cat === 'hunt' && bv >= 5 && !w.mil.big) { w.mil.big = 1; this.hist(w, '🐺', `Aparece el primer gran depredador: ${nm(best)}.`); }
        }
      }
    },
    snap(a, val) { return { id: a.id, sp: a.sp, name: a.name, val, gen: a.gen, kills: a.kills, off: a.offspring, desc: a.desc, age: a.age, alive: a.alive }; },
  };
})(Eco);

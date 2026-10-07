// Modo dios y botones de caos. Todo pasa por aquí para poder probarlo sin interfaz.
(function (E) {
  const U = E.U, C = E.CFG;
  const X = E.Exp = {
    add(w, kind, n, cx, cy) {
      for (let i = 0; i < n; i++) {
        let x, y;
        if (cx === undefined) { const p = w.randWalk(); x = p.x; y = p.y; } else { x = U.clamp(cx + U.rand(-170, 170), 20, C.W - 20); y = U.clamp(cy + U.rand(-170, 170), 20, C.H - 20); }
        if (kind === 'plant') { if (w.fertAt(x, y) > 0) E.Plants.add(w, x, y, U.rand(5, 40)); }
        else if (w.walk(x, y)) E.Animals.create(w, kind, x, y);
      }
      w.spark('ring', cx ?? C.W / 2, cy ?? C.H / 2, '#fff', 1);
    },
    clear(w, f) { for (const a of w.animals) if (a.alive && f(a)) w.kill(a, 'removed'); },
    plantsKill(w, frac) { for (const p of w.plants) if (p.alive && Math.random() < frac) w.rmPlant(p); },
    run(w, name, cx, cy) {
      const logs = { overpop: 'SUPERPOBLACIÓN', carnonly: 'SOLO CARNÍVOROS', herbonly: 'SOLO HERBÍVOROS', noplants: 'EXTINCIÓN VEGETAL', invasion: 'INVASIÓN', xdrought: 'SEQUÍA EXTREMA', abundance: 'ABUNDANCIA TOTAL', chaos: 'CAOS' };
      E.Story.log(w, '💥', `¿Qué pasa si...? ${logs[name]}`); E.Story.hist(w, '💥', `El jugador provoca: ${logs[name]}.`);
      switch (name) {
        case 'overpop': this.add(w, 'deer', 60, cx, cy); this.add(w, 'rabbit', 40, cx, cy); break;
        case 'carnonly': this.clear(w, a => a.kind === 'H'); this.add(w, 'wolf', 12, cx, cy); break;
        case 'herbonly': this.clear(w, a => a.kind === 'C'); this.add(w, 'deer', 40, cx, cy); break;
        case 'noplants': this.plantsKill(w, 0.95); break;
        case 'invasion': E.Events.invade(w); E.Events.invade(w); break;
        case 'xdrought': E.Events.start(w, 'drought'); E.Events.start(w, 'heat'); w.events.forEach(e => { if (e.type === 'drought') e.dur = 150; }); break;
        case 'abundance': this.add(w, 'plant', 250, cx, cy); E.Events.start(w, 'rain'); this.add(w, 'deer', 20, cx, cy); break;
        case 'chaos': {
          const pool = ['overpop', 'carnonly', 'noplants', 'invasion', 'xdrought', 'abundance'], ev = ['fire', 'flood', 'disease', 'storm', 'cold'];
          this.add(w, 'wolf', 6, cx, cy); E.Events.start(w, U.pick(ev)); E.Events.start(w, U.pick(ev));
          if (Math.random() < 0.7) this.run(w, U.pick(pool.filter(p => p !== 'carnonly')), cx, cy);
          break;
        }
      }
    },
  };
})(Eco);

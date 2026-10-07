(function (E) {
  const U = E.U, C = E.CFG;
  E.Plants = {
    CAP: 900,
    add(w, x, y, hp) { const p = { x, y, hp, max: 40, age: 0, alive: true }; w.plants.push(p); w.pg.add(p); return p; },
    // Nacer -> crecer -> ser comida / marchitarse -> desaparecer. Depende de terreno, agua, estación y clima.
    update(w, dt) {
      const g = w.env.g * w.M.plant * w.D.plant, P = w.plants;
      for (const p of P) {
        if (!p.alive) continue;
        const f = w.fertAt(p.x, p.y) * g; p.age += dt;
        if (p.hp < p.max) p.hp += dt * f * 1.7; else if (f < 0.4) p.hp -= (0.4 - f) * 3 * dt;
        if (p.hp < 2 && p.age > 5 || (p.age > 320 && Math.random() < dt * 0.004)) w.rmPlant(p);
      }
      w.seedT -= dt;
      while (w.seedT <= 0 && P.length) {
        w.seedT += 0.07 / Math.max(0.15, g);
        const s = P[Math.random() * P.length | 0];
        if (!s.alive || s.hp < s.max * 0.9 || P.length >= this.CAP) continue;
        const a = Math.random() * 6.28, d = U.rand(20, 70), x = s.x + Math.cos(a) * d, y = s.y + Math.sin(a) * d;
        if (x < 5 || y < 5 || x > C.W - 5 || y > C.H - 5) continue;
        const f = w.fertAt(x, y);
        if (f > 0 && Math.random() < Math.min(1, f * 0.6) && w.pg.q(x, y, 35, w.tmp2).length < 4) this.add(w, x, y, 3);
      }
      if (P.length < 6 && Math.random() < dt * 0.05) { const p = w.randWalk(); if (w.fertAt(p.x, p.y) > 0) this.add(w, p.x, p.y, 3); } // semillas del viento
    },
  };
})(Eco);

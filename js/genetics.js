(function (E) {
  const U = E.U, C = E.CFG;
  E.Genes = {
    founder(sp) { const b = C.species[sp].base, g = {}; for (const k in b) g[k] = b[k] ? b[k] * (1 + U.gauss() * 0.06) : 0; return g; },
    // Media de los padres + mutación (a veces grande). Devuelve también la mutación más notable.
    child(sp, a, b) {
      const B = C.species[sp].base, g = {}; let best = null;
      for (const k in B) {
        if (!B[k]) { g[k] = 0; continue; }
        const m = (a[k] + b[k]) / 2, v = U.clamp(m * (1 + U.gauss() * (Math.random() < 0.12 ? 0.12 : 0.035)), B[k] * 0.55, B[k] * (k === 'aggression' ? 1.6 : 1.8));
        g[k] = v;
        const p = v / m - 1; if (!best || Math.abs(p) > Math.abs(best.p)) best = { k, p };
      }
      if (g.aggression > 1) g.aggression = 1;
      return { genes: g, mut: best && Math.abs(best.p) >= 0.03 ? best : null };
    },
    derive(a) { const g = a.genes; a.maxHp = 70 * g.size * (0.6 + 0.4 * g.resistance); a.r = 7 * g.size; },
  };
})(Eco);

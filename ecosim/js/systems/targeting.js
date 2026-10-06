// Selección de objetivo: separada de la percepción y del comportamiento.
Eco.TargetSelector = {
  priorities: {
    nearest: (o, t) => -Eco.Utils.dist(o, t),
    richest: (o, t) => t.hp * 0.6 - Eco.Utils.dist(o, t),
  },
  // Un objetivo ya fijado se conserva aunque salga del sensor (con tolerancia).
  valid(o, t) {
    return t.alive && (!t.claimedBy || t.claimedBy === o.id) &&
      Eco.Utils.dist(o, t) <= o.spec.perception.sensor.range * 1.5 + t.radius;
  },
  update(world) {
    for (const o of world.byKind('animal')) {
      if (o.target && !this.valid(o, o.target)) o.target = null;
      if (o.target || o.cooldown > 0 || !o.visible.length) continue;
      const score = this.priorities[o.spec.priority || 'nearest'];
      let best = null, bestScore = -Infinity;
      for (const t of o.visible) {
        if (!this.valid(o, t)) continue;
        const s = score(o, t);
        if (s > bestScore) { bestScore = s; best = t; }
      }
      o.target = best;
    }
  },
};

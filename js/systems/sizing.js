// Única fuente de verdad de la relación HP -> tamaño.
Eco.Sizing = {
  targetRadius(o) {
    const s = o.spec.size, f = Eco.Utils.clamp(o.hp / o.maxHp, 0, 1);
    return s.min + (s.max - s.min) * Math.sqrt(f);
  },
  update(world, dt) {
    for (const k of ['plant', 'animal'])
      for (const o of world.byKind(k)) o.radius = Eco.Utils.smooth(o.radius, this.targetRadius(o), o.spec.size.smoothing, dt);
  },
};

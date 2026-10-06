// Sensores: cada uno decide si `o` ve a `t`. Registrar uno nuevo = añadir una entrada.
Eco.Sensors = {
  circle: { sees: (o, t, s) => Eco.Utils.dist(o, t) - t.radius <= s.range },
  cone: {
    sees(o, t, s) {
      const U = Eco.Utils, d = U.dist(o, t);
      if (d - t.radius > s.range) return false;
      if (d <= o.radius + t.radius) return true;
      const half = (s.angle * Math.PI / 180) / 2;
      return Math.abs(U.angleDiff(o.heading, U.angleTo(o, t))) <= half;
    },
  },
};

// Solo percibe: rellena `o.visible`. No decide nada.
Eco.Perception = {
  update(world) {
    for (const o of world.byKind('animal')) {
      const { sensor, targets } = o.spec.perception, sensing = Eco.Sensors[sensor.type];
      o.visible.length = 0;
      for (const key of targets)
        for (const t of world.bySpecies(key)) if (t.alive && sensing.sees(o, t, sensor)) o.visible.push(t);
    }
  },
};

// Edad, crecimiento de plantas y muerte. Punto de extensión: vejez, enfermedades, reproducción.
Eco.Lifecycle = {
  update(world, dt) {
    for (const p of world.byKind('plant')) {
      p.age += dt;
      p.hp = Math.min(p.maxHp, p.hp + p.spec.growthRate * dt);
      const f = p.hp / p.maxHp;
      p.state = p.claimedBy ? 'BEING_EATEN' : f < 0.34 ? 'SPROUT' : f < 0.99 ? 'GROWING' : 'MATURE';
    }
    for (const a of world.byKind('animal')) {
      a.age += dt;
      if (a.hp <= 0) {
        Eco.Effects.ring(world, a.x, a.y, { color: '160,160,160', from: a.radius, to: a.radius + 24, dur: 0.8 });
        world.remove(a, 'starved');
      }
    }
  },
};

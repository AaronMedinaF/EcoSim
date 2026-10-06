// Efectos visuales efímeros (anillos, textos flotantes). Viven en world.effects.
Eco.Effects = {
  add(world, fx) { world.effects.push(Object.assign({ t: 0, dur: 0.8 }, fx)); },
  ring(world, x, y, o) { this.add(world, { type: 'ring', x, y, ...o }); },
  text(world, x, y, text, color) { this.add(world, { type: 'text', x, y, text, color, dur: 1.1 }); },
  update(world, dt) {
    for (const fx of world.effects) fx.t += dt;
    world.effects = world.effects.filter(fx => fx.t < fx.dur);
  },
};

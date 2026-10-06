Eco.Spawning = {
  init(world) {
    for (const [key, cfg] of Object.entries(world.config.spawn)) {
      world.nextSpawn[key] = cfg.delay || 0;
      for (let i = 0; i < cfg.initial; i++) this.spawn(world, key);
    }
  },
  update(world, dt) {
    for (const [key, cfg] of Object.entries(world.config.spawn)) {
      world.nextSpawn[key] -= dt;
      if (world.nextSpawn[key] > 0) continue;
      world.nextSpawn[key] = cfg.interval;
      for (let i = 0; i < cfg.batch && world.bySpecies(key).length < cfg.max; i++) this.spawn(world, key);
    }
  },
  spawn(world, key, x, y) {
    const U = Eco.Utils, m = 20;
    x = x ?? U.rand(m, world.width - m);
    y = y ?? U.rand(m, world.height - m);
    Eco.Effects.ring(world, x, y, { color: '255,255,255', from: 2, to: 24, dur: 0.6 });
    return world.add(Eco.Species.create(key, x, y));
  },
};

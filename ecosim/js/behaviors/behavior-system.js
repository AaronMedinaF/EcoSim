Eco.BehaviorSystem = {
  update(world, dt) {
    for (const o of world.byKind('animal')) {
      o.cooldown = Math.max(0, o.cooldown - dt);
      o.brain.update(world, dt);
    }
  },
};

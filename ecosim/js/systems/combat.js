Eco.Combat = {
  // Resuelve un ataque: éxito si la presa sigue al alcance y la tirada acompaña.
  strike(attacker, prey, world) {
    const U = Eco.Utils, s = attacker.spec;
    const inReach = prey.alive && U.dist(attacker, prey) <= attacker.radius + prey.radius + s.reach * 3;
    if (inReach && Math.random() < s.attackSuccess) {
      Eco.Effects.ring(world, prey.x, prey.y, { color: '255,70,70', from: prey.radius, to: prey.radius + 30, dur: 0.6 });
      Eco.Feeding.consume(attacker, prey, world, 'predated');
      return true;
    }
    Eco.Effects.text(world, attacker.x, attacker.y - attacker.radius - 14, 'fallo', '200,200,200');
    return false;
  },
};

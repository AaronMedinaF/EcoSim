Eco.Feeding = {
  // Transfiere los HP de la comida al comensal y elimina la comida.
  consume(eater, food, world, cause) {
    const gain = food.hp * eater.spec.feedEfficiency;
    eater.hp = Math.min(eater.maxHp, eater.hp + gain);
    world.remove(food, cause);
    Eco.Effects.text(world, eater.x, eater.y - eater.radius - 14, '+' + Math.round(gain), '255,235,120');
    return gain;
  },
};

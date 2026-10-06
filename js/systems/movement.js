Eco.Steering = {
  // Deambular: mantiene rumbo y lo cambia ocasionalmente; vuelve al centro cerca de los bordes.
  wander(o, world, dt) {
    const U = Eco.Utils, m = world.config.world.edgeMargin;
    o.wanderTimer -= dt;
    if (o.x < m || o.y < m || o.x > world.width - m || o.y > world.height - m) {
      o.desiredHeading = U.angleTo(o, { x: world.width / 2, y: world.height / 2 });
      o.wanderTimer = 1;
    } else if (o.wanderTimer <= 0) {
      o.desiredHeading = o.heading + U.rand(-1, 1) * o.spec.wanderTurn;
      o.wanderTimer = U.rand(1.5, 4);
    }
  },
};

// Aplica giro suave, velocidad, límites del mundo y coste de movimiento (HP por distancia).
Eco.Movement = {
  update(world, dt) {
    const U = Eco.Utils;
    for (const o of world.byKind('animal')) {
      const s = o.spec, maxTurn = s.turnRate * dt;
      o.heading += U.clamp(U.angleDiff(o.heading, o.desiredHeading), -maxTurn, maxTurn);
      o.speedNow = U.smooth(o.speedNow, s.speed * o.speedMul * o.throttle, 8, dt);
      const d = o.speedNow * dt;
      if (d < 1e-4) continue;
      o.x = U.clamp(o.x + Math.cos(o.heading) * d, o.radius, world.width - o.radius);
      o.y = U.clamp(o.y + Math.sin(o.heading) * d, o.radius, world.height - o.radius);
      o.hp -= d * s.moveCost;
      o.distanceTravelled += d;
    }
  },
};

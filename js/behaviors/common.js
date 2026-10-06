// Estados reutilizables por cualquier animal.
Eco.Behaviors = {};
Eco.Behaviors.common = {
  wandering: {
    enter(o) { o.throttle = 1; o.speedMul = o.spec.wanderSpeedMul || 1; },
    update(o, w, dt) {
      Eco.Steering.wander(o, w, dt);
      if (o.target) o.brain.set('DETECTING', w);
    },
  },
  detecting: {
    enter(o) { o.throttle = 0; },
    update(o, w) {
      if (!o.target) return o.brain.set('WANDERING', w);
      o.desiredHeading = Eco.Utils.angleTo(o, o.target);
      if (o.stateTime >= o.spec.reactionTime) o.brain.set('CHASING', w);
    },
  },
  // Persigue al objetivo y pasa a `engageState` al estar al alcance.
  chasing(engageState) {
    return {
      enter(o) { o.throttle = 1; o.speedMul = o.spec.chaseSpeedMul || 1; },
      update(o, w) {
        const t = o.target, U = Eco.Utils;
        if (!t || (t.claimedBy && t.claimedBy !== o.id)) { o.target = null; return o.brain.set('WANDERING', w); }
        o.desiredHeading = U.angleTo(o, t);
        if (U.dist(o, t) <= o.radius + t.radius * 0.6 + o.spec.reach) o.brain.set(engageState, w);
      },
    };
  },
};

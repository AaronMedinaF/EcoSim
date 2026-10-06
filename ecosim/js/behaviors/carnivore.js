(function () {
  const C = Eco.Behaviors.common;
  Eco.Behaviors.carnivore = {
    WANDERING: C.wandering,
    DETECTING: C.detecting,
    CHASING: C.chasing('ATTACKING'),
    ATTACKING: {
      enter(o) { o.throttle = 0; },
      update(o, w) {
        const t = o.target;
        if (!t || !t.alive) { o.target = null; return o.brain.set('WANDERING', w); }
        o.desiredHeading = Eco.Utils.angleTo(o, t);
        if (o.stateTime >= o.spec.attackWindup) {
          const hit = Eco.Combat.strike(o, t, w);
          o.cooldown = hit ? o.spec.cooldownAfterKill : o.spec.cooldownAfterMiss;
          o.target = null;
          o.brain.set('WANDERING', w);
        }
      },
    },
  };
})();

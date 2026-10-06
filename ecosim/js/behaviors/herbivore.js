(function () {
  const C = Eco.Behaviors.common;
  Eco.Behaviors.herbivore = {
    WANDERING: C.wandering,
    DETECTING: C.detecting,
    CHASING: C.chasing('EATING'),
    EATING: {
      enter(o) { o.throttle = 0; o.target.claimedBy = o.id; },
      update(o, w) {
        const t = o.target;
        if (!t || !t.alive) { o.target = null; return o.brain.set('WANDERING', w); }
        o.desiredHeading = Eco.Utils.angleTo(o, t);
        t.eatProgress = Math.min(o.stateTime / o.spec.eatTime, 1);
        if (t.eatProgress >= 1) {
          Eco.Feeding.consume(o, t, w, 'eaten');
          o.target = null;
          o.brain.set('WANDERING', w);
        }
      },
    },
  };
})();

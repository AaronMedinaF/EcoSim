(function () {
  const U = Eco.Utils;

  // Máquina de estados genérica: `states` = { NOMBRE: { enter, update, exit } }
  class StateMachine {
    constructor(owner, states) { this.owner = owner; this.states = states; this.name = null; }
    set(name, world) {
      if (this.name === name) return;
      this.states[this.name]?.exit?.(this.owner, world);
      this.name = name;
      this.owner.state = name;
      this.owner.stateTime = 0;
      this.states[name].enter?.(this.owner, world);
    }
    update(world, dt) {
      this.owner.stateTime += dt;
      this.states[this.name].update?.(this.owner, world, dt);
    }
  }

  class Organism {
    constructor(spec, x, y) {
      this.id = U.nextId();
      this.spec = spec; this.species = spec.key; this.kind = spec.kind;
      this.x = x; this.y = y;
      this.maxHp = spec.maxHp; this.hp = spec.startHp;
      this.age = 0; this.alive = true;
      this.radius = 0; // crece suavemente desde 0 (animación de aparición)
      this.state = 'SPROUT'; this.stateTime = 0;
    }
  }

  class Plant extends Organism {
    constructor(spec, x, y) { super(spec, x, y); this.claimedBy = null; this.eatProgress = 0; }
  }

  class Animal extends Organism {
    constructor(spec, x, y) {
      super(spec, x, y);
      this.heading = this.desiredHeading = U.rand(0, Math.PI * 2);
      this.throttle = 1; this.speedMul = 1; this.speedNow = 0;
      this.wanderTimer = 0; this.cooldown = 0; this.distanceTravelled = 0;
      this.target = null; this.visible = [];
      this.brain = new StateMachine(this, Eco.Behaviors[spec.behavior]);
    }
    onAdd(world) { this.brain.set('WANDERING', world); }
    onRemove() {
      const t = this.target;
      if (t && t.claimedBy === this.id) { t.claimedBy = null; t.eatProgress = 0; }
    }
  }

  Eco.Species = {
    create(key, x, y) {
      const spec = Eco.CONFIG.species[key];
      return spec.kind === 'plant' ? new Plant(spec, x, y) : new Animal(spec, x, y);
    },
  };
  Eco.StateMachine = StateMachine;
})();

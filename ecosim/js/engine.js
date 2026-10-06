// Motor: timestep fijo con acumulador. La lógica no depende de los FPS ni del render.
Eco.Engine = class Engine {
  constructor(config, systems) {
    this.config = config; this.systems = systems;
    this.running = true; this.speed = 1; this.acc = 0;
    this.reset();
  }
  reset() {
    this.world = new Eco.World(this.config);
    this.acc = 0;
    this.systems.forEach(s => s.init?.(this.world));
  }
  advance(realDt) {
    if (!this.running) return;
    const { fixedStep, maxStepsPerFrame } = this.config.sim;
    this.acc += Math.min(realDt, 0.25) * this.speed;
    let n = 0;
    while (this.acc >= fixedStep && n++ < maxStepsPerFrame) { this.tick(fixedStep); this.acc -= fixedStep; }
    if (n > maxStepsPerFrame) this.acc = 0;
  }
  tick(dt) {
    this.world.time += dt;
    for (const s of this.systems) s.update(this.world, dt);
    this.world.flush();
  }
};

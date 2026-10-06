(function () {
  // Orden de ejecución de los sistemas en cada tick (añadir uno nuevo = añadirlo aquí).
  const systems = [
    Eco.Spawning, Eco.Perception, Eco.TargetSelector, Eco.BehaviorSystem,
    Eco.Movement, Eco.Lifecycle, Eco.Sizing, Eco.Effects, Eco.Stats,
  ];
  const engine = new Eco.Engine(Eco.CONFIG, systems);
  const renderer = new Eco.Renderer(document.getElementById('world'));
  renderer.resize(engine.world);
  const ui = new Eco.UI(engine, renderer);

  let last = performance.now(), fps = 60;
  function frame(now) {
    const dt = (now - last) / 1000; last = now;
    fps = Eco.Utils.lerp(fps, 1 / Math.max(dt, 1e-3), 0.1);
    engine.advance(dt);
    renderer.draw(engine.world, { showPerception: ui.showPerception });
    ui.refresh(fps, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

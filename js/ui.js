Eco.UI = class UI {
  constructor(engine, renderer) {
    const C = engine.config, $ = id => document.getElementById(id);
    this.engine = engine; this.last = 0;
    this.showPerception = C.debug.showPerception;
    this.rows = {};

    const addRow = (key, label) => {
      const d = document.createElement('div');
      d.className = 'row'; d.innerHTML = `<span>${label}</span><b>0</b>`;
      $('stats').appendChild(d); this.rows[key] = d.lastChild;
    };
    Object.entries(C.species).forEach(([k, s]) => addRow(k, s.label));
    [['total', 'Población total'], ['time', 'Tiempo'], ['fps', 'FPS'], ['starved', 'Muertes por inanición'], ['predated', 'Presas cazadas']]
      .forEach(([k, l]) => addRow(k, l));

    Object.entries(C.species).forEach(([k, s]) => {
      const n = C.manualSpawn[k] || 1, b = document.createElement('button');
      b.textContent = `+${n} ${s.label}`;
      b.onclick = () => { for (let i = 0; i < n; i++) Eco.Spawning.spawn(engine.world, k); };
      $('spawners').appendChild(b);
    });

    $('toggle').onclick = e => { engine.running = !engine.running; e.target.textContent = engine.running ? 'Pausar' : 'Iniciar'; };
    $('reset').onclick = () => { engine.reset(); renderer.resize(engine.world); };
    C.sim.speeds.forEach(v => $('speed').add(new Option(v + 'x', v, v === 1, v === 1)));
    $('speed').onchange = e => { engine.speed = +e.target.value; };
    $('perception').checked = this.showPerception;
    $('perception').onchange = e => { this.showPerception = e.target.checked; };
  }

  refresh(fps, now) {
    if (now - this.last < 200) return;
    this.last = now;
    const w = this.engine.world, c = w.stats.counts, t = Math.floor(w.time);
    for (const k in c) if (this.rows[k]) this.rows[k].textContent = c[k];
    this.rows.time.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    this.rows.fps.textContent = Math.round(fps);
    this.rows.starved.textContent = w.counters.starved;
    this.rows.predated.textContent = w.counters.predated;
  }
};

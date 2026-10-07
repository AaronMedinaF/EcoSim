(function (E) {
  const U = E.U, C = E.CFG;
  const app = {
    w: null, r: null, ui: null, speed: 1, paused: false, doc: false, sel: null, docLast: -99, docSeen: -1, watch: 0,
    start(o) { const w = new E.World(o); w.seed(o.p, o.h, o.c); this.attach(w); E.Story.hist(w, '🌍', `Nace un mundo: ${C.maps[o.map].label}.`); this.ui.toast('🌍', 'Mundo creado'); },
    load(name) { const s = E.Save.all()[name]; if (!s) return this.ui.toast('⚠️', 'No existe ese mundo'); this.attach(E.Save.restore(s)); this.ui.toast('📂', 'Mundo cargado'); },
    attach(w) { this.w = w; this.sel = null; this.r.build(w); this.r.reset(); this.paused = false; document.getElementById('bPlay').textContent = '⏸️'; this.ui.showMenu(false); this.ui.build(); this.ui.update(true); this.docLast = -99; this.docSeen = -1; },
    skip() { if (!this.w) return; for (let i = 0, n = C.DAY / C.TICK; i < n; i++) E.Sim.step(this.w, C.TICK); this.w.fx.length = 0; this.ui.toast('⏭️', 'Un día después...'); },
    docTick() {
      const w = this.w; if (!this.doc || w.time - this.docLast < 7) return;
      let best = null; for (const d of w.doc) if (d.t > this.docSeen && w.time - d.t < 10 && (!best || d.prio > best.prio || (d.prio === best.prio && d.t > best.t))) best = d;
      if (!best) return;
      this.docLast = w.time; this.docSeen = w.time; this.ui.banner(best);
      const a = best.id && w.byId.get(best.id);
      if (a && a.alive) { this.sel = a; this.r.cam.goal = null; this.r.cam.f = a; this.r.cam.z = Math.max(this.r.cam.z, 2); } else this.r.goTo(best.x, best.y);
      w.doc.length = 0;
    },
  };
  app.r = new E.Render(document.getElementById('cv'));
  app.ui = new E.UI(app);
  window.EcoApp = app;
  let last = performance.now(), acc = 0, autoT = 0;
  function frame(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    const w = app.w;
    if (w) {
      if (!app.paused) {
        acc += dt * app.speed; let n = 0;
        while (acc >= C.TICK && n < 60) { E.Sim.step(w, C.TICK); acc -= C.TICK; n++; }
        if (n >= 60) acc = 0;
        if (app.sel && app.sel.alive) { if (app.watchId === app.sel.id) w.tr.watch = (w.tr.watch || 0) + dt * app.speed; else app.watchId = app.sel.id; }
        if ((autoT += dt) > 30) { autoT = 0; E.Save.put('__auto__', w); }
        app.docTick();
      }
      app.r.draw(w, dt, app.sel, false);
      if ((app.ui.fc = (app.ui.fc || 0) + dt) > 0.25) { app.ui.fc = 0; app.ui.update(false); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('beforeunload', () => { if (app.w) E.Save.put('__auto__', app.w); });
})(Eco);

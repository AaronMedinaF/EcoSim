(function (E) {
  const U = E.U, C = E.CFG;
  // Rejilla espacial: las consultas de vecinos no recorren todos los organismos.
  E.Grid = class {
    constructor(cs) { this.cs = cs; this.c = Math.ceil(C.W / cs); this.r = Math.ceil(C.H / cs); this.cells = Array.from({ length: this.c * this.r }, () => []); }
    clear() { for (const c of this.cells) c.length = 0; }
    add(o) { this.cells[U.clamp(o.y / this.cs | 0, 0, this.r - 1) * this.c + U.clamp(o.x / this.cs | 0, 0, this.c - 1)].push(o); }
    q(x, y, r, out) {
      out.length = 0; const cs = this.cs;
      const x0 = U.clamp((x - r) / cs | 0, 0, this.c - 1), x1 = U.clamp((x + r) / cs | 0, 0, this.c - 1);
      const y0 = U.clamp((y - r) / cs | 0, 0, this.r - 1), y1 = U.clamp((y + r) / cs | 0, 0, this.r - 1);
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const c = this.cells[j * this.c + i]; for (let k = 0; k < c.length; k++) out.push(c[k]); }
      return out;
    }
  };

  E.World = class {
    constructor(o) {
      this.map = o.map; this.M = C.maps[o.map]; this.diff = o.diff || 'balanced'; this.D = C.diff[this.diff];
      this.cols = C.W / C.CELL; this.rows = C.H / C.CELL;
      this.tiles = new Uint8Array(this.cols * this.rows); this.moist = new Float32Array(this.tiles.length);
      this.plants = []; this.animals = []; this.dead = []; this.byId = new Map(); this.events = []; this.fx = [];
      this.log = []; this.story = []; this.hist = []; this.doc = []; this.legend = {}; this.mil = {}; this.crash = {}; this.win = {}; this.seen = {}; this.ext = {};
      this.cnt = {}; for (const k in C.species) this.cnt[k] = 0;
      this.time = 0; this.tick = 0; this.sec = 0; this.env = { g: 1, d: 1, p: 1 }; this.disease = null; this.lastEv = null;
      this.next = U.rand(150, 260) / this.D.ev; this.inv = U.rand(420, 700); this.seedT = 0; this.ver = 0; this.hver = 0; this.acc = {}; this.tr = {}; this.chal = [];
      this.stats = { births: 0, deaths: 0, hunts: 0, eaten: 0, extinct: 0, events: 0, maxGen: 1, causes: {} };
      this.pg = new E.Grid(50); this.ag = new E.Grid(60); this.pd = true; this.tmp = []; this.tmp2 = [];
      if (o.tiles) this.tiles.set(o.tiles); else this.gen();
      this.calcMoist();
      E.Meta.initChal(this);
    }
    gen() {
      const M = this.M, keys = Object.keys(M.w), tot = keys.reduce((s, k) => s + M.w[k], 0), seeds = [];
      for (let i = 0; i < 16; i++) {
        let r = Math.random() * tot, t = +keys[0];
        for (const k of keys) { r -= M.w[k]; if (r <= 0) { t = +k; break; } }
        seeds.push({ x: U.rand(0, this.cols), y: U.rand(0, this.rows), t });
      }
      for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
        let b = 1e9, t = 0;
        for (const s of seeds) { const d = (s.x - x) ** 2 + (s.y - y) ** 2 + U.rand(0, 14); if (d < b) { b = d; t = s.t; } }
        this.tiles[y * this.cols + x] = t;
      }
      for (let i = 0; i < M.ponds; i++) {
        const cx = U.rand(3, this.cols - 3), cy = U.rand(3, this.rows - 3), r = U.rand(1.6, 3.6);
        for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if ((x - cx) ** 2 + (y - cy) ** 2 < r * r * U.rand(0.7, 1.3)) this.tiles[y * this.cols + x] = 4;
      }
      for (let i = 0; i < this.tiles.length; i++) if (this.tiles[i] !== 4 && Math.random() < M.rocks) this.tiles[i] = 5;
    }
    calcMoist() {
      const R = 3;
      for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
        let n = 0;
        for (let j = Math.max(0, y - R); j <= Math.min(this.rows - 1, y + R); j++) for (let i = Math.max(0, x - R); i <= Math.min(this.cols - 1, x + R); i++) if (this.tiles[j * this.cols + i] === 4) n++;
        this.moist[y * this.cols + x] = 1 + 0.4 * Math.min(1, n / 8);
      }
    }
    idx(x, y) { return U.clamp(y / C.CELL | 0, 0, this.rows - 1) * this.cols + U.clamp(x / C.CELL | 0, 0, this.cols - 1); }
    tileAt(x, y) { return this.tiles[this.idx(x, y)]; }
    walk(x, y) { const t = this.tileAt(x, y); return t !== 4 && t !== 5; }
    fertAt(x, y) { const i = this.idx(x, y); return C.tiles[this.tiles[i]].f * this.moist[i]; }
    day() { return Math.floor(this.time / C.DAY) + 1; }
    season() { return Math.floor((this.day() - 1) / C.SEASON_DAYS) % 4; }
    seasonProg() { return ((this.time / C.DAY) % C.SEASON_DAYS) / C.SEASON_DAYS; }
    randWalk() { for (let i = 0; i < 40; i++) { const x = U.rand(20, C.W - 20), y = U.rand(20, C.H - 20); if (this.walk(x, y)) return { x, y }; } return { x: C.W / 2, y: C.H / 2 }; }
    spark(t, x, y, c, n = 1) {
      for (let i = 0; i < n && this.fx.length < 300; i++) { const a = Math.random() * 6.28, v = U.rand(10, 40), l = t === 'ring' ? 0.7 : U.rand(0.5, 1); this.fx.push({ t, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (t === 'heart' ? 25 : 0), l, m: l, c }); }
    }
    rmPlant(p) { p.alive = false; this.pd = true; }
    kill(a, cause, by) {
      if (!a.alive) return;
      a.alive = false; a.cause = cause; a.died = this.time; this.cnt[a.sp]--;
      if (cause !== 'removed') { this.stats.deaths++; this.stats.causes[cause] = (this.stats.causes[cause] || 0) + 1; E.Story.death(this, a, cause, by); }
      this.dead.push(a); if (this.dead.length > 300) this.byId.delete(this.dead.shift().id);
    }
    paint(x, y, t, r) {
      const cx = x / C.CELL, cy = y / C.CELL;
      for (let j = 0; j < this.rows; j++) for (let i = 0; i < this.cols; i++) if ((i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r) this.tiles[j * this.cols + i] = t;
      this.calcMoist();
    }
    seed(np, nh, nc) {
      for (let i = 0, n = 0; i < np && n < np * 20; n++) { const x = U.rand(10, C.W - 10), y = U.rand(10, C.H - 10); if (Math.random() * 1.5 < this.fertAt(x, y)) { E.Plants.add(this, x, y, U.rand(5, 40)); i++; } }
      for (let i = 0; i < nh; i++) { const p = this.randWalk(); E.Animals.create(this, 'deer', p.x, p.y); }
      for (let i = 0; i < nc; i++) { const p = this.randWalk(); E.Animals.create(this, 'wolf', p.x, p.y); }
    }
  };

  E.Sim = {
    step(w, dt) {
      w.time += dt; w.tick++;
      E.Events.update(w, dt); E.Plants.update(w, dt);
      w.ag.clear(); for (const a of w.animals) if (a.alive) w.ag.add(a);
      if (w.pd) { w.plants = w.plants.filter(p => p.alive); w.pg.clear(); for (const p of w.plants) w.pg.add(p); w.pd = false; }
      E.Animals.update(w, dt);
      if ((w.acc.s = (w.acc.s || 0) + dt) >= 1) { w.acc.s = 0; E.Story.second(w); }
      if ((w.acc.m = (w.acc.m || 0) + dt) >= 2) { w.acc.m = 0; E.Meta.check(w); }
      if ((w.acc.h = (w.acc.h || 0) + dt) >= 3) { w.acc.h = 0; E.Meta.sample(w); }
    },
  };
})(Eco);

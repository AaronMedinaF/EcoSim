// Mundos guardados (varias ranuras con nombre) + autoguardado.
(function (E) {
  const U = E.U;
  E.Save = {
    KEY: 'ecosim3.worlds',
    all() { try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch (e) { return {}; } },
    put(name, w) { try { const a = this.all(); a[name] = this.snap(w); localStorage.setItem(this.KEY, JSON.stringify(a)); return true; } catch (e) { return false; } },
    del(name) { try { const a = this.all(); delete a[name]; localStorage.setItem(this.KEY, JSON.stringify(a)); } catch (e) { /* */ } },
    snap(w) {
      const r = v => +v.toFixed(1);
      return {
        v: 3, map: w.map, diff: w.diff, time: w.time, date: Date.now(), nid: U.id, tiles: Array.from(w.tiles), next: w.next, inv: w.inv,
        plants: w.plants.filter(p => p.alive).map(p => [p.x | 0, p.y | 0, r(p.hp), p.age | 0]),
        animals: w.animals.filter(a => a.alive).map(a => [a.sp, r(a.x), r(a.y), r(a.hp), r(a.energy), r(a.age), a.gen, a.genes, a.id, a.parents, a.kills, a.offspring, a.desc, a.eaten, a.dist | 0, a.name, a.sick, a.cd]),
        stats: w.stats, hist: w.hist, log: w.log.slice(-60), story: w.story, legend: w.legend, mil: w.mil, tr: w.tr, chal: w.chal,
        events: w.events.map(e => ({ type: e.type, t: e.t, dur: e.dur, x: e.x, y: e.y, r: e.r })), disease: w.disease,
      };
    },
    restore(s) {
      const w = new E.World({ map: s.map, diff: s.diff, tiles: s.tiles });
      w.time = s.time; w.next = s.next; w.inv = s.inv; Object.assign(w.stats, s.stats); w.hist = s.hist; w.log = s.log; w.story = s.story; w.legend = s.legend; w.mil = s.mil; w.tr = s.tr; w.chal = s.chal;
      w.events = s.events.map(e => ({ ...e, k: 0 })); w.disease = s.disease;
      for (const [x, y, hp, age] of s.plants) { const p = E.Plants.add(w, x, y, hp); p.age = age; }
      for (const a of s.animals) {
        const o = E.Animals.create(w, a[0], a[1], a[2], { genes: a[7], gen: a[6], parents: a[9], age: a[5], energy: a[4], id: a[8] });
        o.hp = a[3]; o.kills = a[10]; o.offspring = a[11]; o.desc = a[12]; o.eaten = a[13]; o.dist = a[14]; o.name = a[15]; o.sick = a[16]; o.cd = a[17];
      }
      U.id = Math.max(U.id, s.nid); w.pd = true;
      return w;
    },
  };
})(Eco);

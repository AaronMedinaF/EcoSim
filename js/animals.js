(function (E) {
  const U = E.U, C = E.CFG, SP = C.species;
  const ready = a => !a.sick && a.cd <= 0 && a.age > 50 && a.energy > 74 && a.hp > a.maxHp * 0.6 && a.state !== 'EAT' && a.state !== 'FLEE' && a.state !== 'HUNT';
  E.Animals = {
    create(w, sp, x, y, o = {}) {
      const a = {
        id: o.id || U.nextId(), sp, kind: SP[sp].kind, x, y, heading: U.rand(0, 6.28), want: 0, speedNow: 0, spdMul: 0.5,
        genes: o.genes || E.Genes.founder(sp), gen: o.gen || 1, parents: o.parents || null, age: o.age ?? U.rand(30, 120), energy: o.energy ?? U.rand(55, 90),
        state: 'WANDER', target: null, think: Math.random() * 0.3, cd: U.rand(5, 30), bite: 0, eatT: 0, chaseStart: 0, ign: null, rest: 0, sick: 0, immune: 0,
        kills: 0, offspring: 0, desc: 0, eaten: 0, dist: 0, alive: true, name: Math.random() < 0.3 ? U.pick(C.names) : null,
        tone: U.rand(-0.12, 0.12), ageMul: 1, spd: 0, per: 0, r: 7, maxHp: 70, hp: 70, dmg: null, cause: null,
      };
      E.Genes.derive(a); a.hp = a.maxHp * (o.child ? 0.7 : 1); a.want = a.heading; a.born = w.time - a.age;
      a.maxAge = a.genes.lifespan * U.rand(0.9, 1.15); a.spd = a.genes.speed; a.per = a.genes.perception;
      w.animals.push(a); w.byId.set(a.id, a); w.cnt[sp]++;
      return a;
    },
    update(w, dt) {
      for (const a of w.animals) if (a.alive) this.tick(w, a, dt);
      const L = w.animals; let j = 0; for (let i = 0; i < L.length; i++) if (L[i].alive) L[j++] = L[i]; L.length = j;
    },
    tick(w, a, dt) {
      const G = a.genes; a.age += dt; a.cd -= dt; a.bite -= dt; a.immune -= dt;
      if (a.age > a.maxAge) return w.kill(a, 'vejez');
      if ((a.think -= dt) <= 0) { a.think = 0.25 + Math.random() * 0.1; this.think(w, a); if (!a.alive) return; }
      if (a.state === 'EAT' && (a.eatT -= dt) <= 0) this.finishEat(w, a);
      this.move(w, a, dt);
      const basal = 0.5 * Math.pow(G.size, 0.75) * (1 + 0.15 * (G.perception / SP[a.sp].base.perception - 1));
      a.energy -= (basal + 2e-4 * a.speedNow * a.speedNow) * dt * w.env.d * w.M.drain * w.D.drain / G.efficiency;
      if (a.energy <= 0) { a.energy = 0; a.hp -= 4 * dt; a.dmg = 'hambre'; } else if (a.hp < a.maxHp && a.energy > 55) a.hp += 1.2 * dt;
      if (a.sick > 0) { a.sick -= dt; a.hp -= 1.5 * dt / G.resistance; a.dmg = 'enfermedad'; if (a.sick <= 0) { a.sick = 0; a.immune = 120; } }
      if (a.hp <= 0) w.kill(a, a.dmg || 'hambre', a.by);
    },
    think(w, a) {
      const G = a.genes;
      a.ageMul = a.age < 25 ? 0.8 : a.age > G.lifespan * 0.7 ? Math.max(0.5, 1 - (a.age - G.lifespan * 0.7) / (G.lifespan * 0.6)) : 1;
      a.spd = G.speed * a.ageMul * (a.sick > 0 ? 0.7 : 1) / Math.pow(G.efficiency, 0.4);
      a.per = G.perception * a.ageMul * w.env.p;
      if (a.sick > 0) this.spread(w, a);
      const hz = E.Events.hazard(w, a);
      if (hz) { a.state = 'FLEE'; a.target = null; a.want = Math.atan2(a.y - hz.y, a.x - hz.x); a.spdMul = 1.4; return; }
      if (a.state === 'EAT' && a.target && a.target.alive) return;
      if (a.kind === 'H') this.thinkH(w, a); else this.thinkC(w, a);
    },
    thinkH(w, a) {
      const per = a.per; w.ag.q(a.x, a.y, per, w.tmp);
      let th = null, bd = per * per * 0.7;
      for (const o of w.tmp) if (o.kind === 'C' && o.alive) { const d = U.d2(a, o); if (d < bd) { bd = d; th = o; } }
      if (th) { a.state = 'FLEE'; a.target = null; a.want = Math.atan2(a.y - th.y, a.x - th.x) + U.rand(-0.5, 0.5); a.spdMul = 1.5; return; }
      if (a.energy < 70) {
        w.pg.q(a.x, a.y, per, w.tmp2); let p = null, b = 1e9;
        for (const o of w.tmp2) if (o.alive && o.hp > 8) { const d = U.d2(a, o); if (d < b) { b = d; p = o; } }
        if (p) {
          a.target = p;
          if (Math.sqrt(b) < a.r + 7) { a.state = 'EAT'; a.eatT = 0.7; a.spdMul = 0; return; }
          a.state = 'SEEK'; a.want = Math.atan2(p.y - a.y, p.x - a.x); a.spdMul = 1; return;
        }
        a.state = 'SEARCH'; if (Math.random() < 0.15) a.want = a.heading + U.rand(-0.8, 0.8); a.spdMul = 0.85; return;
      }
      if (this.tryMate(w, a, per)) return;
      a.state = 'WANDER'; a.spdMul = 0.45; if (Math.random() < 0.2) a.want = a.heading + U.rand(-1, 1);
    },
    thinkC(w, a) {
      const G = a.genes, per = a.per;
      if (a.state === 'REST') { a.rest -= 0.28; a.spdMul = 0; if (a.rest > 0) return; a.state = 'WANDER'; }
      let t = a.target;
      if (a.state === 'HUNT') {
        if (!t || !t.alive || w.time - a.chaseStart > 4 + 6 * G.aggression || U.d2(a, t) > per * per * 2 || (a.energy < 12 && G.aggression < 0.5)) {
          if (t) { a.ign = a.ign || {}; a.ign[t.id] = w.time + 10; } // abandona la persecución
          a.target = null; a.state = 'SEARCH';
        } else {
          a.want = Math.atan2(t.y - a.y, t.x - a.x); a.spdMul = 1.4;
          if (Math.hypot(t.x - a.x, t.y - a.y) < a.r + t.r + 3 && a.bite <= 0) this.bite(w, a, t);
          return;
        }
      }
      if (a.energy < 78) {
        w.ag.q(a.x, a.y, per, w.tmp); let best = null, bs = -1e9;
        for (const o of w.tmp) {
          if (o.kind !== 'H' || !o.alive || (a.ign && a.ign[o.id] > w.time)) continue;
          const dx = o.x - a.x, dy = o.y - a.y, d = Math.hypot(dx, dy);
          if (d > per || (d > 34 && Math.abs(U.ang(a.heading, Math.atan2(dy, dx))) > 1.25)) continue; // cono frontal de ~140°
          let s = -d + (1 - o.hp / o.maxHp) * 90 + (o.sick > 0 ? 50 : 0) + (o.age > o.genes.lifespan * 0.7 ? 40 : 0) + G.aggression * 30;
          if (o.spd > a.spd * 1.25 && G.aggression < 0.7) s -= 80; // los prudentes evitan presas muy rápidas
          if (s > bs) { bs = s; best = o; }
        }
        if (best && bs > -per * (0.45 + 0.5 * G.aggression)) {
          a.target = best; a.state = 'HUNT'; a.chaseStart = w.time; a.spdMul = 1.4; w.stats.hunts++; E.Story.hunt(w, a, best); return;
        }
      }
      if (a.energy > 90) { a.state = 'REST'; a.rest = U.rand(3, 7); a.spdMul = 0; return; }
      if (this.tryMate(w, a, per)) return;
      a.state = 'SEARCH'; if (Math.random() < 0.2) a.want = a.heading + U.rand(-1, 1); a.spdMul = 0.55;
    },
    tryMate(w, a, per) {
      if (!ready(a)) return false;
      w.ag.q(a.x, a.y, Math.min(per, 140), w.tmp); let m = null, b = 1e9;
      for (const o of w.tmp) if (o !== a && o.sp === a.sp && o.alive && ready(o)) { const d = U.d2(a, o); if (d < b) { b = d; m = o; } }
      if (!m) return false;
      if (b > 18 * 18) { a.state = 'MATE'; a.want = Math.atan2(m.y - a.y, m.x - a.x); a.spdMul = 0.9; return true; }
      if (Math.random() < 0.5 * Math.min(1.5, a.genes.fertility)) this.breed(w, a, m);
      return true;
    },
    breed(w, a, m) {
      if (w.cnt[a.sp] >= SP[a.sp].maxPop) return;
      const cost = 28 * Math.pow(a.genes.fertility, 0.6), cd = Math.max(15, 35 / Math.pow(a.genes.fertility, 0.7));
      a.energy -= cost; m.energy -= cost; a.cd = m.cd = cd * U.rand(0.8, 1.2);
      const { genes, mut } = E.Genes.child(a.sp, a.genes, m.genes);
      const c = this.create(w, a.sp, (a.x + m.x) / 2 + U.rand(-8, 8), (a.y + m.y) / 2 + U.rand(-8, 8), { genes, gen: Math.max(a.gen, m.gen) + 1, parents: [a.id, m.id], age: 0, energy: 60, child: true });
      a.offspring++; m.offspring++; a.desc++; m.desc++;
      for (const p of [a, m]) for (const pid of p.parents || []) { const g = w.byId.get(pid); if (g) g.desc++; }
      E.Story.birth(w, c, a, m, mut);
    },
    finishEat(w, a) {
      const p = a.target;
      if (p && p.alive) {
        const b = Math.min(p.hp, 22); p.hp -= b; a.energy = Math.min(100, a.energy + b * 0.9); a.eaten++; w.stats.eaten++;
        w.spark('dot', p.x, p.y, '#8be36a', 4); E.hooks.sound('eat');
        if (p.hp < 6) w.rmPlant(p);
      }
      a.state = 'WANDER'; a.target = null;
    },
    bite(w, a, t) {
      a.bite = 0.8;
      t.hp -= 30 * (0.6 + a.genes.aggression) * Math.sqrt(a.genes.size) / Math.pow(t.genes.resistance, 0.7); t.dmg = 'depredación'; t.by = a;
      w.spark('dot', t.x, t.y, '#e74c3c', 5);
      if (t.hp <= 0) {
        a.kills++; a.energy = Math.min(100, a.energy + 55 * Math.pow(t.genes.size, 0.8)); a.target = null;
        w.kill(t, 'depredación', a); a.state = a.energy > 85 ? 'REST' : 'SEARCH'; a.rest = U.rand(3, 6);
      }
    },
    spread(w, a) {
      w.ag.q(a.x, a.y, 26, w.tmp);
      for (const o of w.tmp) if (o.sp === a.sp && o !== a && o.alive && !o.sick && o.immune <= 0 && Math.random() < 0.12 / o.genes.resistance) o.sick = U.rand(40, 80);
    },
    move(w, a, dt) {
      const turn = a.kind === 'H' ? 5 : 4;
      a.heading += U.clamp(U.ang(a.heading, a.want), -turn * dt, turn * dt);
      const tgt = a.state === 'EAT' || a.state === 'REST' ? 0 : a.spd * a.spdMul;
      a.speedNow += (tgt - a.speedNow) * Math.min(1, 6 * dt);
      const d = a.speedNow * dt; if (d < 1e-3) return;
      const nx = a.x + Math.cos(a.heading) * d, ny = a.y + Math.sin(a.heading) * d;
      if (nx < 15 || ny < 15 || nx > C.W - 15 || ny > C.H - 15) { a.want = Math.atan2(C.H / 2 - a.y, C.W / 2 - a.x) + U.rand(-0.5, 0.5); a.x = U.clamp(nx, 8, C.W - 8); a.y = U.clamp(ny, 8, C.H - 8); return; }
      if (!w.walk(nx, ny)) { a.want = a.heading + (Math.random() < 0.5 ? 1 : -1) * U.rand(1.2, 2.2); a.speedNow *= 0.5; return; }
      a.x = nx; a.y = ny; a.dist += d;
    },
  };
})(Eco);

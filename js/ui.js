// Interfaz: menú de creación, barra, paneles, selección y cámara libre.
(function (E) {
  const U = E.U, C = E.CFG, $ = id => document.getElementById(id);
  const STATE = { WANDER: 'Deambulando', SEARCH: 'Buscando', SEEK: 'Yendo a comer', EAT: 'Comiendo', FLEE: 'Huyendo', HUNT: 'Cazando', REST: 'Descansando', MATE: 'Buscando pareja' };
  const CAUSE = { hambre: 'hambre', depredación: 'depredación', vejez: 'vejez', enfermedad: 'enfermedad', incendio: 'un incendio', inundación: 'una inundación', removed: 'intervención del jugador' };
  const TABS = [['animal', '🔎'], ['exp', '🧪'], ['stats', '📊'], ['story', '📖'], ['ach', '🏆'], ['saves', '💾']];
  const row = (k, v) => `<div class="row"><span>${k}</span><b>${v}</b></div>`;
  const nm = a => `#${a.id}${a.name ? ' ' + a.name : ''}`;

  E.UI = class {
    constructor(app) {
      this.app = app; this.tab = 'animal'; this.open = true; this.mapSel = 'forest'; this.diffSel = 'balanced'; this.gene = 'speed'; this.t = 0; this.lv = -1; this.hv = -1; this.brush = null;
      this.menu(); this.bar(); this.tabs(); this.bind();
      E.hooks.toast = (ic, tx) => this.toast(ic, tx);
    }
    // ---------- menú ----------
    menu() {
      const M = C.maps;
      $('maps').innerHTML = Object.entries(M).map(([k, m]) => `<button data-a="map:${k}" class="${k === this.mapSel ? 'on' : ''}">${m.label.replace(' ', '<br>')}</button>`).join('');
      $('diffs').innerHTML = Object.entries(C.diff).map(([k, d]) => `<button data-a="diff:${k}" class="${k === this.diffSel ? 'on' : ''}">${d.label}</button>`).join('');
      this.sliders(true); this.saves();
    }
    sliders(reset) {
      if (reset) { const d = C.maps[this.mapSel].def; $('np').value = d[0]; $('nh').value = d[1]; $('nc').value = d[2]; }
      $('vp').textContent = $('np').value; $('vh').textContent = $('nh').value; $('vc').textContent = $('nc').value;
    }
    saves() {
      const all = E.Save.all(), k = Object.keys(all);
      $('menuSaves').innerHTML = k.length ? '<h3>MUNDOS GUARDADOS</h3>' + k.map(n => `<div class="sv"><span>${n === '__auto__' ? '⏱ Autoguardado' : '🌍 ' + n} · día ${Math.floor(all[n].time / C.DAY) + 1} · ${C.maps[all[n].map].label}</span><button data-a="loadw:${encodeURIComponent(n)}">Cargar</button></div>`).join('') : '';
    }
    showMenu(on) { $('menu').hidden = !on; $('resume').hidden = !this.app.w; if (on) this.saves(); }
    // ---------- barra ----------
    bar() {
      $('speeds').innerHTML = [0.25, 0.5, 1, 2, 4, 8].map(v => `<button data-a="speed:${v}" class="${v === 1 ? 'on' : ''}">${v}x</button>`).join('');
      const b = document.createElement('button'); b.id = 'bEv'; b.dataset.a = 'goev'; b.textContent = '📍 Ir al evento'; $('bar').insertBefore(b, $('bFit'));
    }
    tabs() { $('tabs').innerHTML = TABS.map(([k, i]) => `<button data-a="tab:${k}" class="${k === this.tab && this.open ? 'on' : ''}">${i}</button>`).join(''); }
    setTab(k) {
      if (k === this.tab && this.open) this.open = false; else { this.tab = k; this.open = true; }
      this.tabs(); $('panel').hidden = !this.open; this.lv = this.hv = -1; if (this.open) this.build();
    }
    build() {
      const p = $('panel'), w = this.app.w;
      if (this.tab === 'animal') p.innerHTML = '<div id="aB"></div>';
      else if (this.tab === 'exp') {
        const add = (k, n, l) => `<button data-a="add:${k}:${n}">+${n} ${l}</button>`;
        p.innerHTML = `<h3>🧪 EXPERIMENTOS</h3><div class="btns">${add('plant', 10, '🌱')}${add('plant', 50, '🌱')}${add('plant', 100, '🌱')}${add('deer', 5, '🦌')}${add('deer', 20, '🦌')}${add('rabbit', 10, '🐇')}${add('wolf', 1, '🐺')}${add('wolf', 10, '🐺')}${add('lynx', 3, '🐆')}</div>
        <div class="mut">Se sueltan en el centro de la vista.</div><h3>ACCIONES ESPECIALES</h3>
        <div class="btns">${['rain', 'drought', 'fire', 'cold', 'disease', 'flood', 'storm', 'heat'].map(k => `<button data-a="ev:${k}">${E.Events.T[k].i} ${E.Events.T[k].n}</button>`).join('')}<button data-a="inv">⚠️ Invasora</button></div>
        <h3>💀 ¿QUÉ PASA SI...?</h3><div class="btns two">${[['overpop', 'SUPERPOBLACIÓN'], ['carnonly', 'SOLO CARNÍVOROS'], ['herbonly', 'SOLO HERBÍVOROS'], ['noplants', 'EXTINCIÓN VEGETAL'], ['invasion', 'INVASIÓN'], ['xdrought', 'SEQUÍA EXTREMA'], ['abundance', 'ABUNDANCIA TOTAL'], ['chaos', '🎲 CAOS']].map(([k, l]) => `<button data-a="what:${k}">${l}</button>`).join('')}</div>
        <h3>🖌️ PINTAR TERRENO</h3><div class="btns">${[[null, '✋ Nada'], [0, '🌾'], [1, '🌳'], [2, '🏜️'], [3, '❄️'], [4, '💧']].map(([k, l]) => `<button data-a="brush:${k}" class="${this.brush === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      } else if (this.tab === 'stats') p.innerHTML = `<div id="sB"></div><canvas id="c1" width="640" height="240"></canvas><h3>EVOLUCIÓN <select id="gs">${Object.entries(C.genes).map(([k, l]) => `<option value="${k}" ${k === this.gene ? 'selected' : ''}>${l}</option>`).join('')}</select></h3><canvas id="c2" width="640" height="240"></canvas>`;
      else if (this.tab === 'story') p.innerHTML = '<h3>🏆 LEYENDAS</h3><div id="lgB"></div><h3>📖 HISTORIA</h3><div id="hsB"></div>';
      else if (this.tab === 'ach') p.innerHTML = '<h3>🎯 DESAFÍOS</h3><div id="chB"></div><h3>🏆 LOGROS</h3><div id="acB"></div>';
      else this.buildSaves();
      this.update(true);
    }
    buildSaves() {
      const all = E.Save.all(), k = Object.keys(all).filter(n => n !== '__auto__');
      $('panel').innerHTML = `<h3>💾 MUNDOS</h3><div class="row"><input type="text" id="sn" placeholder="Nombre del mundo" style="flex:1"><button data-a="savew">Guardar</button></div>` +
        k.map(n => `<div class="row"><span>🌍 ${n}</span><span><button data-a="loadw:${encodeURIComponent(n)}">Cargar</button> <button data-a="delw:${encodeURIComponent(n)}">🗑</button></span></div>`).join('') || '';
    }
    // ---------- eventos ----------
    bind() {
      const app = this.app, cv = $('cv');
      document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) this.act(el.dataset.a); });
      $('np').oninput = $('nh').oninput = $('nc').oninput = () => this.sliders(false);
      $('create').onclick = () => app.start({ map: this.mapSel, diff: this.diffSel, p: +$('np').value, h: +$('nh').value, c: +$('nc').value });
      $('resume').onclick = () => this.showMenu(false);
      $('bPlay').onclick = () => { app.paused = !app.paused; $('bPlay').textContent = app.paused ? '▶️' : '⏸️'; E.Audio.init(); };
      $('bSkip').onclick = () => app.skip();
      $('bDoc').onclick = () => { app.doc = !app.doc; $('bDoc').classList.toggle('on', app.doc); this.toast('🎥', app.doc ? 'Modo documental activado' : 'Modo documental desactivado'); };
      $('bFit').onclick = () => { app.r.cam.f = null; app.r.goTo(C.W / 2, C.H / 2, app.r.fit); };
      $('bMus').onclick = () => { E.Audio.init(); E.Audio.on.mus = !E.Audio.on.mus; $('bMus').style.opacity = E.Audio.on.mus ? 1 : 0.4; };
      $('bFx').onclick = () => { E.Audio.init(); E.Audio.on.fx = !E.Audio.on.fx; $('bFx').style.opacity = E.Audio.on.fx ? 1 : 0.4; };
      $('bMenu').onclick = () => this.showMenu(true);
      $('banner').onclick = () => this.act('goev');
      document.addEventListener('change', e => { if (e.target.id === 'gs') { this.gene = e.target.value; this.update(true); } });
      let drag = null;
      cv.addEventListener('pointerdown', e => { E.Audio.init(); drag = { x: e.clientX, y: e.clientY, moved: false }; if (this.brush !== null && app.w) this.paint(e); });
      cv.addEventListener('pointermove', e => {
        if (!drag || !app.w) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (this.brush !== null) { this.paint(e); return; }
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (drag.moved) { const c = app.r.cam; c.f = null; c.goal = null; c.x -= dx / c.z; c.y -= dy / c.z; drag.x = e.clientX; drag.y = e.clientY; }
      });
      cv.addEventListener('pointerup', e => { if (drag && app.w) { if (this.brush !== null) app.r.build(app.w); else if (!drag.moved) this.pick(e); } drag = null; });
      cv.addEventListener('wheel', e => {
        e.preventDefault(); const r = app.r, c = r.cam, p = r.toWorld(e.clientX, e.clientY); c.goal = null;
        c.z = U.clamp(c.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), r.fit, 4);
        if (!c.f) { c.x = p.x - (e.clientX - r.cw / 2) / c.z; c.y = p.y - (e.clientY - r.ch / 2) / c.z; }
      }, { passive: false });
      addEventListener('resize', () => app.r && app.r.resize());
    }
    paint(e) { const p = this.app.r.toWorld(e.clientX, e.clientY); this.app.w.paint(p.x, p.y, this.brush, 1.6); this.app.r.build(this.app.w); }
    pick(e) {
      const app = this.app, p = app.r.toWorld(e.clientX, e.clientY); let best = null, bd = 1e9;
      for (const a of app.w.animals) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (a.alive && d < a.r + 10 / app.r.cam.z && d < bd) { bd = d; best = a; } }
      this.select(best);
    }
    select(a) { this.app.sel = a; if (a && (!this.open || this.tab !== 'animal')) { this.tab = 'animal'; this.open = true; this.tabs(); $('panel').hidden = false; this.build(); } else if (this.tab === 'animal') this.update(true); }
    act(s) {
      const [a, b, c] = s.split(':'), app = this.app, w = app.w, cam = app.r && app.r.cam;
      switch (a) {
        case 'map': this.mapSel = b; this.menu(); break;
        case 'diff': this.diffSel = b; this.menu(); break;
        case 'loadw': app.load(decodeURIComponent(b)); break;
        case 'tab': this.setTab(b); break;
        case 'speed': app.speed = +b; document.querySelectorAll('[data-a^="speed:"]').forEach(x => x.classList.toggle('on', x.dataset.a === s)); break;
        case 'add': E.Exp.add(w, b, +c, cam.x, cam.y); break;
        case 'ev': if (b === 'disease') E.Events.outbreak(w, 'deer') || E.Events.outbreak(w); else E.Events.start(w, b); break;
        case 'inv': E.Events.invade(w); break;
        case 'what': E.Exp.run(w, b, cam.x, cam.y); break;
        case 'brush': this.brush = b === 'null' ? null : +b; this.build(); break;
        case 'follow': { const t = app.sel; if (t && t.alive) { cam.f = cam.f === t ? null : t; cam.goal = null; if (cam.f) cam.z = Math.max(cam.z, 2.2); } break; }
        case 'deselect': app.sel = null; cam.f = null; this.update(true); break;
        case 'goev': { const e = w && w.lastEv; if (e) { const t = e.id && w.byId.get(e.id); app.r.goTo(t && t.alive ? t.x : e.x, t && t.alive ? t.y : e.y); if (t) this.select(t); } break; }
        case 'pick': { const t = w.byId.get(+b); if (t) { this.select(t); if (t.alive) app.r.goTo(t.x, t.y); } else this.toast('📜', 'Ya no hay información de ese animal.'); break; }
        case 'pos': app.r.goTo(+b, +c); break;
        case 'savew': { const n = ($('sn').value || '').trim() || 'Mundo ' + new Date().toLocaleTimeString(); this.toast('💾', E.Save.put(n, w) ? `Guardado: ${n}` : 'No se pudo guardar.'); this.buildSaves(); break; }
        case 'delw': E.Save.del(decodeURIComponent(b)); this.buildSaves(); this.saves(); break;
      }
    }
    toast(ic, tx) { const b = $('toasts'), d = document.createElement('div'); d.className = 'toast'; d.textContent = `${ic} ${tx}`; b.appendChild(d); while (b.children.length > 3) b.firstChild.remove(); setTimeout(() => d.remove(), 4000); }
    banner(d) { const b = $('banner'); b.hidden = false; b.innerHTML = `🔴 EVENTO<small>${d.txt}</small>`; clearTimeout(this.bt); this.bt = setTimeout(() => { b.hidden = true; }, 7000); }
    // ---------- actualización ----------
    update(force) {
      const w = this.app.w; if (!w) return;
      const s = C.seasons[w.season()], A = w.animals.length, ev = w.events.map(e => E.Events.T[e.type].i).join('');
      $('hud').innerHTML = `Día ${w.day()} · ${s.i} ${s.n} ${ev}<br><span class="mut">🌱 ${w.plants.length} · 🦌 ${w.cnt.deer + w.cnt.rabbit} · 🐺 ${w.cnt.wolf + w.cnt.lynx} · ⏱ ${U.t(w.time)}</span>`;
      if (w.ver !== this.lv || force) { this.lv = w.ver; $('ticker').innerHTML = w.log.slice(-5).reverse().map(l => `<div data-a="${l.id ? 'pick:' + l.id : l.x != null ? 'pos:' + (l.x | 0) + ':' + (l.y | 0) : 'x'}">${l.ic} ${l.txt}</div>`).join(''); }
      if (!this.open) return;
      const k = this.tab;
      if (k === 'animal' && $('aB')) $('aB').innerHTML = this.animalHtml(this.app.sel);
      else if (k === 'stats' && $('sB')) this.stats(w);
      else if (k === 'story' && $('lgB') && (w.hver !== this.hv || force || this.t % 20 === 0)) {
        this.hv = w.hver;
        $('lgB').innerHTML = Object.entries(E.Story.CATS).map(([c, d]) => { const l = w.legend[c]; return l ? `<div class="lg" data-a="pick:${l.id}"><b>${d[0]} ${d[2]}</b><br>${C.species[l.sp].icon} #${l.id}${l.name ? ' ' + l.name : ''} ${l.alive ? '' : '☠'} — ${d[1].toLowerCase()}: ${c === 'long' ? U.t(l.val) : l.val.toFixed(c === 'fast' || c === 'per' ? 1 : 0)}<br><span class="mut">${l.kills} presas · ${l.off} hijos · ${l.desc} descendientes · gen ${l.gen}</span></div>` : ''; }).join('') || '<span class="mut">Aún no hay leyendas.</span>';
        $('hsB').innerHTML = w.story.slice().reverse().map(h => `<div class="hs"><i>Día ${h.d}</i> ${h.ic} ${h.txt}</div>`).join('') || '<span class="mut">La historia aún no ha empezado.</span>';
      } else if (k === 'ach' && $('acB')) {
        $('chB').innerHTML = w.chal.map(c => `<div class="ach ${c.done ? 'ok' : ''}">${c.done ? '✅' : '⬜'} ${c.txt}</div>`).join('');
        $('acB').innerHTML = E.Meta.ACH.map(a => { const d = E.Meta.done.has(a.id); return `<div class="ach ${d ? 'ok' : ''}">${d || !a.secret ? a.ic + ' <b>' + a.n + '</b><br><span class="mut">' + a.d + '</span>' : '❓ <b>???</b><br><span class="mut">Logro secreto</span>'}</div>`; }).join('');
      }
      this.t++;
    }
    animalHtml(a) {
      if (!a) return '<h3>🔎 OBSERVAR</h3><p class="mut">Haz clic en cualquier animal del mapa para ver su vida, sus genes y su historia.</p>';
      const S = C.species[a.sp], g = a.genes, t = a.target && a.target.alive ? nm(a.target) : '—';
      const par = a.parents ? a.parents.map(p => `<a class="l" data-a="pick:${p}">#${p}</a>`).join(' y ') : 'fundador';
      return `<h3>${S.icon} ${S.label.toUpperCase()} ${nm(a)}</h3>` + (a.alive ? `<div class="btns two"><button data-a="follow">${this.app.r.cam.f === a ? '🚫 DEJAR DE SEGUIR' : '🎯 SEGUIR'}</button><button data-a="deselect">✖ Cerrar</button></div>` : `<p class="dead">☠ Murió de ${CAUSE[a.cause] || a.cause} a los ${U.t(a.age)}</p><div class="btns two"><button data-a="deselect">✖ Cerrar</button></div>`) +
        row('Estado', a.alive ? (STATE[a.state] || a.state) : 'Muerto') + row('Edad', U.t(a.age) + ' / ' + U.t(a.maxAge)) + row('Generación', a.gen) + row('Padres', par) +
        row('Salud', `${Math.max(0, a.hp).toFixed(0)}/${a.maxHp.toFixed(0)}`) + row('Energía', a.energy.toFixed(0)) + row('Velocidad', a.spd.toFixed(1)) + row('Percepción', a.per.toFixed(0)) +
        row('Tamaño', g.size.toFixed(2)) + row('Resistencia', g.resistance.toFixed(2)) + (a.kind === 'C' ? row('Agresividad', g.aggression.toFixed(2)) : '') + row('Fertilidad', g.fertility.toFixed(2)) + row('Eficiencia', g.efficiency.toFixed(2)) +
        row('Objetivo', t) + (a.kind === 'C' ? row('Presas', a.kills) : row('Comida', a.eaten)) + row('Descendientes', `${a.offspring} hijos · ${a.desc} total`) + row('Distancia', Math.round(a.dist)) + (a.sick > 0 ? row('Salud', '🦠 enfermo') : '');
    }
    stats(w) {
      const A = w.animals.length; w.tr.peak = Math.max(w.tr.peak || 0, A);
      const alive = Object.keys(w.cnt).filter(k => w.cnt[k] > 0).length;
      $('sB').innerHTML = row('Tiempo de simulación', U.t(w.time)) + row('Población actual', `${A} animales · ${w.plants.length} plantas`) + row('Población máxima', w.tr.peak) +
        Object.keys(C.species).map(k => row(C.species[k].icon + ' ' + C.species[k].label + 's', w.cnt[k])).join('') +
        row('Nacimientos', w.stats.births) + row('Muertes', w.stats.deaths) + row('Cacerías', w.stats.hunts) + row('Extinciones', w.stats.extinct) + row('Generación máxima', w.stats.maxGen) + row('Plantas consumidas', w.stats.eaten) + row('Eventos', w.stats.events) + row('Especies vivas', alive) +
        '<h3>CAUSAS DE MUERTE</h3>' + (Object.entries(w.stats.causes).map(([k, v]) => row(CAUSE[k] || k, v)).join('') || '<span class="mut">Sin muertes aún.</span>');
      this.charts(w);
    }
    charts(w) {
      const h = w.hist.slice(-160), c1 = $('c1'), c2 = $('c2'); if (!c1 || h.length < 2) return;
      const draw = (cv, series, label) => {
        const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.clearRect(0, 0, W, H); g.font = '16px system-ui';
        series.forEach(([pts, col, name], si) => {
          let mn = Infinity, mx = -Infinity; for (const v of pts) { if (v < mn) mn = v; if (v > mx) mx = v; } if (label === 'pop') mn = 0; if (mx === mn) mx = mn + 1;
          g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); pts.forEach((v, i) => { const x = i / (pts.length - 1) * (W - 10) + 5, y = H - 30 - (v - mn) / (mx - mn) * (H - 50); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
          g.fillStyle = col; g.fillText(`${name}: ${pts[pts.length - 1].toFixed(label === 'pop' ? 0 : 1)}${label === 'pop' ? ` (máx ${mx})` : ''}`, 8 + si * 200, H - 8);
        });
      };
      draw(c1, [[h.map(p => p.p), '#7be07b', 'Plantas'], [h.map(p => p.H), '#5fb4ff', 'Herbívoros'], [h.map(p => p.C), '#ff6a6a', 'Carnívoros']], 'pop');
      const gk = this.gene; draw(c2, [[h.map(p => p.g.H[gk] || 0), '#5fb4ff', 'Herbívoros'], [h.map(p => p.g.C[gk] || 0), '#ff6a6a', 'Carnívoros']], 'gene');
    }
  };
})(Eco);

(function () {
  const TAU = Math.PI * 2;
  const shapes = {
    circle: (c, r) => { c.beginPath(); c.arc(0, 0, r, 0, TAU); },
    roundedSquare: (c, r) => { const s = r * 1.7; c.beginPath(); c.roundRect(-s / 2, -s / 2, s, s, r * 0.5); },
    triangle: (c, r) => { c.beginPath(); c.moveTo(r * 1.3, 0); c.lineTo(-r * 0.9, r * 0.9); c.lineTo(-r * 0.9, -r * 0.9); c.closePath(); },
  };

  Eco.Renderer = class Renderer {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }

    resize(world) {
      this.dpr = window.devicePixelRatio || 1;
      this.canvas.width = world.width * this.dpr;
      this.canvas.height = world.height * this.dpr;
      this.canvas.style.aspectRatio = world.width + '/' + world.height;
    }

    draw(world, { showPerception }) {
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.background(world);
      const animals = world.byKind('animal');
      if (showPerception) animals.forEach(o => this.perception(o));
      world.byKind('plant').forEach(o => this.organism(o));
      animals.forEach(o => this.organism(o));
      animals.forEach(o => this.overlays(o));
      world.effects.forEach(fx => this.effect(fx));
    }

    background(w) {
      const c = this.ctx, g = c.createLinearGradient(0, 0, w.width, w.height);
      g.addColorStop(0, '#1d2f25'); g.addColorStop(1, '#27402f');
      c.fillStyle = g; c.fillRect(0, 0, w.width, w.height);
      c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; c.beginPath();
      for (let x = 0; x < w.width; x += 80) { c.moveTo(x, 0); c.lineTo(x, w.height); }
      for (let y = 0; y < w.height; y += 80) { c.moveTo(0, y); c.lineTo(w.width, y); }
      c.stroke();
    }

    perception(o) {
      const c = this.ctx, s = o.spec.perception.sensor, locked = !!o.target;
      c.beginPath();
      if (s.type === 'circle') c.arc(o.x, o.y, s.range, 0, TAU);
      else {
        const half = (s.angle * Math.PI / 180) / 2;
        c.moveTo(o.x, o.y); c.arc(o.x, o.y, s.range, o.heading - half, o.heading + half); c.closePath();
      }
      c.fillStyle = locked ? 'rgba(255,220,80,.14)' : 'rgba(255,255,255,.07)'; c.fill();
      c.strokeStyle = locked ? 'rgba(255,220,80,.7)' : 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.stroke();
    }

    organism(o) {
      let r = o.radius;
      if (r < 0.5) return;
      const c = this.ctx, sp = o.spec.render;
      c.save();
      c.translate(o.x, o.y);
      if (o.heading !== undefined) c.rotate(o.heading);
      let sc = 1;
      if (o.state === 'EATING') sc = 1 + 0.12 * Math.sin(o.stateTime * 20);
      if (o.state === 'ATTACKING') sc = 1 + 0.15 * Math.sin(o.stateTime * 40);
      c.scale(sc, sc);
      if (o.eatProgress) r *= 1 - 0.5 * o.eatProgress;
      shapes[sp.shape](c, r);
      c.fillStyle = sp.fill; c.fill();
      c.strokeStyle = sp.stroke; c.lineWidth = 2; c.stroke();
      if (sp.eyes) {
        c.fillStyle = '#fff';
        for (const s of [-1, 1]) { c.beginPath(); c.arc(r * 0.35, s * r * 0.3, r * 0.2, 0, TAU); c.fill(); }
        c.fillStyle = '#123';
        for (const s of [-1, 1]) { c.beginPath(); c.arc(r * 0.42, s * r * 0.3, r * 0.1, 0, TAU); c.fill(); }
      }
      c.restore();
    }

    // Barra de HP, marcador de detección, línea de ataque y burbuja "six seven".
    overlays(o) {
      const c = this.ctx, r = o.radius;
      if (r < 1) return;
      const w = Math.max(14, r * 2), f = Eco.Utils.clamp(o.hp / o.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(o.x - w / 2, o.y + r + 6, w, 3);
      c.fillStyle = f > 0.35 ? '#7be07b' : '#ff7b5c'; c.fillRect(o.x - w / 2, o.y + r + 6, w * f, 3);
      if (o.state === 'DETECTING') this.label('!', o.x, o.y - r - 8, '#ffd54f');
      if (o.state === 'ATTACKING' && o.target) {
        c.strokeStyle = `rgba(255,60,60,${0.4 + 0.6 * Math.abs(Math.sin(o.stateTime * 25))})`;
        c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.target.x, o.target.y); c.stroke();
      }
      if (o.state === 'EATING') this.bubble('six seven', o.x, o.y - r - 12 - 2 * Math.sin(o.stateTime * 6));
    }

    label(text, x, y, color) {
      const c = this.ctx;
      c.font = 'bold 16px system-ui'; c.textAlign = 'center'; c.fillStyle = color; c.fillText(text, x, y);
    }

    bubble(text, x, y) {
      const c = this.ctx;
      c.font = 'bold 12px system-ui'; c.textAlign = 'center';
      const w = c.measureText(text).width + 14;
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - w / 2, y - 20, w, 20, 8); c.fill();
      c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y + 6); c.fill();
      c.fillStyle = '#1b2a22'; c.fillText(text, x, y - 6);
    }

    effect(fx) {
      const c = this.ctx, p = fx.t / fx.dur;
      if (fx.type === 'ring') {
        c.strokeStyle = `rgba(${fx.color},${1 - p})`; c.lineWidth = 2;
        c.beginPath(); c.arc(fx.x, fx.y, Eco.Utils.lerp(fx.from, fx.to, p), 0, TAU); c.stroke();
      } else {
        c.globalAlpha = 1 - p; c.font = 'bold 13px system-ui'; c.textAlign = 'center';
        c.fillStyle = `rgb(${fx.color})`; c.fillText(fx.text, fx.x, fx.y - 22 * p);
        c.globalAlpha = 1;
      }
    }
  };
})();

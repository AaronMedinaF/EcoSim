const Eco = (window.Eco = window.Eco || {});
Eco.Utils = {
  rand: (a, b) => a + Math.random() * (b - a),
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  angleTo: (a, b) => Math.atan2(b.y - a.y, b.x - a.x),
  // Diferencia angular con signo, en (-PI, PI]
  angleDiff(a, b) {
    let d = (b - a) % (2 * Math.PI);
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    return d;
  },
  // Suavizado exponencial independiente del framerate
  smooth: (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt)),
  nextId: (() => { let i = 0; return () => ++i; })(),
};

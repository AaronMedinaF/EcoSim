window.Eco = window.Eco || {};
(function (E) {
  E.U = {
    rand: (a, b) => a + Math.random() * (b - a),
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    pick: a => a[Math.random() * a.length | 0],
    gauss() { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) * 1.73; },
    ang(a, b) { let d = (b - a) % 6.2832; if (d > 3.1416) d -= 6.2832; if (d < -3.1416) d += 6.2832; return d; },
    d2: (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2,
    id: 0, nextId() { return ++this.id; },
    t(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  };
  E.hooks = { toast() {}, sound() {} }; // la UI y el audio se enganchan aquí
  E.CFG = {
    W: 1600, H: 1000, CELL: 40, TICK: 1 / 30, DAY: 20, SEASON_DAYS: 8,
    tiles: [
      { n: 'Pradera', c: '#6fa84a', f: 1.2 }, { n: 'Bosque', c: '#3f7a3a', f: 1.5 }, { n: 'Desierto', c: '#d8b86a', f: 0.25 },
      { n: 'Tundra', c: '#b9c9cf', f: 0.35 }, { n: 'Agua', c: '#3b82c4', f: 0 }, { n: 'Roca', c: '#7d7f84', f: 0 }, { n: 'Sabana', c: '#c4a64e', f: 0.8 },
    ],
    maps: {
      forest:  { label: '🌳 Bosque',  w: { 1: 6, 0: 3 },          ponds: 4, rocks: 0.02, plant: 1.2, drain: 1,    def: [140, 30, 5] },
      prairie: { label: '🌾 Pradera', w: { 0: 7, 1: 1 },          ponds: 2, rocks: 0.01, plant: 1.1, drain: 1,    def: [120, 30, 5] },
      desert:  { label: '🏜️ Desierto', w: { 2: 7, 6: 1, 0: 0.5 }, ponds: 1, rocks: 0.05, plant: 0.7, drain: 1.15, def: [70, 20, 3] },
      tundra:  { label: '❄️ Tundra',  w: { 3: 7, 1: 0.7 },        ponds: 1, rocks: 0.04, plant: 0.6, drain: 1.2,  def: [60, 14, 3] },
      savanna: { label: '🌴 Sabana',  w: { 6: 6, 0: 2, 1: 0.6 },  ponds: 2, rocks: 0.02, plant: 1,   drain: 1,    def: [100, 40, 8] },
    },
    diff: {
      balanced: { label: 'Equilibrado', ev: 1, plant: 1, drain: 1 },
      chaos:    { label: 'Caótico', ev: 2.5, plant: 0.9, drain: 1.1 },
      extreme:  { label: 'Extremo', ev: 3, plant: 0.6, drain: 1.3 },
    },
    seasons: [
      { n: 'Primavera', i: '🌱', g: 1.6, d: 1, tint: 'rgba(120,230,120,.05)' }, { n: 'Verano', i: '☀️', g: 1.2, d: 1.05, tint: 'rgba(255,220,90,.07)' },
      { n: 'Otoño', i: '🍂', g: 0.6, d: 1, tint: 'rgba(230,130,40,.12)' }, { n: 'Invierno', i: '❄️', g: 0.25, d: 1.2, tint: 'rgba(190,220,255,.14)' },
    ],
    // Los genes son valores absolutos; `base` es el fundador de cada especie.
    species: {
      deer:   { kind: 'H', label: 'Ciervo', icon: '🦌', color: '#c9884a', maxPop: 70, base: { speed: 50, perception: 130, size: 1, resistance: 1, aggression: 0, fertility: 1, lifespan: 480, efficiency: 1 } },
      rabbit: { kind: 'H', label: 'Conejo', icon: '🐇', color: '#d9d2c3', maxPop: 200, invader: 1, base: { speed: 58, perception: 100, size: 0.55, resistance: 0.6, aggression: 0, fertility: 2.2, lifespan: 220, efficiency: 1 } },
      wolf:   { kind: 'C', label: 'Lobo', icon: '🐺', color: '#8a93a6', maxPop: 30, base: { speed: 60, perception: 160, size: 1, resistance: 1, aggression: 0.55, fertility: 0.8, lifespan: 540, efficiency: 1 } },
      lynx:   { kind: 'C', label: 'Lince', icon: '🐆', color: '#c47a3a', maxPop: 25, invader: 1, base: { speed: 66, perception: 140, size: 0.8, resistance: 0.8, aggression: 0.7, fertility: 1, lifespan: 400, efficiency: 1 } },
    },
    genes: { speed: 'velocidad', perception: 'percepción', size: 'tamaño', resistance: 'resistencia', aggression: 'agresividad', fertility: 'fertilidad', lifespan: 'longevidad', efficiency: 'eficiencia' },
    names: ['Luna', 'Rayo', 'Sombra', 'Bruma', 'Piedra', 'Ceniza', 'Nube', 'Trueno', 'Hoja', 'Zarza', 'Alba', 'Roble', 'Niebla', 'Fuego', 'Brisa', 'Musgo', 'Colmillo', 'Vela', 'Ágata', 'Duna'],
  };
})(Eco);

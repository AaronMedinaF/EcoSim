// Todos los parámetros de la simulación. Añadir una especie = añadir una entrada en `species` (+ `spawn`).
Eco.CONFIG = {
  world: { width: 1200, height: 760, edgeMargin: 50 },
  sim: { fixedStep: 1 / 60, maxStepsPerFrame: 8, speeds: [0.5, 1, 2, 4] },
  debug: { showPerception: false },

  // Spawning progresivo: `initial` al empezar, luego `batch` cada `interval` s (tras `delay`) mientras haya menos de `max`.
  spawn: {
    plant:     { initial: 25, interval: 0.6, batch: 1, max: 260, delay: 0 },
    herbivore: { initial: 6,  interval: 7,   batch: 1, max: 30,  delay: 6 },
    carnivore: { initial: 0,  interval: 18,  batch: 1, max: 6,   delay: 30 },
  },
  manualSpawn: { plant: 8, herbivore: 3, carnivore: 1 },

  species: {
    plant: {
      key: 'plant', kind: 'plant', label: 'Plantas',
      maxHp: 30, startHp: 2, growthRate: 1.1, // HP/s
      size: { min: 3, max: 15, smoothing: 5 },
      render: { shape: 'circle', fill: '#4caf50', stroke: '#2e7d32' },
    },
    herbivore: {
      key: 'herbivore', kind: 'animal', label: 'Herbívoros', behavior: 'herbivore',
      maxHp: 100, startHp: 45,
      speed: 55, wanderSpeedMul: 0.6, turnRate: 3.2, wanderTurn: 1.3, // rad
      moveCost: 0.012, // HP por unidad de distancia
      size: { min: 7, max: 20, smoothing: 4 },
      perception: { sensor: { type: 'circle', range: 120 }, targets: ['plant'] },
      priority: 'richest',
      reactionTime: 0.3, reach: 3, eatTime: 1.4, feedEfficiency: 1,
      render: { shape: 'roundedSquare', fill: '#5fb4ff', stroke: '#1f6fb3', eyes: true },
    },
    carnivore: {
      key: 'carnivore', kind: 'animal', label: 'Carnívoros', behavior: 'carnivore',
      maxHp: 200, startHp: 110,
      speed: 60, wanderSpeedMul: 0.7, chaseSpeedMul: 1.9, turnRate: 2.6, wanderTurn: 1.0,
      moveCost: 0.014,
      size: { min: 9, max: 26, smoothing: 4 },
      perception: { sensor: { type: 'cone', range: 190, angle: 45 }, targets: ['herbivore'] }, // angle = apertura total (grados)
      priority: 'nearest',
      reactionTime: 0.25, reach: 4, attackWindup: 0.4, attackSuccess: 0.85,
      feedEfficiency: 0.8, cooldownAfterKill: 3, cooldownAfterMiss: 1.2,
      render: { shape: 'triangle', fill: '#ef5350', stroke: '#8e1b1b' },
    },
  },
};

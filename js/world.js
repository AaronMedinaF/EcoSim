Eco.World = class World {
  constructor(config) {
    this.config = config;
    this.width = config.world.width; this.height = config.world.height;
    this.time = 0;
    this.nextSpawn = {};
    this.effects = [];
    this.counters = { starved: 0, predated: 0, eaten: 0 };
    this.stats = { counts: {}, history: [], timer: 0 };
    this._byKind = {}; this._bySpecies = {}; this._dirty = false;
  }
  byKind(k) { return this._byKind[k] || (this._byKind[k] = []); }
  bySpecies(s) { return this._bySpecies[s] || (this._bySpecies[s] = []); }
  add(o) {
    this.byKind(o.kind).push(o); this.bySpecies(o.species).push(o);
    o.onAdd?.(this);
    return o;
  }
  // Marca como eliminado; las listas se compactan en flush() al final del tick.
  remove(o, cause) {
    if (!o.alive) return;
    o.alive = false; o.onRemove?.(this);
    if (cause) this.counters[cause] = (this.counters[cause] || 0) + 1;
    this._dirty = true;
  }
  flush() {
    if (!this._dirty) return;
    for (const m of [this._byKind, this._bySpecies]) for (const k in m) m[k] = m[k].filter(o => o.alive);
    this._dirty = false;
  }
};

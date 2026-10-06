Eco.Stats = {
  update(world, dt) {
    const st = world.stats, counts = {};
    let total = 0;
    for (const key of Object.keys(world.config.species)) total += counts[key] = world.bySpecies(key).length;
    counts.total = total;
    st.counts = counts;
    st.timer += dt;
    if (st.timer >= 1) { // historial para futuras gráficas de población
      st.timer = 0;
      st.history.push({ t: world.time, ...counts });
      if (st.history.length > 600) st.history.shift();
    }
  },
};

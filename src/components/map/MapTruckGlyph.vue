<script setup>
defineProps({
  vehicle: { type: Object, required: true },
});
</script>

<template>
  <g
    class="truck-glyph"
    :data-state="vehicle.state.id"
    :style="{
      '--state-accent': vehicle.state.accent,
      '--material-accent': vehicle.material.accent,
    }"
  >
    <ellipse cx="-0.04" cy="0.02" rx="0.88" ry="0.5" class="truck-halo" />
    <path d="M -0.6 -0.24 L 0.04 -0.24 L 0.18 -0.06 L 0.18 0.18 L -0.62 0.18 Z" class="truck-bed-shell" />
    <path d="M -0.52 -0.14 L -0.02 -0.14 L 0.08 0.04 L -0.54 0.04 Z" class="truck-cargo" />
    <path d="M 0.08 -0.2 L 0.38 -0.2 L 0.54 -0.04 L 0.54 0.22 L 0.18 0.22 L 0.08 0.06 Z" class="truck-cab-shell" />
    <rect x="0.18" y="-0.12" width="0.2" height="0.12" rx="0.03" class="truck-window" />
    <rect x="0.42" y="0.03" width="0.06" height="0.05" rx="0.02" class="truck-headlamp" />
    <circle cx="-0.38" cy="0.24" r="0.1" class="truck-wheel" />
    <circle cx="-0.04" cy="0.24" r="0.1" class="truck-wheel" />
    <circle cx="0.3" cy="0.24" r="0.11" class="truck-wheel" />
    <circle cx="0.24" cy="-0.24" r="0.06" class="truck-beacon" />
  </g>
</template>

<style scoped>
.truck-glyph {
  color: var(--state-accent);
}

.truck-halo {
  fill: var(--state-accent);
  opacity: 0.14;
}

.truck-bed-shell,
.truck-cab-shell {
  fill: rgba(28, 36, 47, 0.94);
  stroke: rgba(224, 231, 255, 0.7);
  stroke-width: 0.05;
}

.truck-cargo {
  fill: var(--material-accent);
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 0.04;
}

.truck-window {
  fill: rgba(138, 211, 255, 0.78);
}

.truck-headlamp {
  fill: rgba(255, 240, 196, 0.84);
}

.truck-wheel {
  fill: rgba(10, 13, 18, 0.96);
  stroke: rgba(184, 198, 216, 0.54);
  stroke-width: 0.04;
}

.truck-beacon {
  fill: var(--state-accent);
  stroke: rgba(255, 255, 255, 0.46);
  stroke-width: 0.03;
}

.truck-glyph[data-state='slow'] .truck-bed-shell,
.truck-glyph[data-state='slow'] .truck-cab-shell {
  stroke: rgba(255, 218, 132, 0.74);
}

.truck-glyph[data-state='stopped'] .truck-bed-shell,
.truck-glyph[data-state='stopped'] .truck-cab-shell {
  stroke: rgba(255, 163, 163, 0.8);
}
</style>

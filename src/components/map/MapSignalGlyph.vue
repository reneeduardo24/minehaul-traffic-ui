<script setup>
defineProps({
  light: { type: Object, required: true },
});
</script>

<template>
  <g class="signal-glyph" :style="{ '--signal-accent': light.stateMeta.accent }">
    <circle r="0.82" class="signal-halo" />
    <line x1="0" y1="0" x2="0" y2="0.9" class="signal-post" />
    <rect x="-0.28" y="0.12" width="0.56" height="1.04" rx="0.16" class="signal-body" />
    <circle cx="0" cy="0.38" r="0.11" class="signal-lamp red" :class="{ active: light.state === 'RED' }" />
    <circle cx="0" cy="0.64" r="0.11" class="signal-lamp yellow" :class="{ active: light.state === 'YELLOW' }" />
    <circle cx="0" cy="0.9" r="0.11" class="signal-lamp green" :class="{ active: light.state === 'GREEN' }" />
  </g>
</template>

<style scoped>
.signal-halo {
  fill: var(--signal-accent);
  opacity: 0.14;
}

.signal-post {
  stroke: rgba(226, 232, 240, 0.56);
  stroke-width: 0.07;
}

.signal-body {
  fill: rgba(9, 14, 22, 0.96);
  stroke: rgba(226, 232, 240, 0.22);
  stroke-width: 0.05;
}

.signal-lamp {
  fill: rgba(90, 102, 120, 0.36);
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 0.03;
}

.signal-lamp.red.active {
  fill: #ef6262;
  filter: drop-shadow(0 0 5px rgba(239, 98, 98, 0.72));
}

.signal-lamp.yellow.active {
  fill: #f2b447;
  filter: drop-shadow(0 0 5px rgba(242, 180, 71, 0.72));
}

.signal-lamp.green.active {
  fill: #3fd07e;
  filter: drop-shadow(0 0 5px rgba(63, 208, 126, 0.72));
}
</style>

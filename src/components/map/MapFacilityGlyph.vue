<script setup>
import { computed } from 'vue';

const props = defineProps({
  facility: { type: Object, required: true },
});

const accentByKind = {
  pit: '#d68624',
  depot: '#4dd4a0',
  crusher: '#60d489',
  stockpile: '#e4cf62',
  storage: '#5fd9c6',
  dump: '#8ee28c',
};

const accent = computed(() => accentByKind[props.facility.kind] || '#8ca0b8');
</script>

<template>
  <g class="facility-glyph" :style="{ color: accent }">
    <g v-if="facility.kind === 'pit'">
      <path d="M -1.02 -0.44 L -0.32 -0.86 L 0.88 -0.46 L 0.34 0.82 L -0.86 0.42 Z" class="plate" />
      <path d="M -0.62 -0.18 C -0.22 -0.5, 0.28 -0.5, 0.52 -0.1 C 0.62 0.24, 0.28 0.48, -0.06 0.5 C -0.42 0.5, -0.68 0.2, -0.62 -0.18 Z" class="linework" />
      <path d="M -0.42 -0.08 C -0.12 -0.3, 0.2 -0.28, 0.34 -0.02 C 0.4 0.18, 0.16 0.32, -0.04 0.32 C -0.28 0.32, -0.46 0.12, -0.42 -0.08 Z" class="linework" />
      <path d="M -0.2 0 C -0.04 -0.12, 0.08 -0.1, 0.14 0 C 0.18 0.08, 0.08 0.18, -0.02 0.18 C -0.12 0.18, -0.22 0.1, -0.2 0 Z" class="linework" />
      <circle cx="-0.74" cy="0.34" r="0.12" class="ore-knot" />
      <circle cx="0.68" cy="0.2" r="0.12" class="ore-knot" />
      <circle cx="-0.48" cy="-0.52" r="0.12" class="ore-knot" />
      <circle cx="0.46" cy="-0.5" r="0.12" class="ore-knot" />
    </g>

    <g v-else-if="facility.kind === 'depot'">
      <path d="M -1.02 0.42 L -0.6 -0.54 L 0.84 -0.54 L 1 0.3 L -0.2 0.72 Z" class="plate" />
      <rect x="-0.92" y="-0.34" width="0.2" height="0.58" rx="0.04" class="solid" />
      <rect x="-0.64" y="-0.14" width="0.54" height="0.14" rx="0.04" class="solid" />
      <path d="M -0.1 -0.1 L 0.36 -0.42 L 0.62 -0.42 L 0.18 -0.1 Z" class="solid" />
      <path d="M 0.04 0.38 L 0.24 -0.02 L 0.42 0.38 Z" class="ore-fill" />
      <path d="M 0.34 0.36 L 0.54 -0.02 L 0.72 0.36 Z" class="ore-fill" />
      <path d="M 0.62 0.34 L 0.8 0.02 L 0.94 0.34 Z" class="ore-fill" />
    </g>

    <g v-else-if="facility.kind === 'crusher'">
      <rect x="-0.92" y="-0.34" width="0.22" height="0.8" rx="0.04" class="solid" />
      <rect x="-0.54" y="-0.16" width="0.34" height="0.62" rx="0.04" class="solid" />
      <rect x="-0.06" y="-0.42" width="0.24" height="0.88" rx="0.04" class="solid" />
      <rect x="0.34" y="-0.2" width="0.28" height="0.66" rx="0.04" class="solid" />
      <path d="M -0.22 0.16 L 0.22 0.02 L 0.5 0.16" class="linework" />
      <path d="M -0.76 -0.02 L -0.28 -0.22 L -0.02 -0.02" class="linework" />
      <path d="M 0.18 -0.02 L 0.56 -0.22 L 0.82 -0.02" class="linework" />
      <line x1="0.72" y1="0.42" x2="0.72" y2="0.82" class="linework" />
      <line x1="0.94" y1="0.36" x2="0.94" y2="0.78" class="linework" />
    </g>

    <g v-else-if="facility.kind === 'storage'">
      <rect x="-0.92" y="-0.14" width="0.76" height="0.34" rx="0.08" class="solid" />
      <rect x="-0.02" y="-0.12" width="0.28" height="0.82" rx="0.12" class="solid" />
      <rect x="0.34" y="-0.12" width="0.28" height="0.82" rx="0.12" class="solid" />
      <rect x="0.7" y="-0.12" width="0.24" height="0.82" rx="0.12" class="solid" />
      <line x1="-0.72" y1="0.18" x2="-0.26" y2="0.18" class="linework" />
      <line x1="0.12" y1="0.68" x2="0.12" y2="0.92" class="linework" />
      <line x1="0.48" y1="0.68" x2="0.48" y2="0.92" class="linework" />
      <line x1="0.82" y1="0.68" x2="0.82" y2="0.92" class="linework" />
    </g>

    <g v-else-if="facility.kind === 'dump'">
      <path d="M -1.04 -0.16 C -0.74 0.14, -0.46 0.54, -0.08 0.42 C 0.26 0.32, 0.34 -0.16, 0.6 -0.06 C 0.82 0.02, 0.98 0.28, 1 0.58 L -1 0.58 Z" class="plate" />
      <path d="M -0.98 0.56 C -0.74 0.28, -0.44 0.14, -0.16 0.18 C 0.18 0.22, 0.38 0.46, 0.7 0.44 C 0.82 0.44, 0.92 0.48, 1 0.56" class="linework" />
      <path d="M -0.72 0.28 C -0.46 0.16, -0.24 0.2, -0.02 0.34" class="linework" />
      <path d="M 0.08 0.36 C 0.3 0.2, 0.52 0.18, 0.76 0.28" class="linework" />
    </g>

    <g v-else>
      <rect x="-0.8" y="-0.5" width="1.6" height="1" rx="0.16" class="solid" />
      <line x1="-0.6" y1="0" x2="0.6" y2="0" class="linework" />
      <line x1="0" y1="-0.34" x2="0" y2="0.34" class="linework" />
    </g>
  </g>
</template>

<style scoped>
.facility-glyph {
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.22));
}

.plate {
  fill: currentColor;
  opacity: 0.1;
  stroke: currentColor;
  stroke-width: 0.06;
}

.solid {
  fill: rgba(9, 14, 22, 0.28);
  stroke: currentColor;
  stroke-width: 0.06;
}

.linework {
  fill: none;
  stroke: currentColor;
  stroke-width: 0.06;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ore-fill,
.ore-knot {
  fill: currentColor;
  opacity: 0.22;
  stroke: currentColor;
  stroke-width: 0.04;
}
</style>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  vehicles: Object,
  trafficLights: Object,
});

// Map dimensions — coordinates from the backend are expected 0–100
// Traffic lights are pinned at known intersections
const LIGHT_POSITIONS = {
  'TL-01': { x: 30, y: 35 },
  'TL-02': { x: 65, y: 60 },
};

const vehicleList = computed(() =>
  Object.entries(props.vehicles || {}).map(([id, d]) => ({ id, ...d }))
);

const lightList = computed(() =>
  Object.entries(props.trafficLights || {}).map(([id, d]) => ({
    id,
    ...d,
    px: LIGHT_POSITIONS[id]?.x ?? 50,
    py: LIGHT_POSITIONS[id]?.y ?? 50,
  }))
);

const lightStateColor = (state) => {
  if (!state) return '#6b7280';
  const s = state.toUpperCase();
  if (s === 'GREEN') return '#10b981';
  if (s === 'RED') return '#ef4444';
  if (s === 'YELLOW') return '#f59e0b';
  return '#6b7280';
};
</script>

<template>
  <div class="map-wrapper glass-panel">
    <div class="map-header">
      <h2>Live Mine Map</h2>
      <div class="map-legend">
        <span class="legend-item"><span class="dot" style="background:#60a5fa"></span> Vehicle</span>
        <span class="legend-item"><span class="dot" style="background:#10b981"></span> Green Light</span>
        <span class="legend-item"><span class="dot" style="background:#ef4444"></span> Red Light</span>
      </div>
    </div>

    <div class="map-canvas">
      <!-- Mine terrain background grid -->
      <svg class="terrain-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Horizontal roads -->
        <rect x="0" y="32" width="100" height="6" rx="1" fill="rgba(148,163,184,0.12)" />
        <rect x="0" y="57" width="100" height="6" rx="1" fill="rgba(148,163,184,0.12)" />
        <!-- Vertical roads -->
        <rect x="27" y="0" width="6" height="100" rx="1" fill="rgba(148,163,184,0.12)" />
        <rect x="62" y="0" width="6" height="100" rx="1" fill="rgba(148,163,184,0.12)" />
        <!-- Center dashes -->
        <line x1="0" y1="35" x2="100" y2="35" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3" />
        <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3" />
        <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3" />
        <line x1="65" y1="0" x2="65" y2="100" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3" />
        <!-- Zone labels -->
        <text x="10" y="20" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z1</text>
        <text x="44" y="20" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z2</text>
        <text x="76" y="20" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z3</text>
        <text x="10" y="53" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z4</text>
        <text x="44" y="53" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z5</text>
        <text x="76" y="53" font-size="4" fill="rgba(148,163,184,0.4)" font-family="monospace">Z6</text>
        <!-- Pit / Mine area -->
        <ellipse cx="85" cy="82" rx="12" ry="10" fill="rgba(120,53,15,0.18)" stroke="rgba(180,83,9,0.3)" stroke-width="0.5" />
        <text x="80" y="83" font-size="3.5" fill="rgba(251,191,36,0.6)" font-family="monospace">⛏ PIT</text>
        <!-- Depot area -->
        <rect x="2" y="72" width="18" height="18" rx="2" fill="rgba(30,64,175,0.15)" stroke="rgba(96,165,250,0.3)" stroke-width="0.5" />
        <text x="5" y="82" font-size="3.5" fill="rgba(147,197,253,0.6)" font-family="monospace">DEPOT</text>
      </svg>

      <!-- Traffic lights -->
      <div
        v-for="light in lightList"
        :key="light.id"
        class="traffic-light-pin"
        :style="{ left: light.px + '%', top: light.py + '%' }"
        :title="`${light.id} — ${light.state || 'UNKNOWN'} (${light.zone_id})`"
      >
        <div class="tl-body">
          <div class="tl-bulb" :style="{ background: lightStateColor(light.state) }"></div>
        </div>
        <div class="tl-label">{{ light.id }}</div>
      </div>

      <!-- Vehicles -->
      <div
        v-for="v in vehicleList"
        :key="v.id"
        class="vehicle-pin"
        :style="{ left: (v.x ?? 50) + '%', top: (v.y ?? 50) + '%' }"
        :title="`${v.id} — Zone ${v.zone_id} | Speed: ${v.speed}km/h`"
      >
        <div class="vehicle-body">🚜</div>
        <div class="vehicle-label">{{ v.id }}</div>
      </div>

      <!-- Empty state -->
      <div v-if="vehicleList.length === 0 && lightList.length === 0" class="map-empty">
        <p>Waiting for data from the gateway…</p>
        <p class="sub">Make sure the backend is running on port 8000</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  min-height: 0;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.map-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.map-legend {
  display: flex;
  gap: 1rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.map-canvas {
  flex: 1;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: radial-gradient(ellipse at 80% 80%, rgba(120,53,15,0.1), transparent 50%),
              radial-gradient(ellipse at 10% 80%, rgba(30,64,175,0.1), transparent 40%),
              rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255,255,255,0.05);
  min-height: 300px;
}

.terrain-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Traffic Lights */
.traffic-light-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: default;
  z-index: 10;
}
.tl-body {
  width: 14px;
  height: 14px;
  background: rgba(30,30,40,0.9);
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.tl-bulb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
  transition: background 0.4s;
}
.tl-label {
  font-size: 0.5rem;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
  background: rgba(0,0,0,0.6);
  padding: 1px 3px;
  border-radius: 3px;
}

/* Vehicles */
.vehicle-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 20;
  animation: vehiclePop 0.4s ease-out;
  cursor: default;
}
@keyframes vehiclePop {
  from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  to   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
.vehicle-body {
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
  transition: left 0.6s ease, top 0.6s ease;
}
.vehicle-label {
  font-size: 0.5rem;
  color: #fff;
  background: rgba(59,130,246,0.7);
  padding: 1px 4px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 600;
}

.map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
}
.map-empty .sub {
  font-size: 0.75rem;
  opacity: 0.6;
}
</style>

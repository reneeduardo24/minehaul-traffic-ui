<script setup>
/**
 * TrafficMap — Graphical mine map
 *
 * COORDINATE SYSTEM (derived from vehicle_simulator.py):
 *   The backend uses ABSOLUTE world coordinates (not zone-relative),
 *   in the range roughly x:[0..25], y:[0..6].
 *
 *   World layout (from simulator routes):
 *     Z1  x≈0-2,   y≈0-2   → PIT loading area (bottom-left)
 *     Z2  x≈10-14, y≈1-5   → Main road / bottleneck (center)
 *     Z3  x≈20-22, y≈5     → CRUSHER-A (top-right)
 *
 *   Fixed infrastructure:
 *     DEPOT     x=0,  y=0   (start/home base)
 *     PIT-1..3  x≈0-2, y≈0-2
 *     CRUSHER-A x≈21, y≈5
 *     TL-01     zone Z1 (near pit exit) → x≈3, y≈1
 *     TL-02     zone Z2 (road center)   → x≈12, y≈3
 *
 * WORLD → CANVAS mapping:
 *   We define WORLD_W=26, WORLD_H=7 and map linearly to 0-100%.
 *   left% = (x / WORLD_W) * 100
 *   top%  = (1 - y / WORLD_H) * 100   ← flip Y so y=0 is bottom
 */
import { computed } from 'vue';

const props = defineProps({
  vehicles:      { type: Object, default: () => ({}) },
  trafficLights: { type: Object, default: () => ({}) },
});

// World extent — set to just beyond the simulator's max coords
const WORLD_W = 26;
const WORLD_H = 7;

function worldToCanvas(x, y) {
  return {
    left: ((x / WORLD_W) * 100).toFixed(2) + '%',
    top:  (((WORLD_H - y) / WORLD_H) * 100).toFixed(2) + '%',
  };
}

// Fixed infrastructure points
const INFRA = [
  { id: 'DEPOT',     x: 0,  y: 0,   icon: '🏭', label: 'DEPOT', color: '#60a5fa' },
  { id: 'PIT-1',     x: 0,  y: 2,   icon: '⛏',  label: 'PIT-1', color: '#f59e0b' },
  { id: 'PIT-2',     x: 1,  y: 1,   icon: '⛏',  label: 'PIT-2', color: '#f59e0b' },
  { id: 'PIT-3',     x: 2,  y: 0,   icon: '⛏',  label: 'PIT-3', color: '#f59e0b' },
  { id: 'CRUSHER-A', x: 21, y: 5,   icon: '⚙️',  label: 'CRUSHER-A', color: '#a78bfa' },
];

// Traffic light fixed positions (logical, matching zone assignments)
const TL_POSITIONS = {
  'TL-01': { x: 3,  y: 1, zone: 'Z1' },  // Pit exit intersection
  'TL-02': { x: 12, y: 3, zone: 'Z2' },  // Road center throttle point
};

const vehicleList = computed(() =>
  Object.values(props.vehicles).map(v => ({
    ...v,
    pos: worldToCanvas(v.x ?? 0, v.y ?? 0),
  }))
);

const lightList = computed(() =>
  Object.entries(props.trafficLights).map(([id, d]) => {
    const pin = TL_POSITIONS[id] ?? { x: 5, y: 3 };
    return {
      id,
      state:  (d.state ?? d.status ?? 'UNKNOWN').toUpperCase(),
      zone_id: d.zone_id,
      pos: worldToCanvas(pin.x, pin.y),
    };
  })
);

const infraList = computed(() =>
  INFRA.map(p => ({ ...p, pos: worldToCanvas(p.x, p.y) }))
);

function lightColor(state) {
  if (state === 'GREEN')  return '#10b981';
  if (state === 'RED')    return '#ef4444';
  if (state === 'YELLOW') return '#f59e0b';
  return '#6b7280';
}

function speedClass(speed) {
  if (speed === undefined) return '';
  if (speed < 0.5) return 'stopped';
  if (speed < 1.5) return 'slow';
  return 'moving';
}
</script>

<template>
  <div class="map-wrapper glass-panel">
    <div class="map-header">
      <h2>Live Mine Map</h2>
      <div class="legend">
        <span class="leg"><span class="dot" style="background:#10b981"></span>Moving</span>
        <span class="leg"><span class="dot" style="background:#f59e0b"></span>Slow</span>
        <span class="leg"><span class="dot" style="background:#ef4444"></span>Stopped</span>
      </div>
    </div>

    <div class="canvas">
      <!-- ── SVG layer: roads + zones ── -->
      <svg class="roads-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!--
          Road coordinate mapping (same formula as worldToCanvas):
          left% = x/26*100,  top% = (7-y)/7*100
          Z1 exit: x=3  → 11.5%
          Z2 start: x=9 → 34.6%
          Z2 center: x=12 → 46.2%
          Z2 end: x=15 → 57.7%
          Z3: x=21 → 80.8%
          DEPOT y=0 → top=100%  (bottom)
          PIT-1 y=2 → top=71.4%
          Crusher y=5 → top=28.6%
        -->

        <!-- Main haul road: PIT zone → CRUSHER (horizontal spine at y≈1.5 → top≈78%) -->
        <rect x="0" y="74" width="100" height="4" rx="1"
              fill="rgba(148,163,184,0.10)" />
        <line x1="0" y1="76" x2="100" y2="76"
              stroke="rgba(255,255,255,0.07)" stroke-width="0.5" stroke-dasharray="3 2"/>

        <!-- Return road (empty trucks back): slightly offset (y≈0.5 → top≈93%) -->
        <rect x="0" y="89" width="100" height="3" rx="1"
              fill="rgba(148,163,184,0.07)" />

        <!-- Connector: PIT-1 ramp (x=0→11.5%, y=2→71.4% to haul road y=76%) -->
        <rect x="0" y="71" width="12" height="5" rx="1"
              fill="rgba(148,163,184,0.08)" />

        <!-- Connector: CRUSHER approach (x=81% downward to y=76%) -->
        <rect x="79" y="29" width="4" height="47" rx="1"
              fill="rgba(148,163,184,0.08)" />

        <!-- Zone labels -->
        <text x="3"  y="68" font-size="3.5" fill="rgba(148,163,184,0.5)" font-family="monospace">Z1</text>
        <text x="38" y="68" font-size="3.5" fill="rgba(148,163,184,0.5)" font-family="monospace">Z2</text>
        <text x="80" y="68" font-size="3.5" fill="rgba(148,163,184,0.5)" font-family="monospace">Z3</text>

        <!-- Zone boundary separators (dashed vertical) -->
        <line x1="34" y1="0" x2="34" y2="100"
              stroke="rgba(255,255,255,0.04)" stroke-width="0.5" stroke-dasharray="2 4"/>
        <line x1="65" y1="0" x2="65" y2="100"
              stroke="rgba(255,255,255,0.04)" stroke-width="0.5" stroke-dasharray="2 4"/>
      </svg>

      <!-- ── Infrastructure pins ── -->
      <div
        v-for="p in infraList"
        :key="p.id"
        class="infra-pin"
        :style="{ left: p.pos.left, top: p.pos.top }"
        :title="p.label"
      >
        <span class="infra-icon" :style="{ background: p.color + '22', borderColor: p.color + '55' }">
          {{ p.icon }}
        </span>
        <span class="infra-label" :style="{ color: p.color }">{{ p.label }}</span>
      </div>

      <!-- ── Traffic lights ── -->
      <div
        v-for="light in lightList"
        :key="light.id"
        class="tl-pin"
        :style="{ left: light.pos.left, top: light.pos.top }"
        :title="`${light.id} — ${light.state} (${light.zone_id})`"
      >
        <div class="tl-body">
          <div class="tl-bulb" :style="{ background: lightColor(light.state), boxShadow: `0 0 8px ${lightColor(light.state)}` }"></div>
        </div>
        <span class="tl-label">{{ light.id }}</span>
      </div>

      <!-- ── Vehicles ── -->
      <div
        v-for="v in vehicleList"
        :key="v.vehicle_id"
        class="vehicle-pin"
        :class="speedClass(v.speed)"
        :style="{ left: v.pos.left, top: v.pos.top }"
        :title="`${v.vehicle_id} — Zone ${v.zone_id} | ${v.speed} km/h → ${v.destination}`"
      >
        <div class="vehicle-icon">🚜</div>
        <span class="vehicle-label">{{ v.vehicle_id }}</span>
        <span class="vehicle-speed" v-if="v.speed !== undefined">{{ v.speed }} km/h</span>
      </div>

      <!-- Empty state -->
      <div v-if="vehicleList.length === 0 && lightList.length === 0" class="map-empty">
        <p>Waiting for gateway data…</p>
        <p class="sub">Make sure the backend is running on port 8000</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.map-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.legend { display: flex; gap: 0.75rem; }
.leg {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--text-muted);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* Map canvas */
.canvas {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 80% 30%, rgba(167,139,250,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 5%  80%, rgba(245,158,11,0.06)  0%, transparent 40%),
    rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.06);
  min-height: 200px;
}

.roads-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Infrastructure */
.infra-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 5;
  pointer-events: none;
}
.infra-icon {
  font-size: 1rem;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}
.infra-label {
  font-size: 0.45rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
  background: rgba(0,0,0,0.6);
  padding: 1px 3px;
  border-radius: 3px;
}

/* Traffic lights */
.tl-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 15;
  cursor: default;
}
.tl-body {
  width: 14px;
  height: 14px;
  background: rgba(20,20,30,0.9);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-bulb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background 0.4s, box-shadow 0.4s;
}
.tl-label {
  font-size: 0.45rem;
  color: rgba(255,255,255,0.7);
  background: rgba(0,0,0,0.65);
  padding: 1px 3px;
  border-radius: 3px;
  white-space: nowrap;
}

/* Vehicles */
.vehicle-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  z-index: 20;
  transition: left 0.7s ease, top 0.7s ease;
  cursor: default;
}
.vehicle-icon {
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.7));
}
.vehicle-label {
  font-size: 0.45rem;
  font-weight: 700;
  color: #fff;
  background: rgba(59,130,246,0.8);
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
}
.vehicle-speed {
  font-size: 0.4rem;
  color: rgba(255,255,255,0.7);
  background: rgba(0,0,0,0.5);
  padding: 0 3px;
  border-radius: 2px;
  white-space: nowrap;
}

/* Speed-based glow ring */
.vehicle-pin.moving .vehicle-icon   { filter: drop-shadow(0 0 5px #10b981) drop-shadow(0 1px 4px rgba(0,0,0,0.7)); }
.vehicle-pin.slow   .vehicle-icon   { filter: drop-shadow(0 0 5px #f59e0b) drop-shadow(0 1px 4px rgba(0,0,0,0.7)); }
.vehicle-pin.stopped .vehicle-icon  { filter: drop-shadow(0 0 5px #ef4444) drop-shadow(0 1px 4px rgba(0,0,0,0.7)); }

.map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.map-empty .sub { font-size: 0.7rem; opacity: 0.6; }
</style>

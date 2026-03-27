<script setup>
/**
 * TrafficMap — Single-coordinate-system mine map
 *
 * ══════════════════════════════════════════════════════════════
 * ROOT CAUSE OF PREVIOUS BUGS:
 *   The SVG roads used a manual "0 0 100 100" coordinate space
 *   with positions drawn by eye (e.g., rect at y=74).
 *   Vehicle divs used worldToCanvas() producing different %s.
 *   These two spaces NEVER coincided → trucks never on road.
 *
 * THE FIX — One function w2pct() governs everything:
 *   SVG viewBox="0 0 100 100" + vehicle div positions
 *   ALL use identical percentage math.
 *
 * ══ BACKEND COORDINATE SYSTEM (from vehicle_simulator.py) ══
 *   Fields in payload: vehicle_id, zone_id, x, y, speed, destination
 *   x ∈ [0, 22]   — increases left → right   (absolute, NOT zone-relative)
 *   y ∈ [0,  5]   — increases bottom → top   (physics / Y-up)
 *
 *   Zone spatial layout:
 *     Z1 (PIT area):    x ∈ [0,   3],  y ∈ [0, 2]
 *     Z2 (haul road):   x ∈ [10, 14],  y ∈ [1, 4]
 *     Z3 (CRUSHER):     x ∈ [20, 22],  y ≈ 5
 *
 * ══ TRANSFORM: w2pct(worldX, worldY) ══
 *   Converts world coords → CSS percentages (same values used in SVG).
 *
 *   WORLD_MAX_X = 23   (1 unit beyond max simulator x=22)
 *   WORLD_MAX_Y = 5.5  (0.5 above max simulator y=5)
 *   MX = 4  (horizontal margin %)
 *   MY = 6  (vertical margin %)
 *
 *   pctX = MX + (worldX / WORLD_MAX_X) * (100 - 2*MX)
 *        = 4  + (worldX / 23) * 92
 *
 *   pctY = MY + (1 - worldY / WORLD_MAX_Y) * (100 - 2*MY)
 *        = 6  + (1 - worldY / 5.5) * 88          ← Y FLIPPED
 *
 *   Validation examples:
 *     w2pct(0,  0)  → (4,  94)   bottom-left  = Z1 PIT start      ✓
 *     w2pct(12, 4)  → (52, 30)   upper-center = Z2 TRUCK-01 lane  ✓
 *     w2pct(21, 5)  → (88, 14)   top-right    = CRUSHER-A         ✓
 * ══════════════════════════════════════════════════════════════
 */
import { computed } from 'vue';

const props = defineProps({
  vehicles:      { type: Object, default: () => ({}) },
  trafficLights: { type: Object, default: () => ({}) },
});

// ─── Single coordinate transform ─────────────────────────────────────────────
const WORLD_MAX_X = 23;
const WORLD_MAX_Y = 5.5;
const MX = 4;   // horizontal margin %
const MY = 6;   // vertical margin %

/** World → percentage (0-100). Used by BOTH SVG and positioned divs. */
function w2pct(wx, wy) {
  const x = MX + (wx / WORLD_MAX_X) * (100 - 2 * MX);
  const y = MY + (1 - wy / WORLD_MAX_Y) * (100 - 2 * MY);
  return { x: +x.toFixed(3), y: +y.toFixed(3) };
}

/** Shorthand: "x,y" string for SVG polygon/polyline points */
function pt(wx, wy) {
  const p = w2pct(wx, wy);
  return `${p.x},${p.y}`;
}

// ─── Map geometry — all defined in world coords, rendered via w2pct() ─────────

// Zone background bands (world x ranges)
const ZONES = [
  { id: 'Z1', label: 'Z1', wx1: -1,  wx2: 9,  color: 'rgba(245,158,11,0.06)'  },
  { id: 'Z2', label: 'Z2', wx1: 9,   wx2: 16, color: 'rgba(148,163,184,0.05)' },
  { id: 'Z3', label: 'Z3', wx1: 16,  wx2: 24, color: 'rgba(167,139,250,0.06)' },
];

// Computed so w2pct runs once per zone
const zoneBands = computed(() =>
  ZONES.map(z => ({
    ...z,
    x1: w2pct(z.wx1, 0).x,
    x2: w2pct(z.wx2, 0).x,
    lx: w2pct((z.wx1 + z.wx2) / 2, 0).x,
  }))
);

// Road polygon — encloses all truck routes with ~0.5-unit margin
// Bottom edge (low world-y) left→right, then top edge (high world-y) right→left
const ROAD_PTS = [
  // bottom edge
  [0, -0.2], [9, 0.5], [14, 0.5], [23, 4.5],
  // top edge (reversed)
  [23, 5.5], [14, 4.5], [9, 4], [0.5, 2.5],
].map(([x, y]) => pt(x, y)).join(' ');

// Actual truck lane guides (from simulator routes — these ARE the truck paths)
const LANES = [
  [[0,0], [10,3], [13.5,4], [20,5]],   // TRUCK-01
  [[1,1], [10,2], [13.5,2], [21,5]],   // TRUCK-02
  [[2,2], [10,1], [13.5,1], [22,5]],   // TRUCK-03
].map(pts => pts.map(([x, y]) => pt(x, y)).join(' '));

// Zone boundary x positions (world x → pct)
const ZONE_DIVIDERS = [9, 16].map(wx => w2pct(wx, 0).x);

// Infrastructure nodes — world positions from simulator + logical reasoning
const INFRA = [
  { id: 'PIT-1',     wx: 0,    wy: 0,   icon: '⛏', label: 'PIT-1',     color: '#f59e0b' },
  { id: 'PIT-2',     wx: 1,    wy: 1,   icon: '⛏', label: 'PIT-2',     color: '#f59e0b' },
  { id: 'PIT-3',     wx: 2,    wy: 2,   icon: '⛏', label: 'PIT-3',     color: '#e8870d' },
  { id: 'CRUSHER-A', wx: 21.5, wy: 5.2, icon: '⚙', label: 'CRUSHER',   color: '#a78bfa' },
];

const infraComputed = computed(() =>
  INFRA.map(n => ({ ...n, p: w2pct(n.wx, n.wy) }))
);

// Traffic light world positions — placed at real choke points on the road
//   TL-01: Z1 side of Z1→Z2 boundary, mid-height of Z2 entry spread (y=2.5)
//   TL-02: Z2 center, x=12 (middle of all trucks' x-range), y=2.5 (mid-lane)
const TL_POS = {
  'TL-01': { wx: 8.5, wy: 2.5 },
  'TL-02': { wx: 12,  wy: 2.5 },
};

// ─── Computed: vehicles ───────────────────────────────────────────────────────
const vehicleList = computed(() =>
  Object.values(props.vehicles).map(v => {
    const wx = Number(v.x ?? 0);
    const wy = Number(v.y ?? 0);
    const pct = w2pct(wx, wy);

    if (import.meta.env.DEV) {
      console.debug(
        `[MAP] ${v.vehicle_id} | backend: x=${v.x} y=${v.y} zone=${v.zone_id}` +
        ` | world:(${wx},${wy}) | canvas:(${pct.x}%,${pct.y}%)`
      );
    }

    return { ...v, wx, wy, pctX: pct.x, pctY: pct.y };
  })
);

// ─── Computed: traffic lights ─────────────────────────────────────────────────
const lightList = computed(() =>
  Object.entries(props.trafficLights).map(([id, d]) => {
    const wpos = TL_POS[id] ?? { wx: 5, wy: 2.5 };
    const pct  = w2pct(wpos.wx, wpos.wy);
    return {
      id,
      state:   (d.state ?? d.status ?? 'UNKNOWN').toUpperCase(),
      zone_id: d.zone_id ?? '',
      pctX:    pct.x,
      pctY:    pct.y,
    };
  })
);

function lightColor(state) {
  if (state === 'GREEN')  return '#10b981';
  if (state === 'RED')    return '#ef4444';
  if (state === 'YELLOW') return '#f59e0b';
  return '#64748b';
}

function speedColor(speed) {
  const s = Number(speed ?? 0);
  if (s < 0.5) return '#ef4444';
  if (s < 1.5) return '#f59e0b';
  return '#10b981';
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
      <!--
        SVG: static map geometry (roads, zones, infra, lights).
        viewBox="0 0 100 100" — all coords are w2pct() percentages.
        Vehicle divs are overlaid absolutely using the SAME w2pct() values.
      -->
      <svg
        class="map-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- ── Layer 1: Zone backgrounds ── -->
        <rect
          v-for="z in zoneBands"
          :key="z.id"
          :x="z.x1" y="0"
          :width="z.x2 - z.x1" height="100"
          :fill="z.color"
        />

        <!-- Zone boundary dividers -->
        <line
          v-for="bx in ZONE_DIVIDERS"
          :key="'div-' + bx"
          :x1="bx" y1="0" :x2="bx" y2="100"
          stroke="rgba(255,255,255,0.06)"
          stroke-width="0.15"
          stroke-dasharray="1.2 1.2"
        />

        <!-- Zone labels (bottom of canvas, above margin) -->
        <text
          v-for="z in zoneBands"
          :key="'lbl-' + z.id"
          :x="z.lx" y="97"
          text-anchor="middle"
          font-size="2.5"
          font-family="monospace"
          font-weight="700"
          fill="rgba(148,163,184,0.4)"
        >{{ z.label }}</text>

        <!-- ── Layer 2: Road polygon ── -->
        <polygon
          :points="ROAD_PTS"
          fill="rgba(100,116,139,0.15)"
          stroke="rgba(148,163,184,0.25)"
          stroke-width="0.2"
        />

        <!-- Lane guides (actual simulator routes, drawn as dashed polylines) -->
        <polyline
          v-for="(pts, i) in LANES"
          :key="'lane-' + i"
          :points="pts"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          stroke-width="0.25"
          stroke-dasharray="1.5 1"
        />

        <!-- ── Layer 3: Infrastructure nodes ── -->
        <g v-for="n in infraComputed" :key="n.id">
          <circle
            :cx="n.p.x" :cy="n.p.y" r="2.2"
            :fill="n.color + '18'"
            :stroke="n.color + '70'"
            stroke-width="0.3"
          />
          <text
            :x="n.p.x" :y="n.p.y + 1"
            text-anchor="middle"
            font-size="2.8"
          >{{ n.icon }}</text>
          <text
            :x="n.p.x" :y="n.p.y + 4"
            text-anchor="middle"
            font-size="1.8"
            font-family="monospace"
            font-weight="700"
            :fill="n.color"
          >{{ n.label }}</text>
        </g>

        <!-- ── Layer 4: Traffic lights ── -->
        <g v-for="light in lightList" :key="light.id">
          <!-- Post -->
          <line
            :x1="light.pctX" :y1="light.pctY + 3.5"
            :x2="light.pctX" :y2="light.pctY + 1.2"
            stroke="rgba(200,200,200,0.35)"
            stroke-width="0.3"
          />
          <!-- Housing -->
          <rect
            :x="light.pctX - 1.4" :y="light.pctY - 1.4"
            width="2.8" height="2.8"
            rx="0.6"
            fill="rgba(10,15,30,0.92)"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="0.2"
          />
          <!-- Bulb -->
          <circle
            :cx="light.pctX" :cy="light.pctY" r="0.9"
            :fill="lightColor(light.state)"
          />
          <!-- ID text -->
          <text
            :x="light.pctX" :y="light.pctY + 5.5"
            text-anchor="middle"
            font-size="1.6"
            font-family="monospace"
            fill="rgba(255,255,255,0.7)"
          >{{ light.id }}</text>
          <!-- State text -->
          <text
            :x="light.pctX" :y="light.pctY + 7.5"
            text-anchor="middle"
            font-size="1.5"
            font-family="monospace"
            :fill="lightColor(light.state)"
          >{{ light.state }}</text>
        </g>

        <!-- Empty state -->
        <g v-if="vehicleList.length === 0 && lightList.length === 0">
          <text
            x="50" y="46"
            text-anchor="middle"
            font-size="3.5"
            fill="rgba(100,116,139,0.6)"
          >Waiting for gateway data…</text>
          <text
            x="50" y="52"
            text-anchor="middle"
            font-size="2.2"
            fill="rgba(100,116,139,0.35)"
          >Backend must be running on port 8000</text>
        </g>
      </svg>

      <!--
        Vehicles: HTML divs overlaid on SVG.
        Positioned using the SAME w2pct() percentages → guaranteed alignment.
        CSS transition: left/top for smooth movement between updates.
      -->
      <div
        v-for="v in vehicleList"
        :key="v.vehicle_id"
        class="vehicle"
        :style="{
          left: v.pctX + '%',
          top:  v.pctY + '%',
          '--speed-color': speedColor(v.speed),
        }"
        :title="`${v.vehicle_id} | Zone ${v.zone_id} | (${v.wx}, ${v.wy}) | ${v.speed} km/h → ${v.destination}`"
      >
        <div class="v-ring"></div>
        <div class="v-icon">🚜</div>
        <span class="v-label">{{ v.vehicle_id }}</span>
        <span class="v-speed">{{ Number(v.speed).toFixed(1) }} km/h</span>
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
  margin-bottom: 0.6rem;
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

/* ── Canvas: relative container for SVG + vehicle overlay ── */
.canvas {
  flex: 1;
  position: relative;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 88% 18%, rgba(167,139,250,0.07) 0%, transparent 45%),
    radial-gradient(ellipse at  5% 82%, rgba(245,158,11,0.07)  0%, transparent 40%),
    rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255,255,255,0.06);
}

/* SVG fills the container exactly — preserveAspectRatio="none" stretches it */
.map-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ── Vehicles: absolutely positioned over SVG ── */
.vehicle {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  z-index: 20;
  pointer-events: none;
  /* Smooth position interpolation — matches the 1s backend update cycle */
  transition: left 0.75s ease, top 0.75s ease;
}

/* Speed-colored glow ring */
.v-ring {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--speed-color, #10b981);
  box-shadow: 0 0 8px var(--speed-color, #10b981);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.7;
  transition: border-color 0.4s, box-shadow 0.4s;
}

.v-icon {
  font-size: 1rem;
  line-height: 1;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8));
}

.v-label {
  font-size: 0.42rem;
  font-weight: 700;
  color: #fff;
  background: rgba(37, 99, 235, 0.85);
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: monospace;
}

.v-speed {
  font-size: 0.38rem;
  color: rgba(255,255,255,0.65);
  background: rgba(0,0,0,0.55);
  padding: 0 3px;
  border-radius: 2px;
  white-space: nowrap;
  font-family: monospace;
}
</style>

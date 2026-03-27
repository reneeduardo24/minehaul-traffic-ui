<script setup>
import { computed, reactive, watch } from 'vue';

import MapFacilityGlyph from './map/MapFacilityGlyph.vue';
import RuntimeFleetPanel from './map/RuntimeFleetPanel.vue';
import MapSignalGlyph from './map/MapSignalGlyph.vue';
import MapTruckGlyph from './map/MapTruckGlyph.vue';
import {
  getMaterialMeta,
  getTrafficLightStateMeta,
  getVehicleState,
  sortVehiclesById,
} from '../utils/runtimeCatalog';

const props = defineProps({
  vehicles: { type: Object, default: () => ({}) },
  trafficLights: { type: Object, default: () => ({}) },
  topology: { type: Object, default: null },
});

const world = computed(() => props.topology?.world || { min_x: 0, min_y: 0, max_x: 24, max_y: 10 });
const worldWidth = computed(() => world.value.max_x - world.value.min_x);
const worldHeight = computed(() => world.value.max_y - world.value.min_y);
const worldMidX = computed(() => world.value.min_x + worldWidth.value / 2);
const viewBox = computed(() => `${world.value.min_x} ${world.value.min_y} ${worldWidth.value} ${worldHeight.value}`);

const zones = computed(() => props.topology?.zones || []);
const roads = computed(() => props.topology?.roads || []);
const facilities = computed(() => props.topology?.facilities || []);
const hasTopology = computed(() => Boolean(props.topology));

const headingMemory = reactive({});

watch(
  () => Object.values(props.vehicles || {}).map((vehicle) => ({
    vehicle_id: vehicle.vehicle_id,
    x: Number(vehicle.x ?? 0),
    y: Number(vehicle.y ?? 0),
  })),
  (positions) => {
    const active = new Set();

    positions.forEach((vehicle) => {
      active.add(vehicle.vehicle_id);
      const previous = headingMemory[vehicle.vehicle_id];
      let angle = previous?.angle ?? 0;

      if (previous) {
        const deltaX = vehicle.x - previous.x;
        const deltaY = vehicle.y - previous.y;
        if (Math.abs(deltaX) > 0.01 || Math.abs(deltaY) > 0.01) {
          angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        }
      }

      headingMemory[vehicle.vehicle_id] = {
        x: vehicle.x,
        y: vehicle.y,
        angle,
      };
    });

    Object.keys(headingMemory).forEach((vehicleId) => {
      if (!active.has(vehicleId)) delete headingMemory[vehicleId];
    });
  },
  { immediate: true },
);

const lightList = computed(() => {
  const ordered = [];
  const knownIds = new Set();

  (props.topology?.traffic_lights || []).forEach((meta) => {
    knownIds.add(meta.id);
    const runtime = props.trafficLights?.[meta.id] || {};
    const state = String(runtime.state || meta.default_state || 'UNKNOWN').toUpperCase();
    ordered.push({
      id: meta.id,
      x: Number(runtime.x ?? meta.x ?? 0),
      y: Number(runtime.y ?? meta.y ?? 0),
      zone_id: runtime.zone_id ?? meta.zone_id ?? '',
      label: runtime.label ?? meta.label ?? meta.id,
      label_dx: Number(runtime.label_dx ?? meta.label_dx ?? 0),
      label_dy: Number(runtime.label_dy ?? meta.label_dy ?? 1.2),
      label_anchor: runtime.label_anchor ?? meta.label_anchor ?? 'middle',
      state,
      stateMeta: getTrafficLightStateMeta(state),
    });
  });

  Object.entries(props.trafficLights || {}).forEach(([id, runtime]) => {
    if (knownIds.has(id)) return;
    const state = String(runtime.state || 'UNKNOWN').toUpperCase();
    ordered.push({
      id,
      x: Number(runtime.x ?? 0),
      y: Number(runtime.y ?? 0),
      zone_id: runtime.zone_id ?? '',
      label: runtime.label ?? id,
      label_dx: Number(runtime.label_dx ?? 0),
      label_dy: Number(runtime.label_dy ?? 1.2),
      label_anchor: runtime.label_anchor ?? 'middle',
      state,
      stateMeta: getTrafficLightStateMeta(state),
    });
  });

  return ordered.sort((left, right) => left.id.localeCompare(right.id));
});

const vehicleList = computed(() =>
  sortVehiclesById(
    Object.values(props.vehicles || {}).map((vehicle) => {
      const state = getVehicleState(vehicle.speed);
      const material = getMaterialMeta(vehicle.material_type, props.topology);

      return {
        ...vehicle,
        x: Number(vehicle.x ?? 0),
        y: Number(vehicle.y ?? 0),
        speed: Number(vehicle.speed ?? 0),
        heading: headingMemory[vehicle.vehicle_id]?.angle ?? 0,
        state,
        material,
      };
    }),
  ),
);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function logicalToViewportPoint(x, y) {
  return {
    x,
    y: world.value.max_y - y + world.value.min_y,
  };
}

function clampToBounds(x, y, padding = 0.75) {
  return {
    x: clamp(x, world.value.min_x + padding, world.value.max_x - padding),
    y: clamp(y, world.value.min_y + padding, world.value.max_y - padding),
  };
}

function pathFromPoints(points = []) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const radius = 0.52;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];

    const previousDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const nextDistance = Math.hypot(next.x - current.x, next.y - current.y);
    const cornerRadius = Math.min(radius, previousDistance / 2, nextDistance / 2);

    const startX = current.x + ((previous.x - current.x) / previousDistance) * cornerRadius;
    const startY = current.y + ((previous.y - current.y) / previousDistance) * cornerRadius;
    const endX = current.x + ((next.x - current.x) / nextDistance) * cornerRadius;
    const endY = current.y + ((next.y - current.y) / nextDistance) * cornerRadius;

    path += ` L ${startX} ${startY}`;
    path += ` Q ${current.x} ${current.y} ${endX} ${endY}`;
  }

  const tail = points[points.length - 1];
  path += ` L ${tail.x} ${tail.y}`;
  return path;
}

function zoneBackdropPath(zone) {
  const insetX = 0.45;
  const insetY = 0.55;
  const x = zone.x + insetX;
  const y = zone.y + insetY;
  const width = zone.width - insetX * 2;
  const height = zone.height - insetY * 2;

  if (zone.id === 'Z1') {
    return [
      `M ${x + 0.3} ${y + 0.6}`,
      `C ${x + width * 0.18} ${y - 0.05}, ${x + width * 0.58} ${y + 0.05}, ${x + width - 0.3} ${y + 0.8}`,
      `L ${x + width - 0.15} ${y + height - 0.7}`,
      `C ${x + width * 0.72} ${y + height + 0.1}, ${x + width * 0.26} ${y + height + 0.12}, ${x + 0.2} ${y + height - 0.45}`,
      'Z',
    ].join(' ');
  }

  if (zone.id === 'Z2') {
    return [
      `M ${x + 0.1} ${y + 0.55}`,
      `C ${x + width * 0.25} ${y - 0.02}, ${x + width * 0.76} ${y - 0.02}, ${x + width - 0.1} ${y + 0.55}`,
      `L ${x + width - 0.1} ${y + height - 0.55}`,
      `C ${x + width * 0.74} ${y + height + 0.1}, ${x + width * 0.24} ${y + height + 0.12}, ${x + 0.05} ${y + height - 0.55}`,
      'Z',
    ].join(' ');
  }

  return [
    `M ${x + 0.2} ${y + 0.5}`,
    `C ${x + width * 0.2} ${y - 0.06}, ${x + width * 0.62} ${y + 0.02}, ${x + width - 0.18} ${y + 0.5}`,
    `L ${x + width - 0.3} ${y + height - 0.45}`,
    `C ${x + width * 0.66} ${y + height + 0.1}, ${x + width * 0.22} ${y + height + 0.12}, ${x + 0.08} ${y + height - 0.6}`,
    'Z',
  ].join(' ');
}

function roadClass(kind) {
  return `road-${kind || 'branch'}`;
}

function badgeWidth(text) {
  return Math.max(1.8, 0.68 + text.length * 0.17);
}

function buildBadge(text, x, y, anchor = 'start', variant = 'default', accent = '#8ca0b8') {
  const width = badgeWidth(text);
  return {
    text,
    x,
    y,
    anchor,
    width,
    rectX: anchor === 'start' ? 0 : anchor === 'end' ? -width : -width / 2,
    textX: anchor === 'start' ? 0.24 : anchor === 'end' ? -0.24 : 0,
    variant,
    accent,
  };
}

const zoneBadges = computed(() => {
  const accents = {
    Z1: '#d68624',
    Z2: '#4fa9ff',
    Z3: '#56d389',
  };

  return zones.value.map((zone) => {
    const anchor = zone.id === 'Z2' ? 'middle' : zone.id === 'Z1' ? 'start' : 'end';
    const x = zone.id === 'Z2' ? zone.x + zone.width / 2 : zone.id === 'Z1' ? zone.x + 0.9 : zone.x + zone.width - 0.9;
    return buildBadge(`${zone.id} · ${zone.label}`, x, 0.95, anchor, 'zone', accents[zone.id] || '#8ca0b8');
  });
});

const facilityBadges = computed(() =>
  facilities.value.map((facility) => {
    const anchor = facility.label_anchor || (facility.x < worldMidX.value ? 'start' : 'end');
    const viewport = logicalToViewportPoint(facility.x, facility.y);
    const point = clampToBounds(
      facility.x + Number(facility.label_dx ?? (anchor === 'start' ? 1.0 : -1.0)),
      viewport.y - Number(facility.label_dy ?? 0),
      0.8,
    );

    return buildBadge(facility.label, point.x, point.y, anchor, 'facility', facility.kind === 'pit' ? '#d68624' : facility.kind === 'crusher' ? '#56d389' : facility.kind === 'dump' ? '#7dd28b' : '#66cfd4');
  }),
);

const lightBadges = computed(() =>
  lightList.value.map((light) => {
    const anchor = light.label_anchor || 'middle';
    const viewport = logicalToViewportPoint(light.x, light.y);
    const point = clampToBounds(
      light.x + light.label_dx,
      viewport.y - light.label_dy,
      0.8,
    );
    return buildBadge(`${light.id} · ${light.state}`, point.x, point.y, anchor, 'light', light.stateMeta.accent);
  }),
);

const vehicleBadges = computed(() =>
  vehicleList.value.map((vehicle) => {
    const anchor = vehicle.x < worldMidX.value ? 'start' : 'end';
    const viewport = logicalToViewportPoint(vehicle.x, vehicle.y);
    const offsetY = viewport.y < 2.0 ? 0.95 : viewport.y > world.value.max_y - 2.0 ? -0.95 : vehicle.y > 5.5 ? 0.92 : -0.9;
    const point = clampToBounds(
      vehicle.x + (anchor === 'start' ? 0.88 : -0.88),
      viewport.y + offsetY,
      0.9,
    );
    return buildBadge(`${vehicle.vehicle_id} · ${vehicle.material.shortLabel}`, point.x, point.y, anchor, 'vehicle', vehicle.state.accent);
  }),
);

function vehicleTransform(vehicle) {
  return `translate(${vehicle.x} ${vehicle.y}) rotate(${vehicle.heading})`;
}
</script>

<template>
  <div class="map-wrapper glass-panel">
    <div class="map-header">
      <div>
        <p class="eyebrow">Live Mine Map</p>
        <h2>Red operativa distribuida</h2>
        <p>Topologia inspirada directamente en la referencia MAPA: cuatro accesos, cuatro destinos y cuatro cruces regulados sin depender de una sola via central.</p>
      </div>
      <div class="map-summary">
        <span>4 accesos</span>
        <span>4 destinos</span>
        <span>4 semaforos</span>
      </div>
    </div>

    <div class="canvas">
      <div class="map-stage">
        <svg class="map-svg" :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="terrain-grid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.03" />
            </pattern>
            <pattern id="terrain-cross" width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 0 2 L 2 0" fill="none" stroke="rgba(255,255,255,0.018)" stroke-width="0.03" />
            </pattern>

            <linearGradient id="zone-z1" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(214,134,36,0.16)" />
              <stop offset="100%" stop-color="rgba(214,134,36,0.04)" />
            </linearGradient>
            <linearGradient id="zone-z2" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(79,169,255,0.14)" />
              <stop offset="100%" stop-color="rgba(79,169,255,0.03)" />
            </linearGradient>
            <linearGradient id="zone-z3" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="rgba(86,211,137,0.16)" />
              <stop offset="100%" stop-color="rgba(86,211,137,0.04)" />
            </linearGradient>

            <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.26" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="vehicle-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect :x="world.min_x" :y="world.min_y" :width="worldWidth" :height="worldHeight" class="map-base" />
          <rect :x="world.min_x" :y="world.min_y" :width="worldWidth" :height="worldHeight" fill="url(#terrain-grid)" />
          <rect :x="world.min_x" :y="world.min_y" :width="worldWidth" :height="worldHeight" fill="url(#terrain-cross)" opacity="0.82" />

          <g :transform="`translate(0 ${world.max_y + world.min_y}) scale(1 -1)`">
            <g class="zone-atmosphere">
              <path v-for="zone in zones" :key="`zone-backdrop-${zone.id}`" :d="zoneBackdropPath(zone)" class="zone-shape" :class="`zone-${zone.id.toLowerCase()}`" />
            </g>

            <g class="conflict-layer">
              <g v-for="light in lightList" :key="`intersection-${light.id}`" class="intersection-group">
                <circle :cx="light.x" :cy="light.y" r="1.08" class="intersection-glow" :style="{ '--intersection-accent': light.stateMeta.accent }" />
                <rect :x="light.x - 0.92" :y="light.y - 0.92" width="1.84" height="1.84" rx="0.34" class="intersection-pad" />
                <path :d="`M ${light.x - 1.24} ${light.y} L ${light.x + 1.24} ${light.y}`" class="intersection-guide" />
                <path :d="`M ${light.x} ${light.y - 1.24} L ${light.x} ${light.y + 1.24}`" class="intersection-guide vertical" />
              </g>
            </g>

            <g class="road-layer">
              <g v-for="road in roads" :key="road.id" :class="['road-group', roadClass(road.kind)]">
                <path :d="pathFromPoints(road.waypoints)" class="road-shadow" />
                <path :d="pathFromPoints(road.waypoints)" class="road-outline" />
                <path :d="pathFromPoints(road.waypoints)" class="road-surface" />
                <path :d="pathFromPoints(road.waypoints)" class="road-lane" />
              </g>
            </g>

            <g class="facility-layer">
              <g
                v-for="facility in facilities"
                :key="facility.id"
                :id="`facility-${facility.id}`"
                :transform="`translate(${facility.x} ${facility.y})`"
                class="facility-group"
              >
                <MapFacilityGlyph :facility="facility" />
              </g>
            </g>

            <g class="light-layer">
              <g
                v-for="light in lightList"
                :key="light.id"
                :id="`light-${light.id}`"
                :transform="`translate(${light.x} ${light.y})`"
                class="light-group"
                filter="url(#soft-glow)"
              >
                <MapSignalGlyph :light="light" />
              </g>
            </g>

            <g class="vehicle-layer">
              <g
                v-for="vehicle in vehicleList"
                :key="vehicle.vehicle_id"
                :id="`vehicle-${vehicle.vehicle_id}`"
                :transform="vehicleTransform(vehicle)"
                filter="url(#vehicle-glow)"
              >
                <MapTruckGlyph :vehicle="vehicle" />
              </g>
            </g>
          </g>

          <g class="label-layer">
            <g
              v-for="zone in zoneBadges"
              :key="zone.text"
              :transform="`translate(${zone.x} ${zone.y})`"
              :class="['badge-group', zone.variant]"
              :style="{ '--badge-accent': zone.accent }"
            >
              <rect :x="zone.rectX" y="-0.36" :width="zone.width" height="0.72" rx="0.24" class="badge-bg" />
              <text :x="zone.textX" y="0.01" :text-anchor="zone.anchor" class="badge-text zone-text">{{ zone.text }}</text>
            </g>

            <g
              v-for="facility in facilityBadges"
              :key="facility.text"
              :transform="`translate(${facility.x} ${facility.y})`"
              :class="['badge-group', facility.variant]"
              :style="{ '--badge-accent': facility.accent }"
            >
              <rect :x="facility.rectX" y="-0.3" :width="facility.width" height="0.6" rx="0.2" class="badge-bg" />
              <text :x="facility.textX" y="0.01" :text-anchor="facility.anchor" class="badge-text facility-text">{{ facility.text }}</text>
            </g>

            <g
              v-for="light in lightBadges"
              :key="light.text"
              :transform="`translate(${light.x} ${light.y})`"
              :class="['badge-group', light.variant]"
              :style="{ '--badge-accent': light.accent }"
            >
              <rect :x="light.rectX" y="-0.28" :width="light.width" height="0.56" rx="0.18" class="badge-bg" />
              <text :x="light.textX" y="0" :text-anchor="light.anchor" class="badge-text light-text">{{ light.text }}</text>
            </g>

            <g
              v-for="vehicle in vehicleBadges"
              :key="vehicle.text"
              :transform="`translate(${vehicle.x} ${vehicle.y})`"
              :class="['badge-group', vehicle.variant]"
              :style="{ '--badge-accent': vehicle.accent }"
            >
              <rect :x="vehicle.rectX" y="-0.28" :width="vehicle.width" height="0.56" rx="0.18" class="badge-bg" />
              <text :x="vehicle.textX" y="0" :text-anchor="vehicle.anchor" class="badge-text vehicle-text">{{ vehicle.text }}</text>
            </g>
          </g>

          <g v-if="!hasTopology" class="empty-state">
            <text :x="world.min_x + worldWidth / 2" :y="world.min_y + worldHeight / 2 - 0.2">Cargando topologia operativa...</text>
            <text :x="world.min_x + worldWidth / 2" :y="world.min_y + worldHeight / 2 + 0.8">Esperando metadatos del gateway</text>
          </g>

          <g v-else-if="vehicleList.length === 0" class="empty-state">
            <text :x="world.min_x + worldWidth / 2" :y="world.min_y + worldHeight / 2 - 0.2">Sin camiones en vivo</text>
            <text :x="world.min_x + worldWidth / 2" :y="world.min_y + worldHeight / 2 + 0.8">Arranca el simulador o publica una posicion desde el panel de control</text>
          </g>
        </svg>
      </div>

      <RuntimeFleetPanel :vehicles="vehicleList" :lights="lightList" :topology="topology" />
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  display: flex;
  flex-direction: column;
  container-type: inline-size;
  height: 100%;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
}

.map-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.eyebrow {
  margin: 0 0 0.15rem;
  color: rgba(177, 191, 209, 0.7);
  font-size: 0.64rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.map-header h2 {
  margin: 0;
  font-size: 1.04rem;
}

.map-header p:last-child {
  margin: 0.25rem 0 0;
  color: var(--text-muted);
  font-size: 0.73rem;
  line-height: 1.5;
  max-width: 62ch;
}

.map-summary {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.map-summary span {
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  color: rgba(230, 238, 248, 0.84);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.canvas {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);
  gap: 0.85rem;
  align-items: stretch;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.map-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(circle at 9% 18%, rgba(214, 134, 36, 0.1), transparent 28%),
    radial-gradient(circle at 48% 42%, rgba(79, 169, 255, 0.09), transparent 30%),
    radial-gradient(circle at 86% 18%, rgba(86, 211, 137, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(7, 12, 19, 0.98), rgba(6, 10, 16, 0.97));
}

.map-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  min-width: 0;
  min-height: 0;
}

.canvas :deep(.fleet-panel) {
  min-height: 0;
  height: 100%;
  min-width: 0;
}

.map-base {
  fill: rgba(6, 10, 16, 0.98);
}

.zone-shape {
  stroke-width: 0.08;
  stroke: rgba(255, 255, 255, 0.08);
  filter: url(#soft-glow);
}

.zone-z1 {
  fill: url(#zone-z1);
}

.zone-z2 {
  fill: url(#zone-z2);
}

.zone-z3 {
  fill: url(#zone-z3);
}

.intersection-glow {
  fill: var(--intersection-accent);
  opacity: 0.12;
}

.intersection-pad {
  fill: rgba(9, 14, 22, 0.88);
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 0.06;
}

.intersection-guide {
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 0.14;
  stroke-linecap: round;
}

.road-group path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.road-shadow {
  stroke: rgba(0, 0, 0, 0.4);
  filter: url(#soft-glow);
}

.road-outline {
  stroke: rgba(255, 255, 255, 0.1);
}

.road-surface {
  stroke: rgba(67, 82, 98, 0.9);
}

.road-lane {
  stroke: rgba(242, 248, 255, 0.22);
  stroke-dasharray: 0.52 0.38;
}

.road-primary .road-shadow {
  stroke-width: 1.12;
}

.road-primary .road-outline {
  stroke-width: 0.9;
}

.road-primary .road-surface {
  stroke-width: 0.76;
}

.road-primary .road-lane {
  stroke-width: 0.1;
}

.road-collector .road-shadow {
  stroke-width: 1.0;
}

.road-collector .road-outline {
  stroke-width: 0.74;
}

.road-collector .road-surface {
  stroke-width: 0.64;
  stroke: rgba(80, 96, 114, 0.92);
}

.road-collector .road-lane {
  stroke-width: 0.09;
  stroke: rgba(238, 246, 255, 0.18);
}

.road-branch .road-shadow {
  stroke-width: 0.9;
}

.road-branch .road-outline {
  stroke-width: 0.66;
}

.road-branch .road-surface {
  stroke-width: 0.56;
  stroke: rgba(90, 104, 120, 0.9);
}

.road-branch .road-lane {
  stroke-width: 0.08;
  stroke-dasharray: 0.42 0.3;
}

.facility-layer,
.light-layer,
.vehicle-layer {
  isolation: isolate;
}

.facility-group {
  filter: url(#soft-glow);
}

.label-layer text,
.empty-state text {
  dominant-baseline: middle;
  font-family: var(--font-mono);
}

.badge-bg {
  fill: rgba(7, 13, 21, 0.88);
  stroke: color-mix(in srgb, var(--badge-accent) 38%, rgba(255, 255, 255, 0.12));
  stroke-width: 0.04;
}

.badge-text {
  fill: rgba(244, 248, 252, 0.9);
  font-size: 0.33px;
  letter-spacing: 0.03em;
}

.zone-text {
  font-size: 0.38px;
  font-weight: 700;
}

.facility-text,
.light-text,
.vehicle-text {
  font-weight: 700;
}

.light-text,
.vehicle-text {
  font-size: 0.31px;
}

.empty-state text:first-child {
  text-anchor: middle;
  font-size: 0.74px;
  fill: rgba(255, 255, 255, 0.66);
}

.empty-state text:last-child {
  text-anchor: middle;
  font-size: 0.48px;
  fill: rgba(255, 255, 255, 0.44);
}

@media (max-height: 820px) {
  .map-header {
    grid-template-columns: 1fr;
  }

  .canvas {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(320px, 58vh) auto;
  }

  .map-stage {
    min-height: 320px;
  }

  .canvas :deep(.fleet-panel) {
    height: auto;
    max-height: 420px;
  }
}

@container (max-width: 760px) {
  .map-header {
    grid-template-columns: 1fr;
  }

  .map-summary {
    justify-content: flex-start;
  }

  .canvas {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(360px, 1fr) auto;
  }

  .map-stage {
    min-height: 360px;
  }

  .canvas :deep(.fleet-panel) {
    height: auto;
    max-height: 480px;
  }
}

@media (max-width: 1400px), (max-height: 820px) {
  .map-wrapper {
    height: auto;
    min-height: 780px;
  }
}
</style>

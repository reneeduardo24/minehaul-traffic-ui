<script setup>
import { computed } from 'vue';

import {
  formatFacilityLabel,
  formatSpeed,
  getTrafficLightStateMeta,
  sortVehiclesById,
} from '../../utils/runtimeCatalog';

const props = defineProps({
  vehicles: { type: Array, default: () => [] },
  lights: { type: Array, default: () => [] },
  topology: { type: Object, default: null },
});

const fleet = computed(() => sortVehiclesById(props.vehicles));
const stateCounts = computed(() => ({
  moving: fleet.value.filter((vehicle) => vehicle.state.id === 'moving').length,
  slow: fleet.value.filter((vehicle) => vehicle.state.id === 'slow').length,
  stopped: fleet.value.filter((vehicle) => vehicle.state.id === 'stopped').length,
}));

const lightList = computed(() =>
  [...props.lights]
    .map((light) => ({ ...light, stateMeta: getTrafficLightStateMeta(light.state) }))
    .sort((left, right) => left.id.localeCompare(right.id)),
);
</script>

<template>
  <aside class="fleet-panel">
    <div class="panel-head">
      <div>
        <p class="eyebrow">Runtime Fleet</p>
        <h3>Estado operativo</h3>
      </div>
      <span class="fleet-total">{{ fleet.length }} camiones</span>
    </div>

    <div class="fleet-stats">
      <div class="stat-card moving">
        <span class="stat-n">{{ stateCounts.moving }}</span>
        <span class="stat-l">En ruta</span>
      </div>
      <div class="stat-card slow">
        <span class="stat-n">{{ stateCounts.slow }}</span>
        <span class="stat-l">Precaucion</span>
      </div>
      <div class="stat-card stopped">
        <span class="stat-n">{{ stateCounts.stopped }}</span>
        <span class="stat-l">Detenidos</span>
      </div>
    </div>

    <div class="truck-list">
      <div v-if="fleet.length === 0" class="empty-panel">
        Esperando telemetria del simulador.
      </div>

      <article v-for="vehicle in fleet" :key="vehicle.vehicle_id" class="truck-row" :data-state="vehicle.state.id">
        <div class="truck-mark" :style="{ '--state-accent': vehicle.state.accent, '--material-accent': vehicle.material.accent }">
          <span class="truck-mark-body"></span>
          <span class="truck-mark-cargo"></span>
        </div>

        <div class="truck-copy">
          <div class="truck-mainline">
            <strong>{{ vehicle.vehicle_id }}</strong>
            <span class="state-chip" :style="{ '--chip-accent': vehicle.state.accent }">{{ vehicle.state.panelLabel }}</span>
          </div>

          <div class="truck-subline">
            <span class="material-pill" :style="{ '--material-accent': vehicle.material.accent }">
              {{ vehicle.material.iconLabel }}
            </span>
            <span>{{ vehicle.material.label }}</span>
            <span class="divider"></span>
            <span>{{ formatSpeed(vehicle.speed) }}</span>
          </div>

          <div class="truck-route">
            {{ vehicle.zone_id }} -> {{ formatFacilityLabel(vehicle.destination, topology) }}
          </div>
        </div>
      </article>
    </div>

    <div class="light-summary">
      <p class="eyebrow">Intersecciones</p>
      <div class="light-grid">
        <div v-for="light in lightList" :key="light.id" class="light-row" :style="{ '--light-accent': light.stateMeta.accent }">
          <span class="light-dot"></span>
          <div>
            <strong>{{ light.id }}</strong>
            <span>{{ light.stateMeta.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.fleet-panel {
  position: relative;
  z-index: 2;
  container-type: inline-size;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(9, 16, 25, 0.88), rgba(7, 12, 20, 0.96));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.panel-head,
.truck-mainline,
.truck-subline,
.light-row {
  display: flex;
  align-items: center;
}

.panel-head {
  justify-content: space-between;
  gap: 0.8rem;
}

.panel-head h3 {
  margin: 0.1rem 0 0;
  font-size: 0.95rem;
}

.eyebrow {
  margin: 0;
  color: rgba(191, 204, 222, 0.72);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.fleet-total {
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(232, 241, 255, 0.84);
  font-size: 0.68rem;
}

.fleet-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.55rem 0.65rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
}

.stat-card.moving {
  box-shadow: inset 0 0 0 1px rgba(63, 208, 126, 0.14);
}

.stat-card.slow {
  box-shadow: inset 0 0 0 1px rgba(242, 180, 71, 0.16);
}

.stat-card.stopped {
  box-shadow: inset 0 0 0 1px rgba(239, 98, 98, 0.16);
}

.stat-n {
  font-size: 1.08rem;
  font-weight: 700;
}

.stat-l {
  color: rgba(191, 204, 222, 0.72);
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.truck-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  overflow: auto;
  padding-right: 0.12rem;
}

.truck-row {
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr);
  gap: 0.7rem;
  padding: 0.6rem 0.65rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.035);
}

.truck-mark {
  position: relative;
  width: 2.1rem;
  height: 1.35rem;
  margin-top: 0.05rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.04);
}

.truck-mark-body,
.truck-mark-cargo {
  position: absolute;
  display: block;
}

.truck-mark-body {
  inset: 0.4rem 0.2rem 0.25rem 0.2rem;
  border-radius: 0.38rem;
  border: 1px solid rgba(255, 255, 255, 0.38);
  background: linear-gradient(180deg, rgba(27, 35, 46, 0.96), rgba(17, 23, 32, 0.94));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--state-accent) 30%, transparent);
}

.truck-mark-cargo {
  left: 0.34rem;
  right: 0.86rem;
  top: 0.51rem;
  height: 0.24rem;
  border-radius: 0.18rem;
  background: var(--material-accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--material-accent) 50%, transparent);
}

.truck-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.truck-mainline {
  justify-content: space-between;
  gap: 0.5rem;
}

.truck-mainline strong {
  font-size: 0.78rem;
}

.state-chip,
.material-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.state-chip {
  padding: 0.22rem 0.45rem;
  border: 1px solid color-mix(in srgb, var(--chip-accent) 35%, transparent);
  background: color-mix(in srgb, var(--chip-accent) 12%, rgba(255, 255, 255, 0.02));
  color: var(--chip-accent);
}

.truck-subline {
  gap: 0.36rem;
  flex-wrap: wrap;
  color: rgba(217, 228, 242, 0.82);
  font-size: 0.68rem;
}

.material-pill {
  width: 1.5rem;
  padding: 0.18rem 0;
  color: rgba(6, 12, 20, 0.94);
  background: var(--material-accent);
}

.divider {
  width: 0.24rem;
  height: 0.24rem;
  border-radius: 999px;
  background: rgba(191, 204, 222, 0.36);
}

.truck-route {
  color: rgba(166, 181, 198, 0.74);
  font-size: 0.63rem;
  letter-spacing: 0.04em;
}

.light-summary {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.7rem;
}

.light-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.light-row {
  gap: 0.45rem;
  padding: 0.45rem 0.55rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.035);
}

.light-row strong,
.light-row span {
  display: block;
}

.light-row strong {
  font-size: 0.7rem;
}

.light-row span:last-child {
  color: rgba(191, 204, 222, 0.72);
  font-size: 0.62rem;
}

.light-dot {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 999px;
  background: var(--light-accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--light-accent) 55%, transparent);
}

.empty-panel {
  padding: 0.7rem 0.2rem;
  color: rgba(166, 181, 198, 0.72);
  font-size: 0.72rem;
  text-align: center;
}

@container (max-width: 300px) {
  .panel-head,
  .truck-mainline {
    align-items: flex-start;
    flex-direction: column;
  }

  .fleet-stats,
  .light-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1180px) {
  .fleet-panel {
    position: static;
    width: 100%;
    height: auto;
    max-height: none;
  }
}
</style>

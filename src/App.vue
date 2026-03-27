<script setup>
import { computed } from 'vue';

import ControlPanel from './components/ControlPanel.vue';
import EventNotifications from './components/EventNotifications.vue';
import TrafficMap from './components/TrafficMap.vue';
import { useMinehaulGateway } from './composables/useMinehaulGateway';
import { getVehicleState } from './utils/runtimeCatalog';

const {
  isConnected,
  vehicles,
  trafficLights,
  events,
  reports,
  topology,
  lastError,
  loading,
  publishVehiclePosition,
  changeTrafficLight,
  createDelivery,
  fetchMaterialReport,
  fetchCongestionReport,
  fetchState,
  fetchSummary,
} = useMinehaulGateway();

const fleet = computed(() => Object.values(vehicles.value || {}));
const vehicleCount = computed(() => fleet.value.length);
const lightCount = computed(() => Object.keys(trafficLights.value || {}).length);
const stateCounts = computed(() =>
  fleet.value.reduce(
    (counts, vehicle) => {
      const state = getVehicleState(vehicle.speed).id;
      counts[state] += 1;
      return counts;
    },
    { moving: 0, slow: 0, stopped: 0 },
  ),
);

const summary = computed(() => reports.value.summary || {});
</script>

<template>
  <div class="app-shell">
    <header class="header glass-panel">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <span></span>
        </div>

        <div class="brand-copy">
          <p class="eyebrow">Mine Vehicle Traffic System</p>
          <h1>MVTS Centro de Operaciones</h1>
          <p class="subtitle">Mapa en vivo, control de cruces, entregas y reportes sobre la misma operacion.</p>
        </div>
      </div>

      <div class="header-metrics">
        <article class="status-card" :class="{ live: isConnected }">
          <div>
            <p class="metric-label">Gateway</p>
            <strong>{{ isConnected ? 'En linea' : 'Desconectado' }}</strong>
          </div>
          <span class="status-dot"></span>
        </article>

        <article class="metric-card wide">
          <p class="metric-label">Flota</p>
          <strong>{{ vehicleCount }}</strong>
          <div class="metric-detail">
            <span class="moving">{{ stateCounts.moving }} en ruta</span>
            <span class="slow">{{ stateCounts.slow }} lento</span>
            <span class="stopped">{{ stateCounts.stopped }} parado</span>
          </div>
        </article>

        <article class="metric-card">
          <p class="metric-label">Semaforos</p>
          <strong>{{ lightCount }}</strong>
          <div class="metric-detail single">Intersecciones activas</div>
        </article>

        <article class="metric-card">
          <p class="metric-label">Despachos</p>
          <strong>{{ summary.delivery_count ?? 0 }}</strong>
          <div class="metric-detail single">{{ summary.tons_total ?? 0 }} t registradas</div>
        </article>
      </div>

      <div v-if="lastError" class="error-banner">
        {{ lastError }}
      </div>
    </header>

    <main class="dashboard">
      <ControlPanel
        class="dashboard-panel control-region"
        :topology="topology"
        :trafficLights="trafficLights"
        :reports="reports"
        :loadingState="loading"
        :publishVehiclePosition="publishVehiclePosition"
        :changeTrafficLight="changeTrafficLight"
        :createDelivery="createDelivery"
        :fetchMaterialReport="fetchMaterialReport"
        :fetchCongestionReport="fetchCongestionReport"
        :fetchState="fetchState"
        :fetchSummary="fetchSummary"
      />

      <TrafficMap class="dashboard-panel map-region" :vehicles="vehicles" :trafficLights="trafficLights" :topology="topology" />

      <EventNotifications class="dashboard-panel feed-region" :events="events" :topology="topology" />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0.85rem;
  gap: 0.85rem;
  overflow: hidden;
}

.header {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem 1.15rem;
  align-items: stretch;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.brand-mark {
  position: relative;
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(145deg, rgba(214, 134, 36, 0.16), rgba(79, 169, 255, 0.1));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.brand-mark span {
  position: absolute;
  inset: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.44);
  border-radius: 0.55rem 0.55rem 0.2rem 0.2rem;
  transform: skewX(-12deg);
}

.brand-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 0.18rem;
  color: rgba(186, 199, 216, 0.72);
  font-size: 0.64rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.brand-copy h1 {
  margin: 0;
  font-size: 1.3rem;
  letter-spacing: -0.03em;
}

.subtitle {
  margin: 0.22rem 0 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.55;
  max-width: 58ch;
}

.header-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(92px, auto);
  gap: 0.7rem;
  align-content: start;
}

.status-card,
.metric-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  min-height: 88px;
  padding: 0.8rem 0.85rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
}

.status-card {
  position: relative;
  grid-column: span 1;
}

.status-card.live {
  box-shadow: inset 0 0 0 1px rgba(63, 208, 126, 0.18);
}

.status-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  align-self: flex-end;
  background: #ef6262;
  box-shadow: 0 0 12px rgba(239, 98, 98, 0.72);
}

.status-card.live .status-dot {
  background: #3fd07e;
  box-shadow: 0 0 14px rgba(63, 208, 126, 0.76);
}

.metric-label {
  margin: 0;
  color: rgba(186, 199, 216, 0.72);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.status-card strong,
.metric-card strong {
  font-size: 1.18rem;
}

.metric-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  font-size: 0.64rem;
  color: rgba(220, 231, 242, 0.8);
}

.metric-detail.single {
  color: var(--text-muted);
}

.metric-detail .moving {
  color: #62d98f;
}

.metric-detail .slow {
  color: #f2b447;
}

.metric-detail .stopped {
  color: #ef6262;
}

.error-banner {
  grid-column: 1 / -1;
  padding: 0.65rem 0.8rem;
  border-radius: 12px;
  border: 1px solid rgba(239, 98, 98, 0.26);
  background: rgba(239, 98, 98, 0.08);
  color: #ffc0c0;
  font-size: 0.74rem;
}

.dashboard {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr) minmax(290px, 330px);
  grid-template-rows: minmax(0, 1fr);
  grid-template-areas: 'control map feed';
  gap: 0.85rem;
  overflow: hidden;
  align-items: stretch;
}

.dashboard-panel {
  min-width: 0;
  min-height: 0;
}

.control-region {
  grid-area: control;
}

.map-region {
  grid-area: map;
}

.feed-region {
  grid-area: feed;
}

@media (max-width: 1480px) {
  .header {
    grid-template-columns: 1fr;
  }

  .subtitle {
    max-width: 72ch;
  }

  .header-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1400px), (max-height: 820px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .dashboard {
    grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
    grid-template-rows: auto auto;
    grid-template-areas:
      'control map'
      'feed feed';
    overflow: visible;
  }

  .feed-region {
    max-height: 380px;
  }
}

@media (max-width: 1080px) {
  .header-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas:
      'control'
      'map'
      'feed';
  }

  .feed-region {
    max-height: none;
  }
}

@media (max-width: 760px) {
  .app-shell {
    padding: 0.6rem;
  }

  .header {
    padding: 0.85rem;
  }

  .brand {
    align-items: flex-start;
  }

  .header-metrics {
    grid-template-columns: 1fr;
  }
}
</style>

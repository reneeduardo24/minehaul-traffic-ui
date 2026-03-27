<script setup>
import { useMinehaulGateway } from './composables/useMinehaulGateway';
import TrafficMap        from './components/TrafficMap.vue';
import EventNotifications from './components/EventNotifications.vue';
import ControlPanel      from './components/ControlPanel.vue';

const {
  isConnected,
  vehicles,
  trafficLights,
  events,
  reports,
  lastError,
  publishVehiclePosition,
  changeTrafficLight,
  createDelivery,
  fetchMaterialReport,
  fetchCongestionReport,
  fetchState,
} = useMinehaulGateway();

const vehicleCount = () => Object.keys(vehicles.value).length;
const lightCount   = () => Object.keys(trafficLights.value).length;
</script>

<template>
  <div class="app">

    <!-- ── Header ── -->
    <header class="header glass-panel">
      <div class="header-left">
        <span class="logo">⛏</span>
        <div class="title-group">
          <h1>MVTS Control Center</h1>
          <span class="subtitle">Mine Vehicle Traffic System</span>
        </div>
      </div>
      <div class="header-right">
        <span v-if="lastError" class="err-chip">⚠ {{ lastError }}</span>
        <div class="status-badge" :class="{ live: isConnected }">
          <span class="ping"></span>
          {{ isConnected ? 'Gateway Live' : 'Disconnected' }}
        </div>
        <div class="counters">
          <span class="c-item" title="Active vehicles">🚜 {{ vehicleCount() }}</span>
          <span class="c-item" title="Traffic lights">🚦 {{ lightCount() }}</span>
        </div>
      </div>
    </header>

    <!-- ── Dashboard (3 columns) ── -->
    <main class="dashboard">
      <ControlPanel
        :trafficLights="trafficLights"
        :reports="reports"
        :publishVehiclePosition="publishVehiclePosition"
        :changeTrafficLight="changeTrafficLight"
        :createDelivery="createDelivery"
        :fetchMaterialReport="fetchMaterialReport"
        :fetchCongestionReport="fetchCongestionReport"
        :fetchState="fetchState"
      />
      <TrafficMap :vehicles="vehicles" :trafficLights="trafficLights" />
      <EventNotifications :events="events" />
    </main>

  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0.65rem;
  gap: 0.65rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  flex-shrink: 0;
}
.header-left { display: flex; align-items: center; gap: 0.65rem; }
.logo { font-size: 1.6rem; filter: drop-shadow(0 0 8px rgba(251,191,36,0.35)); }
.title-group { display: flex; flex-direction: column; gap: 1px; }
h1 {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(to right, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1;
}
.subtitle {
  font-size: 0.62rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.header-right { display: flex; align-items: center; gap: 0.6rem; }
.err-chip {
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #fca5a5;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--accent-red);
  transition: all 0.4s;
}
.status-badge.live {
  background: rgba(16,185,129,0.08);
  border-color: rgba(16,185,129,0.2);
  color: var(--accent-green);
}
.ping {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 5px currentColor;
}
.status-badge.live .ping { animation: pulse 2s infinite; }
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.45; transform: scale(1.3); }
}
.counters { display: flex; gap: 0.4rem; }
.c-item {
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
}

/* ── Dashboard ── */
.dashboard {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 260px;
  gap: 0.65rem;
  overflow: hidden;
  min-height: 0;
}
</style>

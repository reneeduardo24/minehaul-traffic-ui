<script setup>
import { useMinehaulGateway } from './composables/useMinehaulGateway';
import TrafficMap from './components/TrafficMap.vue';
import EventNotifications from './components/EventNotifications.vue';
import ControlPanel from './components/ControlPanel.vue';

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
</script>

<template>
  <div class="app-container">

    <!-- Header -->
    <header class="glass-panel main-header">
      <div class="header-left">
        <span class="logo">⛏</span>
        <div>
          <h1>MVTS Control Center</h1>
          <span class="subtitle">Mine Vehicle Traffic System</span>
        </div>
      </div>
      <div class="header-right">
        <div v-if="lastError" class="error-chip">⚠ {{ lastError }}</div>
        <div class="status-badge" :class="{ connected: isConnected }">
          <span class="dot"></span>
          {{ isConnected ? 'Gateway Live' : 'Disconnected' }}
        </div>
        <div class="counters">
          <span class="counter-item">🚜 {{ Object.keys(vehicles).length }}</span>
          <span class="counter-item">🚦 {{ Object.keys(trafficLights).length }}</span>
        </div>
      </div>
    </header>

    <!-- Main layout -->
    <main class="dashboard">
      <!-- Left: Control Panel -->
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

      <!-- Center: Graphical Map -->
      <TrafficMap :vehicles="vehicles" :trafficLights="trafficLights" />

      <!-- Right: Live Events -->
      <EventNotifications :events="events" />
    </main>

  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0.75rem;
  gap: 0.75rem;
}

/* Header */
.main-header {
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.logo {
  font-size: 1.75rem;
  filter: drop-shadow(0 0 8px rgba(251,191,36,0.4));
}
.main-header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  background: linear-gradient(to right, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1;
}
.subtitle {
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.error-chip {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  font-size: 0.75rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(239,68,68,0.1);
  color: var(--accent-red);
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(239,68,68,0.2);
  transition: all 0.4s;
}
.status-badge.connected {
  background: rgba(16,185,129,0.1);
  color: var(--accent-green);
  border-color: rgba(16,185,129,0.2);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}
.status-badge.connected .dot {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
.counters {
  display: flex;
  gap: 0.5rem;
}
.counter-item {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  color: var(--text-primary);
}

/* Dashboard layout */
.dashboard {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 280px;
  gap: 0.75rem;
  overflow: hidden;
  min-height: 0;
}
</style>

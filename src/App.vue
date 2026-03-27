<script setup>
import { useMinehaulGateway } from './composables/useMinehaulGateway';
import TrafficMap from './components/TrafficMap.vue';
import EventNotifications from './components/EventNotifications.vue';

const { isConnected, vehicles, trafficLights, events } = useMinehaulGateway();
</script>

<template>
  <div class="app-container">
    <header class="glass-panel main-header">
      <div class="header-content">
        <h1>MVTS Control Center</h1>
        <div class="status-badge" :class="{ connected: isConnected }">
          <span class="dot"></span>
          {{ isConnected ? 'Live' : 'Disconnected' }}
        </div>
      </div>
    </header>
    <main class="dashboard">
      <TrafficMap :vehicles="vehicles" :trafficLights="trafficLights" />
      <EventNotifications :events="events" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
  gap: 1rem;
}
.main-header {
  padding: 1rem 2rem;
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.main-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  background: linear-gradient(to right, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s;
}
.status-badge.connected {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-green);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}
.status-badge.connected .dot {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
.dashboard {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1rem;
  overflow: hidden;
}
</style>

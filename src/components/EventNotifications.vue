<script setup>
import { ref } from 'vue';

const props = defineProps({
  events: { type: Array, default: () => [] },
});

function humanize(event) {
  const et = event.event_type;
  const p = event.payload || {};

  if (et === 'vehicle.position.updated') {
    const speed = p.speed !== undefined ? `${p.speed} km/h` : '';
    return `🚜 Vehicle <strong>${p.vehicle_id}</strong> moved to zone <strong>${p.zone_id}</strong> at position (${p.x?.toFixed(0)}, ${p.y?.toFixed(0)}) — ${speed}`;
  }

  if (et === 'traffic_light.changed') {
    const fromIcon = stateIcon(p.previous_state);
    const toIcon = stateIcon(p.new_state);
    return `🚦 Light <strong>${p.traffic_light_id}</strong> in zone <strong>${p.zone_id}</strong> changed ${fromIcon} → ${toIcon} by ${p.changed_by}`;
  }

  if (et === 'delivery.created') {
    return `📦 Delivery registered: <strong>${p.vehicle_id}</strong> transported ${p.quantity_tons} t of <strong>${p.material_type}</strong> from ${p.origin} to ${p.destination}`;
  }

  if (et === 'congestion.detected') {
    const sev = p.severity;
    const icon = sev === 'HIGH' ? '🔴' : sev === 'MEDIUM' ? '🟡' : '🟢';
    return `${icon} Congestion alert in zone <strong>${p.zone_id}</strong> — ${sev} severity, ${p.vehicle_count} vehicles, avg speed ${p.avg_speed?.toFixed(1)} km/h`;
  }

  // Fallback: just show the event type nicely
  return `📡 Event <strong>${et}</strong> received`;
}

function stateIcon(state) {
  if (!state) return '⬜';
  const s = state.toUpperCase();
  if (s === 'GREEN') return '🟢';
  if (s === 'RED') return '🔴';
  if (s === 'YELLOW') return '🟡';
  return '⬜';
}

function eventClass(event) {
  const et = event.event_type || '';
  if (et.includes('congestion')) return 'ev-congestion';
  if (et.includes('traffic_light')) return 'ev-light';
  if (et.includes('delivery')) return 'ev-delivery';
  return 'ev-vehicle';
}
</script>

<template>
  <div class="glass-panel notifications-container">
    <h2>Recent Events</h2>
    <div class="events-list">
      <div v-if="events.length === 0" class="empty-state">
        <span>📡</span>
        <span>Listening for events…</span>
      </div>
      <div
        v-for="(ev, idx) in events"
        :key="idx"
        class="event-item"
        :class="eventClass(ev)"
      >
        <div class="event-time">{{ ev.time }}</div>
        <div class="event-text" v-html="humanize(ev)"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.notifications-container h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
  flex-shrink: 0;
}
.events-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--text-muted);
  font-size: 0.875rem;
  opacity: 0.7;
  padding: 2rem 0;
}

.event-item {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border-left: 3px solid var(--border-glass);
  background: rgba(255,255,255,0.02);
  animation: slideIn 0.25s ease-out;
  flex-shrink: 0;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}

.ev-vehicle { border-left-color: #60a5fa; }
.ev-light   { border-left-color: #f59e0b; }
.ev-delivery { border-left-color: #34d399; }
.ev-congestion { border-left-color: #ef4444; }

.event-time {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 0.2rem;
  font-family: monospace;
}
.event-text {
  font-size: 0.8rem;
  color: var(--text-primary);
  line-height: 1.5;
}
.event-text :deep(strong) {
  color: #fff;
  font-weight: 600;
}
</style>

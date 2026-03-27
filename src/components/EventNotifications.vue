<script setup>
const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
});

const getEventColor = (type) => {
  if (type === 'priority_granted') return 'var(--accent-blue)';
  if (type === 'traffic_light_update') return 'var(--accent-orange)';
  return 'var(--text-primary)';
};
</script>

<template>
  <div class="glass-panel notifications-container">
    <h2>Recent Events</h2>
    <div class="events-list">
      <div v-if="events.length === 0" class="empty-state">
        No recent events
      </div>
      <div v-for="(ev, idx) in events" :key="idx" class="event-item">
        <div class="event-time">{{ ev.time }}</div>
        <div class="event-content">
          <div class="event-type" :style="{ color: getEventColor(ev.type) }">{{ ev.type }}</div>
          <div class="event-details">
            <template v-if="ev.type === 'location_update'">
               Veh. {{ ev.vehicle_id }} to [{{ ev.location?.x }}, {{ ev.location?.y }}]
            </template>
            <template v-else-if="ev.type === 'priority_granted'">
               Priority: {{ ev.vehicle_id }}
            </template>
            <template v-else-if="ev.type === 'traffic_light_update'">
               Light {{ ev.light_id }}: {{ ev.status }}
            </template>
            <template v-else>
              {{ JSON.stringify(ev) }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}
.notifications-container h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
}
.events-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}
.event-item {
  background: rgba(255,255,255,0.03);
  border-left: 3px solid var(--accent-blue);
  padding: 0.75rem;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  animation: slideIn 0.3s ease-out;
}
.event-item:nth-child(n) {
    border-color: var(--border-glass);
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
.event-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.event-type {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.event-details {
  font-size: 0.9rem;
  color: var(--text-primary);
  word-break: break-all;
}
.empty-state {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.875rem;
}
</style>

<script setup>
const props = defineProps({
  events: { type: Array, default: () => [] },
});

// ─── Event humanizer ──────────────────────────────────────────────────────────
function humanize(ev) {
  const type    = ev.event_type || '';
  const payload = ev.payload    || {};

  switch (type) {

    case 'vehicle.position.updated': {
      const { vehicle_id, zone_id, x, y, speed, destination } = payload;
      const s = speed !== undefined ? `${Number(speed).toFixed(1)} km/h` : '';
      const pos = (x !== undefined && y !== undefined)
        ? ` at (${Number(x).toFixed(1)}, ${Number(y).toFixed(1)})`
        : '';
      return {
        icon: '🚜',
        text: `<strong>${vehicle_id}</strong> moved to <strong>${zone_id}</strong>${pos}${s ? ` · ${s}` : ''}${destination ? ` → ${destination}` : ''}`,
        cls:  'ev-vehicle',
      };
    }

    case 'traffic_light.changed': {
      const { traffic_light_id, zone_id, previous_state, new_state, changed_by } = payload;
      return {
        icon: '🚦',
        text: `Light <strong>${traffic_light_id}</strong> (${zone_id}) changed `
             + `${stateIcon(previous_state)} → ${stateIcon(new_state)}`
             + (changed_by ? ` by ${changed_by}` : ''),
        cls:  'ev-light',
      };
    }

    case 'delivery.created': {
      const { vehicle_id, material_type, quantity_tons, origin, destination } = payload;
      return {
        icon: '📦',
        text: `<strong>${vehicle_id}</strong> delivered `
             + `${quantity_tons} t of <strong>${material_type}</strong> `
             + `from ${origin} → ${destination}`,
        cls:  'ev-delivery',
      };
    }

    case 'congestion.detected': {
      const { zone_id, severity, vehicle_count, avg_speed } = payload;
      const sev = (severity || '').toLowerCase();
      return {
        icon: sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '🟢',
        text: `Congestion in <strong>${zone_id}</strong> — ${severity} severity · `
             + `${vehicle_count} vehicles · avg ${avg_speed} km/h`,
        cls:  'ev-congestion',
      };
    }

    default:
      return {
        icon: '📡',
        text: `Event: <strong>${type || 'unknown'}</strong>`,
        cls:  'ev-default',
      };
  }
}

function stateIcon(state) {
  const s = (state || '').toUpperCase();
  if (s === 'GREEN')  return '🟢';
  if (s === 'RED')    return '🔴';
  if (s === 'YELLOW') return '🟡';
  return '⬜';
}
</script>

<template>
  <div class="ev-panel glass-panel">
    <h2>Recent Events</h2>
    <div class="ev-list">
      <div v-if="events.length === 0" class="ev-empty">
        <span>📡</span><span>Listening for events…</span>
      </div>
      <div
        v-for="(ev, i) in events"
        :key="i"
        class="ev-item"
        :class="humanize(ev).cls"
      >
        <div class="ev-meta">
          <span class="ev-icon">{{ humanize(ev).icon }}</span>
          <span class="ev-time">{{ ev.time }}</span>
        </div>
        <div class="ev-text" v-html="humanize(ev).text"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ev-panel {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
}
.ev-panel h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
  flex-shrink: 0;
}
.ev-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-right: 2px;
}
.ev-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 2rem 0;
  opacity: 0.7;
}
.ev-item {
  padding: 0.5rem 0.65rem;
  border-radius: 7px;
  border-left: 3px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.02);
  flex-shrink: 0;
  animation: slideIn 0.22s ease-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(6px); }
  to   { opacity: 1; transform: translateX(0); }
}
.ev-vehicle   { border-left-color: #60a5fa; }
.ev-light     { border-left-color: #f59e0b; }
.ev-delivery  { border-left-color: #34d399; }
.ev-congestion { border-left-color: #ef4444; }

.ev-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
}
.ev-icon { font-size: 0.85rem; }
.ev-time { font-size: 0.6rem; color: var(--text-muted); font-family: monospace; }
.ev-text {
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.5;
}
.ev-text :deep(strong) { color: #fff; font-weight: 600; }
</style>

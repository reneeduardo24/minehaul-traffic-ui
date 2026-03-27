<script setup>
import { computed } from 'vue';

import {
  formatFacilityLabel,
  formatMaterialLabel,
  getTrafficLightStateMeta,
  getVehicleState,
} from '../utils/runtimeCatalog';

const props = defineProps({
  events: { type: Array, default: () => [] },
  topology: { type: Object, default: null },
});

function normalizeEvent(event) {
  const type = event.event_type || '';
  const payload = event.payload || {};

  switch (type) {
    case 'vehicle.position.updated': {
      const state = getVehicleState(payload.speed);
      return {
        tag: 'VEH',
        tone: 'vehicle',
        title: payload.vehicle_id || 'Truck',
        body: `${state.label} · ${payload.zone_id || 'Sin zona'} · ${Number(payload.speed || 0).toFixed(1)} km/h`,
        detail: `${formatMaterialLabel(payload.material_type, props.topology)} -> ${formatFacilityLabel(payload.destination, props.topology)}`,
      };
    }

    case 'traffic_light.changed': {
      const previous = getTrafficLightStateMeta(payload.previous_state);
      const next = getTrafficLightStateMeta(payload.new_state);
      return {
        tag: 'SIG',
        tone: 'signal',
        title: payload.traffic_light_id || 'Semaforo',
        body: `${previous.label} -> ${next.label}`,
        detail: `${payload.zone_id || 'Sin zona'} · ${payload.changed_by || 'operador'}`,
      };
    }

    case 'delivery.created': {
      return {
        tag: 'DLV',
        tone: 'delivery',
        title: payload.vehicle_id || 'Despacho',
        body: `${payload.quantity_tons} t · ${formatMaterialLabel(payload.material_type, props.topology)}`,
        detail: `${formatFacilityLabel(payload.origin, props.topology)} -> ${formatFacilityLabel(payload.destination, props.topology)}`,
      };
    }

    case 'congestion.detected': {
      return {
        tag: 'TRF',
        tone: 'congestion',
        title: payload.zone_id || 'Congestion',
        body: `${payload.severity || 'LOW'} · ${payload.vehicle_count || 0} vehiculos`,
        detail: `Promedio ${payload.avg_speed || 0} km/h · ${payload.duration_seconds || 0}s`,
      };
    }

    default:
      return {
        tag: 'SYS',
        tone: 'default',
        title: type || 'Evento',
        body: 'Actualizacion del gateway',
        detail: event.source || 'sistema',
      };
  }
}

const eventList = computed(() => props.events.map((event) => ({ ...event, ui: normalizeEvent(event) })));
</script>

<template>
  <aside class="events-panel glass-panel">
    <div class="panel-head">
      <div>
        <p class="eyebrow">Live Feed</p>
        <h2>Eventos de campo</h2>
      </div>
    </div>

    <div class="event-list">
      <div v-if="eventList.length === 0" class="empty-state">
        Escuchando eventos del gateway...
      </div>

      <article v-for="event in eventList" :key="event.event_id || `${event.time}-${event.event_type}`" class="event-row" :data-tone="event.ui.tone">
        <div class="event-top">
          <span class="event-tag">{{ event.ui.tag }}</span>
          <span class="event-time">{{ event.time }}</span>
        </div>

        <strong>{{ event.ui.title }}</strong>
        <p>{{ event.ui.body }}</p>
        <span class="event-detail">{{ event.ui.detail }}</span>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.events-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  overflow: hidden;
  container-type: inline-size;
}

.panel-head {
  margin-bottom: 0.8rem;
}

.eyebrow {
  margin: 0 0 0.15rem;
  color: rgba(186, 199, 216, 0.72);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 0;
  font-size: 1rem;
}

.event-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.event-row {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  padding: 0.7rem 0.75rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.event-row[data-tone='vehicle'] {
  box-shadow: inset 0 0 0 1px rgba(79, 169, 255, 0.12);
}

.event-row[data-tone='signal'] {
  box-shadow: inset 0 0 0 1px rgba(242, 180, 71, 0.12);
}

.event-row[data-tone='delivery'] {
  box-shadow: inset 0 0 0 1px rgba(63, 208, 126, 0.12);
}

.event-row[data-tone='congestion'] {
  box-shadow: inset 0 0 0 1px rgba(239, 98, 98, 0.12);
}

.event-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.event-tag {
  padding: 0.18rem 0.44rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(230, 238, 248, 0.82);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.event-time {
  color: var(--text-muted);
  font-size: 0.62rem;
  font-family: var(--font-mono);
}

.event-row strong {
  font-size: 0.79rem;
}

.event-row p {
  margin: 0;
  color: rgba(223, 233, 244, 0.86);
  font-size: 0.72rem;
  line-height: 1.5;
}

.event-detail {
  color: var(--text-muted);
  font-size: 0.66rem;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 200px;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
}

@container (min-width: 760px) {
  .event-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
  }

  .empty-state {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1400px), (max-height: 820px) {
  .events-panel {
    height: auto;
    max-height: 380px;
  }

  .event-list {
    padding-right: 0.12rem;
  }
}

@media (max-width: 760px) {
  .events-panel {
    max-height: none;
  }
}
</style>

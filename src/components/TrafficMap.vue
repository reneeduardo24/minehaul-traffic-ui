<script setup>
import { computed } from 'vue';

const props = defineProps({
  vehicles: Object,
  trafficLights: Object
});

const vehicleList = computed(() => Object.entries(props.vehicles || {}).map(([id, data]) => ({ id, ...data })));
const lightList = computed(() => Object.entries(props.trafficLights || {}).map(([id, data]) => ({ id, ...data })));

const getStatusColor = (status) => {
  if (!status) return 'var(--text-muted)';
  status = status.toString().toLowerCase();
  if (status.includes('priority')) return 'var(--accent-blue)';
  if (status.includes('overriding')) return 'var(--accent-red)';
  return 'var(--text-primary)';
};
</script>

<template>
  <div class="glass-panel map-container">
    <h2>Fleet & Infrastructure</h2>
    <div class="entities-view">
      
      <div class="section">
        <h3>Vehicles</h3>
        <div class="grid">
          <div v-for="v in vehicleList" :key="v.id" class="entity-card vehicle-card">
            <div class="card-header">
              <span class="icon">🚜</span>
              <span class="id">{{ v.id }}</span>
            </div>
            <div class="card-details">
              <div class="detail-row" v-if="v.x !== undefined">
                <span class="label">Pos:</span>
                <span class="value">[{{ v.x }}, {{ v.y }}]</span>
              </div>
              <div class="detail-row" v-if="v.category">
                <span class="label">Type:</span>
                <span class="value">{{ v.category }}</span>
              </div>
               <div class="detail-row" v-if="v.status">
                <span class="label">Status:</span>
                <span class="value" :style="{ color: getStatusColor(v.status) }">{{ v.status }}</span>
              </div>
            </div>
          </div>
          <div v-if="vehicleList.length === 0" class="empty-state">No vehicles monitored</div>
        </div>
      </div>

       <div class="section">
        <h3>Traffic Lights</h3>
        <div class="grid">
          <div v-for="l in lightList" :key="l.id" class="entity-card light-card" :class="l.status?.toLowerCase()">
            <div class="card-header">
              <span class="icon">🚦</span>
              <span class="id">{{ l.id }}</span>
            </div>
             <div class="card-details">
              <div class="detail-row">
                <span class="label">State:</span>
                <span class="value state-badge">{{ l.status || 'UNKNOWN' }}</span>
              </div>
            </div>
          </div>
          <div v-if="lightList.length === 0" class="empty-state">No lights tracking</div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}
.map-container h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  font-weight: 600;
}
.entities-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}
.section h3 {
  font-size: 1rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.entity-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1.25rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.entity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border-color: rgba(255,255,255,0.1);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.75rem;
}
.card-header .icon {
  font-size: 1.25rem;
}
.card-header .id {
  font-weight: 600;
  color: #fff;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
}
.detail-row .label {
  color: var(--text-muted);
}
.detail-row .value {
  font-weight: 500;
}

.light-card.green .state-badge {
  color: var(--accent-green);
  text-shadow: 0 0 8px rgba(16,185,129,0.3);
}
.light-card.red .state-badge {
  color: var(--accent-red);
  text-shadow: 0 0 8px rgba(239,68,68,0.3);
}
.empty-state {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.875rem;
}
</style>

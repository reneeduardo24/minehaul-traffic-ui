<script setup>
import { computed, ref } from 'vue';

import {
  formatFacilityLabel,
  formatMaterialLabel,
  getMaterialOptions,
} from '../utils/runtimeCatalog';

const props = defineProps({
  topology: { type: Object, default: null },
  trafficLights: { type: Object, default: () => ({}) },
  reports: { type: Object, default: () => ({}) },
  loadingState: { type: Object, default: () => ({}) },
  publishVehiclePosition: { type: Function, required: true },
  changeTrafficLight: { type: Function, required: true },
  createDelivery: { type: Function, required: true },
  fetchMaterialReport: { type: Function, required: true },
  fetchCongestionReport: { type: Function, required: true },
  fetchState: { type: Function, required: true },
  fetchSummary: { type: Function, required: true },
});

const activeTab = ref('vehicles');
const tabs = [
  { id: 'vehicles', label: 'Vehiculos', tag: 'POS' },
  { id: 'lights', label: 'Semaforos', tag: 'SIG' },
  { id: 'delivery', label: 'Despachos', tag: 'DLV' },
  { id: 'reports', label: 'Reportes', tag: 'REP' },
];

const loading = ref(false);
const feedback = ref(null);

function setFeedback(type, message) {
  feedback.value = { type, message };
  setTimeout(() => {
    feedback.value = null;
  }, 4200);
}

async function run(action, successMessage = 'Operacion completada') {
  loading.value = true;
  feedback.value = null;

  try {
    const response = await action();
    setFeedback('ok', successMessage);
    return response;
  } catch (error) {
    setFeedback('error', error.message || 'La operacion fallo');
    throw error;
  } finally {
    loading.value = false;
  }
}

const facilities = computed(() => props.topology?.facilities || []);
const worldMidX = computed(() => {
  const world = props.topology?.world;
  if (!world) return 12;
  return world.min_x + (world.max_x - world.min_x) / 2;
});

const originFacilities = computed(() => facilities.value.filter((facility) => facility.x <= worldMidX.value));
const destinationFacilities = computed(() => facilities.value.filter((facility) => facility.x >= worldMidX.value));
const zoneIds = computed(() => (props.topology?.zones || []).map((zone) => zone.id));
const materialOptions = computed(() => getMaterialOptions(props.topology));

const vForm = ref({
  vehicle_id: 'TRUCK-01',
  zone_id: 'Z1',
  x: 2.0,
  y: 8.4,
  speed: 1.4,
  destination: 'CRUSHER-B',
  material_type: 'copper_ore',
});

const dForm = ref({
  vehicle_id: 'TRUCK-01',
  origin: 'PIT-A',
  destination: 'CRUSHER-B',
  material_type: 'copper_ore',
  quantity_tons: 24,
});

const selectedLight = ref('TL-01');
const lightIds = computed(() => {
  const fromTopology = (props.topology?.traffic_lights || []).map((light) => light.id);
  if (fromTopology.length) return fromTopology;
  const runtimeIds = Object.keys(props.trafficLights || {});
  return runtimeIds.length ? runtimeIds : ['TL-01'];
});
const lightStates = ['GREEN', 'YELLOW', 'RED'];
const period = ref('day');

async function submitVehicle() {
  await run(
    () => props.publishVehiclePosition({ ...vForm.value }),
    `Snapshot enviado para ${vForm.value.vehicle_id}`,
  );
}

async function setLight(state) {
  await run(
    () => props.changeTrafficLight(selectedLight.value, state),
    `${selectedLight.value} -> ${state}`,
  );
}

async function submitDelivery() {
  await run(
    () => props.createDelivery({ ...dForm.value }),
    `Despacho registrado para ${dForm.value.vehicle_id}`,
  );
}

async function refreshState() {
  await run(() => props.fetchState(), 'Estado actualizado');
}

async function refreshSummary() {
  await run(() => props.fetchSummary(), 'Resumen actualizado');
}

async function loadMaterial() {
  await run(() => props.fetchMaterialReport(period.value), 'Reporte de material listo');
}

async function loadCongestion() {
  await run(() => props.fetchCongestionReport(), 'Reporte de congestiones listo');
}

function stateClass(value) {
  return String(value || '').toLowerCase();
}
</script>

<template>
  <aside class="control-panel glass-panel">
    <div class="panel-header">
      <div>
        <p class="eyebrow">Control Board</p>
        <h2>Operacion</h2>
      </div>

      <button class="refresh-btn" :disabled="loading || loadingState.state" @click="refreshState" title="Actualizar estado">
        <span :class="{ spinning: loading || loadingState.state }">↻</span>
      </button>
    </div>

    <transition name="fade">
      <div v-if="feedback" class="feedback" :class="feedback.type">{{ feedback.message }}</div>
    </transition>

    <nav class="tabs" role="tablist" aria-label="Panel de control">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        @click="activeTab = tab.id"
      >
        <span class="tab-tag">{{ tab.tag }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="panel-body">
      <section v-show="activeTab === 'vehicles'" class="section">
        <p class="hint">Publica una posicion puntual. El movimiento continuo, estados y materiales en runtime siguen viniendo del simulador/backend.</p>

        <div class="form-grid">
          <label class="field">
            <span>Truck ID</span>
            <input v-model="vForm.vehicle_id" placeholder="TRUCK-01" />
          </label>

          <label class="field">
            <span>Zona</span>
            <select v-model="vForm.zone_id">
              <option v-for="zoneId in zoneIds" :key="zoneId" :value="zoneId">{{ zoneId }}</option>
            </select>
          </label>

          <label class="field">
            <span>X (mundo)</span>
            <input type="number" v-model.number="vForm.x" step="0.1" min="0" max="24" />
          </label>

          <label class="field">
            <span>Y (mundo)</span>
            <input type="number" v-model.number="vForm.y" step="0.1" min="0" max="10" />
          </label>

          <label class="field">
            <span>Velocidad</span>
            <input type="number" v-model.number="vForm.speed" step="0.1" min="0" max="5" />
          </label>

          <label class="field">
            <span>Destino</span>
            <select v-model="vForm.destination">
              <option v-for="facility in destinationFacilities" :key="facility.id" :value="facility.id">
                {{ facility.label }}
              </option>
            </select>
          </label>

          <label class="field full">
            <span>Material</span>
            <select v-model="vForm.material_type">
              <option v-for="material in materialOptions" :key="material.id" :value="material.id">
                {{ material.label }}
              </option>
            </select>
          </label>
        </div>

        <button class="action-btn primary" :disabled="loading" @click="submitVehicle">Publicar snapshot</button>
      </section>

      <section v-show="activeTab === 'lights'" class="section">
        <p class="hint">Regula los cruces reales del mapa. Usa rojo para alto total, amarillo para precaucion y verde para paso continuo.</p>

        <label class="field full">
          <span>Semaforo</span>
          <select v-model="selectedLight">
            <option v-for="lightId in lightIds" :key="lightId" :value="lightId">{{ lightId }}</option>
          </select>
        </label>

        <div class="light-controls">
          <button
            v-for="state in lightStates"
            :key="state"
            class="light-btn"
            :class="stateClass(state)"
            :disabled="loading"
            @click="setLight(state)"
          >
            <span class="bulb"></span>
            {{ state }}
          </button>
        </div>

        <div class="lights-table" v-if="lightIds.length">
          <div v-for="lightId in lightIds" :key="lightId" class="light-row">
            <div>
              <strong>{{ lightId }}</strong>
              <span>{{ props.trafficLights[lightId]?.zone_id || props.topology?.traffic_lights?.find((entry) => entry.id === lightId)?.zone_id || '---' }}</span>
            </div>

            <span class="light-chip" :class="stateClass(props.trafficLights[lightId]?.state)">
              {{ props.trafficLights[lightId]?.state || 'PENDING' }}
            </span>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'delivery'" class="section">
        <p class="hint">Registra entregas con materiales reales del sistema. El formulario ya quedo limitado a los destinos y materiales operativos.</p>

        <div class="form-grid">
          <label class="field">
            <span>Truck ID</span>
            <input v-model="dForm.vehicle_id" placeholder="TRUCK-01" />
          </label>

          <label class="field">
            <span>Material</span>
            <select v-model="dForm.material_type">
              <option v-for="material in materialOptions" :key="material.id" :value="material.id">
                {{ material.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Origen</span>
            <select v-model="dForm.origin">
              <option v-for="facility in originFacilities" :key="facility.id" :value="facility.id">
                {{ facility.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Destino</span>
            <select v-model="dForm.destination">
              <option v-for="facility in destinationFacilities" :key="facility.id" :value="facility.id">
                {{ facility.label }}
              </option>
            </select>
          </label>

          <label class="field full">
            <span>Cantidad (toneladas)</span>
            <input type="number" v-model.number="dForm.quantity_tons" min="1" max="500" />
          </label>
        </div>

        <div class="delivery-preview">
          <strong>{{ dForm.vehicle_id }}</strong>
          <span>{{ formatMaterialLabel(dForm.material_type, topology) }}</span>
          <span>{{ formatFacilityLabel(dForm.origin, topology) }} -> {{ formatFacilityLabel(dForm.destination, topology) }}</span>
        </div>

        <button class="action-btn success" :disabled="loading" @click="submitDelivery">Registrar despacho</button>
      </section>

      <section v-show="activeTab === 'reports'" class="section">
        <p class="hint">Consulta resumen, material y congestion directamente contra el backend. No hay datos mockeados en esta vista.</p>

        <div class="report-controls">
          <label class="field grow">
            <span>Periodo</span>
            <select v-model="period">
              <option value="day">Ultimas 24 h</option>
              <option value="week">Ultimos 7 dias</option>
              <option value="month">Ultimos 30 dias</option>
            </select>
          </label>

          <button class="action-btn small" :disabled="loading || loadingState.reports" @click="refreshSummary">Resumen</button>
          <button class="action-btn primary small" :disabled="loading" @click="loadMaterial">Material</button>
          <button class="action-btn small" :disabled="loading" @click="loadCongestion">Congestion</button>
        </div>

        <div v-if="reports?.summary" class="report-card summary-card">
          <div class="report-title">Resumen general</div>
          <div class="report-stats">
            <div class="stat">
              <strong>{{ reports.summary.delivery_count }}</strong>
              <span>Despachos</span>
            </div>
            <div class="stat">
              <strong>{{ reports.summary.congestion_count }}</strong>
              <span>Congestiones</span>
            </div>
            <div class="stat">
              <strong>{{ reports.summary.tons_total }}</strong>
              <span>Toneladas</span>
            </div>
          </div>
        </div>

        <div v-if="reports?.material" class="report-card">
          <div class="report-title">Material por periodo</div>
          <div class="report-stats compact">
            <div class="stat">
              <strong>{{ reports.material.delivery_count }}</strong>
              <span>Despachos</span>
            </div>
            <div class="stat">
              <strong>{{ reports.material.total_tons }}</strong>
              <span>Total t</span>
            </div>
          </div>

          <div v-for="(count, materialId) in reports.material.by_material" :key="materialId" class="material-row">
            <span>{{ formatMaterialLabel(materialId, topology) }}</span>
            <strong>{{ count }}</strong>
          </div>

          <div v-if="!Object.keys(reports.material.by_material || {}).length" class="empty-hint">Sin entregas para el periodo seleccionado.</div>
        </div>

        <div v-if="reports?.congestion" class="report-card">
          <div class="report-title">Eventos de congestion</div>

          <div v-for="(event, index) in (reports.congestion.events || []).slice(0, 8)" :key="index" class="congestion-row">
            <span class="severity" :class="stateClass(event.severity)">{{ event.severity }}</span>
            <div>
              <strong>{{ event.zone_id }}</strong>
              <span>{{ event.vehicle_count }} veh · {{ event.avg_speed }} km/h</span>
            </div>
          </div>

          <div v-if="!reports.congestion.events?.length" class="empty-hint">Todavia no hay congestiones registradas.</div>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1rem;
  gap: 0.75rem;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.eyebrow {
  margin: 0 0 0.15rem;
  color: rgba(186, 199, 216, 0.72);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0;
  font-size: 1rem;
}

.refresh-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-muted);
  cursor: pointer;
}

.refresh-btn:hover {
  color: var(--text-primary);
  border-color: rgba(79, 169, 255, 0.22);
}

.refresh-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.feedback {
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  font-size: 0.74rem;
}

.feedback.ok {
  border: 1px solid rgba(63, 208, 126, 0.24);
  background: rgba(63, 208, 126, 0.08);
  color: #9ae7ba;
}

.feedback.error {
  border: 1px solid rgba(239, 98, 98, 0.24);
  background: rgba(239, 98, 98, 0.08);
  color: #ffc0c0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.18rem;
  min-height: 4rem;
  padding: 0.65rem 0.7rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(196, 208, 224, 0.74);
  cursor: pointer;
  text-align: left;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.tab-tag {
  color: rgba(79, 169, 255, 0.84);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.72rem;
  line-height: 1.55;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field.full {
  grid-column: 1 / -1;
}

.field.grow {
  flex: 1;
}

.field span {
  color: rgba(186, 199, 216, 0.72);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.field input,
.field select {
  width: 100%;
  min-width: 0;
  padding: 0.52rem 0.6rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
  color: var(--text-primary);
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: rgba(79, 169, 255, 0.32);
}

.field select option {
  background: #121924;
}

.action-btn {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.07);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.primary {
  border-color: rgba(79, 169, 255, 0.26);
  color: #a9ceff;
}

.action-btn.primary:hover:not(:disabled) {
  background: rgba(79, 169, 255, 0.12);
}

.action-btn.success {
  border-color: rgba(63, 208, 126, 0.26);
  color: #9ae7ba;
}

.action-btn.success:hover:not(:disabled) {
  background: rgba(63, 208, 126, 0.12);
}

.action-btn.small {
  width: auto;
  padding-inline: 0.7rem;
}

.light-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.light-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.7rem 0.3rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  cursor: pointer;
}

.light-btn .bulb {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  border: 2px solid currentColor;
}

.light-btn.green {
  color: #68da96;
}

.light-btn.green .bulb {
  background: #3fd07e;
  box-shadow: 0 0 10px rgba(63, 208, 126, 0.72);
}

.light-btn.yellow {
  color: #f2c25e;
}

.light-btn.yellow .bulb {
  background: #f2b447;
  box-shadow: 0 0 10px rgba(242, 180, 71, 0.72);
}

.light-btn.red {
  color: #ff9b9b;
}

.light-btn.red .bulb {
  background: #ef6262;
  box-shadow: 0 0 10px rgba(239, 98, 98, 0.72);
}

.lights-table {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.light-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.65rem 0.7rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.light-row strong,
.light-row span {
  display: block;
}

.light-row span {
  color: var(--text-muted);
  font-size: 0.65rem;
}

.light-chip {
  padding: 0.24rem 0.5rem;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.light-chip.green {
  background: rgba(63, 208, 126, 0.14);
  color: #68da96;
}

.light-chip.yellow {
  background: rgba(242, 180, 71, 0.14);
  color: #f2c25e;
}

.light-chip.red {
  background: rgba(239, 98, 98, 0.14);
  color: #ff9b9b;
}

.delivery-preview {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  padding: 0.75rem 0.8rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(223, 233, 244, 0.84);
  font-size: 0.72rem;
}

.delivery-preview strong {
  font-size: 0.8rem;
}

.report-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, auto);
  gap: 0.45rem;
  align-items: flex-end;
}

.report-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.8rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.summary-card {
  background: linear-gradient(180deg, rgba(15, 26, 38, 0.42), rgba(11, 18, 27, 0.38));
}

.report-title {
  font-size: 0.78rem;
  font-weight: 700;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 0.9rem;
}

.report-stats.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat strong {
  font-size: 1.3rem;
}

.stat span {
  color: var(--text-muted);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.material-row,
.congestion-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.55rem;
  padding-top: 0.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.72rem;
}

.congestion-row {
  grid-template-columns: auto minmax(0, 1fr);
}

.congestion-row strong,
.congestion-row span {
  display: block;
}

.congestion-row span:last-child {
  color: var(--text-muted);
}

.severity {
  padding: 0.22rem 0.46rem;
  border-radius: 999px;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.severity.high {
  background: rgba(239, 98, 98, 0.14);
  color: #ff9b9b;
}

.severity.medium {
  background: rgba(242, 180, 71, 0.14);
  color: #f2c25e;
}

.severity.low {
  background: rgba(63, 208, 126, 0.14);
  color: #9ae7ba;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.7rem;
  text-align: center;
  padding-top: 0.35rem;
}

@media (max-width: 1400px), (max-height: 820px) {
  .control-panel {
    height: auto;
    overflow: visible;
  }

  .panel-body {
    overflow: visible;
  }
}

@media (max-width: 820px) {
  .report-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-controls .field.grow {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .light-controls {
    grid-template-columns: 1fr;
  }

  .report-controls {
    grid-template-columns: 1fr;
  }

  .action-btn.small {
    width: 100%;
  }
}

@media (max-width: 540px) {
  .tabs {
    grid-template-columns: 1fr;
  }

  .light-row {
    align-items: flex-start;
  }

  .material-row,
  .congestion-row {
    grid-template-columns: 1fr;
  }
}
</style>

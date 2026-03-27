<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  trafficLights: Object,
  publishVehiclePosition: Function,
  changeTrafficLight: Function,
  createDelivery: Function,
  fetchMaterialReport: Function,
  fetchCongestionReport: Function,
  fetchState: Function,
  reports: Object,
});

// ── Tabs ───────────────────────────────────────────────────────
const activeTab = ref('vehicles');
const tabs = [
  { id: 'vehicles', label: 'Vehicles', icon: '🚜' },
  { id: 'lights',   label: 'Traffic Lights', icon: '🚦' },
  { id: 'delivery', label: 'Deliveries', icon: '📦' },
  { id: 'reports',  label: 'Reports', icon: '📊' },
];

// ── Status feedback ───────────────────────────────────────────
const loading = ref(false);
const feedback = ref(null); // { type: 'ok'|'err', msg }
function setFeedback(type, msg) {
  feedback.value = { type, msg };
  setTimeout(() => (feedback.value = null), 4000);
}
async function run(fn) {
  loading.value = true;
  try {
    const res = await fn();
    setFeedback('ok', 'Done ✓');
    return res;
  } catch (e) {
    setFeedback('err', e.message || 'Error');
  } finally {
    loading.value = false;
  }
}

// ── Vehicle Position ──────────────────────────────────────────
const vForm = ref({ vehicle_id: 'TRK-01', zone_id: 'Z1', x: 30, y: 35, speed: 45, destination: 'PIT' });
const zones = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6'];
const destinations = ['PIT', 'DEPOT', 'CRUSHER', 'DUMP'];

async function submitVehicle() {
  await run(() => props.publishVehiclePosition({ ...vForm.value, x: Number(vForm.value.x), y: Number(vForm.value.y), speed: Number(vForm.value.speed) }));
}

// ── Traffic Lights ────────────────────────────────────────────
const lightList = computed(() => Object.keys(props.trafficLights || { 'TL-01': {}, 'TL-02': {} }));
const selectedLight = ref('TL-01');
const states = ['GREEN', 'YELLOW', 'RED'];

async function setLight(newState) {
  await run(() => props.changeTrafficLight(selectedLight.value, newState));
}

// ── Delivery ──────────────────────────────────────────────────
const dForm = ref({ vehicle_id: 'TRK-01', origin: 'PIT', destination: 'DEPOT', material_type: 'ore', quantity_tons: 20 });
const materials = ['ore', 'coal', 'limestone', 'overburden', 'gravel'];

async function submitDelivery() {
  await run(() => props.createDelivery({ ...dForm.value, quantity_tons: Number(dForm.value.quantity_tons) }));
}

// ── Reports ───────────────────────────────────────────────────
const period = ref('day');

async function loadMaterial() {
  await run(() => props.fetchMaterialReport(period.value));
}
async function loadCongestion() {
  await run(() => props.fetchCongestionReport());
}
async function refreshAll() {
  await run(() => props.fetchState());
}
</script>

<template>
  <div class="control-panel glass-panel">
    <div class="panel-header">
      <h2>Control Panel</h2>
      <button class="refresh-btn" @click="refreshAll" :disabled="loading" title="Refresh state">
        <span :class="{ spinning: loading }">↻</span>
      </button>
    </div>

    <!-- Feedback toast -->
    <div v-if="feedback" class="feedback" :class="feedback.type">
      {{ feedback.msg }}
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span>{{ tab.icon }}</span> {{ tab.label }}
      </button>
    </div>

    <!-- ─── Panel Content ─── -->
    <div class="tab-content">

      <!-- VEHICLES -->
      <div v-if="activeTab === 'vehicles'" class="form-section">
        <p class="section-desc">Publish a vehicle position update to the gateway. The vehicle will appear on the map immediately.</p>
        <div class="form-grid">
          <label class="field">
            <span>Vehicle ID</span>
            <input v-model="vForm.vehicle_id" placeholder="TRK-01" />
          </label>
          <label class="field">
            <span>Zone</span>
            <select v-model="vForm.zone_id">
              <option v-for="z in zones" :key="z">{{ z }}</option>
            </select>
          </label>
          <label class="field">
            <span>X (0–100)</span>
            <input type="number" v-model="vForm.x" min="0" max="100" />
          </label>
          <label class="field">
            <span>Y (0–100)</span>
            <input type="number" v-model="vForm.y" min="0" max="100" />
          </label>
          <label class="field">
            <span>Speed (km/h)</span>
            <input type="number" v-model="vForm.speed" min="0" max="120" />
          </label>
          <label class="field">
            <span>Destination</span>
            <select v-model="vForm.destination">
              <option v-for="d in destinations" :key="d">{{ d }}</option>
            </select>
          </label>
        </div>
        <button class="action-btn primary" @click="submitVehicle" :disabled="loading">
          📡 Publish Position
        </button>
      </div>

      <!-- TRAFFIC LIGHTS -->
      <div v-if="activeTab === 'lights'" class="form-section">
        <p class="section-desc">Select a traffic light and change its state. Affects all microservices and triggers an event.</p>
        <label class="field wide">
          <span>Traffic Light</span>
          <select v-model="selectedLight">
            <option v-for="id in lightList" :key="id">{{ id }}</option>
          </select>
        </label>
        <div class="light-buttons">
          <button
            v-for="s in states"
            :key="s"
            class="light-btn"
            :class="s.toLowerCase()"
            @click="setLight(s)"
            :disabled="loading"
          >
            <span class="light-dot"></span>
            {{ s }}
          </button>
        </div>
        <!-- Current states display -->
        <div class="current-lights">
          <div
            v-for="(light, id) in trafficLights"
            :key="id"
            class="light-status-row"
          >
            <span>{{ id }}</span>
            <span class="zone-badge">{{ light.zone_id }}</span>
            <span class="state-chip" :class="(light.state || '').toLowerCase()">{{ light.state || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- DELIVERY -->
      <div v-if="activeTab === 'delivery'" class="form-section">
        <p class="section-desc">Register a material delivery. This will be stored in the database and included in future reports.</p>
        <div class="form-grid">
          <label class="field">
            <span>Vehicle ID</span>
            <input v-model="dForm.vehicle_id" placeholder="TRK-01" />
          </label>
          <label class="field">
            <span>Material</span>
            <select v-model="dForm.material_type">
              <option v-for="m in materials" :key="m">{{ m }}</option>
            </select>
          </label>
          <label class="field">
            <span>Origin</span>
            <select v-model="dForm.origin">
              <option v-for="d in destinations" :key="d">{{ d }}</option>
            </select>
          </label>
          <label class="field">
            <span>Destination</span>
            <select v-model="dForm.destination">
              <option v-for="d in destinations" :key="d">{{ d }}</option>
            </select>
          </label>
          <label class="field wide">
            <span>Quantity (tons)</span>
            <input type="number" v-model="dForm.quantity_tons" min="1" max="500" />
          </label>
        </div>
        <button class="action-btn success" @click="submitDelivery" :disabled="loading">
          📦 Register Delivery
        </button>
      </div>

      <!-- REPORTS -->
      <div v-if="activeTab === 'reports'" class="form-section">
        <p class="section-desc">Fetch reports from the backend. Data is pulled directly from the database.</p>

        <div class="report-row">
          <label class="field">
            <span>Period</span>
            <select v-model="period">
              <option value="day">Last 24h</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </label>
          <button class="action-btn primary" @click="loadMaterial" :disabled="loading">📊 Material Report</button>
          <button class="action-btn" @click="loadCongestion" :disabled="loading">⚠️ Congestion Report</button>
        </div>

        <!-- Material Report Results -->
        <div v-if="reports?.material" class="report-result">
          <h3>📦 Material Report — {{ reports.material.period }}</h3>
          <div class="report-stats">
            <div class="stat">
              <span class="stat-val">{{ reports.material.delivery_count }}</span>
              <span class="stat-label">Deliveries</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ reports.material.total_tons }}</span>
              <span class="stat-label">Total Tons</span>
            </div>
          </div>
          <div class="by-material">
            <div v-for="(count, mat) in reports.material.by_material" :key="mat" class="mat-row">
              <span>{{ mat }}</span>
              <span class="count-badge">{{ count }}</span>
            </div>
            <div v-if="!reports.material.by_material || Object.keys(reports.material.by_material).length === 0" class="no-data">
              No deliveries in this period
            </div>
          </div>
        </div>

        <!-- Congestion Report Results -->
        <div v-if="reports?.congestion" class="report-result">
          <h3>⚠️ Congestion Report</h3>
          <div class="report-stats">
            <div class="stat">
              <span class="stat-val">{{ reports.congestion.count }}</span>
              <span class="stat-label">Total Events</span>
            </div>
          </div>
          <div class="congestion-list">
            <div v-for="(ev, i) in (reports.congestion.events || []).slice(0, 5)" :key="i" class="cong-row">
              <span class="sev" :class="ev.severity?.toLowerCase()">{{ ev.severity }}</span>
              <span>Zone {{ ev.zone_id }}</span>
              <span class="muted">{{ ev.vehicle_count }} vehicles</span>
            </div>
            <div v-if="!reports.congestion.events?.length" class="no-data">No congestion events yet</div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  min-height: 0;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.panel-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.refresh-btn {
  background: none;
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, color 0.2s;
}
.refresh-btn:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
.spinning { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Feedback */
.feedback {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
  animation: fadeIn 0.2s;
  flex-shrink: 0;
}
.feedback.ok  { background: rgba(16,185,129,0.15); color: var(--accent-green); border: 1px solid rgba(16,185,129,0.3); }
.feedback.err { background: rgba(239,68,68,0.15);  color: var(--accent-red);  border: 1px solid rgba(239,68,68,0.3); }
@keyframes fadeIn { from {opacity:0;} to {opacity:1;} }

/* Tabs */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 1rem;
  background: rgba(0,0,0,0.2);
  padding: 4px;
  border-radius: 10px;
  flex-shrink: 0;
}
.tab-btn {
  flex: 1;
  padding: 0.4rem 0.25rem;
  font-size: 0.7rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 7px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: inherit;
  white-space: nowrap;
}
.tab-btn.active {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
  font-weight: 600;
}
.tab-btn:hover:not(.active) { background: rgba(255,255,255,0.04); color: var(--text-primary); }

/* Tab content */
.tab-content {
  flex: 1;
  overflow-y: auto;
}
.form-section { display: flex; flex-direction: column; gap: 0.75rem; }
.section-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field.wide { grid-column: 1 / -1; }
.field span {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field input, .field select {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-glass);
  border-radius: 7px;
  padding: 0.4rem 0.6rem;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--accent-blue); }
.field select option { background: #1a1d24; }

/* Action buttons */
.action-btn {
  padding: 0.55rem 1rem;
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  width: 100%;
}
.action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.action-btn.primary { border-color: rgba(59,130,246,0.4); color: #93c5fd; }
.action-btn.primary:hover:not(:disabled) { background: rgba(59,130,246,0.15); }
.action-btn.success { border-color: rgba(16,185,129,0.4); color: #6ee7b7; }
.action-btn.success:hover:not(:disabled) { background: rgba(16,185,129,0.15); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Traffic light buttons */
.light-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.light-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 0.5rem;
  border-radius: 10px;
  border: 1px solid var(--border-glass);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  font-size: 0.7rem;
  font-family: inherit;
  color: var(--text-muted);
  transition: all 0.2s;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.light-btn .light-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.5;
  transition: all 0.2s;
}
.light-btn.green  { border-color: rgba(16,185,129,0.3); color: #34d399; }
.light-btn.green:hover:not(:disabled):  { background: rgba(16,185,129,0.1); }
.light-btn.green .light-dot  { background: #10b981; box-shadow: 0 0 10px #10b981; opacity: 1; }
.light-btn.yellow { border-color: rgba(245,158,11,0.3); color: #fbbf24; }
.light-btn.yellow .light-dot { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; opacity: 1; }
.light-btn.red    { border-color: rgba(239,68,68,0.3); color: #f87171; }
.light-btn.red .light-dot    { background: #ef4444; box-shadow: 0 0 10px #ef4444; opacity: 1; }
.light-btn:hover:not(:disabled) { transform: translateY(-2px); }
.light-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Current lights table */
.current-lights { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
.light-status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.4rem 0.6rem;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
}
.zone-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: var(--text-muted);
}
.state-chip {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.state-chip.green  { background: rgba(16,185,129,0.15); color: #34d399; }
.state-chip.red    { background: rgba(239,68,68,0.15); color: #f87171; }
.state-chip.yellow { background: rgba(245,158,11,0.15); color: #fbbf24; }

/* Reports */
.report-row { display: flex; gap: 0.5rem; align-items: flex-end; flex-wrap: wrap; }
.report-row .field { flex: 1; min-width: 120px; }
.report-row .action-btn { flex: 0 0 auto; width: auto; }
.report-result {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  padding: 1rem;
}
.report-result h3 { font-size: 0.875rem; margin-bottom: 0.75rem; color: var(--text-primary); }
.report-stats { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-val { font-size: 1.5rem; font-weight: 700; color: #fff; }
.stat-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }
.by-material { display: flex; flex-direction: column; gap: 0.3rem; }
.mat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  text-transform: capitalize;
}
.count-badge {
  background: rgba(59,130,246,0.2);
  color: #93c5fd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}
.congestion-list { display: flex; flex-direction: column; gap: 0.35rem; }
.cong-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.sev {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}
.sev.high   { background: rgba(239,68,68,0.2); color: #f87171; }
.sev.medium { background: rgba(245,158,11,0.2); color: #fbbf24; }
.sev.low    { background: rgba(16,185,129,0.2); color: #34d399; }
.muted { color: var(--text-muted); font-size: 0.75rem; }
.no-data { font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.5rem; }
</style>

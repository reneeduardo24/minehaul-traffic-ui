<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  trafficLights:          { type: Object,   default: () => ({}) },
  reports:                { type: Object,   default: () => ({}) },
  publishVehiclePosition: { type: Function, required: true },
  changeTrafficLight:     { type: Function, required: true },
  createDelivery:         { type: Function, required: true },
  fetchMaterialReport:    { type: Function, required: true },
  fetchCongestionReport:  { type: Function, required: true },
  fetchState:             { type: Function, required: true },
});

// ── Tabs ──────────────────────────────────────────────────────────────────────
const activeTab = ref('vehicles');
const tabs = [
  { id: 'vehicles',  label: 'Vehicles',  icon: '🚜' },
  { id: 'lights',    label: 'Lights',    icon: '🚦' },
  { id: 'delivery',  label: 'Delivery',  icon: '📦' },
  { id: 'reports',   label: 'Reports',   icon: '📊' },
];

// ── Feedback ──────────────────────────────────────────────────────────────────
const loading  = ref(false);
const feedback = ref(null); // { type: 'ok' | 'err', msg }

function setFeedback(type, msg) {
  feedback.value = { type, msg };
  setTimeout(() => { feedback.value = null; }, 4000);
}

async function run(fn) {
  loading.value = true;
  feedback.value = null;
  try {
    const res = await fn();
    setFeedback('ok', 'Success ✓');
    return res;
  } catch (e) {
    setFeedback('err', e.message || 'Request failed');
    throw e;
  } finally {
    loading.value = false;
  }
}

// ── Vehicle form ──────────────────────────────────────────────────────────────
const vForm = ref({
  vehicle_id:  'TRUCK-01',
  zone_id:     'Z1',
  x:           0,
  y:           0,
  speed:       2.0,
  destination: 'CRUSHER-A',
});
const zones        = ['Z1', 'Z2', 'Z3'];
const destinations = ['CRUSHER-A', 'DEPOT', 'DUMP-1', 'PIT-1'];

async function submitVehicle() {
  await run(() => props.publishVehiclePosition({ ...vForm.value }));
}

// ── Traffic lights ────────────────────────────────────────────────────────────
const selectedLight = ref('TL-01');
const lightIds = computed(() => {
  const ids = Object.keys(props.trafficLights);
  return ids.length ? ids : ['TL-01', 'TL-02'];
});
const lightStates = ['GREEN', 'YELLOW', 'RED'];

async function setLight(state) {
  await run(() => props.changeTrafficLight(selectedLight.value, state));
}

// ── Delivery form ──────────────────────────────────────────────────────────────
const dForm = ref({
  vehicle_id:    'TRUCK-01',
  origin:        'PIT-1',
  destination:   'CRUSHER-A',
  material_type: 'copper_ore',
  quantity_tons: 20,
});
const materials = ['copper_ore', 'waste_rock', 'coal', 'limestone', 'gravel'];
const places    = ['PIT-1', 'PIT-2', 'PIT-3', 'CRUSHER-A', 'DEPOT', 'DUMP-1'];

async function submitDelivery() {
  await run(() => props.createDelivery({ ...dForm.value }));
}

// ── Reports ───────────────────────────────────────────────────────────────────
const period = ref('day');

async function loadMaterial()   { await run(() => props.fetchMaterialReport(period.value)); }
async function loadCongestion() { await run(() => props.fetchCongestionReport()); }
async function refreshState()   { await run(() => props.fetchState()); }

function stateLower(s) { return (s || '').toLowerCase(); }
</script>

<template>
  <aside class="cp glass-panel">

    <!-- Header -->
    <div class="cp-header">
      <h2>Control</h2>
      <button class="refresh-btn" :disabled="loading" @click="refreshState" title="Refresh state">
        <span :class="{ spinning: loading }">↻</span>
      </button>
    </div>

    <!-- Feedback -->
    <transition name="fade">
      <div v-if="feedback" class="feedback" :class="feedback.type">{{ feedback.msg }}</div>
    </transition>

    <!-- Tabs -->
    <nav class="tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }}<span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Content -->
    <div class="cp-body">

      <!-- ── VEHICLES ─────────────────────────────────────────── -->
      <section v-show="activeTab === 'vehicles'" class="section">
        <p class="hint">Publish a vehicle position update. It will appear immediately on the map.</p>

        <div class="form-grid">
          <label class="field">
            <span>Vehicle ID</span>
            <input v-model="vForm.vehicle_id" placeholder="TRUCK-01" />
          </label>
          <label class="field">
            <span>Zone</span>
            <select v-model="vForm.zone_id">
              <option v-for="z in zones" :key="z">{{ z }}</option>
            </select>
          </label>
          <label class="field">
            <span>X (world)</span>
            <input type="number" v-model.number="vForm.x" step="0.5" min="0" max="25" />
          </label>
          <label class="field">
            <span>Y (world)</span>
            <input type="number" v-model.number="vForm.y" step="0.5" min="0" max="6" />
          </label>
          <label class="field">
            <span>Speed km/h</span>
            <input type="number" v-model.number="vForm.speed" step="0.1" min="0" max="5" />
          </label>
          <label class="field">
            <span>Destination</span>
            <select v-model="vForm.destination">
              <option v-for="d in destinations" :key="d">{{ d }}</option>
            </select>
          </label>
        </div>
        <button class="btn primary" :disabled="loading" @click="submitVehicle">
          📡 Publish Position
        </button>
      </section>

      <!-- ── LIGHTS ───────────────────────────────────────────── -->
      <section v-show="activeTab === 'lights'" class="section">
        <p class="hint">Select a traffic light and set its state.</p>

        <label class="field full">
          <span>Traffic Light</span>
          <select v-model="selectedLight">
            <option v-for="id in lightIds" :key="id">{{ id }}</option>
          </select>
        </label>

        <div class="light-row">
          <button
            v-for="s in lightStates"
            :key="s"
            class="light-btn"
            :class="s.toLowerCase()"
            :disabled="loading"
            @click="setLight(s)"
          >
            <span class="bulb"></span>{{ s }}
          </button>
        </div>

        <!-- Current state summary -->
        <div class="lights-table" v-if="Object.keys(trafficLights).length">
          <div v-for="(lt, id) in trafficLights" :key="id" class="lt-row">
            <span class="lt-id">{{ id }}</span>
            <span class="lt-zone">{{ lt.zone_id }}</span>
            <span class="lt-chip" :class="stateLower(lt.state)">{{ lt.state || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- ── DELIVERY ──────────────────────────────────────────── -->
      <section v-show="activeTab === 'delivery'" class="section">
        <p class="hint">Register a material delivery into the database.</p>

        <div class="form-grid">
          <label class="field">
            <span>Vehicle ID</span>
            <input v-model="dForm.vehicle_id" placeholder="TRUCK-01" />
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
              <option v-for="p in places" :key="p">{{ p }}</option>
            </select>
          </label>
          <label class="field">
            <span>Destination</span>
            <select v-model="dForm.destination">
              <option v-for="p in places" :key="p">{{ p }}</option>
            </select>
          </label>
          <label class="field full">
            <span>Quantity (tons)</span>
            <input type="number" v-model.number="dForm.quantity_tons" min="1" max="500" />
          </label>
        </div>
        <button class="btn success" :disabled="loading" @click="submitDelivery">
          📦 Register Delivery
        </button>
      </section>

      <!-- ── REPORTS ───────────────────────────────────────────── -->
      <section v-show="activeTab === 'reports'" class="section">
        <p class="hint">Fetch reports directly from the database.</p>

        <div class="report-controls">
          <label class="field">
            <span>Period</span>
            <select v-model="period">
              <option value="day">Last 24 h</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </label>
          <button class="btn primary sm" :disabled="loading" @click="loadMaterial">📊 Material</button>
          <button class="btn sm"         :disabled="loading" @click="loadCongestion">⚠️ Congestion</button>
        </div>

        <!-- Material result -->
        <div v-if="reports?.material" class="report-card">
          <div class="report-title">📦 Material — {{ reports.material.period }}</div>
          <div class="report-stats">
            <div class="stat">
              <span class="stat-n">{{ reports.material.delivery_count }}</span>
              <span class="stat-l">Deliveries</span>
            </div>
            <div class="stat">
              <span class="stat-n">{{ reports.material.total_tons }}</span>
              <span class="stat-l">Tons</span>
            </div>
          </div>
          <div v-for="(n, mat) in reports.material.by_material" :key="mat" class="mat-row">
            <span class="mat-name">{{ mat }}</span>
            <span class="mat-n">{{ n }}</span>
          </div>
          <div v-if="!Object.keys(reports.material.by_material || {}).length" class="empty-hint">
            No deliveries in this period.
          </div>
        </div>

        <!-- Congestion result -->
        <div v-if="reports?.congestion" class="report-card">
          <div class="report-title">⚠️ Congestion — {{ reports.congestion.count }} events</div>
          <div v-for="(ev, i) in (reports.congestion.events || []).slice(0, 8)" :key="i" class="cong-row">
            <span class="sev" :class="(ev.severity||'').toLowerCase()">{{ ev.severity }}</span>
            <span class="cong-zone">{{ ev.zone_id }}</span>
            <span class="cong-info">{{ ev.vehicle_count }} veh · {{ ev.avg_speed }} km/h</span>
          </div>
          <div v-if="!reports.congestion.events?.length" class="empty-hint">No congestion events yet.</div>
        </div>
      </section>

    </div>
  </aside>
</template>

<style scoped>
/* ── Layout ── */
.cp {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
  gap: 0.6rem;
}

/* ── Header ── */
.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.cp-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.refresh-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border-glass);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, color 0.2s;
}
.refresh-btn:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.spinning { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Feedback ── */
.feedback {
  padding: 0.45rem 0.7rem;
  border-radius: 7px;
  font-size: 0.78rem;
  flex-shrink: 0;
}
.feedback.ok  { background: rgba(16,185,129,0.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.25); }
.feedback.err { background: rgba(239,68,68,0.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 3px;
  background: rgba(0,0,0,0.25);
  padding: 3px;
  border-radius: 9px;
  flex-shrink: 0;
}
.tab {
  flex: 1;
  padding: 0.35rem 0.2rem;
  font-size: 0.68rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.18s, color 0.18s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  white-space: nowrap;
}
.tab-label { display: none; }
@media (min-width: 280px) { .tab-label { display: inline; } }
.tab.active { background: rgba(255,255,255,0.09); color: var(--text-primary); font-weight: 600; }
.tab:hover:not(.active) { background: rgba(255,255,255,0.04); color: var(--text-primary); }

/* ── Body ── */
.cp-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
  min-height: 0;
}

/* ── Sections ── */
.section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.5;
}

/* ── Form grid (2 cols, fills full width) ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.field.full { grid-column: 1 / -1; }
.field span {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.field input,
.field select {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  color: var(--text-primary);
  font-size: 0.78rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  min-width: 0;
}
.field input:focus,
.field select:focus { border-color: var(--accent-blue); }
.field select option { background: #181b23; }

/* ── Buttons ── */
.btn {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px;
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn.primary { border-color: rgba(59,130,246,0.35); color: #93c5fd; }
.btn.primary:hover:not(:disabled) { background: rgba(59,130,246,0.12); }
.btn.success { border-color: rgba(16,185,129,0.35); color: #6ee7b7; }
.btn.success:hover:not(:disabled) { background: rgba(16,185,129,0.12); }
.btn.sm { width: auto; flex-shrink: 0; padding: 0.35rem 0.65rem; font-size: 0.72rem; }

/* ── Traffic light buttons ── */
.light-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}
.light-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.65rem 0.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  font-size: 0.65rem;
  font-family: inherit;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  transition: transform 0.2s, background 0.2s, border-color 0.2s;
}
.light-btn:hover:not(:disabled) { transform: translateY(-2px); }
.light-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.bulb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.6;
}
.light-btn.green  { border-color: rgba(16,185,129,0.3); color: #34d399; }
.light-btn.green  .bulb { background: #10b981; box-shadow: 0 0 8px #10b981; opacity: 1; }
.light-btn.green:hover:not(:disabled)  { background: rgba(16,185,129,0.1); }
.light-btn.yellow { border-color: rgba(245,158,11,0.3); color: #fbbf24; }
.light-btn.yellow .bulb { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; opacity: 1; }
.light-btn.yellow:hover:not(:disabled) { background: rgba(245,158,11,0.1); }
.light-btn.red    { border-color: rgba(239,68,68,0.3); color: #f87171; }
.light-btn.red    .bulb { background: #ef4444; box-shadow: 0 0 8px #ef4444; opacity: 1; }
.light-btn.red:hover:not(:disabled)    { background: rgba(239,68,68,0.1); }

/* Current lights table */
.lights-table { display: flex; flex-direction: column; gap: 0.3rem; }
.lt-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.35rem 0.5rem;
  background: rgba(255,255,255,0.02);
  border-radius: 5px;
}
.lt-id    { font-weight: 600; flex-shrink: 0; }
.lt-zone  { color: var(--text-muted); font-size: 0.65rem; flex: 1; }
.lt-chip  { margin-left: auto; font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
.lt-chip.green  { background: rgba(16,185,129,0.15); color: #34d399; }
.lt-chip.red    { background: rgba(239,68,68,0.15);  color: #f87171; }
.lt-chip.yellow { background: rgba(245,158,11,0.15); color: #fbbf24; }

/* ── Reports ── */
.report-controls {
  display: flex;
  gap: 0.4rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.report-controls .field { flex: 1; min-width: 90px; }
.report-card {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 0.75rem;
}
.report-title { font-size: 0.78rem; font-weight: 600; margin-bottom: 0.6rem; color: var(--text-primary); }
.report-stats { display: flex; gap: 1rem; margin-bottom: 0.6rem; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.stat-n { font-size: 1.4rem; font-weight: 700; color: #fff; line-height: 1; }
.stat-l { font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; }
.mat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.mat-name { text-transform: capitalize; }
.mat-n {
  background: rgba(59,130,246,0.15);
  color: #93c5fd;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
}
.cong-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.sev {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}
.sev.high   { background: rgba(239,68,68,0.18);  color: #f87171; }
.sev.medium { background: rgba(245,158,11,0.18); color: #fbbf24; }
.sev.low    { background: rgba(16,185,129,0.18); color: #34d399; }
.cong-zone { font-weight: 600; flex-shrink: 0; }
.cong-info { color: var(--text-muted); }
.empty-hint { font-size: 0.7rem; color: var(--text-muted); text-align: center; padding: 0.5rem 0; }
</style>

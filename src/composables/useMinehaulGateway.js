import { ref, onMounted, onUnmounted } from 'vue';

// ─── Config ──────────────────────────────────────────────────────────────────
const GATEWAY_URL = 'http://127.0.0.1:8000';
const WS_URL      = 'ws://127.0.0.1:8000/ws/events';
const API_TOKEN   = 'mvts-demo-token';

const HEADERS = {
  'x-api-token': API_TOKEN,
  'Content-Type': 'application/json',
};

// ─── Singleton state ──────────────────────────────────────────────────────────
// Shared reactively across all composable calls in the app
const isConnected  = ref(false);
const vehicles     = ref({});   // keyed by vehicle_id => VehiclePositionPayload
const trafficLights = ref({});  // keyed by TL-id => { zone_id, state }
const events       = ref([]);   // last 100 events (newest first)
const reports      = ref({ material: null, congestion: null });
const lastError    = ref(null);

let ws = null;
let reconnectTimer = null;

// ─── WS helpers ───────────────────────────────────────────────────────────────
function pushEvent(payload) {
  events.value.unshift({ time: new Date().toLocaleTimeString(), ...payload });
  if (events.value.length > 100) events.value.pop();
}

function applyEvent(raw) {
  const type    = raw.event_type;
  const payload = raw.payload || {};

  if (type === 'vehicle.position.updated') {
    // payload has: vehicle_id, zone_id, x, y, speed, destination
    vehicles.value[payload.vehicle_id] = { ...payload };
  } else if (type === 'traffic_light.changed') {
    // payload: traffic_light_id, zone_id, previous_state, new_state, changed_by
    trafficLights.value[payload.traffic_light_id] = {
      zone_id: payload.zone_id,
      state:   payload.new_state,
    };
  }
  // congestion.detected and delivery.created are logged only
}

function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${WS_URL}?token=${API_TOKEN}`);

  ws.onopen = () => {
    isConnected.value = true;
    lastError.value   = null;
  };

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      // First message after connect is a snapshot { traffic_lights, vehicle_positions }
      if ('vehicle_positions' in data) {
        vehicles.value     = data.vehicle_positions  || {};
        trafficLights.value = data.traffic_lights    || {};
        return;
      }
      // All subsequent messages are EventEnvelope objects
      applyEvent(data);
      pushEvent(data);
    } catch (e) {
      console.error('[WS] parse error:', e);
    }
  };

  ws.onclose = () => {
    isConnected.value = false;
    reconnectTimer = setTimeout(connectWS, 3000);
  };

  ws.onerror = () => {
    lastError.value = 'Cannot reach the gateway on port 8000';
  };
}

// ─── REST helpers ─────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const resp = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`${resp.status} ${resp.statusText}${text ? ': ' + text : ''}`);
  }
  return resp.json();
}

async function fetchState() {
  const data = await apiFetch('/api/state');
  vehicles.value      = data.vehicle_positions || {};
  trafficLights.value = data.traffic_lights    || {};
}

// ─── API actions (exported) ───────────────────────────────────────────────────
async function publishVehiclePosition(payload) {
  // Required fields: vehicle_id, zone_id, x(float), y(float), speed(float), destination
  return apiFetch('/api/vehicles/position', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      x:     Number(payload.x),
      y:     Number(payload.y),
      speed: Number(payload.speed),
    }),
  });
}

async function changeTrafficLight(traffic_light_id, new_state) {
  return apiFetch('/api/traffic-lights/change', {
    method: 'POST',
    body: JSON.stringify({ traffic_light_id, new_state, changed_by: 'mvts-ui' }),
  });
}

async function createDelivery(payload) {
  return apiFetch('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      quantity_tons: Number(payload.quantity_tons),
    }),
  });
}

async function fetchMaterialReport(period = 'day') {
  const data = await apiFetch(`/api/reports/material?period=${period}`);
  reports.value.material = data;
  return data;
}

async function fetchCongestionReport() {
  const data = await apiFetch('/api/reports/congestions');
  reports.value.congestion = data;
  return data;
}

// ─── Composable ───────────────────────────────────────────────────────────────
export function useMinehaulGateway() {
  onMounted(() => {
    connectWS();
    // Fetch HTTP snapshot in parallel as fallback
    fetchState().catch(() => {});
  });

  onUnmounted(() => {
    clearTimeout(reconnectTimer);
    // Don't close ws — singleton keeps it alive across component remounts
  });

  return {
    isConnected,
    vehicles,
    trafficLights,
    events,
    reports,
    lastError,
    // actions
    publishVehiclePosition,
    changeTrafficLight,
    createDelivery,
    fetchMaterialReport,
    fetchCongestionReport,
    fetchState,
  };
}

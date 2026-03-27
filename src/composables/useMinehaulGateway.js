import { ref, onMounted, onUnmounted } from 'vue';

const GATEWAY_URL = (import.meta.env.VITE_MVTS_GATEWAY_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const WS_URL = import.meta.env.VITE_MVTS_WS_URL || `${GATEWAY_URL.replace(/^http/, 'ws')}/ws/events`;
const API_TOKEN = import.meta.env.VITE_MVTS_API_TOKEN || 'mvts-demo-token';

const HEADERS = {
  'x-api-token': API_TOKEN,
  'Content-Type': 'application/json',
};

const isConnected = ref(false);
const vehicles = ref({});
const trafficLights = ref({});
const events = ref([]);
const reports = ref({ material: null, congestion: null, summary: null });
const topology = ref(null);
const lastError = ref(null);
const loading = ref({ state: false, topology: false, reports: false, action: false });

let ws = null;
let reconnectTimer = null;

function mergeEntries(previous, next) {
  return Object.fromEntries(
    Object.entries(next || {}).map(([id, value]) => [id, { ...(previous[id] || {}), ...value }]),
  );
}

function setError(message) {
  lastError.value = message;
}

function clearError() {
  lastError.value = null;
}

function setLoading(key, value) {
  loading.value = { ...loading.value, [key]: value };
}

function pushEvent(payload) {
  events.value.unshift({ time: new Date().toLocaleTimeString(), ...payload });
  if (events.value.length > 100) events.value.pop();
}

function applyEvent(raw) {
  const type = raw.event_type;
  const payload = raw.payload || {};

  if (type === 'vehicle.position.updated') {
    const current = vehicles.value[payload.vehicle_id] || {};
    vehicles.value[payload.vehicle_id] = { ...current, ...payload };
  } else if (type === 'traffic_light.changed') {
    const current = trafficLights.value[payload.traffic_light_id] || {};
    trafficLights.value[payload.traffic_light_id] = {
      ...current,
      zone_id: payload.zone_id,
      state: payload.new_state,
    };
  }
}

function applySnapshot(data) {
  vehicles.value = mergeEntries(vehicles.value, data.vehicle_positions || {});
  trafficLights.value = mergeEntries(trafficLights.value, data.traffic_lights || {});
}

function connectWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(API_TOKEN)}`);

  ws.onopen = () => {
    isConnected.value = true;
    clearError();
  };

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if ('vehicle_positions' in data) {
        applySnapshot(data);
        return;
      }
      applyEvent(data);
      pushEvent(data);
    } catch (error) {
      console.error('[WS] parse error:', error);
      setError('Invalid event payload received from gateway');
    }
  };

  ws.onclose = () => {
    isConnected.value = false;
    reconnectTimer = setTimeout(connectWS, 3000);
  };

  ws.onerror = () => {
    setError('WebSocket connection to the gateway failed');
  };
}

async function apiFetch(path, options = {}, loadingKey = 'action') {
  setLoading(loadingKey, true);
  try {
    const response = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      headers: { ...HEADERS, ...(options.headers || {}) },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `${response.status} ${response.statusText}`);
    }
    clearError();
    return await response.json();
  } catch (error) {
    setError(error.message || 'Gateway request failed');
    throw error;
  } finally {
    setLoading(loadingKey, false);
  }
}

async function fetchState() {
  const data = await apiFetch('/api/state', {}, 'state');
  applySnapshot(data);
  return data;
}

async function fetchTopology() {
  const data = await apiFetch('/api/topology', {}, 'topology');
  topology.value = data;
  return data;
}

async function fetchSummary() {
  const data = await apiFetch('/api/reports/summary', {}, 'reports');
  reports.value.summary = data;
  return data;
}

async function publishVehiclePosition(payload) {
  const normalized = {
    ...payload,
    x: Number(payload.x),
    y: Number(payload.y),
    speed: Number(payload.speed),
  };
  const result = await apiFetch('/api/vehicles/position', {
    method: 'POST',
    body: JSON.stringify(normalized),
  });
  vehicles.value[normalized.vehicle_id] = { ...normalized };
  return result;
}

async function changeTrafficLight(traffic_light_id, new_state) {
  const result = await apiFetch('/api/traffic-lights/change', {
    method: 'POST',
    body: JSON.stringify({ traffic_light_id, new_state, changed_by: 'mvts-ui' }),
  });
  const current = trafficLights.value[traffic_light_id] || {};
  trafficLights.value[traffic_light_id] = { ...current, state: new_state };
  return result;
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
  const data = await apiFetch(`/api/reports/material?period=${period}`, {}, 'reports');
  reports.value.material = data;
  return data;
}

async function fetchCongestionReport() {
  const data = await apiFetch('/api/reports/congestions', {}, 'reports');
  reports.value.congestion = data;
  return data;
}

export function useMinehaulGateway() {
  onMounted(() => {
    connectWS();
    fetchTopology().catch(() => {});
    fetchState().catch(() => {});
    fetchSummary().catch(() => {});
  });

  onUnmounted(() => {
    clearTimeout(reconnectTimer);
  });

  return {
    isConnected,
    vehicles,
    trafficLights,
    events,
    reports,
    topology,
    lastError,
    loading,
    publishVehiclePosition,
    changeTrafficLight,
    createDelivery,
    fetchMaterialReport,
    fetchCongestionReport,
    fetchState,
    fetchTopology,
    fetchSummary,
  };
}

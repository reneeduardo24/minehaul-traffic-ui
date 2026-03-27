import { ref, onMounted, onUnmounted } from 'vue';

const GATEWAY_URL = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws/events';
const API_TOKEN = 'mvts-demo-token';

const headers = {
  'x-api-token': API_TOKEN,
  'Content-Type': 'application/json',
};

// Singleton state shared across all composable calls
const isConnected = ref(false);
const vehicles = ref({});
const trafficLights = ref({});
const events = ref([]);
const reports = ref({ material: null, congestion: null });
const lastError = ref(null);

let ws = null;
let reconnectTimer = null;

function addEvent(payload, time) {
  events.value.unshift({ time: time || new Date().toLocaleTimeString(), ...payload });
  if (events.value.length > 100) events.value.pop();
}

function applyEvent(event) {
  const type = event.event_type;
  const payload = event.payload || {};
  if (type === 'vehicle.position.updated') {
    vehicles.value[payload.vehicle_id] = { ...vehicles.value[payload.vehicle_id], ...payload };
  } else if (type === 'traffic_light.changed') {
    trafficLights.value[payload.traffic_light_id] = {
      zone_id: payload.zone_id,
      state: payload.new_state,
    };
  } else if (type === 'congestion.detected') {
    // congestion event, just log
  }
}

function connectWS() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  ws = new WebSocket(`${WS_URL}?token=${API_TOKEN}`);
  ws.onopen = () => {
    isConnected.value = true;
    lastError.value = null;
  };
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Gateway sends both snapshot on connect and event envelopes after
      if (data.vehicle_positions !== undefined) {
        // It's a snapshot
        vehicles.value = data.vehicle_positions || {};
        trafficLights.value = data.traffic_lights || {};
      } else {
        // It's an event envelope
        applyEvent(data);
        addEvent(data);
      }
    } catch (e) {
      console.error('WS parse error', e);
    }
  };
  ws.onclose = () => {
    isConnected.value = false;
    reconnectTimer = setTimeout(connectWS, 3000);
  };
  ws.onerror = (e) => {
    lastError.value = 'WebSocket connection failed';
    console.error('WS error', e);
  };
}

async function fetchState() {
  try {
    const resp = await fetch(`${GATEWAY_URL}/api/state`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      vehicles.value = data.vehicle_positions || {};
      trafficLights.value = data.traffic_lights || {};
    }
  } catch (e) {
    console.error('Failed to fetch state:', e);
  }
}

// ─── API Actions ─────────────────────────────────────────────────────────────

async function publishVehiclePosition(payload) {
  // payload: { vehicle_id, zone_id, x, y, speed, destination }
  const resp = await fetch(`${GATEWAY_URL}/api/vehicles/position`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function changeTrafficLight(traffic_light_id, new_state) {
  const resp = await fetch(`${GATEWAY_URL}/api/traffic-lights/change`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ traffic_light_id, new_state, changed_by: 'mvts-ui' }),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function createDelivery(payload) {
  // payload: { vehicle_id, origin, destination, material_type, quantity_tons }
  const resp = await fetch(`${GATEWAY_URL}/api/deliveries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Error ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function fetchMaterialReport(period = 'day') {
  const resp = await fetch(`${GATEWAY_URL}/api/reports/material?period=${period}`, { headers });
  if (!resp.ok) throw new Error(`Error ${resp.status}`);
  const data = await resp.json();
  reports.value.material = data;
  return data;
}

async function fetchCongestionReport() {
  const resp = await fetch(`${GATEWAY_URL}/api/reports/congestions`, { headers });
  if (!resp.ok) throw new Error(`Error ${resp.status}`);
  const data = await resp.json();
  reports.value.congestion = data;
  return data;
}

// ─── Composable Export ────────────────────────────────────────────────────────

export function useMinehaulGateway() {
  onMounted(() => {
    fetchState();
    connectWS();
  });

  onUnmounted(() => {
    clearTimeout(reconnectTimer);
    if (ws) ws.close();
  });

  return {
    isConnected,
    vehicles,
    trafficLights,
    events,
    reports,
    lastError,
    // Actions
    publishVehiclePosition,
    changeTrafficLight,
    createDelivery,
    fetchMaterialReport,
    fetchCongestionReport,
    fetchState,
  };
}

import { ref, onMounted, onUnmounted } from 'vue';

const GATEWAY_URL = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws/events';
const API_TOKEN = 'mvts-demo-token';

export function useMinehaulGateway() {
  const isConnected = ref(false);
  const vehicles = ref({});
  const trafficLights = ref({});
  const events = ref([]);
  let ws = null;

  const fetchInitialState = async () => {
    try {
      const resp = await fetch(`${GATEWAY_URL}/api/state`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        vehicles.value = data.vehicles || {};
        trafficLights.value = data.trafficLights || {};
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  };

  const connectWS = () => {
    ws = new WebSocket(`${WS_URL}?token=${API_TOKEN}`);
    ws.onopen = () => {
      isConnected.value = true;
    };
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        events.value.unshift({ time: new Date().toLocaleTimeString(), ...payload });
        if (events.value.length > 50) events.value.pop();

        if (payload.type === 'location_update') {
          vehicles.value[payload.vehicle_id] = { ...vehicles.value[payload.vehicle_id], ...payload.location };
        } else if (payload.type === 'traffic_light_update') {
          trafficLights.value[payload.light_id] = { ...trafficLights.value[payload.light_id], status: payload.status };
        } else if (payload.type === 'priority_granted') {
           vehicles.value[payload.vehicle_id] = { ...vehicles.value[payload.vehicle_id], status: 'Priority' };
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };
    ws.onclose = () => {
      isConnected.value = false;
      setTimeout(connectWS, 3000); // Reconnect
    };
  };

  onMounted(() => {
    fetchInitialState();
    connectWS();
  });

  onUnmounted(() => {
    if (ws) ws.close();
  });

  return {
    isConnected,
    vehicles,
    trafficLights,
    events
  };
}

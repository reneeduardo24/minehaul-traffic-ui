import { ref } from 'vue';

const GATEWAY_URL = 'http://127.0.0.1:8000';
const WS_URL = 'ws://127.0.0.1:8000/ws/events';
const API_TOKEN = 'mvts-demo-token';

export function useMinehaulGateway() {
  const isConnected = ref(false);
  const vehicles = ref({});
  const trafficLights = ref({});
  
  // Fetch initial state logic
  // WebSocket connection logic
  
  return {
    isConnected,
    vehicles,
    trafficLights
  };
}

# MVTS Control Center — Frontend UI

This is the browser-based dashboard for the **Mine Vehicle Traffic System (MVTS)**. From here you can watch vehicles move around the mine in real time, control traffic lights, register material deliveries, and pull operational reports — all without touching the terminal.

---

## What it does

The UI connects directly to the MVTS Gateway (the FastAPI backend running on port 8000) through two channels:

- **REST API** — used to send commands and fetch reports on demand.
- **WebSocket** — keeps a live connection open so the map and event log update automatically the moment something happens in the system.

Everything you see on screen — vehicle positions, traffic light states, congestion alerts — is driven by real data coming from the backend microservices.

---

## Technologies used

| Layer | Tool |
|---|---|
| Framework | [Vue 3](https://vuejs.org) with `<script setup>` Composition API |
| Build tool | [Vite](https://vitejs.dev) |
| Styling | Vanilla CSS with CSS custom properties (no Tailwind, no frameworks) |
| Real-time | Native Browser WebSocket API |
| HTTP calls | Native Browser Fetch API |
| Graphics | SVG-based mine map rendered directly in the component |

No external UI libraries. No component frameworks. Clean and dependency-light by design.

---

## Requirements

Before running the frontend, make sure the backend is already running. The gateway must be accessible at `http://127.0.0.1:8000`.

To start the backend, run from the `minehaul-traffic-control` folder:

```powershell
# Windows
.\start_distributed_mvp.ps1
```

```bash
# Linux / macOS
./start_distributed_mvp.sh
```

---

## Running the UI

```bash
# Install dependencies (only needed once)
npm install

# Start the development server
npm run dev
```

Then open your browser at **http://localhost:5173**.

That's it. The UI will connect to the gateway automatically and start receiving live data.

---

## Project structure

```
src/
├── App.vue                         # Root layout — header, 3-column dashboard
├── main.js                         # Vue app entry point
├── style.css                       # Global design tokens and utilities
├── composables/
│   └── useMinehaulGateway.js       # All backend communication (REST + WebSocket)
└── components/
    ├── TrafficMap.vue              # Graphical mine map with vehicles and lights
    ├── ControlPanel.vue            # Tabbed control board for all operations
    └── EventNotifications.vue     # Live event feed with human-readable messages
```

---

## Using the interface

### Live Mine Map (center)

The map shows a simplified top-down view of the mine with roads, zones (Z1–Z6), the pit area, and the depot. Vehicles appear as emoji blips and move as position updates arrive. Traffic lights appear as colored dots at the two main intersections (TL-01 at the Z1/Z4 crossroads, TL-02 between Z2 and Z5). The map updates automatically through the WebSocket — no refresh needed.

### Control Panel (left sidebar)

The panel has four tabs:

**🚜 Vehicles** — Publish a vehicle's position manually. Fill in the vehicle ID, zone, X/Y coordinates (scale: 0–100), speed, and destination, then click *Publish Position*. The vehicle will appear or move on the map immediately.

**🚦 Traffic Lights** — Select a light (TL-01 or TL-02) and click the color button to change its state to GREEN, YELLOW, or RED. The current state of each light is shown below the buttons and updates live via WebSocket.

**📦 Deliveries** — Register a material delivery. Pick the vehicle, material type (ore, coal, limestone, etc.), origin, destination, and quantity in tons. This creates a record in the backend database that shows up in material reports.

**📊 Reports** — Pull reports directly from the database. The material report shows delivery counts and total tons by material type for the selected period (24h, 7 days, or 30 days). The congestion report lists recent congestion events with severity, zone, and vehicle count.

### Recent Events (right sidebar)

Every event that flows through the system appears here in plain English. For example:
- *"Vehicle TRK-01 moved to zone Z2 at position (65, 35) — 45 km/h"*
- *"Light TL-02 in zone Z5 changed 🔴 → 🟢 by mvts-ui"*
- *"Delivery registered: TRK-01 transported 20 t of ore from PIT to DEPOT"*

The newest events appear at the top. The feed keeps the last 100 events in memory.

---

## Authentication

The UI uses the token `mvts-demo-token` for all requests. This matches the `API_TOKEN` configured in the backend. You can change it in `src/composables/useMinehaulGateway.js` if needed.

---

## Known limits

- The mine map uses a fixed 0–100 coordinate scale. If the backend sends coordinates outside this range, vehicles may appear off-screen.
- Traffic light positions on the map are hardcoded for TL-01 and TL-02. Adding more lights requires updating the `LIGHT_POSITIONS` map in `TrafficMap.vue`.
- The WebSocket auto-reconnects every 3 seconds if the connection drops. During downtime the status badge turns red and shows "Disconnected".

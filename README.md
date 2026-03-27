# MVTS Control Center - Frontend

Interfaz web del sistema **Mine Vehicle Traffic System (MVTS)**. Este frontend concentra en una sola pantalla el mapa operativo en vivo, los controles de operacion, el feed de eventos y los reportes consultados contra el gateway del sistema.

## Descripcion general

MVTS Control Center es el tablero visual del proyecto MVTS. Su funcion principal es mostrar en tiempo real lo que ocurre en la operacion minera simplificada: movimiento de camiones, estado de semaforos, entregas registradas, eventos operativos y reportes de actividad.

La interfaz no trabaja con datos mockeados para el mapa principal. Se conecta al gateway del backend para consumir estado, topologia, eventos y reportes reales del simulador y de los microservicios del sistema.

## Objetivo del sistema

El objetivo del frontend es ofrecer una vista operativa clara y accionable para:

- monitorear la flota y la topologia de la mina en tiempo real;
- visualizar estados de camiones y semaforos sin depender de la terminal;
- enviar acciones operativas manuales desde la interfaz;
- consultar reportes de material, congestion y resumen general;
- mantener sincronizada la vista del usuario con el backend mediante REST y WebSocket.

## Modulos principales de la interfaz

### 1. Encabezado operativo

La parte superior del dashboard resume el estado global del sistema:

- estado del gateway;
- cantidad de camiones visibles;
- cantidad de semaforos activos;
- cantidad de despachos y toneladas registradas.

### 2. Control Board

Panel lateral para operar el sistema manualmente. Incluye cuatro pestañas:

- `Vehiculos`: publica snapshots de posicion para un truck;
- `Semaforos`: cambia el estado de los semaforos operativos;
- `Despachos`: registra entregas con materiales y destinos reales;
- `Reportes`: consulta resumen, material por periodo y eventos de congestion.

### 3. Live Mine Map

Vista central del sistema. Muestra:

- topologia de la mina redisenada sobre una red vial distribuida;
- rutas principales, colectoras y ramales;
- facilities de origen y destino;
- intersecciones reguladas por semaforos;
- trucks en movimiento con iconografia industrial;
- etiquetas operativas y estados en vivo.

### 4. Runtime Fleet / Estado operativo

Panel integrado al mapa que resume la operacion de la flota. Muestra por truck:

- ID del camion;
- estado actual (moviendose, lento, parado);
- material transportado;
- velocidad actual;
- destino asociado;
- resumen de intersecciones y estado de semaforos.

### 5. Live Feed

Panel de eventos recientes generado a partir del flujo del gateway. Humaniza eventos de:

- posicion de vehiculos;
- cambio de semaforos;
- entregas;
- congestiones.

## Tecnologias usadas

- **Vue 3** con Composition API y `<script setup>`
- **Vite** como entorno de desarrollo y build
- **CSS vanilla** con variables y componentes propios
- **SVG** para el mapa minero en vivo
- **Fetch API** para llamadas REST
- **WebSocket nativo** para actualizacion en tiempo real

No usa frameworks de UI externos ni librerias graficas pesadas.

## Como ejecutar el frontend

### Requisitos previos

Antes de levantar la interfaz, el gateway del backend debe estar disponible. Por defecto se espera en:

- `http://127.0.0.1:8000`

### Instalacion y arranque

```bash
npm install
npm run dev
```

Luego abre en el navegador:

```text
http://127.0.0.1:5173
```

### Build de produccion

```bash
npm run build
```

## Integracion con backend / gateway

La integracion principal esta centralizada en `src/composables/useMinehaulGateway.js`.

La interfaz consume:

- `GET /api/topology`
- `GET /api/state`
- `GET /api/reports/summary`
- `GET /api/reports/material`
- `GET /api/reports/congestions`
- `POST /api/vehicles/position`
- `POST /api/traffic-lights/change`
- `POST /api/deliveries`
- `WS /ws/events`

Por defecto usa estas variables y valores:

- `VITE_MVTS_GATEWAY_URL` -> `http://127.0.0.1:8000`
- `VITE_MVTS_WS_URL` -> derivado del gateway
- `VITE_MVTS_API_TOKEN` -> `mvts-demo-token`

## Que muestra el mapa

El `Live Mine Map` representa una operacion minera simplificada con:

- 4 accesos/origenes operativos;
- 4 destinos de procesamiento, almacenamiento o descarga;
- 4 semaforos en intersecciones reales;
- rutas distribuidas para evitar depender de una sola via central;
- trucks renderizados con estado y material reales del sistema.

La base del mapa permanece fija y solo cambian los elementos dinamicos del runtime: camiones, estados, semaforos y etiquetas asociadas.

## Que muestran los paneles principales

### Panel de control

- formularios para posicion, semaforos y despachos;
- carga de reportes desde backend;
- feedback visual de acciones manuales.

### Panel de eventos

- flujo cronologico de eventos del gateway;
- mensajes resumidos y legibles para operacion;
- actualizacion automatica por WebSocket.

### Estado operativo

- resumen de flota por estado;
- lista de trucks visibles con su material real;
- intersecciones y estado actual de cada semaforo.

## Estructura principal del proyecto

```text
src/
|- App.vue
|- main.js
|- style.css
|- composables/
|  \- useMinehaulGateway.js
|- utils/
|  \- runtimeCatalog.js
\- components/
   |- ControlPanel.vue
   |- EventNotifications.vue
   |- TrafficMap.vue
   \- map/
      |- MapFacilityGlyph.vue
      |- MapSignalGlyph.vue
      |- MapTruckGlyph.vue
      \- RuntimeFleetPanel.vue
```

## Detalles importantes

- El frontend esta pensado para trabajar junto al repositorio backend `minehaul-traffic-control`.
- El mapa, el panel operativo y el feed fueron ajustados para mantener estabilidad visual en distintos tamanos de viewport.
- El estado de los trucks y semaforos depende del backend y del simulador; si esos servicios no estan activos, la UI seguira cargando pero mostrara falta de conexion o ausencia de telemetria.
- Los materiales visibles en UI deben venir del sistema soportado por backend/topologia; actualmente se usan `copper_ore` y `waste_rock`.

## Estado actual de la interfaz

La version actual del frontend incluye:

- rediseno del mapa en vivo;
- panel runtime fleet informativo;
- mejoras responsive del dashboard completo;
- layout estable sin drift del mapa;
- limpieza de scaffolding y componentes no utilizados.

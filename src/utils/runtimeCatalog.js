const FALLBACK_MATERIALS = [
  {
    id: 'copper_ore',
    label: 'Mineral de cobre',
    short_label: 'Cobre',
    accent: '#d68624',
    icon: 'CU',
  },
  {
    id: 'waste_rock',
    label: 'Roca esteril',
    short_label: 'Esteril',
    accent: '#97a3b6',
    icon: 'WR',
  },
];

const VEHICLE_STATES = {
  moving: {
    id: 'moving',
    label: 'Moviendose',
    tone: 'Verde',
    panelLabel: 'MOVIENDOSE / VERDE',
    accent: '#3fd07e',
  },
  slow: {
    id: 'slow',
    label: 'Lento',
    tone: 'Amarillo',
    panelLabel: 'LENTO / AMARILLO',
    accent: '#f2b447',
  },
  stopped: {
    id: 'stopped',
    label: 'Parado',
    tone: 'Rojo',
    panelLabel: 'PARADO / ROJO',
    accent: '#ef6262',
  },
};

const TRAFFIC_LIGHT_STATES = {
  GREEN: {
    id: 'GREEN',
    label: 'Flujo libre',
    accent: '#3fd07e',
  },
  YELLOW: {
    id: 'YELLOW',
    label: 'Precaucion',
    accent: '#f2b447',
  },
  RED: {
    id: 'RED',
    label: 'Alto',
    accent: '#ef6262',
  },
  UNKNOWN: {
    id: 'UNKNOWN',
    label: 'Sin senal',
    accent: '#7b8798',
  },
};

function toCodeLabel(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildMaterialLookup(topology) {
  const materials = topology?.materials?.length ? topology.materials : FALLBACK_MATERIALS;
  return Object.fromEntries(materials.map((material) => [material.id, material]));
}

export function getMaterialOptions(topology) {
  return Object.values(buildMaterialLookup(topology));
}

export function getMaterialMeta(materialType, topology) {
  const materialId = materialType || 'unknown';
  const lookup = buildMaterialLookup(topology);
  const material = lookup[materialId];

  if (material) {
    return {
      ...material,
      shortLabel: material.short_label || material.shortLabel || material.label,
      iconLabel: material.icon || material.short_label || material.label,
    };
  }

  return {
    id: materialId,
    label: materialType ? toCodeLabel(materialType) : 'Sin material',
    shortLabel: materialType ? toCodeLabel(materialType) : 'Sin carga',
    accent: '#7b8798',
    iconLabel: 'NA',
  };
}

export function formatMaterialLabel(materialType, topology) {
  return getMaterialMeta(materialType, topology).label;
}

export function getVehicleState(speed = 0) {
  const numericSpeed = Number(speed || 0);
  if (numericSpeed <= 0.05) return VEHICLE_STATES.stopped;
  if (numericSpeed < 1.0) return VEHICLE_STATES.slow;
  return VEHICLE_STATES.moving;
}

export function getTrafficLightStateMeta(state) {
  const key = String(state || 'UNKNOWN').toUpperCase();
  return TRAFFIC_LIGHT_STATES[key] || TRAFFIC_LIGHT_STATES.UNKNOWN;
}

export function formatFacilityLabel(facilityId, topology) {
  const facility = topology?.facilities?.find((entry) => entry.id === facilityId);
  return facility?.label || facilityId;
}

export function sortVehiclesById(vehicles = []) {
  return [...vehicles].sort((left, right) => left.vehicle_id.localeCompare(right.vehicle_id));
}

export function formatSpeed(speed = 0) {
  return `${Number(speed || 0).toFixed(1)} km/h`;
}

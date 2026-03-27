<script setup>
// Mapa Leaflet o Grid X/Y de vehículos
</script>

<template>
  <div class="glass-panel map-container">
    <h2>Traffic Map</h2>
    <div class="map-view">
        <!-- Áera del mapa -->
    </div>
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
.map-container h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.map-view {
  flex: 1;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
</style>

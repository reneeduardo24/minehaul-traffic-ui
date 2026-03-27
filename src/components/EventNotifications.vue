<script setup>
// Panel lateral de notificaciones y reportes en vivo
</script>

<template>
  <div class="glass-panel notifications-container">
    <h2>Live Events</h2>
    <div class="events-list">
        <!-- TBD -->
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.notifications-container h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.events-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>

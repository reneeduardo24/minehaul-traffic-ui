<script setup>
// Aquí irá la lógica de conexión al gateway y renderizado principal
</script>

<template>
  <div class="app-container">
    <header class="glass-panel main-header">
      <h1>MVTS Control Center</h1>
    </header>
    <main class="dashboard">
      <!-- Mapeo de Componentes -->
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
  gap: 1rem;
}
.main-header {
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
}
.main-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  background: linear-gradient(to right, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.dashboard {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1rem;
  overflow: hidden;
}
</style>

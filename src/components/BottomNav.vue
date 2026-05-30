<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/goals', icon: '🎯', label: '目标' },
  { path: '/badges', icon: '🏅', label: '徽章' },
  { path: '/cheers', icon: '💕', label: '互动' },
  { path: '/settings', icon: '⚙️', label: '设置' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs" :key="tab.path" :to="tab.path"
      class="nav-item" :class="{ active: isActive(tab.path) }"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 428px;
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e0eff5;
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-item.active {
  color: var(--pink);
}

.nav-item:not(.active) {
  color: var(--text-lighter);
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}
</style>

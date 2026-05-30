<script setup lang="ts">
import type { BadgeDefinition } from '@/types'

defineProps<{
  badges: BadgeDefinition[]
  unlockedBadgeKeys: Set<string>
}>()
</script>

<template>
  <div class="badge-grid">
    <div
      v-for="badge in badges"
      :key="badge.key"
      class="badge-card"
      :class="{ unlocked: unlockedBadgeKeys.has(badge.key) }"
    >
      <!-- Unlocked sparkle -->
      <span v-if="unlockedBadgeKeys.has(badge.key)" class="sparkle">✨</span>

      <!-- Locked lock -->
      <span v-else class="lock-icon">🔒</span>

      <!-- Icon -->
      <span class="badge-icon">{{ badge.icon }}</span>

      <!-- Name -->
      <span class="badge-name">{{ badge.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.badge-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 8px 12px;
  border-radius: var(--radius);
  transition: transform 0.2s;
  min-height: 100px;
}

/* ---- Unlocked ---- */
.badge-card.unlocked {
  background: linear-gradient(135deg, #ff9a9e, #fecfef, #a18cd1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(255, 154, 158, 0.25);
}

.badge-card.unlocked:active {
  transform: scale(0.96);
}

/* ---- Locked ---- */
.badge-card:not(.unlocked) {
  background: #f5f5f5;
  border: 2px dashed #ddd;
  filter: grayscale(1);
}

/* ---- Corner marker ---- */
.sparkle,
.lock-icon {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 12px;
  line-height: 1;
}

/* ---- Icon ---- */
.badge-icon {
  font-size: 36px;
  line-height: 1.1;
}

/* ---- Name ---- */
.badge-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-card:not(.unlocked) .badge-name {
  color: #999;
}
</style>

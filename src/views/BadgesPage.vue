<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBadgesStore, BADGE_DEFINITIONS } from '@/stores/badges'
import type { BadgeDefinition } from '@/types'

const badgesStore = useBadgesStore()

const unlockedKeys = computed<Set<string>>(
  () => new Set(badgesStore.unlockedBadges.map(b => b.badge_key))
)

const unlockedCount = computed(() => badgesStore.unlockedBadges.length)

// Only unlocked badge definitions for the showcase
const unlockedBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => unlockedKeys.value.has(b.key))
)

// All badges grouped by category for the collection below
const streakBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'streak')
)
const weightBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'weight')
)
const cheerBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'cheer')
)

const categorySections = computed(() => [
  { emoji: '🗓️', title: '打卡成就', badges: streakBadges.value },
  { emoji: '⚖️', title: '减重成就', badges: weightBadges.value },
  { emoji: '💕', title: '互动成就', badges: cheerBadges.value },
])

onMounted(async () => {
  await badgesStore.fetchBadges()
})
</script>

<template>
  <div class="page">
    <!-- ===== Top: Floating Showcase ===== -->
    <div class="showcase-window">
      <div class="showcase-header">
        <span class="showcase-title">🎒 徽章展柜</span>
        <span class="showcase-count">✨ {{ unlockedCount }} / {{ BADGE_DEFINITIONS.length }}</span>
      </div>

      <!-- Empty state -->
      <div v-if="unlockedBadges.length === 0" class="showcase-empty">
        <span class="showcase-empty-icon">🏆</span>
        <p class="showcase-empty-text">还没有获得徽章哦</p>
        <p class="showcase-empty-hint">坚持打卡、达成目标，来这里收集徽章吧！</p>
      </div>

      <!-- Floating badges -->
      <div v-else class="showcase-badges">
        <div
          v-for="(badge, i) in unlockedBadges"
          :key="badge.key"
          class="floating-badge"
          :style="{ animationDelay: `${i * 0.3}s` }"
        >
          <span class="float-icon">{{ badge.icon }}</span>
          <span class="float-name">{{ badge.name }}</span>
        </div>
      </div>

      <!-- Glass reflection -->
      <div class="showcase-reflection"></div>
    </div>

    <!-- ===== Bottom: All Badges Collection ===== -->
    <div
      v-for="section in categorySections"
      :key="section.title"
      class="section"
    >
      <h3 class="section-title">{{ section.emoji }} {{ section.title }}</h3>
      <div class="badge-collection-grid">
        <div
          v-for="badge in section.badges"
          :key="badge.key"
          class="collection-badge"
          :class="{ 'is-unlocked': unlockedKeys.has(badge.key) }"
        >
          <div class="collection-badge-top">
            <span class="collection-icon">{{ badge.icon }}</span>
            <span v-if="unlockedKeys.has(badge.key)" class="unlock-mark">✅</span>
            <span v-else class="unlock-mark lock">🔒</span>
          </div>
          <span class="collection-name">{{ badge.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 80px;
}

/* ============================
   Showcase Window (Top)
   ============================ */
.showcase-window {
  position: relative;
  background: linear-gradient(160deg, #fff 0%, #fff5f5 40%, #fdf2ff 100%);
  border: 2px solid var(--pink-pale);
  border-radius: 24px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow:
    0 8px 32px rgba(255, 154, 158, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.showcase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.showcase-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.showcase-count {
  font-size: 13px;
  color: var(--pink);
  font-weight: 600;
  background: var(--pink-bg);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Glass shelf reflection */
.showcase-reflection {
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
}

/* Empty showcase */
.showcase-empty {
  text-align: center;
  padding: 24px 16px;
}

.showcase-empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.6;
}

.showcase-empty-text {
  font-size: 15px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.showcase-empty-hint {
  font-size: 13px;
  color: var(--text-lighter);
}

/* Floating badges row */
.showcase-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.floating-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 10px 8px;
  min-width: 72px;
  animation: floatBadge 3s ease-in-out infinite;
}

.float-icon {
  font-size: 36px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(255, 154, 158, 0.3));
}

.float-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--pink);
  text-align: center;
}

@keyframes floatBadge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ============================
   Collection Grid (Bottom)
   ============================ */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.badge-collection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.collection-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px 12px;
  border-radius: var(--radius);
  background: var(--card-bg);
  border: 1.5px solid #eee;
  transition: all 0.2s;
  position: relative;
}

.collection-badge.is-unlocked {
  border-color: var(--pink-pale);
  background: linear-gradient(160deg, #fff, #fff5f5);
  box-shadow: 0 2px 12px rgba(255, 154, 158, 0.1);
}

.collection-badge-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.collection-icon {
  font-size: 32px;
  line-height: 1.1;
}

.unlock-mark {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 14px;
}

.unlock-mark.lock {
  font-size: 12px;
  opacity: 0.5;
}

.collection-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
}

.collection-badge:not(.is-unlocked) .collection-name {
  color: #999;
}
</style>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBadgesStore, BADGE_DEFINITIONS } from '@/stores/badges'
import { useGoalsStore } from '@/stores/goals'
import BadgeGrid from '@/components/BadgeGrid.vue'
import type { BadgeDefinition } from '@/types'

const badgesStore = useBadgesStore()
const goalsStore = useGoalsStore()

const unlockedKeys = computed<Set<string>>(
  () => new Set(badgesStore.unlockedBadges.map(b => b.badge_key))
)

const unlockedCount = computed(() => badgesStore.unlockedBadges.length)

const streakBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'streak')
)

const weightBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'weight')
)

const goalBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'goal')
)

const cheerBadges = computed<BadgeDefinition[]>(() =>
  BADGE_DEFINITIONS.filter(b => b.category === 'cheer')
)

const categorySections = computed(() => [
  { emoji: '🗓️', title: '打卡成就', badges: streakBadges.value },
  { emoji: '⚖️', title: '减重成就', badges: weightBadges.value },
  { emoji: '🎯', title: '目标成就', badges: goalBadges.value },
  { emoji: '💕', title: '互动成就', badges: cheerBadges.value },
])

const completedWithReward = computed(() =>
  goalsStore.completedGoals.filter(g => g.reward)
)

onMounted(async () => {
  await badgesStore.fetchBadges()
  await goalsStore.fetchGoals()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <h2 class="page-title">🏅 我的徽章</h2>
        <span class="bag-icon">🎒</span>
      </div>
      <p class="unlock-count">✨ 已点亮 {{ unlockedCount }} / {{ BADGE_DEFINITIONS.length }}</p>
    </div>

    <!-- Category sections -->
    <div
      v-for="section in categorySections"
      :key="section.title"
      class="section"
    >
      <h3 class="section-title">{{ section.emoji }} {{ section.title }}</h3>
      <BadgeGrid
        :badges="section.badges"
        :unlocked-badge-keys="unlockedKeys"
      />
    </div>

    <!-- Custom Rewards -->
    <div v-if="completedWithReward.length > 0" class="section">
      <h3 class="section-title">🎁 自定义奖励</h3>
      <div class="rewards-list">
        <div
          v-for="goal in completedWithReward"
          :key="goal.id"
          class="reward-card"
        >
          <span class="reward-icon">🎁</span>
          <div class="reward-info">
            <span class="reward-title">{{ goal.title }}</span>
            <span class="reward-desc">{{ goal.reward }}</span>
          </div>
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
}

/* ---- Header ---- */
.header {
  margin-bottom: 24px;
  text-align: center;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 6px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.bag-icon {
  font-size: 28px;
}

.unlock-count {
  font-size: 14px;
  color: var(--pink);
  font-weight: 500;
}

/* ---- Sections ---- */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

/* ---- Rewards ---- */
.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reward-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid #ffeaa7;
  background: linear-gradient(135deg, #fffdf5, #fff8e1);
}

.reward-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.reward-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reward-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.reward-desc {
  font-size: 13px;
  color: var(--text-light);
}
</style>

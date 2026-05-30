<script setup lang="ts">
defineProps<{
  weight: number | null
  change: number | null
  streak: number
  mood?: string | null
}>()
</script>

<template>
  <div class="weight-card">
    <div class="watermark">⚖️</div>
    <div class="card-content">
      <div class="weight-display">
        <span v-if="weight !== null" class="weight-number">{{ weight }}</span>
        <span v-else class="weight-placeholder">--</span>
        <span class="weight-unit">斤</span>
      </div>
      <div class="stats-row">
        <div v-if="change !== null" class="stat change-stat">
          <span class="stat-arrow">{{ change > 0 ? '↑' : change < 0 ? '↓' : '→' }}</span>
          <span class="stat-value">{{ Math.abs(change).toFixed(1) }}</span>
          <span class="stat-label">斤</span>
        </div>
        <div class="stat streak-stat">
          <span class="stat-icon">🔥</span>
          <span class="stat-value">{{ streak }}</span>
          <span class="stat-label">天</span>
        </div>
      </div>
      <div v-if="mood" class="mood-tag">
        💬 {{ mood }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.weight-card {
  position: relative;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(91, 173, 206, 0.3);
}

.watermark {
  position: absolute;
  right: -8px;
  bottom: -8px;
  font-size: 72px;
  opacity: 0.12;
  line-height: 1;
  pointer-events: none;
}

.card-content {
  position: relative;
  z-index: 1;
}

.weight-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}

.weight-number {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
}

.weight-placeholder {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  opacity: 0.6;
}

.weight-unit {
  font-size: 18px;
  font-weight: 500;
  opacity: 0.85;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.stat-arrow {
  font-size: 16px;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  opacity: 0.75;
}

.mood-tag {
  text-align: center;
  margin-top: 12px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  font-size: 13px;
  color: #fff;
}
</style>

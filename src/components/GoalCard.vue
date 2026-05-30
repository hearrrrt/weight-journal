<script setup lang="ts">
import type { Goal } from '@/types'

const props = defineProps<{
  goal: Goal
  currentWeight: number | null
}>()

const emit = defineEmits<{
  complete: [id: string]
  delete: [id: string]
}>()

const isCompleted = props.goal.status === 'completed'
const isActive = props.goal.status === 'active'
const hasReward = !!props.goal.reward

const icon = isCompleted ? '🎉' : (hasReward ? '🎀' : '💫')

const statusLabel = isCompleted ? '已完成' : '进行中'

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="goal-card" :class="{ completed: isCompleted }">
    <div class="card-header">
      <span class="goal-icon">{{ icon }}</span>
      <div class="goal-info">
        <span class="goal-title">{{ goal.title }}</span>
        <span class="goal-target">目标体重: {{ goal.target_weight }} 斤</span>
        <span v-if="goal.reward" class="goal-reward">🎁 {{ goal.reward }}</span>
        <span v-if="isCompleted && goal.completed_at" class="goal-date">
          完成于 {{ formatDate(goal.completed_at) }}
        </span>
      </div>
      <span class="status-badge" :class="isCompleted ? 'badge-done' : 'badge-active'">
        {{ statusLabel }}
      </span>
    </div>

    <div class="card-actions">
      <button
        v-if="isActive"
        class="btn-complete"
        @click="emit('complete', goal.id)"
      >
        🎯 完成
      </button>
      <button class="btn-delete" @click="emit('delete', goal.id)">
        🗑️
      </button>
    </div>
  </div>
</template>

<style scoped>
.goal-card {
  background: var(--card-bg);
  border: 2px solid #fff0f0;
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
  transition: all 0.2s ease;
}

.goal-card.completed {
  background: linear-gradient(135deg, #fff9e6, #fff3cc);
  border: 2px solid #e6c300;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.goal-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.goal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.goal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.goal-target {
  font-size: 13px;
  color: var(--text-light);
}

.goal-reward {
  font-size: 13px;
  color: var(--pink);
}

.goal-date {
  font-size: 12px;
  color: var(--text-light);
  font-style: italic;
}

.status-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-active {
  background: var(--pink-bg);
  color: var(--pink);
}

.badge-done {
  background: #fff9e6;
  color: #b8860b;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-complete {
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-complete:hover {
  opacity: 0.85;
}

.btn-delete {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.btn-delete:hover {
  background: #fff0f0;
}
</style>

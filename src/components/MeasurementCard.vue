<script setup lang="ts">
import type { BodyMeasurement } from '@/types'

defineProps<{
  measurement: BodyMeasurement
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="measurement-card">
    <div class="card-header">
      <span class="card-date">📅 {{ formatDate(measurement.log_date) }}</span>
      <div class="card-actions">
        <button class="btn-edit" @click="emit('edit', measurement.id)">✏️</button>
        <button class="btn-delete" @click="emit('delete', measurement.id)">🗑️</button>
      </div>
    </div>
    <div class="card-values">
      <div v-if="measurement.waist !== null" class="value-item">
        <span class="value-label">腰围</span>
        <span class="value-number">{{ measurement.waist }}</span>
        <span class="value-unit">cm</span>
      </div>
      <div v-if="measurement.hip !== null" class="value-item">
        <span class="value-label">臀围</span>
        <span class="value-number">{{ measurement.hip }}</span>
        <span class="value-unit">cm</span>
      </div>
      <div v-if="measurement.thigh !== null" class="value-item">
        <span class="value-label">大腿围</span>
        <span class="value-number">{{ measurement.thigh }}</span>
        <span class="value-unit">cm</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.measurement-card {
  background: var(--card-bg);
  border: 1.5px solid var(--pink-pale);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-date {
  font-size: 13px;
  color: var(--text-light);
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.btn-edit,
.btn-delete {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-edit:hover {
  background: var(--pink-bg);
}

.btn-delete:hover {
  background: #fff0f0;
}

.card-values {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.value-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.value-label {
  font-size: 12px;
  color: var(--text-light);
}

.value-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--pink);
  line-height: 1;
}

.value-unit {
  font-size: 11px;
  color: var(--text-lighter);
}
</style>

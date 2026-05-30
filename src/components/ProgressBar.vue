<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  startWeight: number
  targetWeight: number
  currentWeight: number
}>()

const totalToLose = computed(() => Math.abs(props.startWeight - props.targetWeight))
const lost = computed(() => Math.abs(props.startWeight - props.currentWeight))
const remaining = computed(() => Math.max(0, Math.abs(props.currentWeight - props.targetWeight)))

const progressPercent = computed(() => {
  if (totalToLose.value === 0) return 0
  const pct = (lost.value / totalToLose.value) * 100
  return Math.min(100, Math.max(0, pct))
})

const isGaining = computed(() => props.targetWeight > props.startWeight)
</script>

<template>
  <div class="progress-bar-card">
    <div class="endpoints">
      <div class="endpoint start">
        <span class="endpoint-label">起始</span>
        <span class="endpoint-value">{{ startWeight }} 斤</span>
      </div>
      <div class="endpoint target">
        <span class="endpoint-label">目标</span>
        <span class="endpoint-value">{{ targetWeight }} 斤</span>
      </div>
    </div>
    <div class="bar-track">
      <div
        class="bar-fill"
        :style="{ width: progressPercent + '%' }"
      ></div>
      <div
        class="paw-print"
        :style="{ left: progressPercent + '%' }"
      >🐾</div>
    </div>
    <div class="remaining-text">
      {{ isGaining ? '还需增重' : '还剩' }} <strong>{{ remaining.toFixed(1) }}</strong> 斤
    </div>
  </div>
</template>

<style scoped>
.progress-bar-card {
  background: var(--card-bg);
  border: 1.5px solid var(--pink-pale);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.endpoints {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.endpoint {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.endpoint.start {
  align-items: flex-start;
}

.endpoint.target {
  align-items: flex-end;
}

.endpoint-label {
  font-size: 12px;
  color: var(--text-light);
}

.endpoint-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.bar-track {
  position: relative;
  height: 12px;
  background: var(--pink-bg);
  border-radius: 6px;
  overflow: visible;
  margin-bottom: 12px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--pink), var(--pink-light));
  border-radius: 6px;
  transition: width 0.5s ease;
  min-width: 0;
}

.paw-print {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  line-height: 1;
  transition: left 0.5s ease;
}

.remaining-text {
  text-align: center;
  font-size: 14px;
  color: var(--text-light);
}

.remaining-text strong {
  color: var(--pink);
  font-size: 18px;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { BodyMeasurement } from '@/types'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
)

const props = defineProps<{
  measurements: BodyMeasurement[]
}>()

const sortedMeasurements = computed(() => {
  return [...props.measurements].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime(),
  )
})

const WAIST_COLOR = '#ff9a9e'
const HIP_COLOR = '#FFE082'
const THIGH_COLOR = '#B2EBF2'

const chartData = computed<ChartData<'line'>>(() => {
  return {
    labels: sortedMeasurements.value.map((m) => m.log_date),
    datasets: [
      {
        label: '腰围 (cm)',
        data: sortedMeasurements.value.map((m) => m.waist),
        borderColor: WAIST_COLOR,
        backgroundColor: 'rgba(255, 154, 158, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: WAIST_COLOR,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        spanGaps: true,
      },
      {
        label: '臀围 (cm)',
        data: sortedMeasurements.value.map((m) => m.hip),
        borderColor: HIP_COLOR,
        backgroundColor: 'rgba(255, 224, 130, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: HIP_COLOR,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        spanGaps: true,
      },
      {
        label: '大腿围 (cm)',
        data: sortedMeasurements.value.map((m) => m.thigh),
        borderColor: THIGH_COLOR,
        backgroundColor: 'rgba(178, 235, 242, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: THIGH_COLOR,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2.5,
        spanGaps: true,
      },
    ],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 11 },
        color: '#999',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#555',
      bodyColor: '#555',
      borderColor: '#ffd4de',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 10,
      callbacks: {
        label: (ctx) => {
          const label = ctx.dataset.label || ''
          const val = ctx.parsed.y
          if (val === null || val === undefined) return `${label}: --`
          return `${label}: ${val} cm`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#ccc',
        font: { size: 11 },
        maxTicksLimit: 7,
      },
    },
    y: {
      grid: { color: 'rgba(255, 154, 158, 0.08)' },
      ticks: {
        color: '#ccc',
        font: { size: 11 },
      },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <div v-if="sortedMeasurements.length === 0" class="chart-empty">
      <span class="empty-icon">📏</span>
      <p>还没有记录，快去添加吧！</p>
    </div>
    <Line v-else :data="chartData" :options="chartOptions" class="chart-canvas" />
  </div>
</template>

<style scoped>
.chart-container {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 16px;
  height: 260px;
  position: relative;
}

.chart-canvas {
  height: 100%;
  width: 100%;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-lighter);
  gap: 8px;
}

.empty-icon {
  font-size: 36px;
}

.chart-empty p {
  font-size: 14px;
}
</style>

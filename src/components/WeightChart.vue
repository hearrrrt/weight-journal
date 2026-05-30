<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Filler,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { WeightLog } from '@/types'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Filler,
  Tooltip
)

const props = defineProps<{
  logs: WeightLog[]
}>()

const sortedLogs = computed(() => {
  return [...props.logs]
    .sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime())
})

const chartData = computed<ChartData<'line'>>(() => {
  return {
    labels: sortedLogs.value.map((l) => l.log_date),
    datasets: [
      {
        label: '体重 (斤)',
        data: sortedLogs.value.map((l) => l.weight),
        borderColor: '#5badce',
        backgroundColor: 'rgba(91, 173, 206, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#5badce',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        borderWidth: 2.5,
      },
    ],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#555',
      bodyColor: '#5badce',
      borderColor: '#b3dff0',
      borderWidth: 1,
      cornerRadius: 12,
      padding: 10,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#ccc',
        font: {
          size: 11,
        },
        maxTicksLimit: 7,
      },
    },
    y: {
      grid: {
        color: 'rgba(91, 173, 206, 0.08)',
      },
      ticks: {
        color: '#ccc',
        font: {
          size: 11,
        },
      },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <div v-if="sortedLogs.length === 0" class="chart-empty">
      <span class="empty-icon">📝</span>
      <p>还没有记录呢，快去打卡吧！</p>
    </div>
    <Line v-else :data="chartData" :options="chartOptions" class="chart-canvas" />
  </div>
</template>

<style scoped>
.chart-container {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 16px;
  height: 200px;
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

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useWeightStore } from '@/stores/weight'
import { useGoalsStore } from '@/stores/goals'
import { useBadgesStore } from '@/stores/badges'
import WeightCard from '@/components/WeightCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WeightChart from '@/components/WeightChart.vue'

const userStore = useUserStore()
const weightStore = useWeightStore()
const goalsStore = useGoalsStore()
const badgesStore = useBadgesStore()

const weightInput = ref<number | null>(null)
const moodInput = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const greeting = ref('')

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

const showConfirm = ref(false)
const pendingWeight = ref(0)
const pendingMood = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (weightInput.value === null) {
    errorMessage.value = '请输入体重'
    return
  }

  if (weightInput.value < 50 || weightInput.value > 300) {
    errorMessage.value = '体重需在 50-300 斤之间'
    return
  }

  submitting.value = true
  try {
    await weightStore.addLog(weightInput.value, moodInput.value || null)
    successMessage.value = '打卡成功！'
    weightInput.value = null
    moodInput.value = ''
    await badgesStore.checkAndAwardBadges()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'DUPLICATE_TODAY') {
      // Already logged today — ask to confirm re-log
      pendingWeight.value = weightInput.value!
      pendingMood.value = moodInput.value || ''
      showConfirm.value = true
    } else if (e instanceof Error) {
      errorMessage.value = e.message
    } else {
      errorMessage.value = '打卡失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

async function confirmRelog() {
  showConfirm.value = false
  submitting.value = true
  try {
    const todayLog = await weightStore.getTodayLog()
    if (todayLog) {
      await weightStore.updateLog(todayLog.id, pendingWeight.value, pendingMood.value || null)
      successMessage.value = '打卡更新成功！'
      weightInput.value = null
      moodInput.value = ''
      await badgesStore.checkAndAwardBadges()
    }
  } catch (e: unknown) {
    errorMessage.value = '更新失败，请重试'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  greeting.value = getGreeting()
  await weightStore.fetchLogs()
  await goalsStore.fetchGoals()
  await badgesStore.fetchBadges()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="avatar">
          {{ userStore.profile?.nickname?.charAt(0) || '👤' }}
        </div>
        <div class="greeting">
          <p class="greeting-text">{{ greeting }}，{{ userStore.profile?.nickname || '用户' }}</p>
        </div>
      </div>
      <div class="header-right">
        <span class="streak-chip">🔥 {{ weightStore.streakDays }} 天</span>
        <span v-if="goalsStore.currentGoal" class="target-chip">
          🎯 {{ goalsStore.currentGoal.target_weight }} 斤
        </span>
      </div>
    </div>

    <!-- Weight Card -->
    <WeightCard
      :weight="weightStore.latestWeight"
      :change="weightStore.lastChange"
      :streak="weightStore.streakDays"
      :mood="weightStore.latestMood"
      class="section"
    />

    <!-- Input Card -->
    <div class="input-card section">
      <h3 class="card-title">今日打卡</h3>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">体重 (斤)</label>
          <input
            v-model.number="weightInput"
            type="number"
            step="0.1"
            min="50"
            max="300"
            placeholder="输入今日体重"
            class="input"
          />
        </div>
        <div class="input-group">
          <label class="input-label">心情</label>
          <input
            v-model="moodInput"
            type="text"
            placeholder="今天心情怎么样？"
            class="input"
            maxlength="50"
          />
        </div>
      </div>
      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>
      <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '打卡中...' : '✨ 打卡记录' }}
      </button>
    </div>

    <!-- Confirm re-log dialog -->
    <Teleport to="body">
      <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
        <div class="confirm-card">
          <div class="confirm-emoji">🤔</div>
          <p class="confirm-title">今天已经打过卡了</p>
          <p class="confirm-desc">要用新数据覆盖吗？</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="showConfirm = false">取消</button>
            <button class="confirm-btn ok" @click="confirmRelog">更新记录</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Progress Bar -->
    <ProgressBar
      v-if="goalsStore.currentGoal && weightStore.latestWeight !== null"
      :start-weight="weightStore.latestWeight + weightStore.totalLoss!"
      :target-weight="goalsStore.currentGoal.target_weight"
      :current-weight="weightStore.latestWeight"
      class="section"
    />

    <!-- Weight Chart -->
    <div class="section">
      <h3 class="section-title">体重趋势</h3>
      <WeightChart :logs="weightStore.logs" />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
}

.section {
  margin-bottom: 16px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.greeting-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.header-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.streak-chip,
.target-chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--pink-bg);
  color: var(--pink);
  font-weight: 500;
  white-space: nowrap;
}

.target-chip {
  background: #fff8e1;
  color: #f9a825;
}

/* Input Card */
.input-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 14px;
}

.input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--pink-pale);
  border-radius: 14px;
  background: var(--pink-bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--pink);
}

.input::placeholder {
  color: var(--text-lighter);
}

/* Hide number input spinners */
.input[type='number']::-webkit-inner-spin-button,
.input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input[type='number'] {
  -moz-appearance: textfield;
}

.message {
  font-size: 13px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 10px;
}

.message.error {
  background: #e0eff5;
  color: #e57373;
}

.message.success {
  background: #f0fff4;
  color: #66bb6a;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Section title */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

/* Confirm dialog */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-card {
  background: #fff;
  border-radius: 24px;
  padding: 28px 24px;
  text-align: center;
  max-width: 280px;
  width: 90%;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.confirm-emoji { font-size: 48px; margin-bottom: 8px; }
.confirm-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.confirm-desc { font-size: 13px; color: var(--text-light); margin-bottom: 20px; }

.confirm-actions { display: flex; gap: 10px; }
.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.confirm-btn.cancel { background: #f5f5f5; color: var(--text-light); }
.confirm-btn.ok { background: linear-gradient(135deg, var(--pink), var(--pink-light)); color: #fff; }
</style>

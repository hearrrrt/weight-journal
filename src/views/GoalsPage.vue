<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGoalsStore } from '@/stores/goals'
import { useWeightStore } from '@/stores/weight'
import GoalCard from '@/components/GoalCard.vue'

const goalsStore = useGoalsStore()
const weightStore = useWeightStore()

const showForm = ref(false)
const titleInput = ref('')
const targetWeightInput = ref<number | null>(null)
const rewardInput = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const activeGoals = computed(() =>
  goalsStore.goals.filter(g => g.status === 'active')
)

const completedGoals = computed(() =>
  goalsStore.goals.filter(g => g.status === 'completed')
)

async function handleAdd() {
  errorMessage.value = ''
  if (!titleInput.value.trim()) {
    errorMessage.value = '请输入目标标题'
    return
  }
  if (targetWeightInput.value === null || targetWeightInput.value <= 0) {
    errorMessage.value = '请输入有效的目标体重'
    return
  }
  submitting.value = true
  try {
    await goalsStore.addGoal(
      titleInput.value.trim(),
      targetWeightInput.value,
      rewardInput.value.trim() || null
    )
    titleInput.value = ''
    targetWeightInput.value = null
    rewardInput.value = ''
    showForm.value = false
  } catch (e: unknown) {
    if (e instanceof Error) {
      errorMessage.value = e.message
    } else {
      errorMessage.value = '创建目标失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

async function handleComplete(id: string) {
  try {
    await goalsStore.completeGoal(id)
  } catch (e) {
    console.error('Failed to complete goal:', e)
  }
}

async function handleDelete(id: string) {
  try {
    await goalsStore.deleteGoal(id)
  } catch (e) {
    console.error('Failed to delete goal:', e)
  }
}

const hasNoGoals = computed(() => goalsStore.goals.length === 0)

onMounted(async () => {
  await goalsStore.fetchGoals()
  await weightStore.fetchLogs()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">🎯 减肥目标</h2>
      <button class="toggle-btn" @click="showForm = !showForm">
        {{ showForm ? '✕ 收起' : '+ 添加' }}
      </button>
    </div>

    <!-- Add Form -->
    <div v-if="showForm" class="add-form">
      <div class="form-group">
        <label class="form-label">目标标题</label>
        <input
          v-model="titleInput"
          type="text"
          placeholder="例如：减到 100 斤"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label class="form-label">目标体重 (斤)</label>
        <input
          v-model.number="targetWeightInput"
          type="number"
          step="0.1"
          placeholder="输入目标体重"
          class="form-input"
        />
      </div>
      <div class="form-group">
        <label class="form-label">奖励 (可选)</label>
        <input
          v-model="rewardInput"
          type="text"
          placeholder="达成后奖励自己什么？"
          class="form-input"
        />
      </div>
      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <button class="submit-btn" :disabled="submitting" @click="handleAdd">
        {{ submitting ? '创建中...' : '✨ 创建目标' }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="hasNoGoals && !showForm" class="empty-state">
      <div class="empty-icon">🎯</div>
      <p class="empty-text">还没有设置目标哦</p>
      <p class="empty-hint">点击右上角「+ 添加」来设定你的减肥目标吧</p>
    </div>

    <!-- Active Goals -->
    <div v-if="activeGoals.length > 0" class="section">
      <h3 class="section-title">🏃 进行中</h3>
      <GoalCard
        v-for="goal in activeGoals"
        :key="goal.id"
        :goal="goal"
        :current-weight="weightStore.latestWeight"
        @complete="handleComplete"
        @delete="handleDelete"
      />
    </div>

    <!-- Completed Goals -->
    <div v-if="completedGoals.length > 0" class="section">
      <h3 class="section-title">✅ 已完成</h3>
      <GoalCard
        v-for="goal in completedGoals"
        :key="goal.id"
        :goal="goal"
        :current-weight="weightStore.latestWeight"
        @complete="handleComplete"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.toggle-btn {
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  white-space: nowrap;
}

.toggle-btn:hover {
  opacity: 0.85;
}

.toggle-btn:active {
  transform: scale(0.97);
}

/* Add Form */
.add-form {
  background: var(--card-bg);
  border: 2px solid #fff0f0;
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.form-label {
  font-size: 13px;
  color: var(--text-light);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--pink-pale);
  border-radius: 14px;
  background: var(--pink-bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--pink);
}

.form-input::placeholder {
  color: var(--text-lighter);
}

.form-input[type='number']::-webkit-inner-spin-button,
.form-input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-input[type='number'] {
  -moz-appearance: textfield;
}

.message {
  font-size: 13px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 10px;
}

.message.error {
  background: #fff0f0;
  color: #e57373;
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

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-lighter);
}
</style>

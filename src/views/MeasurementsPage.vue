<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMeasurementStore } from '@/stores/measurements'
import MeasurementChart from '@/components/MeasurementChart.vue'
import MeasurementCard from '@/components/MeasurementCard.vue'

const store = useMeasurementStore()

// --- Form state ---
const dateInput = ref(new Date().toISOString().split('T')[0])
const waistInput = ref<number | null>(null)
const hipInput = ref<number | null>(null)
const thighInput = ref<number | null>(null)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// --- Edit state ---
const editingId = ref<string | null>(null)

// --- Confirm overwrite state ---
const showConfirm = ref(false)
const pendingDate = ref('')
const pendingWaist = ref<number | null>(null)
const pendingHip = ref<number | null>(null)
const pendingThigh = ref<number | null>(null)

// --- Sorted list for display ---
const sortedMeasurements = computed(() => {
  return [...store.measurements].sort(
    (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
  )
})

const hasNoData = computed(() => store.measurements.length === 0)

// --- Validation ---
function validate(): string | null {
  if (waistInput.value === null && hipInput.value === null && thighInput.value === null) {
    return '请至少填写一项数据'
  }
  const fields: [string, number | null][] = [
    ['腰围', waistInput.value],
    ['臀围', hipInput.value],
    ['大腿围', thighInput.value],
  ]
  for (const [name, val] of fields) {
    if (val !== null && (val < 30 || val > 200)) {
      return `${name}需在 30-200 cm 之间`
    }
  }
  return null
}

// --- Submit (add or update) ---
async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      await store.updateMeasurement(
        editingId.value,
        waistInput.value,
        hipInput.value,
        thighInput.value,
      )
      successMessage.value = '更新成功！'
      editingId.value = null
    } else {
      await store.addMeasurement(
        waistInput.value,
        hipInput.value,
        thighInput.value,
        dateInput.value,
      )
      successMessage.value = '记录成功！'
    }
    // Reset form
    waistInput.value = null
    hipInput.value = null
    thighInput.value = null
    dateInput.value = new Date().toISOString().split('T')[0]
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'DUPLICATE_DATE') {
      pendingDate.value = dateInput.value
      pendingWaist.value = waistInput.value!
      pendingHip.value = hipInput.value
      pendingThigh.value = thighInput.value
      showConfirm.value = true
    } else if (e instanceof Error) {
      errorMessage.value = e.message
    } else {
      errorMessage.value = '操作失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

// --- Confirm overwrite ---
async function confirmOverwrite() {
  showConfirm.value = false
  submitting.value = true
  try {
    const existing = await store.getByDate(pendingDate.value)
    if (existing) {
      await store.updateMeasurement(
        existing.id,
        pendingWaist.value,
        pendingHip.value,
        pendingThigh.value,
      )
      successMessage.value = '更新成功！'
      waistInput.value = null
      hipInput.value = null
      thighInput.value = null
    }
  } catch (e: unknown) {
    errorMessage.value = '更新失败，请重试'
  } finally {
    submitting.value = false
  }
}

// --- Edit ---
function handleEdit(id: string) {
  const m = store.measurements.find((item) => item.id === id)
  if (!m) return
  editingId.value = id
  dateInput.value = m.log_date
  waistInput.value = m.waist
  hipInput.value = m.hip
  thighInput.value = m.thigh
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingId.value = null
  dateInput.value = new Date().toISOString().split('T')[0]
  waistInput.value = null
  hipInput.value = null
  thighInput.value = null
}

// --- Delete ---
async function handleDelete(id: string) {
  if (!confirm('确定要删除这条记录吗？')) return
  try {
    await store.deleteMeasurement(id)
    successMessage.value = '已删除'
  } catch (e: unknown) {
    errorMessage.value = '删除失败，请重试'
  }
}

onMounted(async () => {
  await store.fetchMeasurements()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">📏 身体尺寸</h2>
      <div v-if="store.latestWaist !== null || store.latestHip !== null || store.latestThigh !== null" class="summary-row">
        <span v-if="store.latestWaist !== null" class="summary-chip">腰 {{ store.latestWaist }} cm</span>
        <span v-if="store.latestHip !== null" class="summary-chip">臀 {{ store.latestHip }} cm</span>
        <span v-if="store.latestThigh !== null" class="summary-chip">腿 {{ store.latestThigh }} cm</span>
      </div>
    </div>

    <!-- Input Form -->
    <div class="input-card section">
      <h3 class="card-title">{{ editingId ? '✏️ 编辑记录' : '📝 添加记录' }}</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">日期</label>
          <input
            v-model="dateInput"
            type="date"
            class="form-input"
            :max="new Date().toISOString().split('T')[0]"
          />
        </div>
      </div>
      <div class="form-row three-col">
        <div class="form-group">
          <label class="form-label">腰围 (cm)</label>
          <input
            v-model.number="waistInput"
            type="number"
            step="0.1"
            min="30"
            max="200"
            placeholder="可选"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label">臀围 (cm)</label>
          <input
            v-model.number="hipInput"
            type="number"
            step="0.1"
            min="30"
            max="200"
            placeholder="可选"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label class="form-label">大腿围 (cm)</label>
          <input
            v-model.number="thighInput"
            type="number"
            step="0.1"
            min="30"
            max="200"
            placeholder="可选"
            class="form-input"
          />
        </div>
      </div>
      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>
      <div class="btn-row">
        <button
          v-if="editingId"
          class="btn-cancel"
          @click="cancelEdit"
        >
          取消编辑
        </button>
        <button
          class="submit-btn"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : (editingId ? '💾 保存修改' : '✨ 添加记录') }}
        </button>
      </div>
    </div>

    <!-- Confirm overwrite dialog -->
    <Teleport to="body">
      <div v-if="showConfirm" class="confirm-overlay" @click.self="showConfirm = false">
        <div class="confirm-card">
          <div class="confirm-emoji">🤔</div>
          <p class="confirm-title">{{ pendingDate }} 已有记录</p>
          <p class="confirm-desc">要用新数据覆盖吗？</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="showConfirm = false">取消</button>
            <button class="confirm-btn ok" @click="confirmOverwrite">更新记录</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Chart -->
    <div class="section">
      <h3 class="section-title">尺寸趋势</h3>
      <MeasurementChart :measurements="store.measurements" />
    </div>

    <!-- Change summary -->
    <div v-if="store.waistChange !== null && store.waistChange > 0" class="change-card section">
      <span class="change-emoji">🎉</span>
      <span class="change-text">腰围已减少 {{ store.waistChange }} cm！继续加油！</span>
    </div>

    <!-- History List -->
    <div class="section">
      <h3 class="section-title">历史记录</h3>
      <div v-if="hasNoData" class="empty-state">
        <span class="empty-icon">📏</span>
        <p class="empty-text">还没有记录身体尺寸哦</p>
        <p class="empty-hint">定期记录腰围、臀围、大腿围，观察变化趋势吧</p>
      </div>
      <MeasurementCard
        v-for="m in sortedMeasurements"
        :key="m.id"
        :measurement="m"
        @edit="handleEdit"
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

.section {
  margin-bottom: 20px;
}

/* --- Page Header --- */
.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.summary-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-chip {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  background: var(--pink-bg);
  color: var(--pink);
  font-weight: 500;
}

/* --- Input Card --- */
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

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.form-row.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--pink-pale);
  border-radius: 14px;
  background: var(--pink-bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  font-size: 15px;
}

.form-input:focus {
  border-color: var(--pink);
}

.form-input::placeholder {
  color: var(--text-lighter);
  font-size: 13px;
}

.form-input[type='number']::-webkit-inner-spin-button,
.form-input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-input[type='number'] {
  -moz-appearance: textfield;
}

/* --- Messages --- */
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

.message.success {
  background: #f0fff4;
  color: #66bb6a;
}

/* --- Buttons --- */
.btn-row {
  display: flex;
  gap: 10px;
}

.submit-btn {
  flex: 1;
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

.btn-cancel {
  padding: 14px 18px;
  border: 1.5px solid var(--pink-pale);
  border-radius: 16px;
  background: transparent;
  color: var(--text-light);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: var(--pink-bg);
}

/* --- Section title --- */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

/* --- Change summary --- */
.change-card {
  background: linear-gradient(135deg, #f0fff4, #e8f5e9);
  border: 1.5px solid #a5d6a7;
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.change-emoji {
  font-size: 24px;
}

.change-text {
  font-size: 14px;
  color: #43a047;
  font-weight: 500;
}

/* --- Confirm dialog --- */
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
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-emoji {
  font-size: 48px;
  margin-bottom: 8px;
}

.confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.confirm-desc {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn.cancel {
  background: #f5f5f5;
  color: var(--text-light);
}

.confirm-btn.ok {
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
}

/* --- Empty state --- */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-text {
  font-size: 15px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-lighter);
}
</style>

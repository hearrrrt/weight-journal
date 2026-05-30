<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import CheerBubble from '@/components/CheerBubble.vue'
import type { WeightLog, Cheer } from '@/types'

const userStore = useUserStore()

const logs = ref<WeightLog[]>([])
const cheers = ref<Cheer[]>([])
const loading = ref(false)
const activeInputLogId = ref<string | null>(null)
const messageInput = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const partnerNickname = computed(() =>
  userStore.partnerProfile?.nickname ?? '伴侣'
)

const hasPartner = computed(() => userStore.hasPartner)

const cheersByLogId = computed(() => {
  const map: Record<string, Cheer[]> = {}
  for (const c of cheers.value) {
    if (!map[c.weight_log_id]) {
      map[c.weight_log_id] = []
    }
    map[c.weight_log_id].push(c)
  }
  return map
})

const userId = computed(() => userStore.user?.id)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const moodLabels: Record<string, string> = {
  happy: '😊 开心',
  sad: '😢 难过',
  energetic: '💪 有活力',
  tired: '😴 疲惫',
  neutral: '😐 一般',
  stressed: '😰 有压力',
}

function moodText(mood: string | null): string {
  if (!mood) return ''
  return moodLabels[mood] ?? mood
}

async function fetchData() {
  if (!userStore.profile?.partner_id) return

  loading.value = true
  try {
    // Fetch partner's recent logs
    const { data: logData, error: logError } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userStore.profile.partner_id)
      .order('log_date', { ascending: false })
      .limit(30)

    if (logError) {
      console.error('Failed to fetch partner logs:', logError.message)
      return
    }

    logs.value = (logData as WeightLog[]) ?? []

    if (logs.value.length > 0) {
      const logIds = logs.value.map((l) => l.id)
      const { data: cheerData, error: cheerError } = await supabase
        .from('cheers')
        .select('*')
        .in('weight_log_id', logIds)
        .order('created_at', { ascending: true })

      if (cheerError) {
        console.error('Failed to fetch cheers:', cheerError.message)
        return
      }

      cheers.value = (cheerData as Cheer[]) ?? []
    }
  } finally {
    loading.value = false
  }
}

function isMyCheer(cheer: Cheer): boolean {
  return cheer.from_user === userId.value
}

function cheerFromName(cheer: Cheer): string {
  if (cheer.from_user === userId.value) {
    return userStore.profile?.nickname ?? '我'
  }
  return partnerNickname.value
}

function toggleInput(logId: string) {
  if (activeInputLogId.value === logId) {
    activeInputLogId.value = null
    messageInput.value = ''
  } else {
    activeInputLogId.value = logId
    messageInput.value = ''
  }
}

async function sendCheer(logId: string) {
  const msg = messageInput.value.trim()
  if (!msg) return

  if (!userId.value || !userStore.profile?.partner_id) return

  errorMessage.value = ''
  successMessage.value = ''
  submitting.value = true

  try {
    const { error } = await supabase.from('cheers').insert({
      from_user: userId.value,
      to_user: userStore.profile.partner_id,
      weight_log_id: logId,
      message: msg,
    })

    if (error) {
      console.error('Failed to send cheer:', error.message)
      errorMessage.value = '发送失败，请重试'
      return
    }

    successMessage.value = '发送成功！'
    messageInput.value = ''
    activeInputLogId.value = null

    // Refresh cheers
    const logIds = logs.value.map((l) => l.id)
    const { data: cheerData } = await supabase
      .from('cheers')
      .select('*')
      .in('weight_log_id', logIds)
      .order('created_at', { ascending: true })

    cheers.value = (cheerData as Cheer[]) ?? []
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h2 class="page-title">💕 互动记录</h2>
      <p v-if="hasPartner" class="partner-subtitle">
        与 {{ partnerNickname }} 的互动
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty-state">
      <p class="empty-text">加载中...</p>
    </div>

    <!-- No partner bound -->
    <div v-else-if="!hasPartner" class="empty-state">
      <span class="empty-icon">🔗</span>
      <p class="empty-title">还没有绑定伴侣哦</p>
      <p class="empty-hint">去「设置」页面绑定伴侣，开启互动之旅吧～</p>
    </div>

    <!-- Partner bound but no logs -->
    <div v-else-if="logs.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <p class="empty-title">她还没有开始打卡呢</p>
      <p class="empty-hint">等 {{ partnerNickname }} 开始记录体重后，就可以在这里互动啦</p>
    </div>

    <!-- Log cards with cheers -->
    <div v-else class="log-list">
      <div v-for="log in logs" :key="log.id" class="log-card">
        <!-- Log info -->
        <div class="log-header">
          <span class="log-date">{{ formatDate(log.log_date) }}</span>
          <span v-if="log.mood" class="log-mood">{{ moodText(log.mood) }}</span>
        </div>
        <div class="log-weight">
          <span class="weight-num">{{ log.weight }}</span>
          <span class="weight-unit">斤</span>
        </div>

        <!-- Cheers for this log -->
        <div v-if="cheersByLogId[log.id]?.length" class="cheers-section">
          <CheerBubble
            v-for="cheer in cheersByLogId[log.id]"
            :key="cheer.id"
            :cheer="cheer"
            :is-mine="isMyCheer(cheer)"
            :from-name="cheerFromName(cheer)"
          />
        </div>

        <!-- Cheer input toggle -->
        <div class="cheer-actions">
          <button
            class="toggle-btn"
            @click="toggleInput(log.id)"
          >
            💬 留言
          </button>
        </div>

        <!-- Inline input -->
        <div v-if="activeInputLogId === log.id" class="input-area">
          <input
            v-model="messageInput"
            type="text"
            placeholder="写一句鼓励的话吧..."
            class="cheer-input"
            maxlength="200"
            @keyup.enter="sendCheer(log.id)"
          />
          <button
            class="send-btn"
            :disabled="submitting || !messageInput.trim()"
            @click="sendCheer(log.id)"
          >
            💌
          </button>
        </div>
      </div>
    </div>

    <!-- Messages -->
    <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="message success">{{ successMessage }}</p>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.partner-subtitle {
  font-size: 14px;
  color: var(--pink);
  font-weight: 500;
  margin-top: 4px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.6;
}

.empty-text {
  font-size: 14px;
  color: var(--text-light);
}

/* Log cards */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  border: 1.5px solid var(--pink-pale);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-date {
  font-size: 13px;
  color: var(--text-light);
  font-weight: 500;
}

.log-mood {
  font-size: 13px;
  color: var(--text-light);
}

.log-weight {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 12px;
}

.weight-num {
  font-size: 36px;
  font-weight: 800;
  color: var(--pink);
  line-height: 1;
}

.weight-unit {
  font-size: 14px;
  color: var(--pink-light);
  font-weight: 500;
}

/* Cheers section */
.cheers-section {
  margin-bottom: 8px;
  padding-top: 4px;
  border-top: 1px dashed var(--pink-pale);
}

/* Toggle button */
.cheer-actions {
  display: flex;
  justify-content: flex-end;
}

.toggle-btn {
  font-size: 13px;
  padding: 6px 14px;
  border: 1px solid var(--pink-pale);
  border-radius: 20px;
  background: var(--pink-bg);
  color: var(--pink);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: var(--pink-pale);
}

/* Input area */
.input-area {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}

.cheer-input {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid var(--pink-pale);
  border-radius: 24px;
  background: var(--pink-bg);
  color: var(--text);
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
}

.cheer-input:focus {
  border-color: var(--pink);
}

.cheer-input::placeholder {
  color: var(--text-lighter);
}

.send-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, transform 0.1s;
}

.send-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages */
.message {
  font-size: 13px;
  margin-top: 12px;
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
</style>

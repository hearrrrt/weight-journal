<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

// Section 1: Profile
const nicknameInput = ref('')
const currentNickname = computed(() => userStore.profile?.nickname || '')
const savingNickname = ref(false)
const nicknameMessage = ref('')

// Section 2: Partner binding
const myInviteCode = userStore.user?.id.substring(0, 8) || ''
const inviteCodeInput = ref('')
const binding = ref(false)
const bindError = ref('')

async function handleSaveNickname() {
  nicknameMessage.value = ''
  if (!nicknameInput.value.trim()) {
    nicknameMessage.value = '昵称不能为空'
    return
  }
  savingNickname.value = true
  try {
    await userStore.updateNickname(nicknameInput.value.trim())
    await userStore.fetchProfile()
    nicknameInput.value = ''
    nicknameMessage.value = '昵称已保存！'
  } catch (e: unknown) {
    if (e instanceof Error) {
      nicknameMessage.value = e.message
    } else {
      nicknameMessage.value = '保存失败，请重试'
    }
  } finally {
    savingNickname.value = false
  }
}

async function handleBindPartner() {
  bindError.value = ''
  if (!inviteCodeInput.value.trim()) {
    bindError.value = '请输入邀请码'
    return
  }
  binding.value = true
  try {
    await userStore.bindPartner(inviteCodeInput.value.trim())
    inviteCodeInput.value = ''
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    bindError.value = msg || '绑定失败，请重试'
  } finally {
    binding.value = false
  }
}

async function handleSignOut() {
  await userStore.signOut()
  router.push('/auth')
}
</script>

<template>
  <div class="page">
    <!-- Page Title -->
    <div class="page-header">
      <h2 class="page-title">设置</h2>
    </div>

    <!-- Section 1: Profile -->
    <div class="card section">
      <h3 class="card-title">👤 个人资料</h3>
      <div v-if="currentNickname" class="current-name">
        当前昵称：<span class="current-name-value">{{ currentNickname }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">修改昵称</label>
        <input
          v-model="nicknameInput"
          type="text"
          placeholder="输入新昵称"
          class="form-input"
          maxlength="20"
        />
      </div>
      <p v-if="nicknameMessage" class="message success">{{ nicknameMessage }}</p>
      <button class="submit-btn" :disabled="savingNickname" @click="handleSaveNickname">
        {{ savingNickname ? '保存中...' : '💾 保存' }}
      </button>
    </div>

    <!-- Section 2: Partner Binding -->
    <div class="card section">
      <h3 class="card-title">💕 伴侣绑定</h3>

      <!-- Already bound -->
      <div v-if="userStore.hasPartner && userStore.partnerProfile" class="partner-bound">
        <div class="partner-icon">💝</div>
        <p class="partner-name">{{ userStore.partnerProfile.nickname || '伴侣' }}</p>
        <p class="partner-hint">你们已经绑定啦～</p>
      </div>

      <!-- Not bound -->
      <div v-else>
        <p class="invite-hint">输入对方的邀请码来绑定伴侣</p>

        <div class="invite-display">
          <span class="invite-label">你的邀请码</span>
          <span class="invite-code">{{ myInviteCode }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">对方的邀请码</label>
          <input
            v-model="inviteCodeInput"
            type="text"
            placeholder="输入对方的邀请码"
            class="form-input"
            maxlength="8"
          />
        </div>
        <p v-if="bindError" class="message error">{{ bindError }}</p>
        <button class="submit-btn" :disabled="binding" @click="handleBindPartner">
          {{ binding ? '绑定中...' : '🔗 绑定' }}
        </button>
      </div>
    </div>

    <!-- Section 3: Logout -->
    <div class="card section">
      <button class="logout-btn" @click="handleSignOut">
        🚪 退出登录
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.section {
  margin-bottom: 16px;
}

/* Card */
.card {
  background: var(--card-bg);
  border: 2px solid var(--pink-pale);
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

.current-name {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 14px;
  padding: 8px 14px;
  background: var(--pink-bg);
  border-radius: 12px;
}

.current-name-value {
  color: var(--pink);
  font-weight: 600;
}

/* Form */
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

/* Messages */
.message {
  font-size: 13px;
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 10px;
}

.message.success {
  background: #f0fff4;
  color: #66bb6a;
}

.message.error {
  background: #fff0f0;
  color: #e57373;
}

/* Submit button (gradient pink) */
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

/* Partner bound */
.partner-bound {
  text-align: center;
  padding: 20px 0;
}

.partner-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.partner-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.partner-hint {
  font-size: 14px;
  color: var(--pink);
  font-weight: 500;
}

/* Invite display */
.invite-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 14px;
  background: var(--pink-bg);
  border-radius: 14px;
  border: 1.5px solid var(--pink-pale);
}

.invite-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

.invite-code {
  font-size: 18px;
  font-weight: 700;
  color: var(--pink);
  letter-spacing: 2px;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
}

.invite-hint {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 14px;
}

/* Logout button (border style, not filled) */
.logout-btn {
  width: 100%;
  padding: 14px;
  border: 2px solid var(--pink-pale);
  border-radius: 16px;
  background: transparent;
  color: var(--text-light);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: #e57373;
  color: #e57373;
  background: #fff5f5;
}

.logout-btn:active {
  transform: scale(0.98);
}
</style>

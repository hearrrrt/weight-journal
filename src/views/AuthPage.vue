<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const nickname = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const title = computed(() => (isRegister.value ? '一起开始减肥吧' : '欢迎回来'))
const subtitle = computed(() =>
  isRegister.value ? '注册账号，记录每一天的变化' : '登录继续你的减肥旅程',
)
const buttonText = computed(() => (isRegister.value ? '🌸 注册' : '✨ 登录'))
const toggleText = computed(() =>
  isRegister.value ? '已有账号？去登录' : '没有账号？去注册',
)

function toggleMode() {
  isRegister.value = !isRegister.value
  error.value = ''
}

async function submit() {
  error.value = ''
  success.value = ''
  if (!email.value || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  if (isRegister.value && !nickname.value.trim()) {
    error.value = '请填写昵称'
    return
  }
  loading.value = true
  try {
    if (isRegister.value) {
      await userStore.signUp(email.value, password.value, nickname.value.trim())
      success.value = '注册成功！请检查邮箱中的确认邮件，点击链接后即可登录。'
    } else {
      await userStore.signIn(email.value, password.value)
      router.push('/')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '操作失败，请稍后重试'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-emoji">(｡･ω･｡)ﾉ♡</div>
      <h1 class="auth-title">{{ title }}</h1>
      <p class="auth-subtitle">{{ subtitle }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <div v-if="isRegister" class="input-group">
          <input
            v-model="nickname"
            type="text"
            class="auth-input"
            placeholder="昵称"
            autocomplete="nickname"
          />
        </div>

        <div class="input-group">
          <input
            v-model="email"
            type="email"
            class="auth-input"
            placeholder="邮箱"
            autocomplete="email"
          />
        </div>

        <div class="input-group">
          <input
            v-model="password"
            type="password"
            class="auth-input"
            placeholder="密码"
            autocomplete="current-password"
          />
        </div>

        <p v-if="success" class="auth-success">{{ success }}</p>
        <p v-if="error" class="auth-error">{{ error }}</p>

        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? '请稍候...' : buttonText }}
        </button>
      </form>

      <button class="auth-toggle" @click="toggleMode">
        {{ toggleText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px 16px;
  background: linear-gradient(180deg, var(--pink-bg) 0%, #fff 100%);
}

.auth-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
}

.auth-emoji {
  font-size: 36px;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 12px;
  color: var(--pink);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-group {
  width: 100%;
}

.auth-input {
  width: 100%;
  padding: 14px 20px;
  border: 2px solid var(--pink-pale);
  border-radius: 50px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.auth-input::placeholder {
  color: var(--text-lighter);
}

.auth-input:focus {
  border-color: var(--pink);
  box-shadow: 0 0 0 4px rgba(91, 173, 206, 0.15);
}

.auth-error {
  font-size: 13px;
  color: #e86060;
  text-align: center;
  margin: 4px 0;
}

.auth-success {
  font-size: 13px;
  color: #4caf50;
  text-align: center;
  margin: 4px 0;
  line-height: 1.6;
}

.auth-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  margin-top: 4px;
}

.auth-btn:hover {
  opacity: 0.92;
}

.auth-btn:active {
  transform: scale(0.98);
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-toggle {
  margin-top: 20px;
  background: none;
  border: none;
  color: var(--pink);
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
  transition: opacity 0.2s;
}

.auth-toggle:hover {
  opacity: 0.7;
}
</style>

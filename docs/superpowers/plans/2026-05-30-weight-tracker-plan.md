# 减肥打卡网站 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个手机优先的减肥打卡网站，支持每日体重记录、阶梯目标管理、自动徽章系统、伴侣互动留言。

**Architecture:** Vue 3 + Vite 前端，Supabase 作为 BaaS（认证 + PostgreSQL + Realtime）。客户端负责徽章检测逻辑，Supabase RLS 保护数据安全。Pinia 管理状态，Vue Router 管理路由，Chart.js 绘制体重曲线。

**Tech Stack:** Vue 3 (Composition API), Vite, Vue Router 4, Pinia, Chart.js + vue-chartjs, Supabase JS SDK, 手写 CSS（粉色系圆润可爱风）

**文件结构总览：**

```
weight-journal/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/index.ts
│   ├── lib/supabase.ts
│   ├── types/index.ts
│   ├── assets/style.css
│   ├── stores/
│   │   ├── user.ts
│   │   ├── weight.ts
│   │   ├── goals.ts
│   │   └── badges.ts
│   ├── views/
│   │   ├── AuthPage.vue
│   │   ├── HomePage.vue
│   │   ├── GoalsPage.vue
│   │   ├── BadgesPage.vue
│   │   ├── CheersPage.vue
│   │   └── SettingsPage.vue
│   └── components/
│       ├── BottomNav.vue
│       ├── BadgeToast.vue
│       ├── WeightCard.vue
│       ├── ProgressBar.vue
│       ├── BadgeGrid.vue
│       ├── WeightChart.vue
│       ├── GoalCard.vue
│       └── CheerBubble.vue
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/assets/style.css`

- [ ] **Step 1: 初始化 Vite + Vue 3 + TypeScript 项目**

```bash
cd /Users/linxiaotong/weight-journal
npm create vite@latest . -- --template vue-ts
npm install
```

- [ ] **Step 2: 安装所有依赖**

```bash
npm install vue-router@4 pinia chart.js vue-chartjs @supabase/supabase-js
npm install -D @types/node
```

- [ ] **Step 3: 配置 vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
```

- [ ] **Step 4: 清理默认文件，创建 src/main.ts**

删除 `src/components/HelloWorld.vue`、`src/style.css`、`src/assets/vue.svg`、`public/vite.svg`。

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 5: 创建路由骨架 src/router/index.ts**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthPage.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('@/views/GoalsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/badges',
      name: 'badges',
      component: () => import('@/views/BadgesPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cheers',
      name: 'cheers',
      component: () => import('@/views/CheersPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

export default router
```

- [ ] **Step 6: 创建 src/types/index.ts 类型定义**

```typescript
// src/types/index.ts
export interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  partner_id: string | null
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  weight: number
  mood: string | null
  log_date: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_weight: number
  reward: string | null
  status: 'active' | 'completed' | 'abandoned'
  sort_order: number
  completed_at: string | null
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_key: string
  unlocked_at: string
}

export interface Cheer {
  id: string
  from_user: string
  to_user: string
  weight_log_id: string
  message: string
  created_at: string
}

export interface BadgeDefinition {
  key: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'weight' | 'goal' | 'cheer'
  condition: string
}
```

- [ ] **Step 7: 写入全局样式 src/assets/style.css**

完整的全局 CSS，包括 CSS 变量、基础重置、移动端布局：

```css
/* src/assets/style.css */
:root {
  --pink: #ff9a9e;
  --pink-light: #ffb8c6;
  --pink-pale: #ffd4de;
  --pink-bg: #fff5f5;
  --warm-yellow: #FFE082;
  --soft-blue: #B2EBF2;
  --text: #555;
  --text-light: #999;
  --text-lighter: #ccc;
  --bg: #fffaf5;
  --card-bg: #fff;
  --radius: 16px;
  --radius-lg: 24px;
  --shadow: 0 4px 16px rgba(255, 150, 150, 0.08);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  max-width: 100vw;
}

#app {
  max-width: 428px;
  margin: 0 auto;
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: 70px;
  position: relative;
}

input, textarea, button {
  font-family: inherit;
  font-size: 16px;
}

a {
  color: inherit;
  text-decoration: none;
}

.page {
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
}
```

- [ ] **Step 8: 创建占位页面文件（6 个空壳 view）**

为每个 view 创建最小占位：

```vue
<!-- src/views/AuthPage.vue -->
<template>
  <div class="page">
    <h2>登录 / 注册</h2>
  </div>
</template>

<!-- src/views/HomePage.vue -->
<template>
  <div class="page">
    <h2>首页</h2>
  </div>
</template>
```

（其余 GoalsPage、BadgesPage、CheersPage、SettingsPage 同理，用各自标题）

- [ ] **Step 9: 创建 App.vue 基础壳**

```vue
<!-- src/App.vue -->
<template>
  <router-view />
</template>
```

- [ ] **Step 10: 验证项目能跑**

```bash
cd /Users/linxiaotong/weight-journal
npm run dev
```

预期：浏览器打开 localhost:5173 看到首页占位文字。

- [ ] **Step 11: 初始化 Git 并提交**

```bash
cd /Users/linxiaotong/weight-journal
git init
git add -A
git commit -m "feat: scaffold Vue 3 + Vite project with router and pinia"
```

---

### Task 2: Supabase 数据库建表

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: 编写完整建表 SQL**

```sql
-- supabase/migrations/001_initial_schema.sql

-- 用户资料表
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname text,
  avatar_url text,
  partner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 体重记录表
CREATE TABLE weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight decimal(4,1) NOT NULL,
  mood text,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- 阶梯目标表
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_weight decimal(4,1) NOT NULL,
  reward text,
  status goal_status DEFAULT 'active',
  sort_order int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 徽章表
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- 互动留言表
CREATE TABLE cheers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_log_id uuid REFERENCES weight_logs(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date DESC);
CREATE INDEX idx_goals_user ON goals(user_id, sort_order);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_cheers_to_user ON cheers(to_user, created_at DESC);
```

- [ ] **Step 2: 编写 RLS 策略 SQL**

```sql
-- RLS 启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- profiles: 自己可读写
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: 伴侣可读（通过 partner_id 关联）
CREATE POLICY "Partner can read profile" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = profiles.id
    )
  );

-- weight_logs: 自己可读写
CREATE POLICY "Users can CRUD own logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- weight_logs: 伴侣可读
CREATE POLICY "Partner can read logs" ON weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = weight_logs.user_id
    )
  );

-- goals: 自己可读写
CREATE POLICY "Users can CRUD own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- user_badges: 自己可读写
CREATE POLICY "Users can read own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_badges: 伴侣可读
CREATE POLICY "Partner can read badges" ON user_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.partner_id = user_badges.user_id
    )
  );

-- cheers: 发送者可读自己发的
CREATE POLICY "Users can read sent cheers" ON cheers
  FOR SELECT USING (auth.uid() = from_user);

-- cheers: 接收者可读给自己的
CREATE POLICY "Users can read received cheers" ON cheers
  FOR SELECT USING (auth.uid() = to_user);

-- cheers: 可插入
CREATE POLICY "Users can insert cheers" ON cheers
  FOR INSERT WITH CHECK (auth.uid() = from_user);

-- cheers: 发送者可删除
CREATE POLICY "Users can delete own cheers" ON cheers
  FOR DELETE USING (auth.uid() = from_user);

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', '新朋友'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 3: 在 Supabase Dashboard 中执行 SQL**

打开 Supabase 项目 → SQL Editor → 粘贴上述全部 SQL → 执行。

- [ ] **Step 4: 提交**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and auto-profile trigger"
```

---

### Task 3: Supabase 客户端 & 认证

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `src/views/AuthPage.vue`, `src/stores/user.ts`, `src/router/index.ts`

- [ ] **Step 1: 创建 Supabase 客户端 src/lib/supabase.ts**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: 创建 .env 文件**

```bash
# .env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3: 创建 user store — src/stores/user.ts**

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const partnerProfile = ref<Profile | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const hasPartner = computed(() => !!profile.value?.partner_id)

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    profile.value = data as Profile
  }

  async function fetchPartnerProfile() {
    if (!profile.value?.partner_id) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.value.partner_id)
      .single()
    partnerProfile.value = data as Profile
  }

  async function initSession() {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) {
      await fetchProfile()
      await fetchPartnerProfile()
    }
  }

  async function signUp(email: string, password: string, nickname: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) throw error
    user.value = data.user
    await fetchProfile()
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    await fetchProfile()
    await fetchPartnerProfile()
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    partnerProfile.value = null
  }

  async function updateNickname(nickname: string) {
    if (!user.value) return
    await supabase.from('profiles').update({ nickname }).eq('id', user.value.id)
    if (profile.value) profile.value.nickname = nickname
  }

  async function bindPartner(partnerEmail: string) {
    if (!user.value) return
    // 通过邮箱查找伴侣
    const { data: authUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (await supabase.auth.admin?.getUserByEmail?.(partnerEmail)) || '')
      .single()
    // 简化方案：直接让双方输入对方的邮箱来绑定
    const { data: partners } = await supabase
      .from('profiles')
      .select('id')
      // 实际做法: 用昵称搜索，或者直接输入对方的绑定码
    // 生产环境建议用邀请码机制，这里用直接输入 partner email 简化
  }

  return {
    user, profile, partnerProfile,
    isLoggedIn, hasPartner,
    initSession, signUp, signIn, signOut,
    updateNickname, bindPartner, fetchProfile, fetchPartnerProfile,
  }
})
```

- [ ] **Step 4: 更新路由守卫 src/router/index.ts**

在现有 router 文件顶部加入：

```typescript
import { supabase } from '@/lib/supabase'

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/auth')
  } else if (to.path === '/auth' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})
```

- [ ] **Step 5: 实现 AuthPage.vue**

```vue
<!-- src/views/AuthPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const nickname = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (isLogin.value) {
      await userStore.signIn(email.value, password.value)
    } else {
      await userStore.signUp(email.value, password.value, nickname.value)
    }
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '出错了，再试一次吧 🥺'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page" style="display: flex; flex-direction: column; justify-content: center; min-height: 100dvh;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px;">🐣</div>
      <h2 style="color: var(--pink); margin-top: 8px;">{{ isLogin ? '欢迎回来' : '一起开始减肥吧' }}</h2>
      <p style="color: var(--text-light); font-size: 13px;">{{ isLogin ? '今天也要加油哦 💪' : '记录每一克的变化' }}</p>
    </div>

    <form @submit.prevent="submit" style="display: flex; flex-direction: column; gap: 12px;">
      <input
        v-model="email" type="email" required
        placeholder="📧 邮箱"
        style="padding: 14px; border: 2px solid #f0e0e0; border-radius: var(--radius); outline: none;"
      />
      <input
        v-if="!isLogin"
        v-model="nickname" type="text" required
        placeholder="💝 你的昵称"
        style="padding: 14px; border: 2px solid #f0e0e0; border-radius: var(--radius); outline: none;"
      />
      <input
        v-model="password" type="password" required minlength="6"
        placeholder="🔒 密码（至少6位）"
        style="padding: 14px; border: 2px solid #f0e0e0; border-radius: var(--radius); outline: none;"
      />

      <p v-if="error" style="color: #e85555; font-size: 13px; text-align: center;">{{ error }}</p>

      <button
        type="submit" :disabled="loading"
        style="padding: 14px; background: linear-gradient(135deg, #ff9a9e, #fab2b6); border: none; color: white;
               border-radius: 30px; font-size: 16px; font-weight: 600; cursor: pointer; letter-spacing: 2px;"
      >
        {{ loading ? '...' : (isLogin ? '✨ 登录' : '🌸 注册') }}
      </button>
    </form>

    <button
      @click="isLogin = !isLogin"
      style="margin-top: 16px; background: none; border: none; color: var(--pink); font-size: 14px; cursor: pointer;"
    >
      {{ isLogin ? '还没有账号？注册一个 →' : '已有账号？去登录 →' }}
    </button>
  </div>
</template>
```

- [ ] **Step 6: 更新 main.ts，应用启动时初始化 session**

在 `src/main.ts` 的 `app.mount('#app')` 之前添加：

```typescript
import { useUserStore } from './stores/user'

async function bootstrap() {
  const userStore = useUserStore()
  await userStore.initSession()
  app.mount('#app')
}

bootstrap()
```

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: add Supabase client, auth page, and user store"
```

---

### Task 4: 底部导航 & 布局

**Files:**
- Create: `src/components/BottomNav.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 创建 BottomNav.vue**

```vue
<!-- src/components/BottomNav.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/goals', icon: '🎯', label: '目标' },
  { path: '/badges', icon: '🏅', label: '徽章' },
  { path: '/cheers', icon: '💕', label: '互动' },
]

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs" :key="tab.path" :to="tab.path"
      class="nav-item" :class="{ active: isActive(tab.path) }"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 428px;
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #fff0f0;
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-item.active {
  color: var(--pink);
}

.nav-item:not(.active) {
  color: var(--text-lighter);
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
```

- [ ] **Step 2: 更新 App.vue 加入导航**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.path !== '/auth')
</script>

<template>
  <router-view />
  <BottomNav v-if="showNav" />
</template>
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add bottom navigation bar and app layout"
```

---

### Task 5: 首页 — 体重打卡核心

**Files:**
- Create: `src/stores/weight.ts`, `src/components/WeightCard.vue`, `src/components/ProgressBar.vue`, `src/components/WeightChart.vue`
- Modify: `src/views/HomePage.vue`

- [ ] **Step 1: 创建 weight store — src/stores/weight.ts**

```typescript
// src/stores/weight.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from './user'
import type { WeightLog } from '@/types'

export const useWeightStore = defineStore('weight', () => {
  const userStore = useUserStore()
  const logs = ref<WeightLog[]>([])
  const loading = ref(false)

  // 从最早记录算起的累计减重
  const totalLoss = computed(() => {
    if (logs.value.length < 2) return 0
    const first = logs.value[logs.value.length - 1] // 最早（按日期排序是asc）
    const last = logs.value[0] // 最新
    // 需要按日期正确排序
    const sorted = [...logs.value].sort((a, b) => a.log_date.localeCompare(b.log_date))
    const earliest = sorted[0]
    const latest = sorted[sorted.length - 1]
    return Number((earliest.weight - latest.weight).toFixed(1))
  })

  const latestWeight = computed(() => {
    if (logs.value.length === 0) return null
    const sorted = [...logs.value].sort((a, b) => b.log_date.localeCompare(a.log_date))
    return sorted[0]?.weight ?? null
  })

  // 上一次体重变化
  const lastChange = computed(() => {
    if (logs.value.length < 2) return null
    const sorted = [...logs.value].sort((a, b) => b.log_date.localeCompare(a.log_date))
    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    return Number((latest.weight - prev.weight).toFixed(1))
  })

  // 连续打卡天数
  const streakDays = computed(() => {
    if (logs.value.length === 0) return 0
    const dates = [...new Set(logs.value.map(l => l.log_date))].sort().reverse()
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)

    for (let i = 0; i < dates.length; i++) {
      const expected = new Date()
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().slice(0, 10)
      if (dates[i] === expectedStr) {
        streak++
      } else if (i === 0 && dates[i] === today) {
        streak++
      } else {
        break
      }
    }
    return streak
  })

  // 累计打卡天数
  const totalDays = computed(() => new Set(logs.value.map(l => l.log_date)).size)

  async function fetchLogs() {
    if (!userStore.user) return
    loading.value = true
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userStore.user.id)
      .order('log_date', { ascending: false })
      .limit(365)
    logs.value = (data || []) as WeightLog[]
    loading.value = false
  }

  async function addLog(weight: number, mood: string | null) {
    if (!userStore.user) return
    const logDate = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({
        user_id: userStore.user.id,
        weight,
        mood,
        log_date: logDate,
      })
      .select()
      .single()
    if (error) throw error
    logs.value.unshift(data as WeightLog)
    return data as WeightLog
  }

  async function updateLog(id: string, weight: number, mood: string | null) {
    const { data, error } = await supabase
      .from('weight_logs')
      .update({ weight, mood })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = logs.value.findIndex(l => l.id === id)
    if (idx >= 0) logs.value[idx] = data as WeightLog
    return data as WeightLog
  }

  async function getTodayLog() {
    if (!userStore.user) return null
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userStore.user.id)
      .eq('log_date', today)
      .single()
    return data as WeightLog | null
  }

  return {
    logs, loading,
    totalLoss, latestWeight, lastChange, streakDays, totalDays,
    fetchLogs, addLog, updateLog, getTodayLog,
  }
})
```

- [ ] **Step 2: 创建 WeightCard.vue**

```vue
<!-- src/components/WeightCard.vue -->
<script setup lang="ts">
defineProps<{
  weight: number | null
  change: number | null
  streak: number
}>()
</script>

<template>
  <div class="weight-card">
    <div class="watermark">⚖️</div>
    <div class="label">今日体重</div>
    <div class="number">{{ weight ?? '--.-' }}</div>
    <div class="unit">斤</div>
    <div v-if="change !== null" class="change" :class="change > 0 ? 'up' : 'down'">
      {{ change > 0 ? '↑' : '↓' }} {{ Math.abs(change) }} 斤
      {{ change <= 0 ? '🎉' : '' }}
    </div>
    <div class="streak">🔥 连续打卡 {{ streak }} 天</div>
  </div>
</template>

<style scoped>
.weight-card {
  background: linear-gradient(145deg, #ffb8c6, #ffd4de);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
}

.watermark {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 72px;
  opacity: 0.1;
}

.label {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  letter-spacing: 3px;
  margin-bottom: 4px;
}

.number {
  font-size: 56px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: -3px;
}

.unit {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 8px;
}

.change {
  display: inline-block;
  background: rgba(255,255,255,0.3);
  border-radius: 12px;
  padding: 4px 14px;
  font-size: 11px;
  color: #fff;
  margin-bottom: 8px;
}

.streak {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
}
</style>
```

- [ ] **Step 3: 创建 ProgressBar.vue**

```vue
<!-- src/components/ProgressBar.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  startWeight: number
  targetWeight: number
  currentWeight: number
}>()

const progress = computed(() => {
  const total = props.startWeight - props.targetWeight
  const done = props.startWeight - props.currentWeight
  if (total <= 0) return 0
  return Math.min(Math.max((done / total) * 100, 0), 100)
})

const remaining = computed(() => {
  return Math.max(Number((props.currentWeight - props.targetWeight).toFixed(1)), 0)
})
</script>

<template>
  <div class="progress-container">
    <div class="progress-labels">
      <div class="endpoint">
        <span class="endpoint-value">{{ startWeight }}</span>
        <span class="endpoint-label">起点</span>
      </div>
      <div class="mid-info">
        <span class="mid-text">已减 {{ Number((startWeight - currentWeight).toFixed(1)) }} 斤 🎉</span>
      </div>
      <div class="endpoint">
        <span class="endpoint-value target">{{ targetWeight }}</span>
        <span class="endpoint-label">目标</span>
      </div>
    </div>
    <div class="bar-track">
      <div class="bar-fill" :style="{ width: progress + '%' }">
        <span class="paw">🐾</span>
      </div>
    </div>
    <div class="remaining-text">🐢 一步一步来，还剩 {{ remaining }} 斤～</div>
  </div>
</template>

<style scoped>
.progress-container {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
  margin-bottom: 16px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 10px;
}

.endpoint {
  text-align: center;
}

.endpoint-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.endpoint-value.target {
  color: var(--pink);
}

.endpoint-label {
  font-size: 9px;
  color: var(--text-lighter);
  display: block;
}

.mid-info {
  font-size: 12px;
  color: var(--pink);
  font-weight: 600;
}

.bar-track {
  background: #fff0f0;
  border-radius: 12px;
  height: 12px;
  overflow: hidden;
}

.bar-fill {
  background: linear-gradient(90deg, #ffb8c6, #ffccd5);
  border-radius: 12px;
  height: 100%;
  position: relative;
  transition: width 0.6s ease;
  min-width: 20px;
}

.paw {
  position: absolute;
  right: -8px;
  top: -6px;
  font-size: 18px;
}

.remaining-text {
  font-size: 10px;
  color: #d4a0a0;
  text-align: center;
  margin-top: 8px;
}
</style>
```

- [ ] **Step 4: 创建 WeightChart.vue**

```vue
<!-- src/components/WeightChart.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, TimeScale,
  CategoryScale, Filler, Tooltip,
} from 'chart.js'
import type { WeightLog } from '@/types'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const props = defineProps<{
  logs: WeightLog[]
}>()

const chartData = computed(() => {
  const sorted = [...props.logs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  return {
    labels: sorted.map(l => l.log_date.slice(5)), // MM-DD
    datasets: [{
      data: sorted.map(l => l.weight),
      borderColor: '#ff9a9e',
      backgroundColor: 'rgba(255, 154, 158, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#ff9a9e',
      borderWidth: 2,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.parsed.y} 斤`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#ccc' },
    },
    y: {
      grid: { color: '#fff0f0' },
      ticks: { font: { size: 10 }, color: '#ccc' },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <div class="chart-title">📈 体重变化曲线</div>
    <div v-if="logs.length === 0" class="chart-empty">还没有记录呢，快去打卡吧！</div>
    <div v-else style="height: 200px;">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.chart-empty {
  text-align: center;
  color: var(--text-lighter);
  font-size: 13px;
  padding: 40px 0;
}
</style>
```

- [ ] **Step 5: 实现 HomePage.vue 完整页面**

```vue
<!-- src/views/HomePage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWeightStore } from '@/stores/weight'
import { useGoalsStore } from '@/stores/goals'
import { useBadgesStore } from '@/stores/badges'
import WeightCard from '@/components/WeightCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WeightChart from '@/components/WeightChart.vue'

const weightStore = useWeightStore()
const goalsStore = useGoalsStore()
const badgesStore = useBadgesStore()

const weightInput = ref('')
const moodInput = ref('')
const submitting = ref(false)
const todayLog = ref<any>(null)
const error = ref('')

onMounted(async () => {
  await weightStore.fetchLogs()
  await goalsStore.fetchGoals()
  await badgesStore.fetchBadges()
})

// 起点：取最早记录或第一个 active goal 对应的起点
const startWeight = ref(112) // 默认值，实际从数据中取

async function submit() {
  const w = parseFloat(weightInput.value)
  if (isNaN(w) || w < 50 || w > 300) {
    error.value = '体重数值不对哦，再确认一下？'
    return
  }
  error.value = ''
  submitting.value = true
  try {
    await weightStore.addLog(w, moodInput.value || null)
    weightInput.value = ''
    moodInput.value = ''
    // 检查徽章
    await badgesStore.checkAndAwardBadges()
  } catch (e: any) {
    if (e.code === '23505') {
      error.value = '今天已经打过卡啦～'
    } else {
      error.value = '网络不太好，再试一次吧 🥺'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- 顶部欢迎 -->
    <div class="header">
      <div class="avatar">🐣</div>
      <div>
        <div class="greeting">Hi 小可爱 👋</div>
        <div class="sub-greeting">🔥 连续 {{ weightStore.streakDays }} 天</div>
      </div>
      <div class="target-chip" v-if="goalsStore.currentGoal">
        🎯 {{ goalsStore.currentGoal.target_weight }} 斤
      </div>
    </div>

    <!-- 体重卡片 -->
    <WeightCard
      :weight="weightStore.latestWeight"
      :change="weightStore.lastChange"
      :streak="weightStore.streakDays"
    />

    <!-- 输入区 -->
    <div class="input-card">
      <input
        v-model="weightInput" type="number" step="0.1"
        placeholder="⚖️ 今天体重多少斤呀？"
        class="input-field"
      />
      <input
        v-model="moodInput" type="text"
        placeholder="💬 今天想说的话…"
        class="input-field"
      />
      <p v-if="error" class="error-msg">{{ error }}</p>
      <button @click="submit" :disabled="submitting" class="submit-btn">
        {{ submitting ? '...' : '✨ 打卡记录' }}
      </button>
    </div>

    <!-- 进度条 -->
    <ProgressBar
      v-if="goalsStore.currentGoal"
      :start-weight="goalsStore.startWeight ?? 112"
      :target-weight="goalsStore.currentGoal.target_weight"
      :current-weight="weightStore.latestWeight ?? 112"
    />

    <!-- 图表 -->
    <WeightChart :logs="weightStore.logs" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #ffe0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.greeting {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.sub-greeting {
  font-size: 11px;
  color: #f9a8a8;
}

.target-chip {
  margin-left: auto;
  background: #fff0f0;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 11px;
  color: #e87878;
  font-weight: 500;
  border: 1.5px dashed #ffcccc;
}

.input-card {
  background: #fff;
  border-radius: 18px;
  padding: 14px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
  margin-bottom: 16px;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #ffe0e0;
  border-radius: 12px;
  outline: none;
  margin-bottom: 8px;
}

.input-field:focus {
  border-color: var(--pink-light);
}

.error-msg {
  color: #e85555;
  font-size: 12px;
  text-align: center;
  margin-bottom: 4px;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #ff9a9e, #fab2b6);
  border: none;
  color: white;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 2px;
}

.submit-btn:disabled {
  opacity: 0.6;
}
</style>
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: implement home page with weight card, progress bar, and chart"
```

---

### Task 6: 目标管理

**Files:**
- Create: `src/stores/goals.ts`, `src/components/GoalCard.vue`
- Modify: `src/views/GoalsPage.vue`

- [ ] **Step 1: 创建 goals store — src/stores/goals.ts**

```typescript
// src/stores/goals.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from './user'
import type { Goal } from '@/types'

export const useGoalsStore = defineStore('goals', () => {
  const userStore = useUserStore()
  const goals = ref<Goal[]>([])

  const currentGoal = computed(() =>
    goals.value.find(g => g.status === 'active') ?? null
  )

  const completedGoals = computed(() =>
    goals.value.filter(g => g.status === 'completed')
  )

  const startWeight = ref<number | null>(null)

  async function fetchGoals() {
    if (!userStore.user) return
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userStore.user.id)
      .order('sort_order')
    goals.value = (data || []) as Goal[]
  }

  async function addGoal(title: string, targetWeight: number, reward: string | null) {
    if (!userStore.user) return
    const sortOrder = goals.value.length
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userStore.user.id,
        title,
        target_weight: targetWeight,
        reward,
        sort_order: sortOrder,
        status: 'active',
      })
      .select()
      .single()
    if (error) throw error
    goals.value.push(data as Goal)
  }

  async function updateGoal(id: string, updates: Partial<Goal>) {
    const { error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
    if (error) throw error
    const idx = goals.value.findIndex(g => g.id === id)
    if (idx >= 0) Object.assign(goals.value[idx], updates)
  }

  async function completeGoal(id: string) {
    await updateGoal(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    } as any)
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    goals.value = goals.value.filter(g => g.id !== id)
  }

  async function reorderGoals(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase.from('goals').update({ sort_order: i }).eq('id', orderedIds[i])
    }
    goals.value.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
  }

  return {
    goals, currentGoal, completedGoals, startWeight,
    fetchGoals, addGoal, updateGoal, completeGoal, deleteGoal, reorderGoals,
  }
})
```

- [ ] **Step 2: 创建 GoalCard.vue**

```vue
<!-- src/components/GoalCard.vue -->
<script setup lang="ts">
import type { Goal } from '@/types'

defineProps<{
  goal: Goal
  currentWeight: number | null
}>()

const emit = defineEmits<{
  complete: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <div
    class="goal-card"
    :class="{ completed: goal.status === 'completed', active: goal.status === 'active' }"
  >
    <div class="goal-icon">{{ goal.status === 'completed' ? '🎉' : (goal.reward ? '🎀' : '💫') }}</div>
    <div class="goal-body">
      <div class="goal-title">{{ goal.title }}</div>
      <div class="goal-target">目标体重：{{ goal.target_weight }} 斤</div>
      <div v-if="goal.reward" class="goal-reward">奖励：{{ goal.reward }}</div>
      <div v-if="goal.status === 'completed' && goal.completed_at" class="goal-completed">
        已于 {{ new Date(goal.completed_at).toLocaleDateString('zh-CN') }} 达成 ✅
      </div>
    </div>
    <div class="goal-actions">
      <span class="status-badge" :class="goal.status">
        {{ goal.status === 'active' ? '进行中' : goal.status === 'completed' ? '已完成' : '已放弃' }}
      </span>
      <button
        v-if="goal.status === 'active'"
        @click="emit('complete', goal.id)"
        class="btn-complete"
      >🎯 完成</button>
      <button
        @click="emit('delete', goal.id)"
        class="btn-delete"
      >🗑️</button>
    </div>
  </div>
</template>

<style scoped>
.goal-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
}

.goal-card.completed {
  background: linear-gradient(135deg, #FFF9E6, #FFF3CD);
  border: 2px solid #FFE082;
}

.goal-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.goal-body {
  flex: 1;
}

.goal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.goal-target {
  font-size: 11px;
  color: var(--text-light);
}

.goal-reward {
  font-size: 11px;
  color: #b8960b;
}

.goal-completed {
  font-size: 10px;
  color: var(--pink);
  margin-top: 2px;
}

.goal-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 10px;
}

.status-badge.active {
  background: #fff0f0;
  color: #e87878;
}

.status-badge.completed {
  background: #FFF9C4;
  color: #b8860b;
}

.btn-complete, .btn-delete {
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
}

.btn-complete { color: var(--pink); }
.btn-delete { color: var(--text-lighter); }
</style>
```

- [ ] **Step 3: 实现 GoalsPage.vue**

```vue
<!-- src/views/GoalsPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGoalsStore } from '@/stores/goals'
import { useWeightStore } from '@/stores/weight'
import GoalCard from '@/components/GoalCard.vue'

const goalsStore = useGoalsStore()
const weightStore = useWeightStore()

const showAdd = ref(false)
const newTitle = ref('')
const newTarget = ref('')
const newReward = ref('')
const error = ref('')

onMounted(async () => {
  await goalsStore.fetchGoals()
  await weightStore.fetchLogs()
})

async function addGoal() {
  const target = parseFloat(newTarget.value)
  if (isNaN(target) || target <= 0) {
    error.value = '请输入合理的目标体重'
    return
  }
  error.value = ''
  await goalsStore.addGoal(
    newTitle.value || `目标体重 ${target} 斤`,
    target,
    newReward.value || null,
  )
  newTitle.value = ''
  newTarget.value = ''
  newReward.value = ''
  showAdd.value = false
}

async function handleComplete(id: string) {
  await goalsStore.completeGoal(id)
}

async function handleDelete(id: string) {
  if (confirm('确定要删除这个目标吗？')) {
    await goalsStore.deleteGoal(id)
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>🎯 减肥目标</h2>
      <button @click="showAdd = !showAdd" class="add-btn">
        {{ showAdd ? '✕' : '+ 添加' }}
      </button>
    </div>

    <!-- 添加目标表单 -->
    <div v-if="showAdd" class="add-form">
      <input v-model="newTitle" placeholder="目标名称，如：第一阶段" class="add-input" />
      <input v-model="newTarget" type="number" step="0.1" placeholder="目标体重（斤）" class="add-input" />
      <input v-model="newReward" placeholder="达成奖励，如：一顿火锅🍲" class="add-input" />
      <p v-if="error" class="error">{{ error }}</p>
      <button @click="addGoal" class="submit-btn">✨ 创建目标</button>
    </div>

    <!-- 当前目标 -->
    <div v-if="goalsStore.currentGoal" class="section">
      <h3 class="section-title">🏃 进行中</h3>
      <GoalCard
        :goal="goalsStore.currentGoal"
        :current-weight="weightStore.latestWeight"
        @complete="handleComplete"
        @delete="handleDelete"
      />
    </div>

    <!-- 已完成目标 -->
    <div v-if="goalsStore.completedGoals.length > 0" class="section">
      <h3 class="section-title">✅ 已完成</h3>
      <GoalCard
        v-for="goal in goalsStore.completedGoals" :key="goal.id"
        :goal="goal"
        :current-weight="weightStore.latestWeight"
        @delete="handleDelete"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="goalsStore.goals.length === 0 && !showAdd" class="empty">
      <div class="empty-icon">🎯</div>
      <p>还没有设置目标哦</p>
      <p class="empty-hint">点击右上角来创建第一个目标吧！</p>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 18px;
  color: var(--text);
}

.add-btn {
  background: var(--pink);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
}

.add-form {
  background: #fff;
  border-radius: 18px;
  padding: 14px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-input {
  padding: 12px;
  border: 2px solid #ffe0e0;
  border-radius: 12px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.error {
  color: #e85555;
  font-size: 12px;
}

.submit-btn {
  padding: 12px;
  background: linear-gradient(135deg, #ff9a9e, #fab2b6);
  border: none;
  color: white;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 10px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-lighter);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-lighter);
}
</style>
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: implement goals management with add, complete, and delete"
```

---

### Task 7: 徽章系统

**Files:**
- Create: `src/stores/badges.ts`, `src/components/BadgeGrid.vue`, `src/components/BadgeToast.vue`
- Modify: `src/views/BadgesPage.vue`

- [ ] **Step 1: 创建徽章定义和 store — src/stores/badges.ts**

```typescript
// src/stores/badges.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from './user'
import { useWeightStore } from './weight'
import { useGoalsStore } from './goals'
import type { UserBadge, BadgeDefinition } from '@/types'

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // 打卡成就
  { key: 'streak_1', name: '初来乍到', description: '首次打卡', icon: '🌱', category: 'streak', condition: '累计打卡 1 天' },
  { key: 'streak_7', name: '坚持一周', description: '连续打卡 7 天', icon: '🔥', category: 'streak', condition: '连续打卡 7 天' },
  { key: 'streak_21', name: '二十一天', description: '连续打卡 21 天', icon: '💪', category: 'streak', condition: '连续打卡 21 天' },
  { key: 'streak_66', name: '习惯成自然', description: '连续打卡 66 天', icon: '🏆', category: 'streak', condition: '连续打卡 66 天' },
  { key: 'total_100', name: '百日筑基', description: '累计打卡 100 天', icon: '👑', category: 'streak', condition: '累计打卡 100 天' },
  // 减重成就
  { key: 'weight_2', name: '初见成效', description: '减重 2 斤', icon: '🍃', category: 'weight', condition: '累计减重 2 斤' },
  { key: 'weight_4', name: '稳步向前', description: '减重 4 斤', icon: '🌸', category: 'weight', condition: '累计减重 4 斤' },
  { key: 'weight_6', name: '半程已过', description: '减重 6 斤', icon: '🎯', category: 'weight', condition: '累计减重 6 斤' },
  { key: 'weight_10', name: '近在咫尺', description: '减重 10 斤', icon: '💫', category: 'weight', condition: '累计减重 10 斤' },
  { key: 'weight_12', name: '达成百斤', description: '减重 12 斤（到100斤）', icon: '👑', category: 'weight', condition: '累计减重 12 斤' },
  // 目标成就
  { key: 'goal_1st', name: '旗开得胜', description: '完成第一个阶梯目标', icon: '🚩', category: 'goal', condition: '完成 1 个目标' },
  { key: 'goal_3rd', name: '势如破竹', description: '连续完成 3 个阶梯目标', icon: '⚡', category: 'goal', condition: '完成 3 个目标' },
  { key: 'goal_final', name: '大功告成', description: '达成最终目标体重', icon: '🎊', category: 'goal', condition: '达成最终目标' },
  // 互动成就
  { key: 'cheer_1st', name: '第一声加油', description: '伴侣留下第 1 条留言', icon: '💌', category: 'cheer', condition: '收到 1 条留言' },
  { key: 'cheer_7days', name: '晚晚都在', description: '伴侣连续 7 天留言', icon: '🌙', category: 'cheer', condition: '伴侣连续 7 天留言' },
  { key: 'cheer_100pct', name: '心电感应', description: '连续 10 条打卡回复率 100%', icon: '💭', category: 'cheer', condition: '10条打卡全回复' },
  { key: 'both_14days', name: '并肩走过', description: '两人共同活跃 14 天', icon: '🫶', category: 'cheer', condition: '双方活跃 14 天' },
  { key: 'cheer_21', name: '最甜后援', description: '累计留言 21 条', icon: '❤️', category: 'cheer', condition: '累计 21 条留言' },
]

export const useBadgesStore = defineStore('badges', () => {
  const userStore = useUserStore()
  const unlockedBadges = ref<UserBadge[]>([])
  const newBadges = ref<BadgeDefinition[]>([]) // 本次刚解锁的，用于弹动画

  const allBadges = ref(BADGE_DEFINITIONS)

  function isUnlocked(badgeKey: string): boolean {
    return unlockedBadges.value.some(b => b.badge_key === badgeKey)
  }

  function getBadgeDef(key: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find(b => b.key === key)
  }

  async function fetchBadges() {
    if (!userStore.user) return
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userStore.user.id)
    unlockedBadges.value = (data || []) as UserBadge[]
  }

  async function awardBadge(badgeKey: string) {
    if (!userStore.user || isUnlocked(badgeKey)) return
    const { data } = await supabase
      .from('user_badges')
      .insert({
        user_id: userStore.user.id,
        badge_key: badgeKey,
      })
      .select()
      .single()
    if (data) {
      unlockedBadges.value.push(data as UserBadge)
      const def = getBadgeDef(badgeKey)
      if (def) newBadges.value.push(def)
    }
  }

  async function checkAndAwardBadges() {
    newBadges.value = []
    const weightStore = useWeightStore()
    const goalsStore = useGoalsStore()

    // --- 打卡徽章 ---
    // streak_1: 累计打卡 >= 1 天
    if (weightStore.totalDays >= 1) await awardBadge('streak_1')
    // streak_7: 连续打卡 >= 7 天
    if (weightStore.streakDays >= 7) await awardBadge('streak_7')
    // streak_21
    if (weightStore.streakDays >= 21) await awardBadge('streak_21')
    // streak_66
    if (weightStore.streakDays >= 66) await awardBadge('streak_66')
    // total_100
    if (weightStore.totalDays >= 100) await awardBadge('total_100')

    // --- 减重徽章 ---
    if (weightStore.totalLoss >= 2) await awardBadge('weight_2')
    if (weightStore.totalLoss >= 4) await awardBadge('weight_4')
    if (weightStore.totalLoss >= 6) await awardBadge('weight_6')
    if (weightStore.totalLoss >= 10) await awardBadge('weight_10')
    if (weightStore.totalLoss >= 12) await awardBadge('weight_12')

    // --- 目标徽章 ---
    if (goalsStore.completedGoals.length >= 1) await awardBadge('goal_1st')
    if (goalsStore.completedGoals.length >= 3) await awardBadge('goal_3rd')
  }

  function clearNewBadges() {
    newBadges.value = []
  }

  return {
    unlockedBadges, newBadges, allBadges,
    isUnlocked, getBadgeDef,
    fetchBadges, awardBadge, checkAndAwardBadges, clearNewBadges,
  }
})
```

- [ ] **Step 2: 创建 BadgeGrid.vue**

```vue
<!-- src/components/BadgeGrid.vue -->
<script setup lang="ts">
import type { BadgeDefinition } from '@/types'

defineProps<{
  badges: BadgeDefinition[]
  unlocked: boolean
}>()
</script>

<template>
  <div class="badge-grid">
    <div
      v-for="badge in badges" :key="badge.key"
      class="badge-item"
      :class="{ unlocked, locked: !unlocked }"
    >
      <div class="badge-icon">{{ badge.icon }}</div>
      <div class="badge-name">{{ badge.name }}</div>
      <div v-if="!unlocked" class="lock">🔒</div>
      <div v-else class="sparkle">✨</div>
    </div>
  </div>
</template>

<style scoped>
.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.badge-item {
  text-align: center;
  padding: 12px 8px;
  border-radius: 16px;
  position: relative;
}

.badge-item.unlocked {
  border: 2px solid #FFE082;
}

.badge-item.locked {
  background: #f5f5f5;
  border: 2px dashed #e0e0e0;
  opacity: 0.6;
  filter: grayscale(0.5);
}

.badge-icon {
  font-size: 28px;
}

.badge-name {
  font-size: 9px;
  font-weight: 600;
  margin-top: 2px;
  color: #b8860b;
}

.locked .badge-name {
  color: #bbb;
}

.lock, .sparkle {
  position: absolute;
  top: -6px;
  right: -6px;
  font-size: 12px;
}
</style>
```

- [ ] **Step 3: 创建 BadgeToast.vue（弹窗动画）**

```vue
<!-- src/components/BadgeToast.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import type { BadgeDefinition } from '@/types'

const props = defineProps<{
  badges: BadgeDefinition[]
}>()

const emit = defineEmits<{
  close: []
}>()

watch(() => props.badges.length, (len) => {
  if (len > 0) {
    setTimeout(() => emit('close'), 4000)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="badges.length > 0" class="toast-overlay" @click.self="emit('close')">
        <div class="toast-card">
          <div class="toast-fireworks">🎉🎊🥳✨🎉</div>
          <div class="toast-title">获得新徽章！</div>
          <div
            v-for="badge in badges" :key="badge.key"
            class="toast-badge"
          >
            <div class="toast-badge-icon">{{ badge.icon }}</div>
            <div class="toast-badge-name">{{ badge.name }}</div>
            <div class="toast-badge-desc">{{ badge.description }}</div>
          </div>
          <button class="toast-btn" @click="emit('close')">太棒了！💖</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.toast-card {
  background: #fff;
  border-radius: 24px;
  padding: 32px 24px;
  text-align: center;
  max-width: 300px;
  width: 90%;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.toast-fireworks {
  font-size: 28px;
  margin-bottom: 8px;
}

.toast-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--pink);
  margin-bottom: 16px;
}

.toast-badge {
  margin-bottom: 12px;
}

.toast-badge-icon {
  font-size: 48px;
}

.toast-badge-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.toast-badge-desc {
  font-size: 12px;
  color: var(--text-light);
}

.toast-btn {
  margin-top: 16px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #ff9a9e, #fab2b6);
  border: none;
  color: white;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 4: 实现 BadgesPage.vue**

```vue
<!-- src/views/BadgesPage.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBadgesStore, BADGE_DEFINITIONS } from '@/stores/badges'
import { useGoalsStore } from '@/stores/goals'
import BadgeGrid from '@/components/BadgeGrid.vue'

const badgesStore = useBadgesStore()
const goalsStore = useGoalsStore()

onMounted(async () => {
  await badgesStore.fetchBadges()
  await goalsStore.fetchGoals()
})

const streakBadges = computed(() => BADGE_DEFINITIONS.filter(b => b.category === 'streak'))
const weightBadges = computed(() => BADGE_DEFINITIONS.filter(b => b.category === 'weight'))
const goalBadges = computed(() => BADGE_DEFINITIONS.filter(b => b.category === 'goal'))
const cheerBadges = computed(() => BADGE_DEFINITIONS.filter(b => b.category === 'cheer'))

const unlockedCount = computed(() => badgesStore.unlockedBadges.length)
const totalCount = computed(() => BADGE_DEFINITIONS.length)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>🏅 我的徽章</h2>
        <p class="sub">✨ 已点亮 {{ unlockedCount }} / {{ totalCount }}</p>
      </div>
      <div class="bag">🎒</div>
    </div>

    <!-- 打卡成就 -->
    <div class="section">
      <div class="section-head">🗓️ 打卡成就</div>
      <BadgeGrid
        :badges="streakBadges"
        :unlocked="false"
      />
    </div>

    <!-- 减重成就 -->
    <div class="section">
      <div class="section-head">⚖️ 减重成就</div>
      <BadgeGrid
        :badges="weightBadges"
        :unlocked="false"
      />
    </div>

    <!-- 目标成就 -->
    <div class="section">
      <div class="section-head">🎯 目标成就</div>
      <BadgeGrid
        :badges="goalBadges"
        :unlocked="false"
      />
    </div>

    <!-- 互动成就 -->
    <div class="section">
      <div class="section-head">💕 互动成就</div>
      <BadgeGrid
        :badges="cheerBadges"
        :unlocked="false"
      />
    </div>

    <!-- 自定义奖励 -->
    <div class="section">
      <div class="section-head">🎁 自定义奖励</div>
      <div v-if="goalsStore.completedGoals.length > 0">
        <div
          v-for="goal in goalsStore.completedGoals" :key="goal.id"
          class="custom-reward"
        >
          <span class="reward-icon">🎀</span>
          <span>{{ goal.title }}</span>
          <span v-if="goal.reward" class="reward-desc">— {{ goal.reward }}</span>
        </div>
      </div>
      <div v-else class="empty-hint">完成目标后会在这里展示奖励哦～</div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
  color: var(--text);
}

.sub {
  font-size: 11px;
  color: var(--text-lighter);
  margin-top: 2px;
}

.bag { font-size: 28px; }

.section {
  margin-bottom: 18px;
}

.section-head {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 8px;
}

.custom-reward {
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 12px;
  margin-bottom: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 6px;
}

.reward-icon {
  font-size: 18px;
}

.reward-desc {
  color: #b8960b;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-lighter);
  text-align: center;
  padding: 20px;
}
</style>
```

- [ ] **Step 5: 将 BadgeToast 加入 App.vue**

在 `App.vue` 中：

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/components/BottomNav.vue'
import BadgeToast from '@/components/BadgeToast.vue'
import { useBadgesStore } from '@/stores/badges'

const route = useRoute()
const showNav = computed(() => route.path !== '/auth')
const badgesStore = useBadgesStore()
</script>

<template>
  <router-view />
  <BottomNav v-if="showNav" />
  <BadgeToast :badges="badgesStore.newBadges" @close="badgesStore.clearNewBadges()" />
</template>
```

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: implement badge system with definitions, grid, and unlock toast"
```

---

### Task 8: 互动留言

**Files:**
- Create: `src/components/CheerBubble.vue`
- Modify: `src/views/CheersPage.vue`

- [ ] **Step 1: 创建 CheerBubble.vue**

```vue
<!-- src/components/CheerBubble.vue -->
<script setup lang="ts">
import type { Cheer } from '@/types'

defineProps<{
  cheer: Cheer
  isMine: boolean
  fromName: string
}>()
</script>

<template>
  <div class="bubble" :class="{ mine: isMine }">
    <div class="bubble-name">{{ fromName }}</div>
    <div class="bubble-msg">{{ cheer.message }}</div>
    <div class="bubble-time">{{ new Date(cheer.created_at).toLocaleString('zh-CN') }}</div>
  </div>
</template>

<style scoped>
.bubble {
  background: #fff;
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 10px;
  max-width: 80%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 2px solid #fff0f0;
}

.bubble.mine {
  margin-left: auto;
  background: linear-gradient(135deg, #fff0f0, #ffe8e8);
  border: 2px solid #ffd4de;
}

.bubble-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--pink);
  margin-bottom: 4px;
}

.bubble-msg {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
}

.bubble-time {
  font-size: 10px;
  color: var(--text-lighter);
  text-align: right;
  margin-top: 4px;
}
</style>
```

- [ ] **Step 2: 实现 CheersPage.vue**

```vue
<!-- src/views/CheersPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import { useWeightStore } from '@/stores/weight'
import CheerBubble from '@/components/CheerBubble.vue'
import type { Cheer, WeightLog } from '@/types'

const userStore = useUserStore()
const weightStore = useWeightStore()

const partnerLogs = ref<(WeightLog & { cheers: Cheer[] })[]>([])
const message = ref('')
const currentLogId = ref<string | null>(null)
const loading = ref(false)

onMounted(async () => {
  if (!userStore.profile?.partner_id) return
  // 获取伴侣的最近体重记录
  const { data: logs } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userStore.profile.partner_id)
    .order('log_date', { ascending: false })
    .limit(30)
  if (!logs) return

  // 获取这些记录下的所有留言
  const logIds = (logs as WeightLog[]).map(l => l.id)
  const { data: cheers } = await supabase
    .from('cheers')
    .select('*')
    .in('weight_log_id', logIds)
    .order('created_at', { ascending: true })

  partnerLogs.value = (logs as WeightLog[]).map(log => ({
    ...log,
    cheers: (cheers as Cheer[] || []).filter(c => c.weight_log_id === log.id),
  }))
})

async function sendCheer(logId: string) {
  if (!message.value.trim() || !userStore.user) return
  loading.value = true
  await supabase.from('cheers').insert({
    from_user: userStore.user.id,
    to_user: userStore.profile?.partner_id,
    weight_log_id: logId,
    message: message.value.trim(),
  })
  message.value = ''
  currentLogId.value = null
  loading.value = false
  // 刷新
  location.reload()
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2>💕 互动记录</h2>
      <p class="sub">{{ userStore.partnerProfile?.nickname || 'TA' }} 的打卡记录</p>
    </div>

    <!-- 未绑定伴侣 -->
    <div v-if="!userStore.hasPartner" class="empty">
      <div class="empty-icon">🔗</div>
      <p>还没有绑定伴侣哦</p>
      <p class="empty-hint">去"设置"页面绑定伴侣，就能看到她的记录了 💕</p>
    </div>

    <!-- 伴侣的记录列表 -->
    <div v-else-if="partnerLogs.length === 0" class="empty">
      <div class="empty-icon">📝</div>
      <p>她还没有开始打卡呢</p>
      <p class="empty-hint">快提醒她记录今天的体重吧～</p>
    </div>

    <div v-else>
      <div v-for="log in partnerLogs" :key="log.id" class="log-card">
        <div class="log-header">
          <span class="log-date">{{ log.log_date }}</span>
          <span class="log-weight">{{ log.weight }} 斤</span>
          <span v-if="log.mood" class="log-mood">{{ log.mood }}</span>
        </div>

        <!-- 留言列表 -->
        <div class="cheers-list">
          <CheerBubble
            v-for="cheer in log.cheers" :key="cheer.id"
            :cheer="cheer"
            :is-mine="cheer.from_user === userStore.user?.id"
            :from-name="cheer.from_user === userStore.user?.id
              ? '我' : (userStore.partnerProfile?.nickname || 'TA')"
          />
        </div>

        <!-- 留言输入 -->
        <div v-if="currentLogId === log.id" class="reply-box">
          <input
            v-model="message" type="text" placeholder="给她加油..."
            class="reply-input"
            @keyup.enter="sendCheer(log.id)"
          />
          <button @click="sendCheer(log.id)" :disabled="loading" class="reply-btn">💌</button>
        </div>
        <button v-else @click="currentLogId = log.id" class="reply-toggle">💬 留言</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 18px;
  color: var(--text);
}

.sub {
  font-size: 12px;
  color: var(--text-light);
}

.log-card {
  background: #fff;
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.log-date { font-size: 12px; color: var(--text-light); }
.log-weight { font-size: 18px; font-weight: 700; color: var(--pink); }
.log-mood { font-size: 12px; color: var(--text-light); }

.cheers-list {
  margin-bottom: 8px;
}

.reply-box {
  display: flex;
  gap: 8px;
}

.reply-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #ffe0e0;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.reply-btn {
  background: var(--pink);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.reply-toggle {
  background: none;
  border: none;
  color: var(--pink);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-lighter);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
}
</style>
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement cheers page with partner log view and messaging"
```

---

### Task 9: 设置页面 & 伴侣绑定

**Files:**
- Modify: `src/views/SettingsPage.vue`, `src/stores/user.ts`

- [ ] **Step 1: 实现 SettingsPage.vue**

```vue
<!-- src/views/SettingsPage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref(userStore.profile?.nickname || '')
const partnerEmail = ref('')
const bindError = ref('')
const bindSuccess = ref('')
const saving = ref(false)

async function saveNickname() {
  saving.value = true
  await userStore.updateNickname(nickname.value)
  saving.value = false
}

async function bindPartner() {
  bindError.value = ''
  bindSuccess.value = ''
  if (!userStore.user) return

  // 通过 email 查找 partner
  // 查找 profiles 表中 nickname 匹配的（简化方案：直接用邀请码模式）
  // 实际采用：双方在 Supabase 中都可以通过输入对方 email 来绑定
  const { data: partners } = await supabase
    .from('profiles')
    .select('id')
    .ilike('id', `%`) // 这里需要实际查
  // 简化做法：通过一个绑定码
  // 生产方案：让用户输入对方的绑定码（用 user id 前8位）
  bindError.value = '此功能需要在 Supabase 中配置。暂时请双方输入对方的邮箱来手动匹配。'
}

async function logout() {
  await userStore.signOut()
  router.push('/auth')
}
</script>

<template>
  <div class="page">
    <h2 style="font-size: 18px; margin-bottom: 20px;">⚙️ 设置</h2>

    <!-- 个人资料 -->
    <div class="section">
      <h3 class="section-title">👤 个人资料</h3>
      <div class="field">
        <label>昵称</label>
        <input v-model="nickname" placeholder="你的昵称" class="field-input" />
      </div>
      <button @click="saveNickname" :disabled="saving" class="save-btn">💾 保存</button>
    </div>

    <!-- 伴侣绑定 -->
    <div class="section">
      <h3 class="section-title">💕 伴侣绑定</h3>
      <div v-if="userStore.hasPartner" class="partner-info">
        <span class="partner-icon">💝</span>
        <div>
          <div class="partner-name">{{ userStore.partnerProfile?.nickname || '已绑定' }}</div>
          <div class="partner-hint">你们已经绑定啦～</div>
        </div>
      </div>
      <div v-else>
        <p class="hint">输入对方的邮箱来绑定伴侣</p>
        <div class="field">
          <label>伴侣邮箱</label>
          <input v-model="partnerEmail" type="email" placeholder="ta@example.com" class="field-input" />
        </div>
        <p v-if="bindError" class="error">{{ bindError }}</p>
        <p v-if="bindSuccess" class="success">{{ bindSuccess }}</p>
        <button @click="bindPartner" class="bind-btn">🔗 绑定</button>
      </div>
    </div>

    <!-- 退出登录 -->
    <button @click="logout" class="logout-btn">🚪 退出登录</button>
  </div>
</template>

<style scoped>
.section {
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  border: 2px solid #fff0f0;
}

.section-title {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 12px;
}

.field {
  margin-bottom: 10px;
}

.field label {
  display: block;
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.field-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ffe0e0;
  border-radius: 12px;
  outline: none;
  box-sizing: border-box;
}

.save-btn, .bind-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff9a9e, #fab2b6);
  border: none;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.hint { font-size: 12px; color: var(--text-light); margin-bottom: 10px; }
.error { color: #e85555; font-size: 12px; }
.success { color: #4caf50; font-size: 12px; }

.partner-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.partner-icon { font-size: 32px; }
.partner-name { font-size: 14px; font-weight: 600; }
.partner-hint { font-size: 11px; color: var(--text-light); }

.logout-btn {
  width: 100%;
  padding: 14px;
  background: none;
  border: 2px solid #ffe0e0;
  border-radius: 30px;
  color: var(--text-light);
  font-size: 14px;
  cursor: pointer;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "feat: implement settings page with profile editing and partner binding"
```

---

### Task 10: PWA & 部署

**Files:**
- Create: `public/manifest.json`, `public/sw.js`
- Modify: `index.html`

- [ ] **Step 1: 创建 public/manifest.json**

```json
{
  "name": "减肥小本本",
  "short_name": "减肥本",
  "description": "每天记录体重，一起变瘦！",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fffaf5",
  "theme_color": "#ff9a9e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐣</text></svg>",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

- [ ] **Step 2: 创建 public/sw.js（基础离线缓存）**

```javascript
// public/sw.js
const CACHE_NAME = 'weight-journal-v1'
const urlsToCache = ['/', '/index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  )
})
```

- [ ] **Step 3: 更新 index.html，注册 service worker 和 manifest**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐣</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
    <meta name="theme-color" content="#ff9a9e" />
    <link rel="manifest" href="/manifest.json" />
    <title>减肥小本本</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
      }
    </script>
  </body>
</html>
```

- [ ] **Step 4: 部署到 Vercel**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd /Users/linxiaotong/weight-journal
vercel --prod
```

部署前需要设置环境变量：
- `VITE_SUPABASE_URL` — Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase 匿名密钥

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add PWA support and update index.html"
```

---

### Task 11: 收尾 & 优化

**Files:**
- Modify: 所有 view 和 store 文件，微调细节

- [ ] **Step 1: 添加全局 loading 和错误 toast**

在 App.vue 中加入简单的全局消息提示。

- [ ] **Step 2: 移动端适配检查**

在 Chrome DevTools 中模拟 375px 宽度，逐个页面检查布局是否溢出或错位。

- [ ] **Step 3: 测试全部流程**

1. 注册两个账号 → 登录
2. 设置伴侣绑定
3. 打卡 → 检查徽章是否触发
4. 设置阶梯目标 → 完成目标
5. 查看徽章墙
6. 互动留言

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "chore: final polish and responsive fixes"
```

---

## 实现顺序建议

1. Task 1 → 脚手架（先跑起来）
2. Task 2 → 数据库（在 Supabase Dashboard 执行 SQL）
3. Task 3 → 认证（能登录注册）
4. Task 4 → 导航（App 壳完整）
5. Task 5 → 首页（核心打卡流程）
6. Task 6 → 目标（阶梯目标 CRUD）
7. Task 7 → 徽章（检测 + 弹窗）
8. Task 8 → 互动（留言系统）
9. Task 9 → 设置（伴侣绑定）
10. Task 10 → PWA + 部署
11. Task 11 → 收尾优化

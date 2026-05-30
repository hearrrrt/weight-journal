# 减肥打卡网站 — 设计规格书

## 概述

一款给女朋友使用的体重打卡减肥网站。手机端优先，游戏化风格，支持阶梯式目标管理、自动徽章系统、伴侣互动留言。两人独立账号，通过伴侣绑定实现互动。

## 技术栈

| 层 | 选型 |
|----|------|
| 前端框架 | Vue 3 (Composition API) |
| 构建工具 | Vite |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| UI 样式 | 手写 CSS（圆润可爱风，不用组件库） |
| 图表 | Chart.js + vue-chartjs |
| BaaS | Supabase（Auth + PostgreSQL + Realtime） |
| 部署 | Vercel 或 Netlify（推送自动部署） |

## 页面 & 路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/auth` | AuthPage | 登录/注册（Supabase Auth） |
| `/` | HomePage | 核心：体重数字卡片、输入区、进度条、体重曲线 |
| `/goals` | GoalsPage | 阶梯目标管理（增删改、排序、标记完成） |
| `/badges` | BadgesPage | 徽章墙（已解锁/未解锁网格 + 自定义奖励） |
| `/cheers` | CheersPage | 伴侣互动（看她的打卡记录、留言） |
| `/settings` | SettingsPage | 个人资料、伴侣绑定（通过 partner_id 关联） |

## 组件树

```
App.vue
├── BottomNav.vue          # 底部导航（手机固定，5 个 tab）
├── BadgeToast.vue         # 解锁徽章弹窗动画
├── views/
│   ├── HomePage.vue
│   ├── GoalsPage.vue
│   ├── BadgesPage.vue
│   ├── CheersPage.vue
│   ├── SettingsPage.vue
│   └── AuthPage.vue
├── components/
│   ├── WeightCard.vue     # 体重数字大卡片（渐变背景）
│   ├── ProgressBar.vue    # 目标进度条（带🐾小脚印）
│   ├── BadgeGrid.vue      # 徽章网格
│   ├── WeightChart.vue    # 体重趋势折线图
│   ├── GoalCard.vue       # 单个目标卡片
│   └── CheerBubble.vue    # 留言气泡
└── stores/
    ├── user.ts            # 用户信息、伴侣绑定
    ├── weight.ts          # 体重记录 CRUD、曲线数据
    ├── goals.ts           # 目标 CRUD
    └── badges.ts          # 徽章状态、客户端检测逻辑
```

## 数据模型（Supabase PostgreSQL）

### profiles — 用户资料

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 关联 auth.users |
| nickname | text | 显示名 |
| avatar_url | text | 头像 URL |
| partner_id | uuid → profiles.id | 绑定伴侣，可为空 |
| created_at | timestamptz | |

### weight_logs — 每日体重记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid → profiles.id | |
| weight | decimal(4,1) | 精确到 0.1 斤 |
| mood | text | 心情/备注，可选 |
| log_date | date | 打卡日期 |
| created_at | timestamptz | |

约束：`UNIQUE(user_id, log_date)` — 每天每人只能有一条记录。

### goals — 阶梯目标

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid → profiles.id | |
| title | text | 如"第一阶段：108斤" |
| target_weight | decimal(4,1) | 目标体重 |
| reward | text | 达成奖励，如"一顿火锅🍲" |
| status | enum('active','completed','abandoned') | |
| sort_order | int | 排序用 |
| completed_at | timestamptz | |
| created_at | timestamptz | |

### user_badges — 已解锁徽章

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid → profiles.id | |
| badge_key | text | 徽章标识，如 'streak_7' |
| unlocked_at | timestamptz | |

约束：`UNIQUE(user_id, badge_key)`

### cheers — 互动留言

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| from_user | uuid → profiles.id | 留言者 |
| to_user | uuid → profiles.id | 接收者 |
| weight_log_id | uuid → weight_logs.id | 在哪条记录下留言 |
| message | text | |
| created_at | timestamptz | |

## 徽章系统

### 系统预设徽章

**🗓️ 打卡成就：**

| badge_key | 名称 | 条件 | 图标 |
|-----------|------|------|------|
| streak_1 | 初来乍到 | 首次打卡 | 🌱 |
| streak_7 | 坚持一周 | 连续打卡 7 天 | 🔥 |
| streak_21 | 二十一天 | 连续打卡 21 天 | 💪 |
| streak_66 | 习惯成自然 | 连续打卡 66 天 | 🏆 |
| total_100 | 百日筑基 | 累计打卡 100 天 | 👑 |

**⚖️ 减重成就（小基数专用，单位：斤）：**

| badge_key | 名称 | 条件 |
|-----------|------|------|
| weight_2 | 初见成效 | 减重 2 斤 |
| weight_4 | 稳步向前 | 减重 4 斤 |
| weight_6 | 半程已过 | 减重 6 斤 |
| weight_10 | 近在咫尺 | 减重 10 斤 |
| weight_12 | 达成百斤 | 减重 12 斤 |

**🎯 目标成就：**

| badge_key | 名称 | 条件 |
|-----------|------|------|
| goal_1st | 旗开得胜 | 完成第一个阶梯目标 |
| goal_3rd | 势如破竹 | 连续完成 3 个阶梯目标 |
| goal_final | 大功告成 | 达成最终目标体重 |

**💕 互动成就：**

| badge_key | 名称 | 条件 |
|-----------|------|------|
| cheer_1st | 第一声加油 | 伴侣留下第 1 条留言 |
| cheer_7days | 晚晚都在 | 伴侣连续 7 天都有留言 |
| cheer_100pct | 心电感应 | 连续 10 条打卡 100% 回复率 |
| both_14days | 并肩走过 | 两人共同活跃超过 14 天 |
| cheer_21 | 最甜后援 | 累计留言 21 条 |

### 自定义目标奖励

用户在 GoalsPage 创建阶梯目标时，可设置：
- 目标体重
- 达成奖励（文字 + emoji）

达成时弹出庆祝动画，并在 BadgesPage 的"自定义奖励"区域亮起。

### 检测逻辑（客户端）

每次提交体重后触发：
1. 查最近连续打卡天数 → 比对打卡徽章
2. 用最早体重和最新体重算累计减重 → 比对减重徽章
3. 查已完成 goal 数量 → 比对目标徽章
4. 新增徽章写入 `user_badges`，弹出 BadgeToast 动画

## 视觉风格

- **调性**：软萌可爱 + 游戏化
- **配色**：粉色系为主（#ff9a9e, #ffb8c6, #ffd4de），辅以暖黄和浅蓝
- **形状**：大圆角（16-24px），卡片式布局
- **字体**：系统默认中文字体，数字加粗
- **图标**：大量 emoji 替代传统图标
- **动效**：徽章解锁弹窗动画，进度条脚印移动，打卡按钮点击反馈
- **布局**：375px 手机宽度优先，导航栏固定在底部

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 网络断开 | 顶部显示"网络不太稳定 🥺"，输入暂存本地 |
| 一天重复打卡 | 弹窗"今天已经记录过啦～要修改吗？"提供修改入口 |
| 体重输入异常 | 前端校验：<50 斤或 >300 斤时弹确认框 |
| Supabase 请求超时 | Toast 提示 + 重试按钮 |
| 未登录访问 | 路由守卫重定向到 /auth |
| 无伴侣数据 | CheersPage 显示空状态引导："绑定伴侣后才能看到她的记录哦 💕" |

## 安全策略（Supabase RLS）

- 用户只能读写自己的 profiles、weight_logs、goals、user_badges
- cheers：留言者只能写自己的留言，接收者可以读写给自己的留言
- weight_logs：伴侣（partner_id 匹配）可读取对方的体重记录
- 通过 Supabase 的 Row Level Security Policy 实现

## 非功能需求

- 首次内容绘制（FCP）< 2 秒
- 支持 PWA（可添加到手机主屏幕）
- 移动端适配 320px - 428px 宽度
- 离线输入暂存（localStorage 兜底）

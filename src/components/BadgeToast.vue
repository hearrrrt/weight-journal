<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { BadgeDefinition } from '@/types'

const props = defineProps<{
  badges: BadgeDefinition[]
}>()

const emit = defineEmits<{
  close: []
}>()

let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (props.badges.length > 0) {
    timer = setTimeout(() => {
      emit('close')
    }, 4000)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

function handleDismiss() {
  if (timer) clearTimeout(timer)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="badges.length > 0" class="toast-overlay" @click.self="handleDismiss">
      <div class="toast-card">
        <!-- Fireworks header -->
        <div class="fireworks">🎉🎊🥳✨🎉</div>
        <h2 class="toast-title">获得新徽章！</h2>

        <!-- Badge list -->
        <div class="toast-badges">
          <div v-for="badge in badges" :key="badge.key" class="toast-badge-item">
            <span class="toast-badge-icon">{{ badge.icon }}</span>
            <span class="toast-badge-name">{{ badge.name }}</span>
            <span class="toast-badge-desc">{{ badge.description }}</span>
          </div>
        </div>

        <!-- Dismiss -->
        <button class="toast-dismiss" @click="handleDismiss">太棒了！💖</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.toast-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 28px 24px 24px;
  max-width: 320px;
  width: 85vw;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.fireworks {
  font-size: 24px;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.toast-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pink);
  margin-bottom: 18px;
}

.toast-badges {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.toast-badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #f0f7fa, #f0f8ff);
  border: 1px solid #b3dff0;
}

.toast-badge-icon {
  font-size: 40px;
  line-height: 1.2;
}

.toast-badge-name {
  font-size: 16px;
  font-weight: 600;
  color: #555;
}

.toast-badge-desc {
  font-size: 12px;
  color: #999;
}

.toast-dismiss {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--pink), var(--pink-light));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.toast-dismiss:active {
  transform: scale(0.97);
}
</style>

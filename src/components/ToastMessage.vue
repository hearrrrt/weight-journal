<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { message, visible, type } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-bar" :class="type">
        <span class="toast-icon">
          <template v-if="type === 'success'">&#10003;</template>
          <template v-else-if="type === 'error'">&#10007;</template>
          <template v-else>&#8505;</template>
        </span>
        <span class="toast-msg">{{ message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-bar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  max-width: 90vw;
  pointer-events: none;
}

.toast-bar.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.toast-bar.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.toast-bar.info {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
}

.toast-icon {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.toast-msg {
  line-height: 1.4;
}

/* Transition */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
</style>

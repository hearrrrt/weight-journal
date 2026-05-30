<script setup lang="ts">
import type { Cheer } from '@/types'

defineProps<{
  cheer: Cheer
  isMine: boolean
  fromName: string
}>()

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="bubble-wrapper" :class="{ mine: isMine }">
    <div class="bubble" :class="{ mine: isMine }">
      <p class="sender-name" :class="{ mine: isMine }">{{ fromName }}</p>
      <p class="message-text">{{ cheer.message }}</p>
      <p class="timestamp">{{ formatTime(cheer.created_at) }}</p>
    </div>
  </div>
</template>

<style scoped>
.bubble-wrapper {
  display: flex;
  margin-bottom: 8px;
}

.bubble-wrapper.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  word-break: break-word;
}

.bubble.mine {
  background: linear-gradient(135deg, #fff0f0, #fff5f5);
  text-align: right;
}

.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--pink-light);
  margin-bottom: 2px;
}

.sender-name.mine {
  color: var(--pink);
}

.message-text {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
}

.timestamp {
  font-size: 10px;
  color: var(--text-lighter);
  margin-top: 4px;
}
</style>

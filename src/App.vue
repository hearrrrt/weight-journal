<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/components/BottomNav.vue'
import BadgeToast from '@/components/BadgeToast.vue'
import ToastMessage from '@/components/ToastMessage.vue'
import { useBadgesStore } from '@/stores/badges'
import { useOnline } from '@/composables/useOnline'

const route = useRoute()
const showNav = computed(() => route.path !== '/auth')
const badgesStore = useBadgesStore()
const { isOnline } = useOnline()
</script>

<template>
  <!-- Offline banner -->
  <Transition name="banner">
    <div v-if="!isOnline" class="offline-banner">
      <span class="offline-icon">&#9888;</span>
      <span>网络不太稳定，请检查网络连接</span>
    </div>
  </Transition>

  <router-view />
  <BottomNav v-if="showNav" />
  <BadgeToast :badges="badgesStore.newBadges" @close="badgesStore.clearNewBadges()" />
  <ToastMessage />
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  max-width: 428px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #856404;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
}

.offline-icon {
  font-size: 15px;
}

/* Banner transition */
.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-100%);
}
</style>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserBadge } from '@/types'

export const useBadgesStore = defineStore('badges', () => {
  const badges = ref<UserBadge[]>([])
  const loading = ref(false)

  async function fetchBadges() {
    loading.value = true
    // TODO: implement supabase fetch
    loading.value = false
  }

  async function checkAndAwardBadges() {
    // TODO: implement badge checking logic
  }

  return {
    badges,
    loading,
    fetchBadges,
    checkAndAwardBadges,
  }
})

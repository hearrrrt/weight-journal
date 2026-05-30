import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Goal } from '@/types'

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref<Goal[]>([])
  const loading = ref(false)

  const currentGoal = computed<Goal | null>(() => {
    const active = goals.value.filter((g) => g.status === 'active')
    if (active.length === 0) return null
    return active.sort((a, b) => a.sort_order - b.sort_order)[0]
  })

  async function fetchGoals() {
    loading.value = true
    // TODO: implement supabase fetch
    loading.value = false
  }

  return {
    goals,
    loading,
    currentGoal,
    fetchGoals,
  }
})

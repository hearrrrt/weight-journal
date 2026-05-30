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
    await supabase.from('goals').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', id)
    const idx = goals.value.findIndex(g => g.id === id)
    if (idx >= 0) {
      goals.value[idx].status = 'completed'
      goals.value[idx].completed_at = new Date().toISOString()
    }
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    goals.value = goals.value.filter(g => g.id !== id)
  }

  return { goals, currentGoal, completedGoals, fetchGoals, addGoal, updateGoal, completeGoal, deleteGoal }
})

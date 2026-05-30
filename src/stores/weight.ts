import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import type { WeightLog } from '@/types'

export const useWeightStore = defineStore('weight', () => {
  const userStore = useUserStore()

  const logs = ref<WeightLog[]>([])
  const loading = ref(false)

  const latestWeight = computed<number | null>(() => {
    if (logs.value.length === 0) return null
    const sorted = [...logs.value].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    )
    return sorted[0].weight
  })

  const totalLoss = computed<number | null>(() => {
    if (logs.value.length < 2) return null
    const sorted = [...logs.value].sort(
      (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
    )
    const earliest = sorted[0].weight
    const latest = sorted[sorted.length - 1].weight
    return earliest - latest
  })

  const lastChange = computed<number | null>(() => {
    if (logs.value.length < 2) return null
    const sorted = [...logs.value].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    )
    const latest = sorted[0].weight
    const previous = sorted[1].weight
    return Number((latest - previous).toFixed(1))
  })

  const streakDays = computed(() => {
    if (logs.value.length === 0) return 0

    const uniqueDates = new Set(logs.value.map((l) => l.log_date))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = 0
    const current = new Date(today)

    while (true) {
      const dateStr = current.toISOString().split('T')[0]
      if (uniqueDates.has(dateStr)) {
        streak++
        current.setDate(current.getDate() - 1)
      } else {
        break
      }
    }

    // If today is not logged, check if yesterday is the start of the streak
    // The streak counts backward from the most recent logged day
    if (streak === 0) {
      // Find the most recent date that has a log
      const sortedDates = [...uniqueDates].sort((a, b) => b.localeCompare(a))
      const mostRecent = new Date(sortedDates[0])
      mostRecent.setHours(0, 0, 0, 0)

      const checkDate = new Date(mostRecent)
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (uniqueDates.has(dateStr)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    return streak
  })

  const totalDays = computed(() => {
    const uniqueDates = new Set(logs.value.map((l) => l.log_date))
    return uniqueDates.size
  })

  async function fetchLogs() {
    const userId = userStore.user?.id
    if (!userId) return

    loading.value = true
    try {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const fromDate = oneYearAgo.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', fromDate)
        .order('log_date', { ascending: false })

      if (error) {
        console.error('Failed to fetch logs:', error.message)
        return
      }

      logs.value = data as WeightLog[]
    } finally {
      loading.value = false
    }
  }

  async function addLog(weight: number, mood: string | null) {
    const userId = userStore.user?.id
    if (!userId) throw new Error('请先登录')

    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('weight_logs').insert({
      user_id: userId,
      weight,
      mood,
      log_date: today,
    })

    if (error) {
      // Handle UNIQUE constraint violation on (user_id, log_date)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error('今天已经打过卡啦～')
      }
      console.error('Failed to add log:', error.message)
      throw error
    }

    await fetchLogs()
  }

  async function updateLog(id: string, weight: number, mood: string | null) {
    const { error } = await supabase
      .from('weight_logs')
      .update({ weight, mood })
      .eq('id', id)

    if (error) {
      console.error('Failed to update log:', error.message)
      throw error
    }

    await fetchLogs()
  }

  async function getTodayLog(): Promise<WeightLog | null> {
    const userId = userStore.user?.id
    if (!userId) return null

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', today)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      console.error('Failed to get today log:', error.message)
      return null
    }

    return data as WeightLog
  }

  return {
    logs,
    loading,
    latestWeight,
    totalLoss,
    lastChange,
    streakDays,
    totalDays,
    fetchLogs,
    addLog,
    updateLog,
    getTodayLog,
  }
})

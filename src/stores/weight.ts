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

  const latestMood = computed<string | null>(() => {
    if (logs.value.length === 0) return null
    const sorted = [...logs.value].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    )
    return sorted[0].mood || null
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

    // Build a set of dates that have logs (as YYYY-MM-DD strings)
    const uniqueDates = new Set(logs.value.map((l) => {
      // Normalize date format — Supabase returns date as string like "2026-05-30"
      if (typeof l.log_date === 'string') return l.log_date.slice(0, 10)
      return l.log_date
    }))

    // Get today in local timezone
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    let streak = 0

    // If today is logged, count backwards from today
    if (uniqueDates.has(today)) {
      const d = new Date(now)
      while (true) {
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (uniqueDates.has(ds)) {
          streak++
          d.setDate(d.getDate() - 1)
        } else {
          break
        }
      }
      return streak
    }

    // If today is NOT logged, count backwards from yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    if (!uniqueDates.has(yesterdayStr)) return 0

    const d = new Date(yesterday)
    while (true) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (uniqueDates.has(ds)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
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

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const { error } = await supabase.from('weight_logs').insert({
      user_id: userId,
      weight,
      mood,
      log_date: today,
    })

    if (error) {
      // Handle UNIQUE constraint violation on (user_id, log_date)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error('DUPLICATE_TODAY')
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
    latestMood,
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

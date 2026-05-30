import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import type { BodyMeasurement } from '@/types'

export const useMeasurementStore = defineStore('measurements', () => {
  const userStore = useUserStore()

  const measurements = ref<BodyMeasurement[]>([])
  const loading = ref(false)

  // --- Computed properties ---

  /** Latest measurement record (most recent by log_date) */
  const latestMeasurement = computed<BodyMeasurement | null>(() => {
    if (measurements.value.length === 0) return null
    const sorted = [...measurements.value].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime(),
    )
    return sorted[0]
  })

  const latestWaist = computed<number | null>(() => {
    return latestMeasurement.value?.waist ?? null
  })

  const latestHip = computed<number | null>(() => {
    return latestMeasurement.value?.hip ?? null
  })

  const latestThigh = computed<number | null>(() => {
    return latestMeasurement.value?.thigh ?? null
  })

  /** Waist reduction since first record (positive = reduced) */
  const waistChange = computed<number | null>(() => {
    if (measurements.value.length < 2) return null
    const sorted = [...measurements.value].sort(
      (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime(),
    )
    const earliest = sorted[0].waist
    const latest = sorted[sorted.length - 1].waist
    if (earliest === null || latest === null) return null
    return Number((earliest - latest).toFixed(1))
  })

  // --- Actions ---

  async function fetchMeasurements() {
    const userId = userStore.user?.id
    if (!userId) return

    loading.value = true
    try {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const fromDate = oneYearAgo.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', fromDate)
        .order('log_date', { ascending: false })

      if (error) {
        console.error('Failed to fetch measurements:', error.message)
        return
      }

      measurements.value = data as BodyMeasurement[]
    } finally {
      loading.value = false
    }
  }

  async function addMeasurement(
    waist: number | null,
    hip: number | null,
    thigh: number | null,
    logDate: string,
  ) {
    const userId = userStore.user?.id
    if (!userId) throw new Error('请先登录')

    const { error } = await supabase.from('body_measurements').insert({
      user_id: userId,
      waist,
      hip,
      thigh,
      log_date: logDate,
    })

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error('DUPLICATE_DATE')
      }
      console.error('Failed to add measurement:', error.message)
      throw error
    }

    await fetchMeasurements()
  }

  async function updateMeasurement(
    id: string,
    waist: number | null,
    hip: number | null,
    thigh: number | null,
  ) {
    const { error } = await supabase
      .from('body_measurements')
      .update({ waist, hip, thigh })
      .eq('id', id)

    if (error) {
      console.error('Failed to update measurement:', error.message)
      throw error
    }

    await fetchMeasurements()
  }

  async function deleteMeasurement(id: string) {
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete measurement:', error.message)
      throw error
    }

    measurements.value = measurements.value.filter((m) => m.id !== id)
  }

  async function getByDate(logDate: string): Promise<BodyMeasurement | null> {
    const userId = userStore.user?.id
    if (!userId) return null

    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', logDate)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Failed to get measurement by date:', error.message)
      return null
    }

    return data as BodyMeasurement
  }

  return {
    measurements,
    loading,
    latestMeasurement,
    latestWaist,
    latestHip,
    latestThigh,
    waistChange,
    fetchMeasurements,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getByDate,
  }
})

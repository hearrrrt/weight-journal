import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import { useWeightStore } from '@/stores/weight'
import { useGoalsStore } from '@/stores/goals'
import type { UserBadge, BadgeDefinition } from '@/types'

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ---- 打卡成就 (Streak) ----
  { key: 'streak_1', name: '初来乍到', description: '连续打卡 1 天', icon: '🌱', category: 'streak', condition: 'streak >= 1' },
  { key: 'streak_7', name: '坚持一周', description: '连续打卡 7 天', icon: '🔥', category: 'streak', condition: 'streak >= 7' },
  { key: 'streak_21', name: '二十一天', description: '连续打卡 21 天', icon: '💪', category: 'streak', condition: 'streak >= 21' },
  { key: 'streak_66', name: '习惯成自然', description: '连续打卡 66 天', icon: '🏆', category: 'streak', condition: 'streak >= 66' },
  { key: 'total_100', name: '百日筑基', description: '累计打卡 100 天', icon: '👑', category: 'streak', condition: 'totalDays >= 100' },

  // ---- 减重成就 (Weight) ----
  { key: 'weight_2', name: '初见成效', description: '累计减重 2 斤', icon: '🍃', category: 'weight', condition: 'totalLoss >= 2' },
  { key: 'weight_4', name: '稳步向前', description: '累计减重 4 斤', icon: '🌸', category: 'weight', condition: 'totalLoss >= 4' },
  { key: 'weight_6', name: '半程已过', description: '累计减重 6 斤', icon: '🎯', category: 'weight', condition: 'totalLoss >= 6' },
  { key: 'weight_10', name: '近在咫尺', description: '累计减重 10 斤', icon: '💫', category: 'weight', condition: 'totalLoss >= 10' },
  { key: 'weight_12', name: '达成百斤', description: '累计减重 12 斤', icon: '👑', category: 'weight', condition: 'totalLoss >= 12' },

  // ---- 目标成就 (Goal) ----
  { key: 'goal_1st', name: '旗开得胜', description: '完成第 1 个目标', icon: '🚩', category: 'goal', condition: 'completed >= 1' },
  { key: 'goal_3rd', name: '势如破竹', description: '完成第 3 个目标', icon: '⚡', category: 'goal', condition: 'completed >= 3' },
  { key: 'goal_final', name: '大功告成', description: '完成全部目标', icon: '🎊', category: 'goal', condition: 'all completed' },

  // ---- 互动成就 (Cheer) ----
  { key: 'cheer_1st', name: '第一声加油', description: '收到 1 条加油', icon: '💌', category: 'cheer', condition: 'cheers >= 1' },
  { key: 'cheer_7days', name: '晚晚都在', description: '收到加油跨越 7 天', icon: '🌙', category: 'cheer', condition: 'cheerDays >= 7' },
  { key: 'cheer_100pct', name: '心电感应', description: '回复率 100%', icon: '💭', category: 'cheer', condition: 'replied >= received' },
  { key: 'both_14days', name: '并肩走过', description: '双人同天打卡 14 天', icon: '🫶', category: 'cheer', condition: 'bothDays >= 14' },
  { key: 'cheer_21', name: '最甜后援', description: '累计收到 21 条加油', icon: '❤️', category: 'cheer', condition: 'cheers >= 21' },
]

export const useBadgesStore = defineStore('badges', () => {
  const userStore = useUserStore()

  const unlockedBadges = ref<UserBadge[]>([])
  const newBadges = ref<BadgeDefinition[]>([])
  const loading = ref(false)

  function isUnlocked(key: string): boolean {
    return unlockedBadges.value.some(b => b.badge_key === key)
  }

  async function fetchBadges() {
    const userId = userStore.user?.id
    if (!userId) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to fetch badges:', error.message)
        return
      }

      unlockedBadges.value = data as UserBadge[]
    } finally {
      loading.value = false
    }
  }

  async function awardBadge(key: string): Promise<boolean> {
    const userId = userStore.user?.id
    if (!userId) return false

    if (isUnlocked(key)) return false

    const { error } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_key: key,
    })

    if (error) {
      // Silently skip duplicates (UNIQUE constraint)
      if (error.code === '23505') return false
      console.error('Failed to award badge:', error.message)
      return false
    }

    const record: UserBadge = {
      id: crypto.randomUUID(),
      user_id: userId,
      badge_key: key,
      unlocked_at: new Date().toISOString(),
    }
    unlockedBadges.value.push(record)

    const def = BADGE_DEFINITIONS.find(d => d.key === key)
    if (def) {
      newBadges.value.push(def)
    }

    return true
  }

  async function checkAndAwardBadges() {
    if (!userStore.user?.id) return

    const weightStore = useWeightStore()
    const goalsStore = useGoalsStore()

    // Refresh from server first
    await fetchBadges()

    const newlyAwarded: BadgeDefinition[] = []

    for (const badge of BADGE_DEFINITIONS) {
      if (isUnlocked(badge.key)) continue

      let eligible = false

      switch (badge.key) {
        // -- Streak --
        case 'streak_1':
          eligible = weightStore.streakDays >= 1
          break
        case 'streak_7':
          eligible = weightStore.streakDays >= 7
          break
        case 'streak_21':
          eligible = weightStore.streakDays >= 21
          break
        case 'streak_66':
          eligible = weightStore.streakDays >= 66
          break
        case 'total_100':
          eligible = weightStore.totalDays >= 100
          break

        // -- Weight --
        case 'weight_2':
          eligible = weightStore.totalLoss !== null && weightStore.totalLoss >= 2
          break
        case 'weight_4':
          eligible = weightStore.totalLoss !== null && weightStore.totalLoss >= 4
          break
        case 'weight_6':
          eligible = weightStore.totalLoss !== null && weightStore.totalLoss >= 6
          break
        case 'weight_10':
          eligible = weightStore.totalLoss !== null && weightStore.totalLoss >= 10
          break
        case 'weight_12':
          eligible = weightStore.totalLoss !== null && weightStore.totalLoss >= 12
          break

        // -- Goal --
        case 'goal_1st':
          eligible = goalsStore.completedGoals.length >= 1
          break
        case 'goal_3rd':
          eligible = goalsStore.completedGoals.length >= 3
          break
        case 'goal_final':
          eligible = goalsStore.goals.length > 0 && goalsStore.goals.every(g => g.status === 'completed')
          break

        // -- Cheer (database queries) --
        default:
          eligible = await checkCheerCondition(badge.key)
          break
      }

      if (eligible) {
        const awarded = await awardBadge(badge.key)
        if (awarded) {
          newlyAwarded.push(badge)
        }
      }
    }

    // Replace with only the badges unlocked this invocation
    newBadges.value = newlyAwarded
  }

  async function checkCheerCondition(key: string): Promise<boolean> {
    const userId = userStore.user?.id
    if (!userId) return false

    switch (key) {
      case 'cheer_1st':
      case 'cheer_21': {
        const threshold = key === 'cheer_1st' ? 1 : 21
        const { count, error } = await supabase
          .from('cheers')
          .select('*', { count: 'exact', head: true })
          .eq('to_user', userId)
        if (error) return false
        return (count ?? 0) >= threshold
      }

      case 'cheer_7days': {
        const { data, error } = await supabase
          .from('cheers')
          .select('created_at')
          .eq('to_user', userId)
        if (error || !data) return false
        const uniqueDays = new Set(data.map((c: { created_at: string }) => c.created_at.split('T')[0]))
        return uniqueDays.size >= 7
      }

      case 'cheer_100pct': {
        // Received cheers
        const { data: received, error: recvErr } = await supabase
          .from('cheers')
          .select('id')
          .eq('to_user', userId)
        if (recvErr || !received || received.length === 0) return false

        // Sent cheers (replies)
        const { count: sentCount, error: sentErr } = await supabase
          .from('cheers')
          .select('*', { count: 'exact', head: true })
          .eq('from_user', userId)
        if (sentErr) return false

        return received.length >= 3 && (sentCount ?? 0) >= received.length
      }

      case 'both_14days': {
        const partnerId = userStore.profile?.partner_id
        if (!partnerId) return false

        const { data: myLogs, error: myErr } = await supabase
          .from('weight_logs')
          .select('log_date')
          .eq('user_id', userId)
        if (myErr || !myLogs) return false

        const { data: partnerLogs, error: partnerErr } = await supabase
          .from('weight_logs')
          .select('log_date')
          .eq('user_id', partnerId)
        if (partnerErr || !partnerLogs) return false

        const myDates = new Set(myLogs.map((l: { log_date: string }) => l.log_date))
        const partnerDates = new Set(partnerLogs.map((l: { log_date: string }) => l.log_date))

        let both = 0
        for (const d of myDates) {
          if (partnerDates.has(d)) both++
        }
        return both >= 14
      }

      default:
        return false
    }
  }

  function clearNewBadges() {
    newBadges.value = []
  }

  return {
    unlockedBadges,
    newBadges,
    loading,
    isUnlocked,
    fetchBadges,
    awardBadge,
    checkAndAwardBadges,
    clearNewBadges,
  }
})

export interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  partner_id: string | null
  invite_code: string | null
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  weight: number
  mood: string | null
  log_date: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  target_weight: number
  reward: string | null
  status: 'active' | 'completed' | 'abandoned'
  sort_order: number
  completed_at: string | null
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_key: string
  unlocked_at: string
}

export interface Cheer {
  id: string
  from_user: string
  to_user: string
  weight_log_id: string
  message: string
  created_at: string
}

export interface BodyMeasurement {
  id: string
  user_id: string
  waist: number | null
  hip: number | null
  thigh: number | null
  log_date: string
  created_at: string
}

export interface BadgeDefinition {
  key: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'weight' | 'goal' | 'cheer'
  condition: string
}

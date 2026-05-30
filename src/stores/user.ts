import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const partnerProfile = ref<Profile | null>(null)

  const isLoggedIn = computed(() => !!user.value)
  const hasPartner = computed(() => !!profile.value?.partner_id)

  async function initSession() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) {
      await fetchProfile()
      if (profile.value?.partner_id) {
        await fetchPartnerProfile()
      }
    }
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (error) {
      console.error('Failed to fetch profile:', error.message)
      return
    }
    profile.value = data as Profile
  }

  async function fetchPartnerProfile() {
    if (!user.value || !profile.value?.partner_id) return
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.value.partner_id)
      .single()
    if (error) {
      console.error('Failed to fetch partner profile:', error.message)
      return
    }
    partnerProfile.value = data as Profile
  }

  async function signUp(email: string, password: string, nickname: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
    // Trigger auto-creates profile with nickname from user_metadata
    // If email confirmation is on, session will be null — user needs to verify first
    if (data.session) {
      user.value = data.user
      await fetchProfile()
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    await fetchProfile()
    if (profile.value?.partner_id) {
      await fetchPartnerProfile()
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    partnerProfile.value = null
  }

  async function updateNickname(nickname: string) {
    if (!user.value) return
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', user.value.id)
    if (error) throw error
    if (profile.value) {
      profile.value.nickname = nickname
    }
  }

  async function bindPartner(inviteCode: string) {
    if (!user.value) throw new Error('请先登录')

    const { data: partners, error: lookupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()
    if (lookupError) throw new Error('未找到该邀请码对应的用户')
    const partner = partners as Profile | null
    if (!partner) throw new Error('未找到该邀请码对应的用户')
    if (partner.id === user.value.id) throw new Error('不能绑定自己')

    const { error: updateError1 } = await supabase
      .from('profiles')
      .update({ partner_id: partner.id })
      .eq('id', user.value.id)
    if (updateError1) throw new Error(updateError1.message)

    const { error: updateError2 } = await supabase
      .from('profiles')
      .update({ partner_id: user.value.id })
      .eq('id', partner.id)
    if (updateError2) throw new Error(updateError2.message)

    await fetchProfile()
    await fetchPartnerProfile()
  }

  return {
    user,
    profile,
    partnerProfile,
    isLoggedIn,
    hasPartner,
    initSession,
    fetchProfile,
    fetchPartnerProfile,
    signUp,
    signIn,
    signOut,
    updateNickname,
    bindPartner,
  }
})

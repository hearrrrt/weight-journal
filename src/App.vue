<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/components/BottomNav.vue'
import BadgeToast from '@/components/BadgeToast.vue'
import { useBadgesStore } from '@/stores/badges'

const route = useRoute()
const showNav = computed(() => route.path !== '/auth')
const badgesStore = useBadgesStore()
</script>

<template>
  <router-view />
  <BottomNav v-if="showNav" />
  <BadgeToast :badges="badgesStore.newBadges" @close="badgesStore.clearNewBadges()" />
</template>

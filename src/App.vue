<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.path !== '/auth')
</script>

<template>
  <router-view />
  <BottomNav v-if="showNav" />
</template>

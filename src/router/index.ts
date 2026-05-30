import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthPage.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('@/views/GoalsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/badges',
      name: 'badges',
      component: () => import('@/views/BadgesPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/cheers',
      name: 'cheers',
      component: () => import('@/views/CheersPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

export default router

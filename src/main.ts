import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/style.css'
import { useUserStore } from './stores/user'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)

  try {
    const userStore = useUserStore()
    await userStore.initSession()
  } catch {
    // Supabase not configured — app runs in offline mode
    console.warn('Supabase not available, running in offline mode')
  }

  app.mount('#app')
}
bootstrap()

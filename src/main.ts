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

  const userStore = useUserStore()
  await userStore.initSession()

  app.mount('#app')
}
bootstrap()

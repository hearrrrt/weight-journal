import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
const type = ref<'success' | 'error' | 'info'>('info')
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(msg: string, t: 'success' | 'error' | 'info' = 'info') {
    message.value = msg
    type.value = t
    visible.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, 3000)
  }

  return { message, visible, type, show }
}

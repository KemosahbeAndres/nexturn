import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './firebase'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
})

app.mount('#app')

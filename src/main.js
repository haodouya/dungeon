import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadAuth } from './store/auth'
import { loadContent } from './store/content'
import { loadGame } from './store/game'
import './style.css'

async function boot() {
  await loadAuth()
  await loadContent()
  await loadGame()
  createApp(App).use(router).mount('#app')
}

boot()

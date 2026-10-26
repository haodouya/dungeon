import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import GameView from '../views/GameView.vue'
import HeroView from '../views/HeroView.vue'
import ShopView from '../views/ShopView.vue'
import ReportView from '../views/ReportView.vue'
import EditorView from '../views/EditorView.vue'
import DataView from '../views/DataView.vue'
import { user } from '../store/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/game', name: 'game', component: GameView, meta: { requiresAuth: true } },
    { path: '/hero', name: 'hero', component: HeroView, meta: { requiresAuth: true } },
    { path: '/shop', name: 'shop', component: ShopView, meta: { requiresAuth: true } },
    { path: '/report/:id', name: 'report', component: ReportView, meta: { requiresAuth: true } },
    { path: '/editor', name: 'editor', component: EditorView, meta: { requiresAdmin: true } },
    { path: '/data', name: 'data', component: DataView, meta: { requiresAdmin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin) {
    if (!user.value) return { path: '/login', query: { redirect: to.fullPath } }
    if (user.value.role !== 'admin') return { path: '/' }
  }
  if (to.meta.requiresAuth && !user.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && user.value) return { path: '/' }
  return true
})

export default router

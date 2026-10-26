<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { lang, toggleLang, tx } from './store/ui'
import { isAdmin, isLoggedIn, logout, user } from './store/auth'
import { hero, maxHp, resetGameState, serverNow } from './store/game'
import { getList } from './store/content'
import { t } from './i18n'

const router = useRouter()

const heroRace = computed(() => getList('races').find((entry) => entry.id === hero.value?.raceId))
const heroClass = computed(() => getList('classes').find((entry) => entry.id === hero.value?.classId))

const clock = ref('')
let timer = null

function tickClock() {
  clock.value = new Date(serverNow()).toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  tickClock()
  timer = setInterval(tickClock, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function doLogout() {
  await logout()
  resetGameState()
  router.push('/')
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">D</span>
        <span class="brand-text">
          <strong>{{ t('app.title') }}</strong>
          <small>{{ t('app.subtitle') }}</small>
        </span>
      </RouterLink>
      <nav class="app-nav">
        <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/game">{{ t('nav.game') }}</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/hero">{{ t('nav.hero') }}</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/shop">{{ t('nav.shop') }}</RouterLink>
        <RouterLink v-if="isAdmin" to="/editor">{{ t('nav.editor') }}</RouterLink>
        <RouterLink v-if="isAdmin" to="/data">{{ t('nav.data') }}</RouterLink>
      </nav>
      <div class="account-bar">
        <button class="btn ghost lang-btn" @click="toggleLang">{{ t('lang.toggle') }}</button>
        <template v-if="user">
          <span class="user-chip">
            {{ user.username }}
            <span v-if="isAdmin" class="role-tag">{{ t('nav.admin') }}</span>
          </span>
          <button class="btn small ghost" @click="doLogout">{{ t('nav.logout') }}</button>
        </template>
        <RouterLink v-else class="btn small" to="/login">{{ t('nav.login') }}</RouterLink>
      </div>
    </header>

    <div v-if="hero" class="status-strip">
      <strong>{{ hero.name }}</strong>
      <span class="muted">
        {{ tx(heroRace?.name, lang) }} · {{ tx(heroClass?.name, lang) }} · Lv {{ hero.level }}
      </span>
      <span>{{ t('game.hero.hp') }} <b class="mono">{{ hero.hp || 0 }}/{{ maxHp }}</b></span>
      <span>{{ t('game.hero.gold') }} <b class="mono">{{ hero.gold }}</b></span>
      <span>{{ t('game.hero.ep') }} <b class="mono">{{ hero.ep }}</b></span>
      <span class="status-clock">
        {{ t('status.serverTime') }} <b class="mono">{{ clock }}</b>
      </span>
    </div>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <span>
        {{
          tx(
            {
              zh: '规则基座：D&D 5.1 SRD（CC-BY-4.0）。本项目名称、文案与美术均自研。',
              en: 'Rules base: D&D 5.1 SRD (CC-BY-4.0). Names, text and art here are original.'
            },
            lang
          )
        }}
      </span>
      <span class="mono">SQLite · schema v1</span>
    </footer>
  </div>
</template>

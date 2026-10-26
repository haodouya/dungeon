<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, register } from '../store/auth'
import { loadGame } from '../store/game'
import { t } from '../i18n'

const route = useRoute()
const router = useRouter()

const mode = ref('login')
const form = ref({ username: '', password: '', confirm: '' })
const error = ref('')
const busy = ref(false)

const isRegister = computed(() => mode.value === 'register')
const submitLabel = computed(() => (isRegister.value ? t('auth.registerSubmit') : t('auth.loginSubmit')))

function switchMode(next) {
  if (mode.value === next) return
  mode.value = next
  error.value = ''
}

async function submit() {
  if (busy.value) return
  error.value = ''
  const username = form.value.username.trim()
  if (!username || !form.value.password) {
    error.value = t('auth.required')
    return
  }
  if (isRegister.value) {
    if (form.value.password.length < 8) {
      error.value = t('auth.passwordShort')
      return
    }
    if (form.value.password !== form.value.confirm) {
      error.value = t('auth.passwordMismatch')
      return
    }
  }

  busy.value = true
  try {
    if (isRegister.value) await register(username, form.value.password)
    else await login(username, form.value.password)
    await loadGame()
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/game'
    router.replace(redirect)
  } catch (err) {
    error.value = err?.message || t('auth.failed')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="view auth-view">
    <section class="card auth-card">
      <p class="hero-kicker">{{ t('auth.kicker') }}</p>
      <h1>{{ t('auth.title') }}</h1>
      <p class="muted">{{ t('auth.desc') }}</p>

      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: !isRegister }" @click="switchMode('login')">
          {{ t('auth.login') }}
        </button>
        <button class="auth-tab" :class="{ active: isRegister }" @click="switchMode('register')">
          {{ t('auth.register') }}
        </button>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label class="field">
          <span class="field-label">{{ t('auth.username') }}</span>
          <input
            v-model="form.username"
            :placeholder="t('auth.usernamePlaceholder')"
            autocomplete="username"
            maxlength="24"
          />
        </label>
        <label class="field">
          <span class="field-label">{{ t('auth.password') }}</span>
          <input
            v-model="form.password"
            type="password"
            :placeholder="t('auth.passwordPlaceholder')"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            maxlength="72"
          />
        </label>
        <label v-if="isRegister" class="field">
          <span class="field-label">{{ t('auth.confirm') }}</span>
          <input v-model="form.confirm" type="password" autocomplete="new-password" maxlength="72" />
        </label>

        <p v-if="error" class="notice bad">{{ error }}</p>

        <button class="btn primary auth-submit" type="submit" :disabled="busy">
          {{ busy ? t('auth.working') : submitLabel }}
        </button>
      </form>

      <p class="muted small auth-note">{{ t('auth.adminNote') }}</p>
    </section>
  </div>
</template>

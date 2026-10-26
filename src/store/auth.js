// 登录态：令牌存 localStorage，用户信息每次启动向服务器确认。
import { computed, ref } from 'vue'
import { api, getToken, setToken } from '../api'

export const user = ref(null)
export const authReady = ref(false)

export const isLoggedIn = computed(() => Boolean(user.value))
export const isAdmin = computed(() => user.value?.role === 'admin')

export async function loadAuth() {
  authReady.value = false
  if (!getToken()) {
    user.value = null
    authReady.value = true
    return null
  }
  try {
    const data = await api('/auth/me')
    user.value = data.user
  } catch {
    setToken('')
    user.value = null
  }
  authReady.value = true
  return user.value
}

export async function login(username, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    auth: false,
    body: { username, password }
  })
  setToken(data.token)
  user.value = data.user
  return data.user
}

export async function register(username, password) {
  const data = await api('/auth/register', {
    method: 'POST',
    auth: false,
    body: { username, password }
  })
  setToken(data.token)
  user.value = data.user
  return data.user
}

export async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' })
  } catch {
    // 网络失败也要清掉本地令牌
  }
  setToken('')
  user.value = null
}

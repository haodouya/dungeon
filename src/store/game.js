// 英雄、背包与战报：全部通过服务器 API 读写 SQLite，不在本地保存游戏进度。
// 冒险采用服务器计时：客户端只根据服务器返回的时间做倒计时展示。
import { computed, ref } from 'vue'
import { content } from './content'
import { buildHeroCombatant } from '../core/character'
import { api } from '../api'

export const hero = ref(null)
export const maxHp = ref(0)
export const reports = ref([])
export const activeAdventure = ref(null)
export const shopItems = ref([])
export const gameLoading = ref(false)
// 服务器时间 - 本地时间，用于校正倒计时，避免用户改本地时钟
export const serverOffset = ref(0)

export const hasHero = computed(() => Boolean(hero.value))

export function resetGameState() {
  hero.value = null
  maxHp.value = 0
  reports.value = []
  activeAdventure.value = null
  shopItems.value = []
}

function syncServerTime(serverTime) {
  const value = Date.parse(serverTime)
  if (Number.isFinite(value)) serverOffset.value = value - Date.now()
}

export function serverNow() {
  return Date.now() + serverOffset.value
}

function applyHeroData(data) {
  if (data?.hero !== undefined) hero.value = data.hero || null
  if (data?.maxHp !== undefined) maxHp.value = Number(data.maxHp) || 0
}

function prependReport(report) {
  if (!report) return
  reports.value = [report, ...reports.value.filter((entry) => entry.id !== report.id)].slice(0, 20)
}

export async function loadGame() {
  gameLoading.value = true
  try {
    const [heroData, reportData, activeData] = await Promise.all([
      api('/hero'),
      api('/reports'),
      api('/runs/active')
    ])
    applyHeroData(heroData)
    syncServerTime(heroData.serverTime)
    reports.value = Array.isArray(reportData.reports) ? reportData.reports : []

    syncServerTime(activeData.serverTime)
    if (activeData.report) {
      prependReport(activeData.report)
      applyHeroData(activeData)
    }
    activeAdventure.value = activeData.adventure || null
  } catch (error) {
    if (error.status === 401) {
      resetGameState()
    } else {
      console.warn('读取游戏存档失败', error)
    }
  } finally {
    gameLoading.value = false
  }
}

export async function createHero({ name, gender, raceId, classId }) {
  if (hero.value) return null
  const data = await api('/hero', {
    method: 'POST',
    body: { name, gender, raceId, classId }
  })
  applyHeroData(data)
  return data.hero
}

export async function deleteHero() {
  await api('/hero', { method: 'DELETE' })
  resetGameState()
}

export function heroView() {
  if (!hero.value || !content.value) return null
  return buildHeroCombatant(hero.value, content.value.entities, hero.value.tactics)
}

export async function saveTactics(tactics) {
  const data = await api('/hero/settings', { method: 'POST', body: { tactics } })
  syncServerTime(data.serverTime)
  applyHeroData(data)
  return data.hero
}

export async function loadShop() {
  const data = await api('/shop')
  syncServerTime(data.serverTime)
  shopItems.value = Array.isArray(data.items) ? data.items : []
  return shopItems.value
}

export async function buyItem(itemId) {
  const data = await api('/shop/buy', { method: 'POST', body: { itemId } })
  syncServerTime(data.serverTime)
  applyHeroData(data)
  return data
}

export async function sellItem(uid) {
  const data = await api('/shop/sell', { method: 'POST', body: { uid } })
  syncServerTime(data.serverTime)
  applyHeroData(data)
  return data
}

export async function equipItem(uid) {
  const data = await api('/hero/equip', { method: 'POST', body: { uid } })
  applyHeroData(data)
  return data.hero
}

export async function unequipItem(slot) {
  const data = await api('/hero/unequip', { method: 'POST', body: { slot } })
  applyHeroData(data)
  return data.hero
}

export async function useItem(uid) {
  const data = await api('/hero/use', { method: 'POST', body: { uid } })
  applyHeroData(data)
  return data
}

export async function startDungeon(dungeonId) {
  if (!hero.value) return null
  const data = await api('/runs', { method: 'POST', body: { dungeonId } })
  syncServerTime(data.serverTime)
  applyHeroData(data)
  activeAdventure.value = data.adventure || null
  return data.adventure
}

export async function pollAdventure() {
  const data = await api('/runs/active')
  syncServerTime(data.serverTime)
  activeAdventure.value = data.adventure || null
  if (data.report) {
    prependReport(data.report)
    applyHeroData(data)
  }
  return { adventure: data.adventure, report: data.report || null }
}

// 当前英雄今天剩余的地城次数（服务器同样会校验）
export function runsLeftToday(dungeon) {
  if (!hero.value || !dungeon) return Infinity
  const limit = Number(dungeon.dailyLimit) || 4
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
  const used = hero.value.runsDate === today ? hero.value.runsToday || 0 : 0
  return Math.max(0, limit - used)
}

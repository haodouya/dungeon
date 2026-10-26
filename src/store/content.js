// 内容库：从服务器 SQLite 读取；所有写操作都直达后端数据库。
// 本地只保留一份响应式副本用于渲染与校验，不再写 localStorage。
import { computed, ref } from 'vue'
import { ENTITY_KEYS, SCHEMA_VERSION, normalizeEntity, uniqueId } from '../data/schema'
import { seedContent } from '../data/seed'
import { validateContent } from '../core/validate'
import { api } from '../api'

const clone = (value) => JSON.parse(JSON.stringify(value))

export const content = ref(null)
export const loaded = ref(false)

export const issues = computed(() => (content.value ? validateContent(content.value) : []))
export const errorCount = computed(() => issues.value.filter((i) => i.level === 'error').length)
export const warnCount = computed(() => issues.value.filter((i) => i.level === 'warn').length)

export const counts = computed(() => {
  const out = {}
  let total = 0
  for (const type of ENTITY_KEYS) {
    const length = content.value?.entities?.[type]?.length || 0
    out[type] = length
    total += length
  }
  out.total = total
  return out
})

function shapePack(pack) {
  const meta = pack?.meta && typeof pack.meta === 'object' ? clone(pack.meta) : {}
  if (typeof meta.name === 'string') meta.name = { en: meta.name, zh: meta.name }
  if (!meta.name) meta.name = { zh: '未命名内容包', en: 'Untitled pack' }
  if (!meta.version) meta.version = '1.0.0'
  if (!meta.updatedAt) meta.updatedAt = ''

  const out = { schemaVersion: SCHEMA_VERSION, meta, entities: {} }
  for (const type of ENTITY_KEYS) {
    const list = Array.isArray(pack?.entities?.[type]) ? pack.entities[type] : []
    out.entities[type] = list
      .filter((rec) => rec && typeof rec === 'object')
      .map((rec) => normalizeEntity(type, rec))
  }
  return out
}

export async function loadContent() {
  if (loaded.value) return content.value
  try {
    content.value = shapePack(await api('/content', { auth: false }))
  } catch (error) {
    // 后端未启动时用内置初始内容兜底，保证界面可打开；写操作仍会失败并提示。
    console.warn('内容加载失败，暂用内置初始内容', error)
    content.value = shapePack(clone(seedContent))
  }
  loaded.value = true
  return content.value
}

function touchMeta() {
  if (content.value?.meta) content.value.meta.updatedAt = new Date().toISOString().slice(0, 10)
}

export function getList(type) {
  return content.value?.entities?.[type] || []
}

export function findEntity(type, id) {
  return getList(type).find((rec) => rec.id === id) || null
}

export function buildDraft(type) {
  const draft = normalizeEntity(type, {
    id: '',
    name: { en: '', zh: '' }
  })
  draft.id = uniqueId(type, getList(type), '')
  return draft
}

function replaceLocal(type, saved) {
  const list = content.value?.entities?.[type]
  if (!list) return saved
  const index = list.findIndex((rec) => rec.id === saved.id)
  if (index >= 0) list[index] = saved
  else list.push(saved)
  touchMeta()
  return saved
}

// 新建或更新一条记录：写入服务器数据库后，再同步本地副本
export async function upsertEntity(type, record) {
  const normalized = normalizeEntity(type, clone(record))
  const exists = getList(type).some((rec) => rec.id === normalized.id)
  const data = exists
    ? await api(`/content/${type}/${encodeURIComponent(normalized.id)}`, {
        method: 'PUT',
        body: normalized
      })
    : await api(`/content/${type}`, { method: 'POST', body: normalized })
  return replaceLocal(type, data.entity)
}

export async function deleteEntity(type, id) {
  await api(`/content/${type}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const list = content.value?.entities?.[type]
  if (!list) return false
  const index = list.findIndex((rec) => rec.id === id)
  if (index < 0) return false
  list.splice(index, 1)
  touchMeta()
  return true
}

export async function duplicateEntity(type, id) {
  const source = findEntity(type, id)
  if (!source) return null
  const copy = clone(source)
  copy.id = uniqueId(type, getList(type), `${id}-copy`)
  copy.name = {
    zh: `${source.name?.zh || source.name?.en || ''}（副本）`,
    en: `${source.name?.en || source.name?.zh || ''} (copy)`
  }
  return upsertEntity(type, copy)
}

export async function resetContent() {
  content.value = shapePack(await api('/content/reset', { method: 'POST' }))
  return content.value
}

export function exportJson() {
  return JSON.stringify(content.value, null, 2)
}

export async function importJson(text) {
  let pack
  try {
    pack = JSON.parse(text)
  } catch {
    const error = new Error('invalid json')
    error.code = 'INVALID_JSON'
    throw error
  }
  if (!pack || typeof pack !== 'object' || !pack.entities) {
    const error = new Error('invalid pack')
    error.code = 'INVALID_PACK'
    throw error
  }
  content.value = shapePack(await api('/content/import', { method: 'POST', body: pack }))
  return content.value
}

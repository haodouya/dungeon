// 地城冒险后端：HTTP API + SQLite + 静态站点托管。
// 运行：node server/index.js（默认 http://127.0.0.1:8787）
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRng } from '../src/core/rng.js'
import { buildHeroCombatant, normalizeTactics } from '../src/core/character.js'
import { runDungeonRun } from '../src/core/dungeon.js'
import { ENTITY_KEYS, SCHEMA_VERSION } from '../src/data/schema.js'
import * as store from './db.js'
import { validatePassword, validateUsername, verifyPassword } from './auth.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(HERE, '../dist')
const PORT = Number(process.env.PORT || 8787)
// 默认监听 0.0.0.0，云平台（Render 等）的端口扫描才能检测到；本地访问不受影响
const HOST = process.env.HOST || '0.0.0.0'

class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const fail = (status, code, message) => {
  throw new ApiError(status, code, message)
}

const todayIn = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body)
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 5 * 1024 * 1024) {
        reject(new ApiError(413, 'BODY_TOO_LARGE', '请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve(null)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new ApiError(400, 'INVALID_JSON', 'JSON 格式错误'))
      }
    })
    req.on('error', reject)
  })
}

function bearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

function currentUser(req) {
  const user = store.sessionUser(bearerToken(req))
  if (!user) fail(401, 'UNAUTHORIZED', '请先登录')
  return user
}

function requireAdmin(req) {
  const user = currentUser(req)
  if (user.role !== 'admin') fail(403, 'FORBIDDEN', '需要管理员权限')
  return user
}

function publicUser(user) {
  return { id: user.id, username: user.username, role: user.role }
}

/* ---------------------------- 业务处理 ---------------------------- */

function findEntity(entities, type, id) {
  return (entities[type] || []).find((rec) => rec.id === id) || null
}

function pickLoot(rooms, tables, rng) {
  const ids = []
  for (const room of rooms) {
    const table = tables.find((entry) => entry.id === room.lootTableId)
    for (const itemId of table?.itemIds || []) {
      if (!ids.includes(itemId)) ids.push(itemId)
    }
  }
  if (!ids.length) return []
  const picked = []
  const count = ids.length > 1 && rng() > 0.45 ? 2 : 1
  while (picked.length < count && ids.length) {
    const index = Math.floor(rng() * ids.length)
    const [itemId] = ids.splice(index, 1)
    picked.push(itemId)
  }
  return picked
}

function levelUp(hero) {
  let gained = 0
  while (hero.ep >= hero.level * 300) {
    hero.ep -= hero.level * 300
    hero.level += 1
    gained += 1
  }
  return gained
}

const REGEN_MINUTES = 10
const nowIso = () => new Date().toISOString()
const newUid = (prefix = 'inv') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const isEquippable = (item) =>
  ['weapon', 'armor', 'accessory'].includes(item?.type) && item?.slot && item.slot !== 'pocket'

function heroMaxHp(hero, entities) {
  return buildHeroCombatant(hero, entities).maxHp
}

// 体力按服务器时间恢复：每 10 分钟 1 点；旧存档（没有 hpAt）视为满体力。
function regenHero(userId, hero, entities) {
  if (!hero) return null
  const maxHp = heroMaxHp(hero, entities)
  let hp = Number.isFinite(hero.hp) && hero.hp > 0 ? hero.hp : hero.hpAt ? 0 : maxHp
  let hpAtMs = hero.hpAt ? Date.parse(hero.hpAt) : Date.now()
  if (!Number.isFinite(hpAtMs)) hpAtMs = Date.now()
  let changed = false

  if (!hero.hpAt) {
    hp = maxHp
    changed = true
  }
  if (hp > maxHp) {
    hp = maxHp
    changed = true
  }
  if (hp < maxHp) {
    const ticks = Math.floor((Date.now() - hpAtMs) / (REGEN_MINUTES * 60000))
    if (ticks > 0) {
      const next = Math.min(maxHp, hp + ticks)
      if (next !== hp) {
        hp = next
        hpAtMs += ticks * REGEN_MINUTES * 60000
        changed = true
      }
    }
  }

  hero.hp = hp
  hero.hpAt = new Date(hpAtMs).toISOString()
  if (changed) return store.updateHero(userId, hero)
  return hero
}

function clearSlotConflicts(inventory, slot, keepUid) {
  for (const inst of inventory) {
    if (inst.uid === keepUid || !inst.equipped) continue
    if (inst.equipped === slot) inst.equipped = ''
    if (slot === 'bothHands' && ['rightHand', 'leftHand'].includes(inst.equipped)) inst.equipped = ''
    if (['rightHand', 'leftHand'].includes(slot) && inst.equipped === 'bothHands') inst.equipped = ''
  }
}

function addItemInstance(inventory, item) {
  const qty = item.consumable ? Math.max(1, Number(item.charges) || 1) : 1
  inventory.push({ uid: newUid(), itemId: item.id, qty, equipped: '' })
}

function addStarterItems(inventory, cls, entities) {
  for (const itemId of cls?.startingItemIds || []) {
    const item = findEntity(entities, 'items', itemId)
    if (!item) continue
    const uid = newUid()
    const equipped = isEquippable(item) && !inventory.some((inst) => inst.equipped === item.slot) ? item.slot : ''
    const qty = item.consumable ? Math.max(1, Number(item.charges) || 1) : 1
    inventory.push({ uid, itemId: item.id, qty, equipped })
  }
}

function publicAdventure(adventure) {
  if (!adventure) return null
  return {
    id: adventure.id,
    dungeonId: adventure.dungeonId,
    status: adventure.status,
    startedAt: adventure.startedAt,
    completesAt: adventure.completesAt,
    hpStart: adventure.hpStart,
    reportId: adventure.reportId
  }
}

// 冒险进行中（pending）锁定装备、物品与商店操作，避免中途改变战斗结果
function assertAdventureUnlocked(userId) {
  if (store.getActiveAdventure(userId)) {
    fail(409, 'ADVENTURE_LOCKED', '冒险进行中，装备、物品与商店操作已锁定')
  }
}

const buyPrice = (item) => Math.max(1, Math.floor(Number(item?.value) || 0))
const sellPrice = (item) => Math.max(1, Math.floor(buyPrice(item) * 0.5))

function shopRecord(item) {
  return {
    id: item.id,
    name: item.name,
    desc: item.desc,
    type: item.type,
    slot: item.slot,
    levelReq: item.levelReq || 1,
    value: item.value,
    buyPrice: buyPrice(item),
    sellPrice: sellPrice(item),
    damageType: item.damageType,
    attackBonus: item.attackBonus || 0,
    defenseBonus: item.defenseBonus || 0,
    initiativeBonus: item.initiativeBonus || 0,
    absorbNormal: item.absorbNormal || 0,
    absorbGood: item.absorbGood || 0,
    absorbCritical: item.absorbCritical || 0,
    damageNormal: item.damageNormal || 0,
    damageGood: item.damageGood || 0,
    damageCritical: item.damageCritical || 0,
    consumable: Boolean(item.consumable),
    charges: item.charges || 0,
    useEffect: item.useEffect || 'none',
    effectAmount: item.effectAmount || 0
  }
}

function settleAdventure(user, adventure) {
  if (!adventure) return null
  const hero = store.getHero(user.id)
  if (!hero) fail(400, 'NO_HERO', '请先创建英雄')
  const pack = store.getContentPack()
  const entities = pack.entities
  const dungeon = findEntity(entities, 'dungeons', adventure.dungeonId)
  if (!dungeon) fail(404, 'DUNGEON_NOT_FOUND', '地城不存在')

  const layers = entities.layers.filter((layer) => layer.dungeonId === dungeon.id)
  const layerIds = new Set(layers.map((layer) => layer.id))
  const rooms = entities.rooms.filter((room) => layerIds.has(room.layerId))

  // 使用出发时保存的英雄快照，避免中途换装改变结果
  const heroCombat = { ...(adventure.snapshot || {}) }
  const maxHp = Number(heroCombat.maxHp) || heroMaxHp(hero, entities)
  heroCombat.maxHp = maxHp
  heroCombat.hp = Math.max(1, Math.min(Number(adventure.hpStart) || maxHp, maxHp))

  const result = runDungeonRun({
    heroCombat,
    dungeon,
    layers,
    rooms,
    monsters: entities.monsters,
    seed: adventure.seed
  })
  const victory = result.outcome === 'victory'
  const ep = victory ? result.kills * 35 + 60 : result.kills * 18 + 5
  const gold = victory ? result.kills * 6 + 20 : result.kills * 3
  const lootIds = victory ? pickLoot(rooms, entities.lootTables, createRng(`${adventure.seed}:loot`)) : []
  const lootItems = lootIds.map((id) => findEntity(entities, 'items', id)).filter(Boolean)
  const loot = lootItems.map((item) => ({ id: item.id, name: item.name }))

  const nextHero = {
    ...hero,
    ep: hero.ep + ep,
    gold: hero.gold + gold,
    runs: hero.runs + 1,
    hp: result.heroHp,
    hpAt: nowIso(),
    inventory: hero.inventory.map((inst) => ({ ...inst }))
  }
  const leveled = levelUp(nextHero)
  for (const item of lootItems) addItemInstance(nextHero.inventory, item)
  store.updateHero(user.id, nextHero)

  const report = {
    id: `report-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    dungeonId: dungeon.id,
    dungeonName: dungeon.name,
    heroName: nextHero.name,
    seed: adventure.seed,
    createdAt: nowIso(),
    startedAt: adventure.startedAt,
    completesAt: adventure.completesAt,
    durationMinutes:
      Number(dungeon.durationMinutes) ||
      Math.max(
        1,
        Math.round((Date.parse(adventure.completesAt) - Date.parse(adventure.startedAt)) / 60000)
      ),
    outcome: result.outcome,
    kills: result.kills,
    chapters: result.chapters,
    stats: result.stats,
    tactics: heroCombat.tactics || normalizeTactics(hero.tactics),
    loadout: {
      weapon: heroCombat.weaponName || heroCombat.weapon?.name || null,
      items: (heroCombat.items || []).map((item) => ({ id: item.id, name: item.name })),
      attackAvg: heroCombat.attackAvg || 0,
      defenseAvg: heroCombat.defenseAvg || 0,
      absorb: heroCombat.absorb || { normal: 0, good: 0, critical: 0 }
    },
    heroStart: { hp: adventure.hpStart, maxHp },
    heroEnd: { hp: result.heroHp, maxHp },
    reward: { ep, gold, items: loot },
    heroAfter: {
      level: nextHero.level,
      ep: nextHero.ep,
      gold: nextHero.gold,
      hp: nextHero.hp,
      maxHp,
      leveled
    }
  }
  store.insertReport(user.id, report)
  store.completeAdventure(user.id, adventure.id, report.id)
  return report
}

function startAdventure(user, dungeonId) {
  const existing = store.getActiveAdventure(user.id)
  if (existing) {
    if (Date.now() >= Date.parse(existing.completesAt)) {
      settleAdventure(user, existing)
    } else {
      fail(409, 'ADVENTURE_ACTIVE', '已有一场冒险正在进行，请等待倒计时结束')
    }
  }

  const hero = store.getHero(user.id)
  if (!hero) fail(400, 'NO_HERO', '请先创建英雄')

  const pack = store.getContentPack()
  const entities = pack.entities
  const dungeon = findEntity(entities, 'dungeons', dungeonId)
  if (!dungeon) fail(404, 'DUNGEON_NOT_FOUND', '地城不存在')
  if (hero.level < (dungeon.minLevel || 1)) fail(403, 'LEVEL_TOO_LOW', '英雄等级不足')

  const refreshed = regenHero(user.id, hero, entities)
  if (refreshed.hp <= 0) fail(400, 'DOWNED', '英雄体力耗尽，请使用治疗物品或等待恢复')

  const limit = Number(dungeon.dailyLimit) || 4
  const today = todayIn()
  const runsToday = refreshed.runsDate === today ? refreshed.runsToday : 0
  if (runsToday >= limit) {
    fail(429, 'DAILY_LIMIT', `今天的地城次数已用完（每天最多 ${limit} 次）`)
  }

  const heroCombat = buildHeroCombatant(refreshed, entities, refreshed.tactics)
  heroCombat.hp = Math.min(refreshed.hp, heroCombat.maxHp)

  const durationMinutes = Math.max(1, Number(dungeon.durationMinutes) || 5)
  const startedAt = new Date()
  const completesAt = new Date(startedAt.getTime() + durationMinutes * 60000)
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`

  const adventure = store.createAdventure(user.id, {
    id: `adv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    dungeonId: dungeon.id,
    seed,
    startedAt: startedAt.toISOString(),
    completesAt: completesAt.toISOString(),
    snapshot: heroCombat,
    hpStart: heroCombat.hp
  })

  store.updateHero(user.id, {
    ...refreshed,
    runsToday: runsToday + 1,
    runsDate: today
  })

  return {
    adventure: publicAdventure(adventure),
    dungeon: { id: dungeon.id, name: dungeon.name, durationMinutes },
    hero: store.getHero(user.id),
    serverTime: nowIso()
  }
}

/* ---------------------------- API 路由 ---------------------------- */

async function handleApi(req, res, url) {
  const method = req.method
  const segments = url.pathname.split('/').filter(Boolean).slice(1) // 去掉 /api

  if (segments[0] === 'health' && method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      schemaVersion: SCHEMA_VERSION,
      entityTypes: ENTITY_KEYS.length,
      database: store.DB_PATH
    })
  }

  if (segments[0] === 'auth') {
    const action = segments[1]

    if (action === 'register' && method === 'POST') {
      const body = await readBody(req)
      const username = String(body?.username || '').trim()
      const password = String(body?.password || '')
      if (!validateUsername(username)) {
        fail(400, 'INVALID_USERNAME', '用户名需为 3~24 个字母、数字、下划线或中文')
      }
      if (!validatePassword(password)) {
        fail(400, 'INVALID_PASSWORD', '密码需为 8~72 个字符')
      }
      if (store.findUserByUsername(username)) {
        fail(409, 'USERNAME_TAKEN', '用户名已被占用')
      }
      const userId = store.createUser(username, password, 'user')
      const token = store.createSession(userId)
      const user = store.findUserById(userId)
      return sendJson(res, 201, { token, user: publicUser(user) })
    }

    if (action === 'login' && method === 'POST') {
      const body = await readBody(req)
      const username = String(body?.username || '').trim()
      const password = String(body?.password || '')
      const row = store.findUserByUsername(username)
      if (!row || !verifyPassword(password, row.password_hash)) {
        fail(401, 'INVALID_CREDENTIALS', '用户名或密码错误')
      }
      const token = store.createSession(row.id)
      return sendJson(res, 200, { token, user: publicUser(row) })
    }

    if (action === 'logout' && method === 'POST') {
      const token = bearerToken(req)
      if (token) store.deleteSession(token)
      return sendJson(res, 200, { ok: true })
    }

    if (action === 'me' && method === 'GET') {
      const user = currentUser(req)
      return sendJson(res, 200, { user: publicUser(user) })
    }
  }

  if (segments[0] === 'content') {
    const action = segments[1]

    if (!action && method === 'GET') {
      return sendJson(res, 200, store.getContentPack())
    }

    if (action === 'export' && method === 'GET') {
      requireAdmin(req)
      return sendJson(res, 200, store.getContentPack())
    }

    if (action === 'import' && method === 'POST') {
      requireAdmin(req)
      const body = await readBody(req)
      try {
        return sendJson(res, 200, store.importContent(body))
      } catch (error) {
        if (error.code === 'VERSION_TOO_NEW') fail(409, error.code, error.message)
        if (error.code === 'INVALID_PACK') fail(400, error.code, error.message)
        throw error
      }
    }

    if (action === 'reset' && method === 'POST') {
      requireAdmin(req)
      return sendJson(res, 200, store.resetContent())
    }

    const type = action
    if (type && !segments[2] && method === 'POST') {
      requireAdmin(req)
      const body = await readBody(req)
      try {
        return sendJson(res, 201, { entity: store.saveEntity(type, body) })
      } catch (error) {
        if (error.code === 'INVALID_ID' || error.code === 'INVALID_ENTITY' || error.code === 'UNKNOWN_TYPE') {
          fail(400, error.code, error.message)
        }
        throw error
      }
    }

    if (type && segments[2] && method === 'PUT') {
      requireAdmin(req)
      const body = await readBody(req)
      try {
        return sendJson(res, 200, { entity: store.saveEntity(type, { ...body, id: segments[2] }) })
      } catch (error) {
        if (error.code === 'INVALID_ID' || error.code === 'INVALID_ENTITY' || error.code === 'UNKNOWN_TYPE') {
          fail(400, error.code, error.message)
        }
        throw error
      }
    }

    if (type && segments[2] && method === 'DELETE') {
      requireAdmin(req)
      const deleted = store.removeEntity(type, segments[2])
      return sendJson(res, 200, { ok: true, deleted })
    }
  }

  if (segments[0] === 'hero') {
    const user = currentUser(req)
    const action = segments[1]

    if (!action && method === 'GET') {
      const pack = store.getContentPack()
      const hero = regenHero(user.id, store.getHero(user.id), pack.entities)
      return sendJson(res, 200, {
        hero,
        maxHp: hero ? heroMaxHp(hero, pack.entities) : 0,
        serverTime: nowIso()
      })
    }

    if (!action && method === 'POST') {
      if (store.getHero(user.id)) fail(409, 'HERO_EXISTS', '已存在英雄，请先删除')
      const body = await readBody(req)
      const name = String(body?.name || '').trim()
      if (name.length < 1 || name.length > 24) fail(400, 'INVALID_NAME', '英雄名字需为 1~24 个字符')
      const pack = store.getContentPack()
      const race = findEntity(pack.entities, 'races', body?.raceId)
      const cls = findEntity(pack.entities, 'classes', body?.classId)
      if (!race || !cls) fail(400, 'INVALID_HERO', '种族或职业不存在')
      if (race.allowedClassIds?.length && !race.allowedClassIds.includes(cls.id)) {
        fail(400, 'INVALID_HERO', '该种族不能选择这个职业')
      }
      if (cls.allowedRaceIds?.length && !cls.allowedRaceIds.includes(race.id)) {
        fail(400, 'INVALID_HERO', '该职业不能选择这个种族')
      }
      const inventory = []
      addStarterItems(inventory, cls, pack.entities)
      const maxHp = cls.baseHp || 10
      const hero = store.insertHero(user.id, {
        name,
        gender: body?.gender === 'male' ? 'male' : 'female',
        raceId: race.id,
        classId: cls.id,
        level: 1,
        ep: 0,
        gold: 30,
        runs: 0,
        runsToday: 0,
        runsDate: '',
        inventory,
        hp: maxHp,
        hpAt: nowIso()
      })
      return sendJson(res, 201, { hero, maxHp })
    }

    if (!action && method === 'DELETE') {
      store.deleteHero(user.id)
      return sendJson(res, 200, { ok: true })
    }

    const hero = store.getHero(user.id)
    if (!hero) fail(400, 'NO_HERO', '请先创建英雄')
    const pack = store.getContentPack()
    const entities = pack.entities
    const body = action ? await readBody(req) : null

    if (action === 'settings' && method === 'POST') {
      const tactics = normalizeTactics(body?.tactics || body)
      const updated = store.updateHero(user.id, { ...hero, tactics })
      return sendJson(res, 200, {
        hero: updated,
        maxHp: heroMaxHp(updated, entities),
        serverTime: nowIso()
      })
    }

    if (action === 'equip' && method === 'POST') {
      assertAdventureUnlocked(user.id)
      const uid = String(body?.uid || '')
      const inst = hero.inventory.find((entry) => entry.uid === uid)
      if (!inst) fail(404, 'ITEM_NOT_FOUND', '背包中没有这件物品')
      const item = findEntity(entities, 'items', inst.itemId)
      if (!item) fail(404, 'ITEM_NOT_FOUND', '物品定义不存在')
      if (!isEquippable(item)) fail(400, 'NOT_EQUIPPABLE', '这件物品不能装备')
      if ((item.levelReq || 1) > hero.level) fail(403, 'LEVEL_TOO_LOW', '英雄等级不足，无法装备')
      if (item.usableClassIds?.length && !item.usableClassIds.includes(hero.classId)) {
        fail(403, 'CLASS_RESTRICTED', '该职业不能使用这件物品')
      }
      if (item.usableRaceIds?.length && !item.usableRaceIds.includes(hero.raceId)) {
        fail(403, 'RACE_RESTRICTED', '该种族不能使用这件物品')
      }
      clearSlotConflicts(hero.inventory, item.slot, inst.uid)
      inst.equipped = item.slot
      const updated = store.updateHero(user.id, hero)
      return sendJson(res, 200, { hero: updated, maxHp: heroMaxHp(updated, entities) })
    }

    if (action === 'unequip' && method === 'POST') {
      assertAdventureUnlocked(user.id)
      const slot = String(body?.slot || '')
      let changed = false
      for (const inst of hero.inventory) {
        if (inst.equipped === slot) {
          inst.equipped = ''
          changed = true
        }
      }
      if (!changed) fail(400, 'SLOT_EMPTY', '这个槽位没有装备')
      const updated = store.updateHero(user.id, hero)
      return sendJson(res, 200, { hero: updated, maxHp: heroMaxHp(updated, entities) })
    }

    if (action === 'use' && method === 'POST') {
      assertAdventureUnlocked(user.id)
      const uid = String(body?.uid || '')
      const inst = hero.inventory.find((entry) => entry.uid === uid)
      if (!inst) fail(404, 'ITEM_NOT_FOUND', '背包中没有这件物品')
      const item = findEntity(entities, 'items', inst.itemId)
      if (!item) fail(404, 'ITEM_NOT_FOUND', '物品定义不存在')
      if (!item.consumable) fail(400, 'NOT_CONSUMABLE', '这件物品不能使用')
      const effect = item.useEffect || 'none'
      const amount = Number(item.effectAmount) || 0
      if (effect === 'none' || amount <= 0) fail(400, 'NO_EFFECT', '这件物品没有可使用效果')

      const maxHp = heroMaxHp(hero, entities)
      const nextHero = { ...hero, inventory: hero.inventory.map((entry) => ({ ...entry })) }
      if (effect === 'heal') {
        nextHero.hp = Math.min(maxHp, (nextHero.hp || 0) + amount)
        nextHero.hpAt = nowIso()
      } else if (effect === 'ep') {
        nextHero.ep += amount
        levelUp(nextHero)
      } else if (effect === 'gold') {
        nextHero.gold += amount
      }

      const target = nextHero.inventory.find((entry) => entry.uid === uid)
      target.qty -= 1
      if (target.equipped) target.equipped = ''
      if (target.qty <= 0) {
        nextHero.inventory = nextHero.inventory.filter((entry) => entry.uid !== uid)
      }
      const updated = store.updateHero(user.id, nextHero)
      return sendJson(res, 200, {
        hero: updated,
        maxHp,
        effect: { type: effect, amount }
      })
    }
  }

  if (segments[0] === 'shop') {
    const user = currentUser(req)
    const action = segments[1]
    const pack = store.getContentPack()

    if (!action && method === 'GET') {
      const items = (pack.entities.items || [])
        .filter((item) => Number(item.value) > 0)
        .map(shopRecord)
        .sort((a, b) => a.levelReq - b.levelReq || a.buyPrice - b.buyPrice || a.id.localeCompare(b.id))
      return sendJson(res, 200, { items, serverTime: nowIso() })
    }

    if (action === 'buy' && method === 'POST') {
      const hero = store.getHero(user.id)
      if (!hero) fail(400, 'NO_HERO', '请先创建英雄')
      assertAdventureUnlocked(user.id)
      const body = await readBody(req)
      const item = findEntity(pack.entities, 'items', String(body?.itemId || ''))
      if (!item) fail(404, 'ITEM_NOT_FOUND', '物品定义不存在')
      if (Number(item.value) <= 0) fail(400, 'NOT_FOR_SALE', '这件物品不出售')
      if ((item.levelReq || 1) > hero.level) fail(403, 'LEVEL_TOO_LOW', '英雄等级不足，无法购买')

      const price = buyPrice(item)
      if (hero.gold < price) fail(402, 'NOT_ENOUGH_GOLD', '金币不足')
      const nextHero = {
        ...hero,
        gold: hero.gold - price,
        inventory: hero.inventory.map((inst) => ({ ...inst }))
      }
      addItemInstance(nextHero.inventory, item)
      const updated = store.updateHero(user.id, nextHero)
      return sendJson(res, 200, {
        hero: updated,
        maxHp: heroMaxHp(updated, pack.entities),
        price,
        item: shopRecord(item),
        serverTime: nowIso()
      })
    }

    if (action === 'sell' && method === 'POST') {
      const hero = store.getHero(user.id)
      if (!hero) fail(400, 'NO_HERO', '请先创建英雄')
      assertAdventureUnlocked(user.id)
      const body = await readBody(req)
      const uid = String(body?.uid || '')
      const inst = hero.inventory.find((entry) => entry.uid === uid)
      if (!inst) fail(404, 'ITEM_NOT_FOUND', '背包中没有这件物品')
      const item = findEntity(pack.entities, 'items', inst.itemId)
      if (!item) fail(404, 'ITEM_NOT_FOUND', '物品定义不存在')
      const refund = sellPrice(item)
      if (refund <= 0) fail(400, 'NOT_SELLABLE', '这件物品无法出售')

      const nextHero = {
        ...hero,
        gold: hero.gold + refund,
        inventory: hero.inventory.filter((entry) => entry.uid !== uid)
      }
      const updated = store.updateHero(user.id, nextHero)
      return sendJson(res, 200, {
        hero: updated,
        maxHp: heroMaxHp(updated, pack.entities),
        refund,
        item: shopRecord(item),
        serverTime: nowIso()
      })
    }
  }

  if (segments[0] === 'reports' && method === 'GET') {
    const user = currentUser(req)
    if (segments[1]) {
      const report = store.getReport(user.id, segments[1])
      if (!report) fail(404, 'REPORT_NOT_FOUND', '找不到这条战报')
      return sendJson(res, 200, { report })
    }
    return sendJson(res, 200, { reports: store.listReports(user.id) })
  }

  if (segments[0] === 'runs') {
    const user = currentUser(req)

    if (method === 'POST' && !segments[1]) {
      const body = await readBody(req)
      const dungeonId = String(body?.dungeonId || '')
      return sendJson(res, 200, startAdventure(user, dungeonId))
    }

    if (method === 'GET' && segments[1] === 'active') {
      let adventure = store.getActiveAdventure(user.id)
      let report = null
      if (adventure && Date.now() >= Date.parse(adventure.completesAt)) {
        report = settleAdventure(user, adventure)
        adventure = store.getAdventure(user.id, adventure.id)
      }
      return sendJson(res, 200, {
        adventure: publicAdventure(adventure),
        report,
        hero: report ? store.getHero(user.id) : undefined,
        serverTime: nowIso()
      })
    }

    if (method === 'POST' && segments[1] && segments[2] === 'claim') {
      const adventure = store.getAdventure(user.id, segments[1])
      if (!adventure) fail(404, 'ADVENTURE_NOT_FOUND', '找不到这场冒险')
      if (adventure.status === 'complete') {
        return sendJson(res, 200, {
          adventure: publicAdventure(adventure),
          report: store.getReport(user.id, adventure.reportId),
          hero: store.getHero(user.id),
          serverTime: nowIso()
        })
      }
      if (Date.now() < Date.parse(adventure.completesAt)) {
        fail(409, 'TOO_EARLY', '冒险尚未结束')
      }
      const report = settleAdventure(user, adventure)
      return sendJson(res, 200, {
        adventure: publicAdventure(store.getAdventure(user.id, adventure.id)),
        report,
        hero: store.getHero(user.id),
        serverTime: nowIso()
      })
    }
  }

  fail(404, 'NOT_FOUND', '接口不存在')
}

/* ---------------------------- 静态站点 ---------------------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
  })
  fs.createReadStream(filePath).pipe(res)
}

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    return res.end()
  }
  let pathname = '/'
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    pathname = '/'
  }
  if (pathname === '/' || pathname === '') pathname = '/index.html'
  const candidate = path.resolve(DIST_DIR, `.${pathname}`)
  if (candidate.startsWith(DIST_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return sendFile(res, candidate)
  }
  const indexFile = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexFile)) {
    return sendFile(res, indexFile)
  }
  res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('前端尚未构建：请先运行 npm run build，或使用 npm run dev 启动开发服务器。')
}

/* ---------------------------- 启动 ---------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`)
  if (url.pathname.startsWith('/api/')) {
    try {
      await handleApi(req, res, url)
    } catch (error) {
      if (error instanceof ApiError) {
        return sendJson(res, error.status, { error: { code: error.code, message: error.message } })
      }
      console.error('[api]', error)
      return sendJson(res, 500, { error: { code: 'INTERNAL', message: '服务器内部错误' } })
    }
    return
  }
  serveStatic(req, res, url)
})

const admin = store.ensureAdmin()
if (admin.created) {
  console.log('==============================================')
  console.log('已创建默认管理员（请登录后尽快在后台修改密码）')
  console.log(`  用户名：${admin.username}`)
  console.log(`  密码：${admin.password}`)
  console.log('  修改方式：node server/admin.js set <用户名> <新密码>')
  console.log('==============================================')
}

server.listen(PORT, HOST, () => {
  console.log(`地城冒险服务已启动：http://${HOST}:${PORT}`)
  console.log(`SQLite 数据库：${store.DB_PATH}`)
  console.log(`前端目录：${DIST_DIR}（未构建时请运行 npm run build）`)
})

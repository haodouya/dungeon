// SQLite 数据层：用户、会话、英雄、战报、内容实体。
// 使用 Node 内置 node:sqlite，无需额外原生依赖。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { ENTITY_KEYS, isValidId, normalizeEntity, SCHEMA_VERSION } from '../src/data/schema.js'
import { normalizeTactics } from '../src/core/character.js'
import { seedContent } from '../src/data/seed.js'
import { validateContent } from '../src/core/validate.js'
import { hashPassword } from './auth.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(HERE, 'data')
export const DB_PATH = process.env.DUNGEON_DB || path.join(DATA_DIR, 'dungeon.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

const now = () => new Date().toISOString()
const clone = (value) => JSON.parse(JSON.stringify(value))

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS heroes (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'female',
    race_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    ep INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    runs INTEGER NOT NULL DEFAULT 0,
    runs_today INTEGER NOT NULL DEFAULT 0,
    runs_date TEXT NOT NULL DEFAULT '',
    inventory TEXT NOT NULL DEFAULT '[]',
    hp INTEGER NOT NULL DEFAULT 0,
    hp_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS adventures (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dungeon_id TEXT NOT NULL,
    seed TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT NOT NULL,
    completes_at TEXT NOT NULL,
    snapshot TEXT NOT NULL DEFAULT '{}',
    hp_start INTEGER NOT NULL DEFAULT 0,
    report_id TEXT,
    settled_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_adventures_user ON adventures(user_id, status);
  CREATE INDEX IF NOT EXISTS idx_adventures_due ON adventures(status, completes_at);

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dungeon_id TEXT NOT NULL,
    seed TEXT NOT NULL,
    outcome TEXT NOT NULL,
    kills INTEGER NOT NULL DEFAULT 0,
    chapters TEXT NOT NULL DEFAULT '[]',
    reward TEXT NOT NULL DEFAULT '{}',
    hero_after TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS content_entities (
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (type, id)
  );

  CREATE TABLE IF NOT EXISTS content_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

ensureColumn('heroes', 'hp', "INTEGER NOT NULL DEFAULT 0")
ensureColumn('heroes', 'hp_at', "TEXT NOT NULL DEFAULT ''")
ensureColumn('heroes', 'tactics', "TEXT NOT NULL DEFAULT '{}'")
ensureColumn('reports', 'meta', "TEXT NOT NULL DEFAULT '{}'")

/* ------------------------------ 内容 ------------------------------ */

function normalizedEntities(source) {
  const out = {}
  for (const type of ENTITY_KEYS) {
    const list = Array.isArray(source?.entities?.[type]) ? source.entities[type] : []
    out[type] = list.filter((rec) => rec && typeof rec === 'object').map((rec) => normalizeEntity(type, rec))
  }
  return out
}

function readMeta(fallback = seedContent.meta) {
  const row = db.prepare('SELECT value FROM content_meta WHERE key = ?').get('meta')
  if (row) {
    try {
      return JSON.parse(row.value)
    } catch {
      return clone(fallback)
    }
  }
  return clone(fallback)
}

function writeMeta(meta) {
  db.prepare(
    'INSERT INTO content_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run('meta', JSON.stringify(meta))
}

export function getContentPack() {
  const pack = { schemaVersion: SCHEMA_VERSION, meta: readMeta(), entities: {} }
  for (const type of ENTITY_KEYS) pack.entities[type] = []
  const rows = db.prepare('SELECT type, data FROM content_entities ORDER BY rowid ASC').all()
  for (const row of rows) {
    if (!pack.entities[row.type]) continue
    try {
      pack.entities[row.type].push(JSON.parse(row.data))
    } catch {
      // 跳过损坏记录，避免整包不可读
    }
  }
  return pack
}

export function validatePack(pack) {
  const issues = validateContent(pack).filter((issue) => issue.level === 'error')
  return issues
}

function replaceContentUnsafe(pack) {
  const normalized = normalizedEntities(pack)
  const meta = pack.meta && typeof pack.meta === 'object' ? clone(pack.meta) : clone(seedContent.meta)
  meta.updatedAt = new Date().toISOString().slice(0, 10)

  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM content_entities')
    const stmt = db.prepare(
      'INSERT INTO content_entities (type, id, data, updated_at) VALUES (?, ?, ?, ?)'
    )
    const stamp = now()
    for (const type of ENTITY_KEYS) {
      for (const rec of normalized[type]) {
        stmt.run(type, rec.id, JSON.stringify(rec), stamp)
      }
    }
    writeMeta(meta)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
  return getContentPack()
}

export function seedContentIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM content_entities').get()
  if (row && Number(row.count) > 0) return false
  replaceContentUnsafe(clone(seedContent))
  return true
}

export function resetContent() {
  return replaceContentUnsafe(clone(seedContent))
}

export function importContent(pack) {
  if (!pack || typeof pack !== 'object' || !pack.entities) {
    const error = new Error('内容包格式错误')
    error.code = 'INVALID_PACK'
    throw error
  }
  const version = Number(pack.schemaVersion) || SCHEMA_VERSION
  if (version > SCHEMA_VERSION) {
    const error = new Error('内容包版本高于当前应用')
    error.code = 'VERSION_TOO_NEW'
    throw error
  }
  const candidate = { schemaVersion: SCHEMA_VERSION, meta: pack.meta, entities: normalizedEntities(pack) }
  const errors = validatePack(candidate)
  if (errors.length) {
    const error = new Error('内容包存在校验错误')
    error.code = 'INVALID_PACK'
    error.details = errors
    throw error
  }
  return replaceContentUnsafe(pack)
}

export function saveEntity(type, record) {
  if (!ENTITY_KEYS.includes(type)) {
    const error = new Error('未知的实体类型')
    error.code = 'UNKNOWN_TYPE'
    throw error
  }
  if (!record || typeof record !== 'object') {
    const error = new Error('实体数据格式错误')
    error.code = 'INVALID_ENTITY'
    throw error
  }
  const normalized = normalizeEntity(type, clone(record))
  if (!normalized.id || !isValidId(normalized.id)) {
    const error = new Error('ID 只能包含小写字母、数字和连字符')
    error.code = 'INVALID_ID'
    throw error
  }

  // 把候选实体放进完整内容里校验，防止写入会破坏引用的数据
  const pack = getContentPack()
  pack.entities[type] = (pack.entities[type] || []).filter((rec) => rec.id !== normalized.id)
  pack.entities[type].push(normalized)
  const errors = validatePack(pack).filter((issue) => issue.type === type && issue.id === normalized.id)
  if (errors.length) {
    const error = new Error('实体未通过校验')
    error.code = 'INVALID_ENTITY'
    error.details = errors
    throw error
  }

  db.prepare(
    `INSERT INTO content_entities (type, id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(type, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(type, normalized.id, JSON.stringify(normalized), now())

  const meta = readMeta()
  meta.updatedAt = new Date().toISOString().slice(0, 10)
  writeMeta(meta)
  return normalized
}

export function removeEntity(type, id) {
  if (!ENTITY_KEYS.includes(type)) {
    const error = new Error('未知的实体类型')
    error.code = 'UNKNOWN_TYPE'
    throw error
  }
  const info = db.prepare('DELETE FROM content_entities WHERE type = ? AND id = ?').run(type, id)
  const meta = readMeta()
  meta.updatedAt = new Date().toISOString().slice(0, 10)
  writeMeta(meta)
  return Number(info.changes) > 0
}

/* ------------------------------ 用户与会话 ------------------------------ */

export function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(String(username))
}

export function findUserById(id) {
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id)
}

export function createUser(username, password, role = 'user') {
  const info = db
    .prepare('INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)')
    .run(String(username), hashPassword(password), role, now())
  return Number(info.lastInsertRowid)
}

export function setUserPassword(userId, password) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), userId)
}

export function setUserRole(userId, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)
}

export function listAdmins() {
  return db.prepare("SELECT id, username, created_at FROM users WHERE role = 'admin' ORDER BY id").all()
}

export function createSession(userId, ttlDays = 7) {
  const token = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/-/g, '')
  const created = new Date()
  const expires = new Date(created.getTime() + ttlDays * 24 * 60 * 60 * 1000)
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    created.toISOString(),
    expires.toISOString()
  )
  return token
}

export function sessionUser(token) {
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.role, u.created_at, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`
    )
    .get(String(token))
  if (!row) return null
  if (row.expires_at < now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(String(token))
    return null
  }
  return { id: row.id, username: row.username, role: row.role, created_at: row.created_at }
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(String(token))
}

export function purgeExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now())
}

/* ------------------------------ 英雄与战报 ------------------------------ */

function rowToHero(row) {
  if (!row) return null
  let inventory = []
  try {
    inventory = JSON.parse(row.inventory)
  } catch {
    inventory = []
  }
  const instances = (Array.isArray(inventory) ? inventory : [])
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return { uid: `inv-${entry}-${index}`, itemId: entry, qty: 1, equipped: '' }
      }
      return {
        uid: entry?.uid || `inv-${entry?.itemId || entry?.id || 'item'}-${index}`,
        itemId: entry?.itemId || entry?.id || '',
        qty: Math.max(1, Number(entry?.qty) || 1),
        equipped: entry?.equipped || ''
      }
    })
    .filter((entry) => entry.itemId)
  let tactics = {}
  try {
    tactics = JSON.parse(row.tactics || '{}')
  } catch {
    tactics = {}
  }
  return {
    id: 'hero-1',
    name: row.name,
    gender: row.gender,
    raceId: row.race_id,
    classId: row.class_id,
    level: row.level,
    ep: row.ep,
    gold: row.gold,
    runs: row.runs,
    runsToday: row.runs_today,
    runsDate: row.runs_date,
    inventory: instances,
    tactics: normalizeTactics(tactics),
    hp: Number(row.hp) || 0,
    hpAt: row.hp_at || '',
    createdAt: row.created_at
  }
}

export function getHero(userId) {
  return rowToHero(db.prepare('SELECT * FROM heroes WHERE user_id = ?').get(userId))
}

export function insertHero(userId, hero) {
  db.prepare(
    `INSERT INTO heroes (user_id, name, gender, race_id, class_id, level, ep, gold, runs, runs_today, runs_date, inventory, tactics, hp, hp_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    hero.name,
    hero.gender || 'female',
    hero.raceId,
    hero.classId,
    hero.level || 1,
    hero.ep || 0,
    hero.gold || 0,
    hero.runs || 0,
    hero.runsToday || 0,
    hero.runsDate || '',
    JSON.stringify(hero.inventory || []),
    JSON.stringify(normalizeTactics(hero.tactics)),
    hero.hp || 0,
    hero.hpAt || now(),
    now()
  )
  return getHero(userId)
}

export function updateHero(userId, hero) {
  db.prepare(
    `UPDATE heroes SET level = ?, ep = ?, gold = ?, runs = ?, runs_today = ?, runs_date = ?, inventory = ?, tactics = ?, hp = ?, hp_at = ?
      WHERE user_id = ?`
  ).run(
    hero.level,
    hero.ep,
    hero.gold,
    hero.runs,
    hero.runsToday || 0,
    hero.runsDate || '',
    JSON.stringify(hero.inventory || []),
    JSON.stringify(normalizeTactics(hero.tactics)),
    hero.hp || 0,
    hero.hpAt || now(),
    userId
  )
  return getHero(userId)
}

export function deleteHero(userId) {
  db.prepare('DELETE FROM reports WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM heroes WHERE user_id = ?').run(userId)
}

function rowToReport(row) {
  if (!row) return null
  const parse = (text, fallback) => {
    try {
      return JSON.parse(text)
    } catch {
      return fallback
    }
  }
  const meta = parse(row.meta, {})
  return {
    id: row.id,
    dungeonId: row.dungeon_id,
    dungeonName: meta.dungeonName || null,
    heroName: meta.heroName || null,
    seed: row.seed,
    outcome: row.outcome,
    kills: row.kills,
    chapters: parse(row.chapters, []),
    reward: parse(row.reward, {}),
    heroAfter: parse(row.hero_after, {}),
    createdAt: row.created_at,
    startedAt: meta.startedAt || null,
    completesAt: meta.completesAt || null,
    durationMinutes: meta.durationMinutes || null,
    stats: meta.stats || null,
    tactics: meta.tactics || null,
    loadout: meta.loadout || null,
    heroStart: meta.heroStart || null,
    heroEnd: meta.heroEnd || null
  }
}

export function insertReport(userId, report) {
  const meta = {
    dungeonName: report.dungeonName,
    heroName: report.heroName,
    startedAt: report.startedAt,
    completesAt: report.completesAt,
    durationMinutes: report.durationMinutes,
    stats: report.stats,
    tactics: report.tactics,
    loadout: report.loadout,
    heroStart: report.heroStart,
    heroEnd: report.heroEnd
  }
  db.prepare(
    `INSERT INTO reports (id, user_id, dungeon_id, seed, outcome, kills, chapters, reward, hero_after, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    report.id,
    userId,
    report.dungeonId,
    report.seed,
    report.outcome,
    report.kills || 0,
    JSON.stringify(report.chapters || []),
    JSON.stringify(report.reward || {}),
    JSON.stringify(report.heroAfter || {}),
    JSON.stringify(meta),
    report.createdAt || now()
  )
  // 每个用户最多保留 20 条战报
  db.prepare(
    `DELETE FROM reports WHERE user_id = ? AND id NOT IN (
       SELECT id FROM reports WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 20
     )`
  ).run(userId, userId)
  return report
}

export function listReports(userId) {
  return db
    .prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 20')
    .all(userId)
    .map(rowToReport)
}

export function getReport(userId, id) {
  return rowToReport(db.prepare('SELECT * FROM reports WHERE user_id = ? AND id = ?').get(userId, id))
}

/* ------------------------------ 冒险计时 ------------------------------ */

function rowToAdventure(row) {
  if (!row) return null
  let snapshot = {}
  try {
    snapshot = JSON.parse(row.snapshot)
  } catch {
    snapshot = {}
  }
  return {
    id: row.id,
    dungeonId: row.dungeon_id,
    seed: row.seed,
    status: row.status,
    startedAt: row.started_at,
    completesAt: row.completes_at,
    snapshot,
    hpStart: row.hp_start,
    reportId: row.report_id || null,
    settledAt: row.settled_at || null
  }
}

export function getActiveAdventure(userId) {
  return rowToAdventure(
    db
      .prepare("SELECT * FROM adventures WHERE user_id = ? AND status = 'pending' ORDER BY started_at DESC LIMIT 1")
      .get(userId)
  )
}

export function getAdventure(userId, id) {
  return rowToAdventure(
    db.prepare('SELECT * FROM adventures WHERE user_id = ? AND id = ?').get(userId, id)
  )
}

export function createAdventure(userId, adventure) {
  db.prepare(
    `INSERT INTO adventures (id, user_id, dungeon_id, seed, status, started_at, completes_at, snapshot, hp_start)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
  ).run(
    adventure.id,
    userId,
    adventure.dungeonId,
    adventure.seed,
    adventure.startedAt,
    adventure.completesAt,
    JSON.stringify(adventure.snapshot || {}),
    adventure.hpStart || 0
  )
  return getActiveAdventure(userId)
}

export function completeAdventure(userId, id, reportId) {
  db.prepare(
    "UPDATE adventures SET status = 'complete', report_id = ?, settled_at = ? WHERE user_id = ? AND id = ?"
  ).run(reportId, now(), userId, id)
  return getAdventure(userId, id)
}

/* ------------------------------ 初始化 ------------------------------ */

export function ensureAdmin({ username, password } = {}) {
  const existing = listAdmins()
  if (existing.length) return { created: false, admins: existing }
  const name = username || process.env.ADMIN_USERNAME || 'admin'
  const pass = password || process.env.ADMIN_PASSWORD || 'Dungeon#2026'
  createUser(name, pass, 'admin')
  return { created: true, username: name, password: pass, admins: listAdmins() }
}

export function ensureAdminAccount({ username, password } = {}) {
  const existing = findUserByUsername(username || process.env.ADMIN_USERNAME || 'admin')
  if (existing) {
    setUserRole(existing.id, 'admin')
    if (password) setUserPassword(existing.id, password)
    return { created: false, id: existing.id, username: existing.username }
  }
  const name = username || process.env.ADMIN_USERNAME || 'admin'
  const pass = password || process.env.ADMIN_PASSWORD || 'Dungeon#2026'
  const id = createUser(name, pass, 'admin')
  return { created: true, id, username: name }
}

export function migrateContent() {
  const rows = db.prepare('SELECT type, id, data FROM content_entities').all()
  const gearBonusMigrated = Boolean(
    db.prepare("SELECT value FROM content_meta WHERE key = 'gearBonusMigration'").get()
  )
  let updated = 0
  for (const row of rows) {
    let data
    try {
      data = JSON.parse(row.data)
    } catch {
      continue
    }
    let changed = false
    if (row.type === 'items') {
      if (data.useEffect === undefined) {
        data.useEffect = (data.tags || []).includes('healing') ? 'heal' : 'none'
        changed = true
      }
      if (data.effectAmount === undefined) {
        data.effectAmount = data.useEffect === 'heal' ? 8 : 0
        changed = true
      }
      // 旧种子里的武器/护甲没有攻防加成，补上后穿脱装备才会真正改变数值。
      // 只执行一次，避免覆盖管理员之后在编辑器里刻意设置的值。
      if (!gearBonusMigrated) {
        const seededItem = (seedContent.entities.items || []).find((entry) => entry.id === row.id)
        for (const key of [
          'attackBonus',
          'defenseBonus',
          'initiativeBonus',
          'absorbNormal',
          'absorbGood',
          'absorbCritical',
          'damageNormal',
          'damageGood',
          'damageCritical'
        ]) {
          const fallback = seededItem?.[key]
          if (!data[key] && typeof fallback === 'number' && fallback !== 0) {
            data[key] = fallback
            changed = true
          }
        }
      }
    }
    if (row.type === 'dungeons' && data.durationMinutes === undefined) {
      const seeded = (seedContent.entities.dungeons || []).find((entry) => entry.id === row.id)
      data.durationMinutes = seeded?.durationMinutes || 5
      changed = true
    }
    if (changed) {
      db.prepare('UPDATE content_entities SET data = ?, updated_at = ? WHERE type = ? AND id = ?').run(
        JSON.stringify(data),
        now(),
        row.type,
        row.id
      )
      updated += 1
    }
  }
  if (!gearBonusMigrated) {
    db.prepare("INSERT OR REPLACE INTO content_meta (key, value) VALUES ('gearBonusMigration', '1')").run()
  }
  return updated
}

seedContentIfEmpty()
migrateContent()
purgeExpiredSessions()

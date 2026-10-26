// 英雄数值推导：种族属性修正 + 职业主副属性 + 初始技能/装备
import { ATTRS, DEFAULT_TACTICS } from '../data/schema.js'

export const BASE_ATTRIBUTE = 4

export function normalizeTactics(source) {
  const value = source && typeof source === 'object' ? source : {}
  const stance = ['balanced', 'aggressive', 'defensive'].includes(value.stance) ? value.stance : DEFAULT_TACTICS.stance
  const position = ['front', 'center', 'back'].includes(value.position) ? value.position : DEFAULT_TACTICS.position
  const targetPriority = ['first', 'weakest', 'strongest'].includes(value.targetPriority)
    ? value.targetPriority
    : DEFAULT_TACTICS.targetPriority
  const firstRound = ['attack', 'defend'].includes(value.firstRound) ? value.firstRound : DEFAULT_TACTICS.firstRound
  return { stance, position, targetPriority, firstRound }
}

export function findRace(entities, hero) {
  return (entities?.races || []).find((race) => race.id === hero?.raceId) || null
}

export function findClass(entities, hero) {
  return (entities?.classes || []).find((cls) => cls.id === hero?.classId) || null
}

export function attributesFor(race) {
  const attrs = Object.fromEntries(ATTRS.map((attr) => [attr.key, BASE_ATTRIBUTE]))
  for (const attr of ATTRS) {
    const mod = race?.attrMods?.[attr.key]
    if (typeof mod === 'number') attrs[attr.key] += mod
  }
  return attrs
}

export function skillsFor(entities, hero) {
  const cls = findClass(entities, hero)
  const skills = entities?.skills || []
  return (cls?.skillIds || [])
    .map((id) => skills.find((skill) => skill.id === id))
    .filter(Boolean)
    .map((skill) => ({ def: skill, level: 1 }))
}

export function itemsFor(entities, hero) {
  const items = entities?.items || []
  return inventoryInstances(hero)
    .filter((inst) => inst.equipped)
    .map((inst) => items.find((item) => item.id === inst.itemId))
    .filter(Boolean)
}

// 背包实例：{ uid, itemId, qty, equipped }。旧存档里的纯 ID 字符串会被自动转换。
export function inventoryInstances(hero) {
  const list = Array.isArray(hero?.inventory) ? hero.inventory : []
  return list
    .map((entry) => {
      if (typeof entry === 'string') {
        return { uid: `inv-${entry}`, itemId: entry, qty: 1, equipped: '' }
      }
      return {
        uid: String(entry?.uid || ''),
        itemId: String(entry?.itemId || entry?.id || ''),
        qty: Math.max(1, Number(entry?.qty) || 1),
        equipped: entry?.equipped || ''
      }
    })
    .filter((entry) => entry.itemId)
}

export function buildHeroCombatant(hero, entities, tacticsSource) {
  const race = findRace(entities, hero)
  const cls = findClass(entities, hero)
  const tactics = normalizeTactics(tacticsSource || hero?.tactics)
  const attrs = attributesFor(race)
  const skills = skillsFor(entities, hero)
  const items = itemsFor(entities, hero)
  const primary = cls?.primaryAttr || 'st'
  const secondary = cls?.secondaryAttr || 'ag'
  const combatSkill = skills.find((entry) => entry.def.category === 'combat')
  const defenseSkill = skills.find(
    (entry) => entry.def.tags?.includes('defense') || /defen[cs]e/i.test(entry.def.formula || '')
  )
  const skillLevel = combatSkill?.level || 0
  const weapon =
    items.find((item) => item.type === 'weapon' && item.slot === 'bothHands') ||
    items.find((item) => item.type === 'weapon') ||
    null

  const attackBonus = items.reduce((sum, item) => sum + (item.attackBonus || 0), 0)
  const defenseBonus = items.reduce((sum, item) => sum + (item.defenseBonus || 0), 0)
  const stance = tactics.stance
  const stanceAttack = stance === 'aggressive' ? 1.1 : stance === 'defensive' ? 0.9 : 1
  const stanceDefense = stance === 'aggressive' ? 0.9 : stance === 'defensive' ? 1.1 : 1
  const attackAvg = Math.round(
    (2 * attrs[primary] + attrs[secondary] + 2 * skillLevel + attackBonus) * stanceAttack
  )
  const defenseAvg = Math.round(
    ((defenseSkill
      ? Math.floor((2 * attrs.dx + attrs.ag + 2 * defenseSkill.level) * 1.1)
      : Math.floor((2 * attrs.dx + attrs.ag) * 1.1)) +
      defenseBonus) *
      stanceDefense
  )
  const damageAvg = Math.max(
    1,
    Math.floor(attrs[primary] / 2) + Math.floor(attrs[secondary] / 3) + Math.floor(skillLevel / 2)
  )
  const initiativeBonus = items.reduce((sum, item) => sum + (item.initiativeBonus || 0), 0)
  const weaponTier = {
    normal: weapon?.damageNormal || 0,
    good: weapon?.damageGood || 0,
    critical: weapon?.damageCritical || 0
  }
  // 展示用伤害段：与 combat.js 的 rollHitDamage 保持同一口径
  const damageTiers = {
    normal: Math.max(1, Math.floor(damageAvg + weaponTier.normal)),
    good: Math.max(1, Math.floor(damageAvg * 1.5 + weaponTier.good)),
    critical: Math.max(1, Math.floor(damageAvg * 2.25 + weaponTier.critical))
  }
  const absorb = {
    normal: items.reduce((sum, item) => sum + (item.absorbNormal || 0), 0),
    good: items.reduce((sum, item) => sum + (item.absorbGood || 0), 0),
    critical: items.reduce((sum, item) => sum + (item.absorbCritical || 0), 0)
  }
  const maxHp = (cls?.baseHp || 10) + (Math.max(1, hero?.level || 1) - 1) * 2

  return {
    id: 'hero',
    side: 'hero',
    name: hero?.name || 'Hero',
    level: hero?.level || 1,
    attrs,
    cls,
    race,
    skills,
    items,
    weapon,
    weaponName: weapon?.name || null,
    maxHp,
    hp: maxHp,
    position: tactics.position,
    tactics,
    attackAvg,
    defenseAvg,
    attackBonus,
    defenseBonus,
    absorb,
    initiativeAvg: 2 * attrs.ag + attrs.pe + initiativeBonus,
    initiativeBonus,
    damageAvg,
    damageTiers,
    damageType: weapon?.damageType || (cls?.tags?.includes('spell') ? 'arcane' : 'bludgeoning'),
    weaponTier
  }
}

// 战斗内核：先攻顺序 → 选目标 → 攻防对抗 → 命中分级 → 伤害与减伤 → 击倒
// 事件流会记录先攻、位置修正、原始伤害与减伤，供战报做专业化展示。
import { createRng } from './rng.js'
import { rollAverage } from './dice.js'

export const POSITION_MODIFIERS = {
  front: { front: 0, left: -20, right: -20, center: 20, back: 20, rear: -30 },
  left: { front: 20, left: -20, right: 0, center: 0, back: -20, rear: -30 },
  right: { front: 20, left: 0, right: -20, center: 0, back: -20, rear: -30 },
  center: { front: -20, left: -20, right: -20, center: -20, back: -20, rear: -30 },
  back: { front: -20, left: -20, right: -20, center: -20, back: -20, rear: 0 },
  rear: { front: 30, left: 20, right: 20, center: 30, back: 0, rear: 0 }
}

export function positionModifier(attacker, defender) {
  return POSITION_MODIFIERS[attacker]?.[defender] ?? 0
}

export function classifyHit(attack, defense) {
  if (defense <= 0) return 'critical'
  if (attack < defense) return 'miss'
  if (attack >= defense * 2.25) return 'critical'
  if (attack >= defense * 1.5) return 'good'
  return 'normal'
}

const HIT_MULTIPLIER = { miss: 0, normal: 1, good: 1.5, critical: 2.25 }

export function monsterCombatant(monster) {
  return {
    id: monster.id,
    side: 'monster',
    name: monster.name,
    level: monster.level || 1,
    maxHp: monster.hp || 1,
    hp: monster.hp || 1,
    position: monster.position || 'front',
    attackAvg: monster.attackBonus || 0,
    defenseAvg: monster.defense || 0,
    initiativeAvg: 4 + (monster.level || 1) * 2 + Math.floor((monster.attackBonus || 0) / 2),
    damageAvg: monster.damageAvg || 0,
    damageType: monster.damageType || 'bludgeoning',
    absorb: {
      normal: monster.absorbNormal || 0,
      good: monster.absorbGood || 0,
      critical: monster.absorbCritical || 0
    },
    weaponTier: { normal: 0, good: 0, critical: 0 }
  }
}

export function emptyStats() {
  const side = () => ({
    attacks: 0,
    hits: 0,
    misses: 0,
    criticals: 0,
    damageDealt: 0,
    damageTaken: 0,
    absorbed: 0,
    bestHit: 0
  })
  return { rounds: 0, kills: 0, hero: side(), monsters: side() }
}

function rollHitDamage(actor, hitType, rng, defender) {
  if (hitType === 'miss') return { damage: 0, raw: 0, absorbed: 0 }
  const base = rollAverage(actor.damageAvg, rng)
  const bonus = actor.weaponTier?.[hitType] || 0
  const raw = Math.max(1, Math.floor(base * HIT_MULTIPLIER[hitType] + bonus))
  const absorbed = Math.min(raw, defender?.absorb?.[hitType] || 0)
  return { damage: Math.max(0, raw - absorbed), raw, absorbed }
}

// 英雄按战术设置选择目标；怪物固定打英雄。
export function pickTarget(unit, heroUnit, monsterUnits) {
  if (unit.side !== 'hero') return heroUnit.hp > 0 ? heroUnit : null
  const alive = monsterUnits.filter((monster) => monster.hp > 0)
  if (!alive.length) return null
  const priority = unit.tactics?.targetPriority || 'first'
  if (priority === 'weakest') {
    return alive.slice().sort((a, b) => a.hp - b.hp || b.attackAvg - a.attackAvg)[0]
  }
  if (priority === 'strongest') {
    return alive.slice().sort((a, b) => b.attackAvg - a.attackAvg || a.hp - b.hp)[0]
  }
  return alive[0]
}

export function simulateCombat({ hero, monsters, seed, maxRounds = 40 }) {
  const rng = createRng(seed)
  const heroUnit = { ...hero, hp: hero.hp }
  // 内容里的怪物也带 hp/position 字段，必须用 side 判定是否已是战斗单位，
  // 否则会漏掉 attackAvg/defenseAvg/initiativeAvg/absorb 等派生数值。
  const monsterUnits = monsters.map((monster) =>
    monster.side === 'monster' ? { ...monster } : monsterCombatant(monster)
  )
  const events = []
  const stats = emptyStats()
  let kills = 0

  for (let round = 1; round <= maxRounds; round += 1) {
    if (heroUnit.hp <= 0 || monsterUnits.every((m) => m.hp <= 0)) break
    stats.rounds = round

    const firstRoundDefend = round === 1 && heroUnit.tactics?.firstRound === 'defend' && heroUnit.hp > 0
    heroUnit.guard = firstRoundDefend ? 1.5 : 1
    if (firstRoundDefend) {
      events.push({
        type: 'defend',
        round,
        name: heroUnit.name,
        side: heroUnit.side,
        defenseBonus: 50
      })
    }

    const order = [heroUnit, ...monsterUnits.filter((m) => m.hp > 0)]
      .map((unit) => ({ unit, initiative: rollAverage(unit.initiativeAvg, rng) }))
      .sort((a, b) => b.initiative - a.initiative)

    events.push({
      type: 'round',
      round,
      order: order.map((entry) => ({
        name: entry.unit.name,
        side: entry.unit.side,
        initiative: entry.initiative
      }))
    })

    for (const entry of order) {
      const actor = entry.unit
      if (actor.hp <= 0) continue
      // 首回合防御：英雄本回合放弃出手，换取防御加成
      if (round === 1 && actor.side === 'hero' && firstRoundDefend) continue

      const foe = pickTarget(actor, heroUnit, monsterUnits)
      if (!foe || foe.hp <= 0) continue

      const modifier = positionModifier(actor.position, foe.position)
      const attackBase = actor.attackAvg
      const attackAvg = Math.max(0, actor.attackAvg * (1 + modifier / 100))
      const attack = rollAverage(attackAvg, rng)
      const defense = rollAverage(foe.defenseAvg * (foe.guard || 1), rng)
      const hitType = classifyHit(attack, defense)
      const { damage, raw, absorbed } = rollHitDamage(actor, hitType, rng, foe)

      const actorStats = actor.side === 'hero' ? stats.hero : stats.monsters
      const targetStats = foe.side === 'hero' ? stats.hero : stats.monsters
      actorStats.attacks += 1
      if (hitType === 'miss') {
        actorStats.misses += 1
      } else {
        actorStats.hits += 1
        actorStats.damageDealt += damage
        actorStats.bestHit = Math.max(actorStats.bestHit, damage)
        if (hitType === 'critical') actorStats.criticals += 1
      }
      targetStats.damageTaken += damage
      targetStats.absorbed += absorbed

      if (hitType !== 'miss') foe.hp = Math.max(0, foe.hp - damage)

      events.push({
        type: 'action',
        round,
        actorName: actor.name,
        actorSide: actor.side,
        targetName: foe.name,
        targetSide: foe.side,
        initiative: entry.initiative,
        attackBase,
        positionModifier: modifier,
        attack,
        defense,
        hitType,
        rawDamage: raw,
        absorbed,
        damage,
        damageType: actor.damageType,
        hpAfter: foe.hp,
        hpMax: foe.maxHp
      })

      if (hitType !== 'miss' && foe.hp <= 0) {
        events.push({ type: 'down', round, name: foe.name, side: foe.side })
        if (foe.side === 'monster') {
          kills += 1
          stats.kills += 1
        }
      }

      if (heroUnit.hp <= 0 || monsterUnits.every((m) => m.hp <= 0)) break
    }

    heroUnit.guard = 1

    if (heroUnit.hp <= 0) {
      return { events, outcome: 'defeat', heroHp: 0, kills, stats }
    }
    if (monsterUnits.every((m) => m.hp <= 0)) {
      return { events, outcome: 'victory', heroHp: heroUnit.hp, kills, stats }
    }
  }

  return { events, outcome: 'defeat', heroHp: heroUnit.hp, kills, stats }
}

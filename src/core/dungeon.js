// 地城推进：按层、房间顺序自动战斗。每场战斗使用可复现的 seed。
import { emptyStats, simulateCombat } from './combat.js'

function mergeStats(target, source) {
  target.rounds += source.rounds
  target.kills += source.kills
  for (const side of ['hero', 'monsters']) {
    for (const key of Object.keys(target[side])) {
      target[side][key] += source[side][key]
    }
  }
}

export function runDungeonRun({ heroCombat, dungeon, layers, rooms, monsters, seed }) {
  const dungeonLayers = (layers || [])
    .filter((layer) => layer.dungeonId === dungeon.id)
    .sort((a, b) => (a.index || 0) - (b.index || 0))

  const chapters = []
  const stats = emptyStats()
  let heroHp = heroCombat.hp
  let kills = 0

  for (const layer of dungeonLayers) {
    const layerRooms = (rooms || [])
      .filter((room) => room.layerId === layer.id)
      .sort((a, b) => (a.index || 0) - (b.index || 0))

    for (const room of layerRooms) {
      const roomMonsters = (room.monsterIds || [])
        .map((id) => (monsters || []).find((monster) => monster.id === id))
        .filter(Boolean)

      const chapter = {
        layerId: layer.id,
        layerName: layer.name,
        layerIndex: layer.index || 1,
        roomId: room.id,
        roomName: room.name,
        roomStory: room.story || room.desc || null,
        monsters: roomMonsters.map((monster) => monster.name),
        events: [],
        outcome: 'clear',
        heroHpStart: heroHp,
        heroHp,
        heroHpMax: heroCombat.maxHp,
        stats: emptyStats()
      }

      if (roomMonsters.length) {
        const result = simulateCombat({
          hero: { ...heroCombat, hp: heroHp },
          monsters: roomMonsters,
          seed: `${seed}:${layer.id}:${room.id}`
        })
        chapter.events = result.events
        chapter.outcome = result.outcome
        chapter.stats = result.stats
        chapter.heroHp = result.heroHp
        mergeStats(stats, result.stats)
        heroHp = result.heroHp
        kills += result.kills
      }

      chapters.push(chapter)
      if (chapter.outcome === 'defeat') {
        return { chapters, outcome: 'defeat', heroHp, kills, stats }
      }
    }
  }

  return {
    chapters,
    outcome: chapters.length ? 'victory' : 'defeat',
    heroHp,
    kills,
    stats
  }
}

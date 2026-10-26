// 原作骰子机制：平均值 X 用 D(2X+1) 表示，取值 0 ~ 2X，期望正好 X。
// 规则要点：
// - 1~7 用单个 D3/D5/.../D15
// - 8 = D15 + D3；14 = 2 × D15；42 = 6 × D15；48 = 6 × D17
// - 最多 6 个骰子；需要更大值时提升骰面

export function diceForAverage(average) {
  const avg = Math.floor(average)
  if (!Number.isFinite(avg) || avg <= 0) return []
  if (avg <= 7) return [2 * avg + 1]

  const full = Math.floor(avg / 7)
  const rest = avg - full * 7
  const extra = rest > 0 ? 1 : 0

  if (full + extra <= 6) {
    const dice = new Array(full).fill(15)
    if (rest > 0) dice.push(2 * rest + 1)
    return dice
  }

  // 超过 6 个骰子：把平均值尽量均匀分到 6 个骰子上（如 48 → 6 × D17）
  const base = Math.floor(avg / 6)
  const remainder = avg % 6
  return Array.from({ length: 6 }, (_, i) => 2 * (base + (i < remainder ? 1 : 0)) + 1)
}

export function diceAverage(dice) {
  return (dice || []).reduce((sum, sides) => sum + (sides - 1) / 2, 0)
}

export function formatDice(dice) {
  if (!dice || dice.length === 0) return '0'
  const groups = new Map()
  for (const sides of dice) groups.set(sides, (groups.get(sides) || 0) + 1)
  return [...groups.entries()]
    .map(([sides, count]) => (count > 1 ? `${count} × D${sides}` : `D${sides}`))
    .join(' + ')
}

export function rollDie(sides, rng = Math.random) {
  return Math.floor(rng() * sides)
}

export function rollDice(dice, rng = Math.random) {
  return (dice || []).reduce((sum, sides) => sum + rollDie(sides, rng), 0)
}

export function rollAverage(average, rng = Math.random) {
  return rollDice(diceForAverage(average), rng)
}

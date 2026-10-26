// 内容数据规范（唯一事实来源）
// - 所有可显示文本都是 { en, zh } 双语对象
// - id、数值、枚举、公式保持单值，便于计算与引用
// - 新增实体类型 = 在这里加一个 ENTITY_DEFS 条目，编辑器与校验会自动支持

export const SCHEMA_VERSION = 1

export const ATTRS = [
  { key: 'st', abbr: 'ST', zh: '力量', en: 'Strength' },
  { key: 'co', abbr: 'CO', zh: '体质', en: 'Constitution' },
  { key: 'in', abbr: 'IN', zh: '智力', en: 'Intelligence' },
  { key: 'dx', abbr: 'DX', zh: '灵巧', en: 'Dexterity' },
  { key: 'ch', abbr: 'CH', zh: '魅力', en: 'Charisma' },
  { key: 'ag', abbr: 'AG', zh: '敏捷', en: 'Agility' },
  { key: 'pe', abbr: 'PE', zh: '感知', en: 'Perception' },
  { key: 'wi', abbr: 'WI', zh: '意志', en: 'Willpower' }
]

export const SLOTS = [
  { value: 'head', zh: '头', en: 'Head' },
  { value: 'ears', zh: '耳', en: 'Ears' },
  { value: 'eyes', zh: '眼镜', en: 'Eyes' },
  { value: 'neck', zh: '颈', en: 'Neck' },
  { value: 'body', zh: '身体', en: 'Body' },
  { value: 'belt', zh: '腰带', en: 'Belt' },
  { value: 'cloak', zh: '披风', en: 'Cloak' },
  { value: 'shoulders', zh: '肩膀', en: 'Shoulders' },
  { value: 'arms', zh: '臂', en: 'Arms' },
  { value: 'hands', zh: '手', en: 'Hands' },
  { value: 'bothHands', zh: '双手', en: 'Both hands' },
  { value: 'rightHand', zh: '右手', en: 'Right hand' },
  { value: 'leftHand', zh: '左手', en: 'Left hand' },
  { value: 'legs', zh: '腿', en: 'Legs' },
  { value: 'feet', zh: '脚', en: 'Feet' },
  { value: 'medal', zh: '勋章', en: 'Medal' },
  { value: 'pocket', zh: '口袋', en: 'Pocket' },
  { value: 'ring', zh: '戒指', en: 'Ring' }
]

export const ATTACK_TYPES = [
  { value: 'melee', zh: '近战', en: 'Melee' },
  { value: 'ranged', zh: '远程', en: 'Ranged' },
  { value: 'spell', zh: '法术', en: 'Spell' },
  { value: 'social', zh: '社交', en: 'Social' },
  { value: 'sneak', zh: '偷袭', en: 'Sneak' },
  { value: 'trap', zh: '陷阱', en: 'Trap' },
  { value: 'blast', zh: '爆炸', en: 'Blast' },
  { value: 'nature', zh: '自然之力', en: 'Nature' },
  { value: 'disease', zh: '疾病', en: 'Disease' },
  { value: 'missile', zh: '魔法飞弹', en: 'Magic missile' },
  { value: 'curse', zh: '诅咒', en: 'Curse' }
]

export const DAMAGE_TYPES = [
  { value: 'bludgeoning', zh: '粉碎', en: 'Bludgeoning' },
  { value: 'slashing', zh: '切割', en: 'Slashing' },
  { value: 'piercing', zh: '穿刺', en: 'Piercing' },
  { value: 'fire', zh: '火焰', en: 'Fire' },
  { value: 'frost', zh: '冰霜', en: 'Frost' },
  { value: 'lightning', zh: '闪电', en: 'Lightning' },
  { value: 'poison', zh: '毒素', en: 'Poison' },
  { value: 'arcane', zh: '奥术', en: 'Arcane' }
]

export const POSITIONS = [
  { value: 'front', zh: '前排', en: 'Front' },
  { value: 'left', zh: '左翼', en: 'Left flank' },
  { value: 'right', zh: '右翼', en: 'Right flank' },
  { value: 'center', zh: '中路', en: 'Center' },
  { value: 'back', zh: '后排', en: 'Back' },
  { value: 'rear', zh: '阵后', en: 'Rear' }
]

export const SKILL_CATEGORIES = [
  { value: 'combat', zh: '战斗', en: 'Combat' },
  { value: 'basic', zh: '基础', en: 'Basic' },
  { value: 'technique', zh: '战技', en: 'Technique' },
  { value: 'blood', zh: '血脉', en: 'Bloodline' }
]

export const ITEM_TYPES = [
  { value: 'weapon', zh: '武器', en: 'Weapon' },
  { value: 'armor', zh: '护甲', en: 'Armor' },
  { value: 'consumable', zh: '消耗品', en: 'Consumable' },
  { value: 'accessory', zh: '饰品', en: 'Accessory' },
  { value: 'tool', zh: '工具', en: 'Tool' },
  { value: 'misc', zh: '杂物', en: 'Misc' }
]

export const USE_EFFECTS = [
  { value: 'none', zh: '无', en: 'None' },
  { value: 'heal', zh: '恢复体力', en: 'Heal' },
  { value: 'ep', zh: '获得经验', en: 'Gain EP' },
  { value: 'gold', zh: '获得金币', en: 'Gain gold' }
]

export const TACTIC_STANCES = [
  { value: 'balanced', zh: '均衡', en: 'Balanced' },
  { value: 'aggressive', zh: '进攻', en: 'Aggressive' },
  { value: 'defensive', zh: '防守', en: 'Defensive' }
]

export const TACTIC_POSITIONS = [
  { value: 'front', zh: '前排', en: 'Front' },
  { value: 'center', zh: '中排', en: 'Center' },
  { value: 'back', zh: '后排', en: 'Back' }
]

export const TACTIC_TARGETS = [
  { value: 'first', zh: '最近目标', en: 'Nearest' },
  { value: 'weakest', zh: '体力最低', en: 'Weakest' },
  { value: 'strongest', zh: '攻击最高', en: 'Strongest' }
]

export const TACTIC_FIRST_ROUND = [
  { value: 'attack', zh: '照常进攻', en: 'Attack' },
  { value: 'defend', zh: '首回合防御', en: 'Defend first' }
]

export const DEFAULT_TACTICS = {
  stance: 'balanced',
  position: 'front',
  targetPriority: 'first',
  firstRound: 'attack'
}

const opt = (list) => list.map((o) => ({ value: o.value, label: { zh: o.zh, en: o.en } }))
const ATTR_OPTIONS = ATTRS.map((a) => ({ value: a.key, label: { zh: a.zh, en: a.en } }))

// 字段构造器，减少重复
const i18n = (key, zh, en, extra = {}) => ({ key, type: 'i18n', label: { zh, en }, ...extra })
const i18nText = (key, zh, en, extra = {}) => ({ key, type: 'i18nText', label: { zh, en }, ...extra })
const text = (key, zh, en, extra = {}) => ({ key, type: 'text', label: { zh, en }, ...extra })
const num = (key, zh, en, extra = {}) => ({ key, type: 'number', label: { zh, en }, integer: true, ...extra })
const enumField = (key, zh, en, options, extra = {}) => ({
  key,
  type: 'enum',
  label: { zh, en },
  options,
  ...extra
})
const ref = (key, zh, en, target, extra = {}) => ({ key, type: 'ref', target, label: { zh, en }, ...extra })
const refs = (key, zh, en, target, extra = {}) => ({ key, type: 'refs', target, label: { zh, en }, ...extra })
const bool = (key, zh, en, extra = {}) => ({ key, type: 'bool', label: { zh, en }, ...extra })
const attrs = (key, zh, en, extra = {}) => ({ key, type: 'attrs', label: { zh, en }, ...extra })
const tags = (key, zh, en, extra = {}) => ({ key, type: 'tags', label: { zh, en }, ...extra })

export const ENTITY_DEFS = {
  races: {
    key: 'races',
    idPrefix: 'race',
    label: { zh: '种族', en: 'Races' },
    badge: (r) => {
      const mods = Object.entries(r.attrMods || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.toUpperCase()}${v > 0 ? '+' : ''}${v}`)
      return mods.join(' ')
    },
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '简介', 'Description'),
      attrs('attrMods', '属性修正', 'Attribute modifiers'),
      i18nText('traits', '种族特性', 'Racial traits'),
      refs('allowedClassIds', '可选职业', 'Allowed classes', 'classes'),
      tags('tags', '标签', 'Tags')
    ]
  },
  classes: {
    key: 'classes',
    idPrefix: 'class',
    label: { zh: '职业', en: 'Classes' },
    badge: (r) => (r.primaryAttr ? r.primaryAttr.toUpperCase() : ''),
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '简介', 'Description'),
      enumField('primaryAttr', '主属性', 'Primary attribute', ATTR_OPTIONS),
      enumField('secondaryAttr', '副属性', 'Secondary attribute', ATTR_OPTIONS, { default: 'ag' }),
      num('baseHp', '初始体力', 'Base HP', { min: 1, max: 999, default: 10 }),
      num('baseResource', '初始资源', 'Base resource', { min: 0, max: 999, default: 6 }),
      refs('skillIds', '初始技能', 'Starting skills', 'skills'),
      refs('allowedRaceIds', '可选种族', 'Allowed races', 'races'),
      refs('startingItemIds', '初始装备', 'Starting items', 'items'),
      tags('tags', '标签', 'Tags')
    ]
  },
  skills: {
    key: 'skills',
    idPrefix: 'skill',
    label: { zh: '技能', en: 'Skills' },
    badge: (r) => {
      const c = SKILL_CATEGORIES.find((x) => x.value === r.category)
      return c ? c.en : ''
    },
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '简介', 'Description'),
      enumField('category', '类别', 'Category', opt(SKILL_CATEGORIES)),
      num('maxLevel', '最高等级', 'Max level', { min: 1, max: 20, default: 10 }),
      num('costEp', '每级经验', 'EP per level', { min: 0, max: 99999, default: 300 }),
      num('costGold', '每级金币', 'Gold per level', { min: 0, max: 99999, default: 5 }),
      text('formula', '公式说明', 'Formula note'),
      tags('tags', '标签', 'Tags')
    ]
  },
  items: {
    key: 'items',
    idPrefix: 'item',
    label: { zh: '物品', en: 'Items' },
    badge: (r) => {
      const s = SLOTS.find((x) => x.value === r.slot)
      return s ? s.en : ''
    },
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '描述', 'Description'),
      enumField('slot', '装备槽', 'Slot', opt(SLOTS), { default: 'pocket' }),
      enumField('type', '类型', 'Type', opt(ITEM_TYPES)),
      num('levelReq', '等级要求', 'Level requirement', { min: 1, max: 99, default: 1 }),
      num('weight', '重量', 'Weight', { min: 0, max: 999, default: 1 }),
      num('value', '价值', 'Value', { min: 0, max: 999999, default: 0 }),
      num('attackBonus', '攻击修正', 'Attack bonus', { min: -99, max: 99, default: 0 }),
      num('defenseBonus', '防御修正', 'Defense bonus', { min: -99, max: 99, default: 0 }),
      num('initiativeBonus', '先攻修正', 'Initiative bonus', { min: -99, max: 99, default: 0 }),
      enumField('damageType', '伤害类型', 'Damage type', opt(DAMAGE_TYPES)),
      num('damageNormal', '普通命中伤害', 'Normal hit damage', { min: 0, max: 999, default: 0 }),
      num('damageGood', '好命中伤害', 'Good hit damage', { min: 0, max: 999, default: 0 }),
      num('damageCritical', '暴击伤害', 'Critical damage', { min: 0, max: 999, default: 0 }),
      num('absorbNormal', '普通减伤', 'Normal absorb', { min: 0, max: 999, default: 0 }),
      num('absorbGood', '好命中减伤', 'Good absorb', { min: 0, max: 999, default: 0 }),
      num('absorbCritical', '暴击减伤', 'Critical absorb', { min: 0, max: 999, default: 0 }),
      refs('usableClassIds', '限定职业', 'Usable by classes', 'classes'),
      refs('usableRaceIds', '限定种族', 'Usable by races', 'races'),
      bool('consumable', '消耗品', 'Consumable'),
      num('charges', '使用次数', 'Charges', { min: 0, max: 99, default: 0 }),
      enumField('useEffect', '使用效果', 'Use effect', opt(USE_EFFECTS), { default: 'none' }),
      num('effectAmount', '效果数值', 'Effect amount', { min: 0, max: 9999, default: 0 }),
      tags('tags', '标签', 'Tags')
    ]
  },
  monsters: {
    key: 'monsters',
    idPrefix: 'monster',
    label: { zh: '怪物', en: 'Monsters' },
    badge: (r) => `Lv ${r.level ?? 0}`,
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '描述', 'Description'),
      num('level', '等级', 'Level', { min: 1, max: 99, default: 1 }),
      num('hp', '体力', 'HP', { min: 1, max: 99999, default: 10 }),
      num('resource', '资源', 'Resource', { min: 0, max: 99999, default: 0 }),
      enumField('position', '站位', 'Position', opt(POSITIONS)),
      enumField('attackType', '攻击类型', 'Attack type', opt(ATTACK_TYPES)),
      num('attackBonus', '攻击值', 'Attack value', { min: 0, max: 999, default: 5 }),
      num('defense', '防御值', 'Defense value', { min: 0, max: 999, default: 5 }),
      enumField('damageType', '伤害类型', 'Damage type', opt(DAMAGE_TYPES)),
      num('damageAvg', '平均伤害', 'Average damage', { min: 0, max: 999, default: 2 }),
      ref('lootTableId', '掉落表', 'Loot table', 'lootTables'),
      tags('tags', '标签', 'Tags')
    ]
  },
  dungeons: {
    key: 'dungeons',
    idPrefix: 'dungeon',
    label: { zh: '地城', en: 'Dungeons' },
    badge: (r) => `Lv ${r.minLevel ?? 1}`,
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '简介', 'Description'),
      i18nText('story', '冒险故事', 'Story'),
      i18n('author', '作者署名', 'Author'),
      num('minLevel', '最低等级', 'Minimum level', { min: 1, max: 99, default: 1 }),
      num('recLevel', '推荐等级', 'Recommended level', { min: 1, max: 99, default: 1 }),
      num('partySize', '队伍人数', 'Party size', { min: 1, max: 12, default: 1 }),
      num('apCost', '行动点消耗', 'Action point cost', { min: 0, max: 60, default: 6 }),
      num('durationMinutes', '冒险时长（分钟）', 'Adventure duration (minutes)', { min: 1, max: 1440, default: 5 }),
      num('cooldownHours', '冷却小时', 'Cooldown hours', { min: 7, max: 72, default: 10 }),
      num('dailyLimit', '每日次数', 'Daily limit', { min: 1, max: 10, default: 4 }),
      enumField('attackType', '攻击类型', 'Attack type', opt(ATTACK_TYPES)),
      enumField('defenseType', '防御类型', 'Defense type', opt(ATTACK_TYPES)),
      i18nText('notes', '备注', 'Notes'),
      tags('tags', '标签', 'Tags')
    ]
  },
  layers: {
    key: 'layers',
    idPrefix: 'layer',
    label: { zh: '地城层', en: 'Dungeon layers' },
    badge: (r) => `#${r.index ?? 0}`,
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '描述', 'Description'),
      ref('dungeonId', '所属地城', 'Dungeon', 'dungeons', { required: true }),
      num('index', '层序号', 'Layer index', { min: 1, max: 99, default: 1 })
    ]
  },
  rooms: {
    key: 'rooms',
    idPrefix: 'room',
    label: { zh: '房间', en: 'Rooms' },
    badge: (r) => `#${r.index ?? 0}`,
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '描述', 'Description'),
      i18nText('story', '剧情文本', 'Story text'),
      ref('layerId', '所属层', 'Layer', 'layers', { required: true }),
      num('index', '房间序号', 'Room index', { min: 1, max: 99, default: 1 }),
      refs('monsterIds', '遭遇怪物', 'Monsters', 'monsters'),
      ref('lootTableId', '掉落表', 'Loot table', 'lootTables'),
      refs('nextRoomIds', '后续房间', 'Next rooms', 'rooms')
    ]
  },
  lootTables: {
    key: 'lootTables',
    idPrefix: 'loot',
    label: { zh: '掉落表', en: 'Loot tables' },
    badge: (r) => `${(r.itemIds || []).length} items`,
    fields: [
      i18n('name', '名称', 'Name', { required: true }),
      i18nText('desc', '描述', 'Description'),
      refs('itemIds', '物品池', 'Item pool', 'items'),
      num('rollsMin', '最少抽取', 'Min rolls', { min: 0, max: 20, default: 1 }),
      num('rollsMax', '最多抽取', 'Max rolls', { min: 0, max: 20, default: 1 })
    ]
  }
}

// 侧栏展示顺序
export const ENTITY_KEYS = ['races', 'classes', 'skills', 'items', 'monsters', 'dungeons', 'layers', 'rooms', 'lootTables']

export function getEntityDef(typeKey) {
  return ENTITY_DEFS[typeKey] || null
}

export function defaultFor(field) {
  if (field.default !== undefined) {
    return Array.isArray(field.default) ? [...field.default] : field.default
  }
  switch (field.type) {
    case 'i18n':
    case 'i18nText':
      return { en: '', zh: '' }
    case 'number':
      return 0
    case 'enum':
      return field.options?.[0]?.value ?? ''
    case 'ref':
      return ''
    case 'refs':
      return []
    case 'bool':
      return false
    case 'attrs':
      return Object.fromEntries(ATTRS.map((a) => [a.key, 0]))
    case 'tags':
      return []
    case 'text':
      return ''
    default:
      return null
  }
}

export function emptyEntity(typeKey) {
  const def = getEntityDef(typeKey)
  if (!def) return null
  const rec = { id: '' }
  for (const field of def.fields) rec[field.key] = defaultFor(field)
  return rec
}

// 导入或旧存档可能缺字段，统一补齐，避免表单出现 undefined
export function normalizeEntity(typeKey, record) {
  const def = getEntityDef(typeKey)
  if (!def || !record) return record
  const out = { ...record }
  for (const field of def.fields) {
    if (out[field.key] === undefined || out[field.key] === null) {
      out[field.key] = defaultFor(field)
      continue
    }
    if ((field.type === 'i18n' || field.type === 'i18nText') && typeof out[field.key] !== 'object') {
      out[field.key] = { en: String(out[field.key]), zh: '' }
      continue
    }
    if (field.type === 'attrs' && typeof out[field.key] === 'object') {
      const base = defaultFor(field)
      for (const a of ATTRS) {
        if (typeof out[field.key][a.key] !== 'number') out[field.key][a.key] = base[a.key]
      }
      continue
    }
    if (field.type === 'refs' && !Array.isArray(out[field.key])) out[field.key] = []
    if (field.type === 'tags' && !Array.isArray(out[field.key])) out[field.key] = []
  }
  if (typeof out.id !== 'string') out.id = String(out.id ?? '')
  return out
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function isValidId(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value)
}

export function uniqueId(typeKey, list, desired) {
  const def = getEntityDef(typeKey)
  const used = new Set((list || []).map((r) => r.id))
  const base = slugify(desired) || `${def?.idPrefix || 'entity'}-new`
  if (!used.has(base)) return base
  let i = 2
  while (used.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}

export function optionLabel(options, value, lang) {
  const found = (options || []).find((o) => o.value === value)
  if (!found) return value || ''
  return found.label?.[lang] || found.label?.en || found[lang] || found.en || String(value)
}

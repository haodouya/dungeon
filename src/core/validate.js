import { ENTITY_DEFS, ENTITY_KEYS, ATTRS, isValidId } from '../data/schema.js'

const m = (zh, en) => ({ zh, en })

function push(issues, level, type, id, field, message) {
  issues.push({ level, type, id: id || '', field: field || '', message })
}

export function validateContent(content) {
  const issues = []
  if (!content || typeof content !== 'object') {
    push(issues, 'error', '', '', '', m('内容包为空或格式错误', 'Content pack is empty or malformed'))
    return issues
  }
  const entities = content.entities || {}
  const index = {}

  for (const type of ENTITY_KEYS) {
    const map = new Map()
    for (const rec of entities[type] || []) {
      if (rec && rec.id) map.set(rec.id, rec)
    }
    index[type] = map
  }

  for (const type of ENTITY_KEYS) {
    const def = ENTITY_DEFS[type]
    const list = entities[type] || []
    const seen = new Set()

    for (const rec of list) {
      const id = rec?.id || ''
      if (!id) {
        push(issues, 'error', type, '', 'id', m('ID 不能为空', 'ID is required'))
      } else if (!isValidId(id)) {
        push(issues, 'error', type, id, 'id', m('ID 只能包含小写字母、数字和连字符', 'ID may only contain lowercase letters, digits and hyphens'))
      } else if (seen.has(id)) {
        push(issues, 'error', type, id, 'id', m('ID 重复', 'Duplicate ID'))
      } else {
        seen.add(id)
      }

      for (const field of def.fields) {
        const value = rec?.[field.key]
        const label = field.label.zh

        if (field.type === 'i18n' || field.type === 'i18nText') {
          const en = typeof value === 'object' && value ? value.en : ''
          const zh = typeof value === 'object' && value ? value.zh : ''
          if (field.required && !String(en || '').trim() && !String(zh || '').trim()) {
            push(issues, 'error', type, id, field.key, m(`${label}不能为空`, `${field.label.en} is required`))
          } else if (en && !zh) {
            push(issues, 'warn', type, id, field.key, m(`${label}缺少中文翻译`, `${field.label.en} has no Chinese translation`))
          }
          continue
        }

        if (field.type === 'number') {
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            push(issues, 'error', type, id, field.key, m(`${label}必须是数字`, `${field.label.en} must be a number`))
          } else {
            if (field.integer && !Number.isInteger(value)) {
              push(issues, 'error', type, id, field.key, m(`${label}必须是整数`, `${field.label.en} must be an integer`))
            }
            if (field.min !== undefined && value < field.min) {
              push(issues, 'error', type, id, field.key, m(`${label}不能小于 ${field.min}`, `${field.label.en} must be at least ${field.min}`))
            }
            if (field.max !== undefined && value > field.max) {
              push(issues, 'error', type, id, field.key, m(`${label}不能大于 ${field.max}`, `${field.label.en} must be at most ${field.max}`))
            }
          }
          continue
        }

        if (field.type === 'enum') {
          const allowed = (field.options || []).map((o) => o.value)
          if (!allowed.includes(value)) {
            push(issues, 'error', type, id, field.key, m(`${label}取值无效`, `Invalid ${field.label.en}`))
          }
          continue
        }

        if (field.type === 'ref') {
          if (field.required && !value) {
            push(issues, 'error', type, id, field.key, m(`${label}必须选择`, `${field.label.en} is required`))
          } else if (value && !index[field.target]?.has(value)) {
            push(issues, 'error', type, id, field.key, m(`${label}引用的 ${value} 不存在`, `${field.label.en} references missing ${value}`))
          }
          continue
        }

        if (field.type === 'refs') {
          if (!Array.isArray(value)) {
            push(issues, 'error', type, id, field.key, m(`${label}必须是列表`, `${field.label.en} must be a list`))
            continue
          }
          for (const refId of value) {
            if (!index[field.target]?.has(refId)) {
              push(issues, 'error', type, id, field.key, m(`${label}引用的 ${refId} 不存在`, `${field.label.en} references missing ${refId}`))
            }
          }
          continue
        }

        if (field.type === 'attrs') {
          if (!value || typeof value !== 'object') {
            push(issues, 'error', type, id, field.key, m(`${label}格式错误`, `${field.label.en} is malformed`))
            continue
          }
          for (const attr of ATTRS) {
            const v = value[attr.key]
            if (typeof v !== 'number' || !Number.isFinite(v)) {
              push(issues, 'error', type, id, field.key, m(`${label}·${attr.zh}必须是数字`, `${field.label.en} · ${attr.en} must be a number`))
            } else if (v < -10 || v > 30) {
              push(issues, 'error', type, id, field.key, m(`${label}·${attr.zh}应在 -10 ~ 30 之间`, `${field.label.en} · ${attr.en} should be between -10 and 30`))
            }
          }
          continue
        }

        if (field.type === 'bool') {
          if (typeof value !== 'boolean') {
            push(issues, 'error', type, id, field.key, m(`${label}必须是布尔值`, `${field.label.en} must be true/false`))
          }
          continue
        }

        if (field.type === 'tags') {
          if (!Array.isArray(value)) {
            push(issues, 'error', type, id, field.key, m(`${label}必须是列表`, `${field.label.en} must be a list`))
          }
          continue
        }

        if (field.type === 'text' && typeof value !== 'string') {
          push(issues, 'error', type, id, field.key, m(`${label}必须是文本`, `${field.label.en} must be text`))
        }
      }
    }
  }

  // 结构提示：地城必须至少有一层，层至少有一个房间
  for (const dungeon of entities.dungeons || []) {
    const hasLayer = (entities.layers || []).some((l) => l.dungeonId === dungeon.id)
    if (!hasLayer) {
      push(issues, 'warn', 'dungeons', dungeon.id, '', m('地城还没有任何层', 'Dungeon has no layers yet'))
    }
  }
  for (const layer of entities.layers || []) {
    const hasRoom = (entities.rooms || []).some((r) => r.layerId === layer.id)
    if (!hasRoom) {
      push(issues, 'warn', 'layers', layer.id, '', m('这一层还没有任何房间', 'Layer has no rooms yet'))
    }
  }
  for (const table of entities.lootTables || []) {
    if (typeof table.rollsMin === 'number' && typeof table.rollsMax === 'number' && table.rollsMax < table.rollsMin) {
      push(issues, 'error', 'lootTables', table.id, 'rollsMax', m('最多抽取不能小于最少抽取', 'Max rolls cannot be less than min rolls'))
    }
  }

  return issues
}

export function issuesFor(issues, type, id) {
  if (!id) return issues.filter((issue) => issue.type === type && !issue.id)
  return issues.filter((issue) => issue.type === type && issue.id === id)
}

export function countByLevel(issues, level) {
  return issues.filter((issue) => issue.level === level).length
}

<script setup>
import { computed, ref, watch } from 'vue'
import {
  ATTRS,
  DEFAULT_TACTICS,
  ITEM_TYPES,
  SLOTS,
  TACTIC_FIRST_ROUND,
  TACTIC_POSITIONS,
  TACTIC_STANCES,
  TACTIC_TARGETS,
  optionLabel
} from '../data/schema'
import { getList } from '../store/content'
import {
  activeAdventure,
  equipItem,
  hero,
  heroView,
  maxHp,
  saveTactics,
  unequipItem,
  useItem
} from '../store/game'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const notice = ref('')
const error = ref('')
const busy = ref(false)

const items = computed(() => getList('items'))
const itemById = computed(() => new Map(items.value.map((item) => [item.id, item])))
const inventory = computed(() => (Array.isArray(hero.value?.inventory) ? hero.value.inventory : []))
const stats = computed(() => heroView())
const race = computed(() => getList('races').find((entry) => entry.id === hero.value?.raceId))
const cls = computed(() => getList('classes').find((entry) => entry.id === hero.value?.classId))
const nextLevelNeed = computed(() => (hero.value ? hero.value.level * 300 : 0))
const locked = computed(() => Boolean(activeAdventure.value))

const tactics = ref({ ...DEFAULT_TACTICS })
watch(
  hero,
  (value) => {
    tactics.value = { ...DEFAULT_TACTICS, ...(value?.tactics || {}) }
  },
  { immediate: true }
)

const tacticFields = [
  { key: 'stance', options: TACTIC_STANCES },
  { key: 'position', options: TACTIC_POSITIONS },
  { key: 'targetPriority', options: TACTIC_TARGETS },
  { key: 'firstRound', options: TACTIC_FIRST_ROUND }
]

const gearSlots = computed(() => SLOTS.filter((slot) => slot.value !== 'pocket'))
const equippedBySlot = computed(() => {
  const map = new Map()
  for (const inst of inventory.value) {
    if (inst.equipped) map.set(inst.equipped, inst)
  }
  return map
})

const hpPercent = computed(() => {
  if (!hero.value) return 0
  const max = maxHp.value || 1
  return Math.max(0, Math.min(100, Math.round(((hero.value.hp || 0) / max) * 100)))
})

function itemOf(instance) {
  return itemById.value.get(instance?.itemId) || null
}

function isEquippable(item) {
  return Boolean(item) && ['weapon', 'armor', 'accessory'].includes(item.type) && item.slot && item.slot !== 'pocket'
}

function canEquip(item) {
  if (!isEquippable(item)) return false
  if ((item.levelReq || 1) > (hero.value?.level || 1)) return false
  if (item.usableClassIds?.length && !item.usableClassIds.includes(hero.value?.classId)) return false
  if (item.usableRaceIds?.length && !item.usableRaceIds.includes(hero.value?.raceId)) return false
  return true
}

function canUse(item) {
  return Boolean(item?.consumable) && (item.useEffect || 'none') !== 'none' && Number(item.effectAmount) > 0
}

function effectLabel(item) {
  if (!item) return ''
  return `${optionLabel(ITEM_TYPES, item.type, lang.value)} · ${optionLabel(SLOTS, item.slot, lang.value)}`
}

function useLabel(item) {
  const effect = t(`hero.effect.${item.useEffect || 'none'}`)
  return `${effect} +${item.effectAmount || 0}`
}

async function run(action, success) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
    if (success) notice.value = success
  } catch (err) {
    error.value = err?.message || t('hero.actionFailed')
  } finally {
    busy.value = false
  }
}

function equip(instance) {
  run(() => equipItem(instance.uid))
}

function unequip(slot) {
  run(() => unequipItem(slot))
}

function use(instance) {
  const item = itemOf(instance)
  run(async () => {
    const data = await useItem(instance.uid)
    const amount = data?.effect?.amount || 0
    notice.value = `${t('hero.useSuccess')}：${tx(item.name, lang)} +${amount}`
  })
}

function saveSettings() {
  run(() => saveTactics({ ...tactics.value }), t('hero.tactics.saved'))
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <h1>{{ t('hero.title') }}</h1>
        <p class="muted">{{ t('hero.subtitle') }}</p>
      </div>
    </header>

    <section v-if="!hero" class="card">
      <p class="muted">{{ t('hero.noHero') }}</p>
      <RouterLink class="btn primary" to="/game">{{ t('hero.goCreate') }}</RouterLink>
    </section>

    <div v-else class="hero-layout">
      <aside class="card hero-sheet">
        <div class="row-between">
          <div>
            <h2>{{ hero.name }}</h2>
            <p class="muted small">
              {{ tx(race?.name, lang) }} · {{ tx(cls?.name, lang) }}
            </p>
          </div>
          <span class="pill next">{{ t('game.hero.level') }} {{ hero.level }}</span>
        </div>

        <div class="hp-block">
          <div class="row-between small">
            <span>{{ t('hero.hp') }}</span>
            <span class="mono">{{ hero.hp || 0 }} / {{ maxHp || 0 }}</span>
          </div>
          <div class="hp-bar"><span :style="{ width: `${hpPercent}%` }"></span></div>
          <p class="muted tiny">{{ t('hero.regenHint') }}</p>
          <p v-if="(hero.hp || 0) <= 0" class="notice bad">{{ t('hero.downed') }}</p>
        </div>

        <dl class="hero-meta">
          <div>
            <dt>{{ t('game.hero.ep') }}</dt>
            <dd>{{ hero.ep }} / {{ nextLevelNeed }}</dd>
          </div>
          <div>
            <dt>{{ t('game.hero.gold') }}</dt>
            <dd>{{ hero.gold }}</dd>
          </div>
        </dl>

        <p class="pane-title">{{ t('hero.summary') }}</p>
        <dl class="hero-meta">
          <div>
            <dt>{{ t('hero.attack') }}</dt>
            <dd>{{ stats?.attackAvg ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.defense') }}</dt>
            <dd>{{ stats?.defenseAvg ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.initiative') }}</dt>
            <dd>{{ stats?.initiativeAvg ?? '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.absorb') }}</dt>
            <dd>
              {{ stats?.absorb?.normal ?? 0 }} / {{ stats?.absorb?.good ?? 0 }} /
              {{ stats?.absorb?.critical ?? 0 }}
            </dd>
          </div>
          <div>
            <dt>{{ t('hero.weapon') }}</dt>
            <dd>{{ stats?.weaponName ? tx(stats.weaponName, lang) : t('hero.noWeapon') }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.damageTiers') }}</dt>
            <dd class="mono">
              {{ stats?.damageTiers?.normal ?? 0 }} / {{ stats?.damageTiers?.good ?? 0 }} /
              {{ stats?.damageTiers?.critical ?? 0 }}
            </dd>
          </div>
        </dl>
        <p class="muted tiny">
          {{ t('hero.damage.normal') }} / {{ t('hero.damage.good') }} /
          {{ t('hero.damage.critical') }}
        </p>

        <p class="pane-title">{{ t('hero.bonus') }}</p>
        <dl class="hero-meta">
          <div>
            <dt>{{ t('hero.bonusAttack') }}</dt>
            <dd>+{{ stats?.attackBonus || 0 }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.bonusDefense') }}</dt>
            <dd>+{{ stats?.defenseBonus || 0 }}</dd>
          </div>
          <div>
            <dt>{{ t('hero.bonusInit') }}</dt>
            <dd>+{{ stats?.initiativeBonus || 0 }}</dd>
          </div>
        </dl>

        <p class="pane-title">{{ t('hero.attributes') }}</p>
        <div class="attr-grid view-only">
          <div v-for="attr in ATTRS" :key="attr.key" class="attr-item">
            <span>{{ tx({ zh: attr.zh, en: attr.en }, lang) }}</span>
            <strong>{{ stats?.attrs[attr.key] }}</strong>
          </div>
        </div>

        <p class="pane-title">{{ t('hero.skills') }}</p>
        <ul class="plain-list">
          <li v-for="skill in stats?.skills || []" :key="skill.def.id">
            <span>{{ tx(skill.def.name, lang) }}</span>
            <span class="muted small">Lv {{ skill.level }}</span>
          </li>
        </ul>
      </aside>

      <div class="hero-main">
        <p v-if="notice" class="notice ok">{{ notice }}</p>
        <p v-if="error" class="notice bad">{{ error }}</p>
        <p v-if="locked" class="notice warn">{{ t('hero.locked') }}</p>

        <section class="card">
          <p class="pane-title">{{ t('hero.tactics.title') }}</p>
          <p class="muted small">{{ t('hero.tactics.hint') }}</p>
          <div class="tactic-grid">
            <label v-for="field in tacticFields" :key="field.key" class="field">
              <span class="field-label">{{ t(`hero.tactics.${field.key}`) }}</span>
              <select v-model="tactics[field.key]" :disabled="busy">
                <option v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ tx({ zh: option.zh, en: option.en }, lang) }}
                </option>
              </select>
            </label>
          </div>
          <p class="muted tiny">{{ t('hero.tactics.effect') }}</p>
          <button class="btn primary small" :disabled="busy" @click="saveSettings">
            {{ t('hero.tactics.save') }}
          </button>
        </section>

        <section class="card">
          <p class="pane-title">{{ t('hero.equipment') }}</p>
          <div class="slot-grid">
            <div v-for="slot in gearSlots" :key="slot.value" class="slot-card">
              <span class="slot-label">{{ tx({ zh: slot.zh, en: slot.en }, lang) }}</span>
              <template v-if="equippedBySlot.get(slot.value)">
                <strong class="slot-item">
                  {{ tx(itemOf(equippedBySlot.get(slot.value))?.name, lang) }}
                </strong>
                <button
                  class="btn small ghost"
                  :disabled="busy || locked"
                  @click="unequip(slot.value)"
                >
                  {{ t('hero.unequip') }}
                </button>
              </template>
              <span v-else class="muted small">{{ t('hero.emptySlot') }}</span>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="row-between">
            <p class="pane-title">{{ t('hero.backpack') }}</p>
            <span class="muted small">{{ inventory.length }} {{ t('common.items') }}</span>
          </div>

          <ul v-if="inventory.length" class="backpack-list">
            <li v-for="instance in inventory" :key="instance.uid" class="backpack-item">
              <div class="item-main">
                <div class="row-between">
                  <strong>{{ tx(itemOf(instance)?.name, lang) }}</strong>
                  <span v-if="instance.equipped" class="equipped-tag">{{ t('hero.equipped') }}</span>
                </div>
                <p class="muted small">
                  {{ effectLabel(itemOf(instance)) }}
                  <span v-if="itemOf(instance)?.consumable"> · {{ t('hero.qty') }} {{ instance.qty }}</span>
                  <span v-if="canUse(itemOf(instance))"> · {{ useLabel(itemOf(instance)) }}</span>
                </p>
                <p v-if="itemOf(instance)?.desc" class="muted tiny">
                  {{ tx(itemOf(instance)?.desc, lang) }}
                </p>
              </div>
              <div class="item-actions">
                <button
                  v-if="isEquippable(itemOf(instance)) && !instance.equipped"
                  class="btn small"
                  :disabled="busy || locked || !canEquip(itemOf(instance))"
                  @click="equip(instance)"
                >
                  {{ t('hero.equip') }}
                </button>
                <button
                  v-if="instance.equipped"
                  class="btn small ghost"
                  :disabled="busy || locked"
                  @click="unequip(instance.equipped)"
                >
                  {{ t('hero.unequip') }}
                </button>
                <button
                  v-if="canUse(itemOf(instance))"
                  class="btn small primary"
                  :disabled="busy || locked"
                  @click="use(instance)"
                >
                  {{ t('hero.use') }}
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="muted small">{{ t('hero.emptyBackpack') }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

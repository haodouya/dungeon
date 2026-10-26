<script setup>
import { computed, onMounted, ref } from 'vue'
import { DAMAGE_TYPES, ITEM_TYPES, SLOTS, optionLabel } from '../data/schema'
import { getList } from '../store/content'
import {
  activeAdventure,
  buyItem,
  hero,
  loadShop,
  maxHp,
  sellItem,
  shopItems
} from '../store/game'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const notice = ref('')
const error = ref('')
const busy = ref(false)

const items = computed(() => getList('items'))
const itemById = computed(() => new Map(items.value.map((item) => [item.id, item])))
const inventory = computed(() => (Array.isArray(hero.value?.inventory) ? hero.value.inventory : []))
const locked = computed(() => Boolean(activeAdventure.value))

function itemOf(instance) {
  return itemById.value.get(instance?.itemId) || null
}

function sellPriceOf(item) {
  return Math.max(1, Math.floor((Number(item?.value) || 0) / 2))
}

function kindLabel(item) {
  if (!item) return ''
  return `${optionLabel(ITEM_TYPES, item.type, lang.value)} · ${optionLabel(SLOTS, item.slot, lang.value)}`
}

function effectLabel(item) {
  if (!item?.consumable) return ''
  const effect = t(`hero.effect.${item.useEffect || 'none'}`)
  return `${effect} +${item.effectAmount || 0}`
}

function bonusLine(item) {
  const parts = []
  if (item?.attackBonus) parts.push(`ATK +${item.attackBonus}`)
  if (item?.defenseBonus) parts.push(`DEF +${item.defenseBonus}`)
  if (item?.initiativeBonus) parts.push(`INI +${item.initiativeBonus}`)
  if (item?.absorbNormal) parts.push(`ABS +${item.absorbNormal}`)
  if (item?.damageNormal) parts.push(`DMG ${item.damageNormal}/${item.damageGood || 0}/${item.damageCritical || 0}`)
  if (item?.damageType) parts.push(optionLabel(DAMAGE_TYPES, item.damageType, lang.value))
  if (item?.consumable && item?.charges) parts.push(`${t('shop.charges')} ${item.charges}`)
  return parts.join(' · ')
}

async function run(action, success) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await action()
    notice.value = success(result)
  } catch (err) {
    error.value = err?.message || t('game.create.failed')
  } finally {
    busy.value = false
  }
}

function buy(item) {
  run(
    () => buyItem(item.id),
    (data) => `${t('shop.buySuccess')}：${tx(data?.item?.name || item.name, lang)} -${data?.price || item.buyPrice}`
  )
}

function sell(instance) {
  const item = itemOf(instance)
  run(
    () => sellItem(instance.uid),
    (data) => `${t('shop.sellSuccess')}：${tx(data?.item?.name || item?.name, lang)} +${data?.refund || 0}`
  )
}

onMounted(loadShop)
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <h1>{{ t('shop.title') }}</h1>
        <p class="muted">{{ t('shop.subtitle') }}</p>
      </div>
      <div v-if="hero" class="shop-wallet">
        <span class="muted small">{{ t('shop.gold') }}</span>
        <strong class="mono">{{ hero.gold }}</strong>
        <span class="muted tiny">HP {{ hero.hp || 0 }}/{{ maxHp }}</span>
      </div>
    </header>

    <section v-if="!hero" class="card">
      <p class="muted">{{ t('shop.noHero') }}</p>
      <RouterLink class="btn primary" to="/game">{{ t('shop.goHero') }}</RouterLink>
    </section>

    <template v-else>
      <p v-if="notice" class="notice ok">{{ notice }}</p>
      <p v-if="error" class="notice bad">{{ error }}</p>
      <p v-if="locked" class="notice warn">{{ t('shop.locked') }}</p>

      <section class="card">
        <p class="pane-title">{{ t('shop.title') }}</p>
        <div v-if="shopItems.length" class="shop-grid">
          <article v-for="item in shopItems" :key="item.id" class="shop-card">
            <div class="row-between">
              <strong>{{ tx(item.name, lang) }}</strong>
              <span class="badge">{{ kindLabel(item) }}</span>
            </div>
            <p class="muted tiny">{{ tx(item.desc, lang) }}</p>
            <p v-if="bonusLine(item)" class="muted small mono">{{ bonusLine(item) }}</p>
            <p v-if="effectLabel(item)" class="muted small">{{ effectLabel(item) }}</p>
            <p class="muted tiny">
              {{ t('shop.levelReq') }} {{ item.levelReq || 1 }} ·
              {{ t('shop.sellPrice') }} {{ item.sellPrice }}
            </p>
            <div class="shop-actions">
              <span class="price mono">{{ t('shop.price') }} {{ item.buyPrice }}</span>
              <button
                class="btn small primary"
                :disabled="busy || locked || (hero?.gold || 0) < item.buyPrice"
                @click="buy(item)"
              >
                {{ (hero?.gold || 0) < item.buyPrice ? t('shop.notEnoughGold') : t('shop.buy') }}
              </button>
            </div>
          </article>
        </div>
        <p v-else class="muted small">{{ t('shop.empty') }}</p>
      </section>

      <section class="card">
        <div class="row-between">
          <p class="pane-title">{{ t('shop.backpack') }}</p>
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
                {{ kindLabel(itemOf(instance)) }}
                <span v-if="itemOf(instance)?.consumable"> · {{ t('hero.qty') }} {{ instance.qty }}</span>
              </p>
            </div>
            <div class="item-actions">
              <span class="muted small mono">{{ t('shop.sellPrice') }} {{ sellPriceOf(itemOf(instance)) }}</span>
              <button
                class="btn small ghost"
                :disabled="busy || locked"
                @click="sell(instance)"
              >
                {{ t('shop.sell') }}
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="muted small">{{ t('shop.emptyBackpack') }}</p>
      </section>
    </template>
  </div>
</template>

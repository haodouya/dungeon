<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ATTRS } from '../data/schema'
import { getList } from '../store/content'
import {
  activeAdventure,
  createHero,
  deleteHero,
  hero,
  heroView,
  maxHp,
  pollAdventure,
  reports,
  runsLeftToday,
  serverOffset,
  startDungeon
} from '../store/game'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const router = useRouter()
const form = ref({ name: '', gender: 'female', raceId: '', classId: '' })
const error = ref('')
const notice = ref('')
const noticeOk = ref('')
const busy = ref(false)

const races = computed(() => getList('races'))
const allClasses = computed(() => getList('classes'))

const availableClasses = computed(() => {
  const race = races.value.find((entry) => entry.id === form.value.raceId)
  return allClasses.value.filter((cls) => {
    const raceAllows = !race?.allowedClassIds?.length || race.allowedClassIds.includes(cls.id)
    const classAllows = !cls.allowedRaceIds?.length || cls.allowedRaceIds.includes(form.value.raceId)
    return raceAllows && classAllows
  })
})

watch(
  races,
  (list) => {
    if (!form.value.raceId && list.length) form.value.raceId = list[0].id
  },
  { immediate: true }
)

watch(
  availableClasses,
  (list) => {
    if (!list.some((cls) => cls.id === form.value.classId)) {
      form.value.classId = list[0]?.id || ''
    }
  },
  { immediate: true }
)

const selectedRace = computed(() => races.value.find((entry) => entry.id === form.value.raceId))
const selectedClass = computed(() => allClasses.value.find((entry) => entry.id === form.value.classId))

const stats = computed(() => heroView())
const heroRace = computed(() => races.value.find((entry) => entry.id === hero.value?.raceId))
const heroClass = computed(() => allClasses.value.find((entry) => entry.id === hero.value?.classId))
const nextLevelNeed = computed(() => (hero.value ? hero.value.level * 300 : 0))
const progress = computed(() => {
  if (!hero.value || !nextLevelNeed.value) return 0
  return Math.min(100, Math.round((hero.value.ep / nextLevelNeed.value) * 100))
})

const dungeons = computed(() =>
  getList('dungeons')
    .slice()
    .sort((a, b) => (a.recLevel || 1) - (b.recLevel || 1))
)

const latest = computed(() => reports.value[0] || null)

// 倒计时完全依赖服务器时间：tick 只驱动画面刷新，serverOffset 来自服务器响应
const tick = ref(Date.now())
const settling = ref(false)
let timer = null

const activeDungeon = computed(() => {
  const adventure = activeAdventure.value
  if (!adventure) return null
  return dungeons.value.find((entry) => entry.id === adventure.dungeonId) || null
})

const remainingMs = computed(() => {
  const adventure = activeAdventure.value
  if (!adventure) return 0
  const end = Date.parse(adventure.completesAt)
  if (!Number.isFinite(end)) return 0
  return Math.max(0, end - (tick.value + serverOffset.value))
})

const countdown = computed(() => {
  const total = Math.ceil(remainingMs.value / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

async function settleIfReady() {
  if (!activeAdventure.value || settling.value || remainingMs.value > 0) return
  settling.value = true
  try {
    const { report } = await pollAdventure()
    if (report) router.push({ name: 'report', params: { id: report.id } })
  } catch (err) {
    notice.value = err?.message || t('game.create.failed')
  } finally {
    settling.value = false
  }
}

onMounted(() => {
  tick.value = Date.now()
  settleIfReady()
  timer = setInterval(() => {
    tick.value = Date.now()
    settleIfReady()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function layersOf(dungeon) {
  return getList('layers').filter((layer) => layer.dungeonId === dungeon.id)
}

function roomsOf(dungeon) {
  const layerIds = new Set(layersOf(dungeon).map((layer) => layer.id))
  return getList('rooms').filter((room) => layerIds.has(room.layerId))
}

function canEnter(dungeon) {
  return (hero.value?.level || 1) >= (dungeon.minLevel || 1)
}

function runsLeft(dungeon) {
  return runsLeftToday(dungeon)
}

function canEmbark(dungeon) {
  return (
    canEnter(dungeon) &&
    runsLeft(dungeon) > 0 &&
    (hero.value?.hp || 0) > 0 &&
    !activeAdventure.value &&
    !busy.value
  )
}

async function submit() {
  if (!form.value.name.trim() || !form.value.raceId || !form.value.classId) {
    error.value = t('game.create.required')
    return
  }
  if (!races.value.length || !allClasses.value.length) {
    error.value = t('game.create.noData')
    return
  }
  error.value = ''
  try {
    await createHero({
      name: form.value.name.trim(),
      gender: form.value.gender,
      raceId: form.value.raceId,
      classId: form.value.classId
    })
  } catch (err) {
    error.value = err?.message || t('game.create.failed')
  }
}

async function removeHero() {
  if (!window.confirm(t('game.hero.resetConfirm'))) return
  try {
    await deleteHero()
  } catch (err) {
    notice.value = err?.message || t('game.create.failed')
  }
}

async function embark(dungeon) {
  if (!canEmbark(dungeon)) return
  busy.value = true
  notice.value = ''
  noticeOk.value = ''
  try {
    const adventure = await startDungeon(dungeon.id)
    if (adventure) {
      noticeOk.value = t('game.adventure.started')
      tick.value = Date.now()
      settleIfReady()
    }
  } catch (err) {
    notice.value = err?.message || t('game.create.failed')
  } finally {
    busy.value = false
  }
}

function openLatest() {
  if (latest.value) router.push({ name: 'report', params: { id: latest.value.id } })
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <h1>{{ t('game.title') }}</h1>
        <p class="muted">{{ t('game.subtitle') }}</p>
      </div>
    </header>

    <section v-if="!hero" class="card create-card">
      <p class="pane-title">{{ t('game.create.title') }}</p>
      <p class="muted">{{ t('game.create.desc') }}</p>

      <template v-if="races.length && allClasses.length">
        <div class="create-grid">
          <label class="field">
            <span class="field-label">{{ t('game.create.name') }}</span>
            <input v-model="form.name" :placeholder="t('game.create.namePlaceholder')" maxlength="24" />
          </label>
          <label class="field">
            <span class="field-label">{{ t('game.create.gender') }}</span>
            <select v-model="form.gender">
              <option value="female">{{ t('game.gender.female') }}</option>
              <option value="male">{{ t('game.gender.male') }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">{{ t('game.create.race') }}</span>
            <select v-model="form.raceId">
              <option v-for="race in races" :key="race.id" :value="race.id">{{ tx(race.name, lang) }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">{{ t('game.create.class') }}</span>
            <select v-model="form.classId">
              <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                {{ tx(cls.name, lang) }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="selectedRace || selectedClass" class="create-preview">
          <div v-if="selectedRace">
            <strong>{{ tx(selectedRace.name, lang) }}</strong>
            <p class="muted small">{{ tx(selectedRace.desc, lang) }}</p>
          </div>
          <div v-if="selectedClass">
            <strong>{{ tx(selectedClass.name, lang) }}</strong>
            <p class="muted small">{{ tx(selectedClass.desc, lang) }}</p>
          </div>
        </div>

        <p v-if="error" class="notice bad">{{ error }}</p>
        <button class="btn primary" @click="submit">{{ t('game.create.submit') }}</button>
      </template>

      <p v-else class="notice bad">{{ t('game.create.noData') }}</p>
    </section>

    <div v-else class="game-grid">
      <aside class="card hero-card">
        <div class="row-between">
          <div>
            <p class="pane-title">{{ t('game.hero.title') }}</p>
            <h2>{{ hero.name }}</h2>
          </div>
          <span class="pill next">{{ t('game.hero.level') }} {{ hero.level }}</span>
        </div>

        <dl class="hero-meta">
          <div>
            <dt>{{ t('game.hero.race') }}</dt>
            <dd>{{ tx(heroRace?.name, lang) }}</dd>
          </div>
          <div>
            <dt>{{ t('game.hero.class') }}</dt>
            <dd>{{ tx(heroClass?.name, lang) }}</dd>
          </div>
          <div>
            <dt>{{ t('game.hero.gold') }}</dt>
            <dd>{{ hero.gold }}</dd>
          </div>
          <div>
            <dt>{{ t('game.hero.hp') }}</dt>
            <dd>{{ hero.hp || 0 }} / {{ maxHp }}</dd>
          </div>
        </dl>

        <RouterLink class="btn small ghost" to="/hero">{{ t('game.hero.openHero') }}</RouterLink>

        <div class="progress-block">
          <div class="row-between small">
            <span>{{ t('game.hero.ep') }} {{ hero.ep }} / {{ nextLevelNeed }}</span>
            <span class="muted">{{ t('game.hero.nextLevel') }} {{ Math.max(0, nextLevelNeed - hero.ep) }}</span>
          </div>
          <div class="progress-bar"><span :style="{ width: `${progress}%` }"></span></div>
        </div>

        <p class="pane-title">{{ t('game.hero.attrs') }}</p>
        <div class="attr-grid view-only">
          <div v-for="attr in ATTRS" :key="attr.key" class="attr-item">
            <span>{{ tx({ zh: attr.zh, en: attr.en }, lang) }}</span>
            <strong>{{ stats?.attrs[attr.key] }}</strong>
          </div>
        </div>

        <p class="pane-title">{{ t('game.hero.skills') }}</p>
        <ul class="plain-list">
          <li v-for="skill in stats?.skills || []" :key="skill.def.id">
            <span>{{ tx(skill.def.name, lang) }}</span>
            <span class="muted small">Lv {{ skill.level }}</span>
          </li>
        </ul>

        <p class="pane-title">{{ t('game.hero.inventory') }}</p>
        <ul class="plain-list">
          <li v-for="item in stats?.items || []" :key="item.id">
            <span>{{ tx(item.name, lang) }}</span>
            <span class="muted small">{{ item.slot }}</span>
          </li>
          <li v-if="!(stats?.items || []).length" class="muted small">{{ t('game.hero.emptyInventory') }}</li>
        </ul>

        <button class="btn danger small" @click="removeHero">{{ t('game.hero.reset') }}</button>
      </aside>

      <section class="card dungeon-pane">
        <p class="pane-title">{{ t('game.dungeons.title') }}</p>
        <p class="muted">{{ t('game.dungeons.desc') }}</p>
        <p v-if="notice" class="notice bad">{{ notice }}</p>
        <p v-if="noticeOk" class="notice ok">{{ noticeOk }}</p>

        <div v-if="activeAdventure" class="adventure-card">
          <div class="adventure-info">
            <p class="pane-title">{{ t('game.adventure.title') }}</p>
            <strong>{{ tx(activeDungeon?.name, lang) || activeAdventure.dungeonId }}</strong>
            <p class="muted small">{{ t('game.adventure.serverNote') }}</p>
          </div>
          <div class="countdown">
            <span class="muted small">{{ t('game.adventure.remaining') }}</span>
            <span class="countdown-time">{{ countdown }}</span>
            <span class="muted tiny">
              {{ settling ? t('game.adventure.resolving') : t('game.adventure.wait') }}
            </span>
          </div>
        </div>

        <div class="latest-strip" v-if="latest">
          <div>
            <span class="muted small">{{ t('game.latest.title') }}</span>
            <strong>{{ tx(latest.dungeonName || latest.dungeonId, lang) }}</strong>
            <span class="pill" :class="latest.outcome === 'victory' ? 'done' : ''">
              {{ latest.outcome === 'victory' ? t('report.victory') : t('report.defeat') }}
            </span>
          </div>
          <button class="btn small" @click="openLatest">{{ t('game.latest.open') }}</button>
        </div>
        <p v-else class="muted small">{{ t('game.latest.none') }}</p>

        <div v-if="dungeons.length" class="dungeon-list">
          <article v-for="dungeon in dungeons" :key="dungeon.id" class="dungeon-card">
            <div class="dungeon-main">
              <div class="row-between">
                <h3>{{ tx(dungeon.name, lang) }}</h3>
                <span class="badge">Lv {{ dungeon.recLevel || 1 }}</span>
              </div>
              <p class="muted small">{{ tx(dungeon.desc, lang) }}</p>
              <div class="dungeon-meta">
                <span>{{ layersOf(dungeon).length }} {{ t('game.dungeons.layers') }}</span>
                <span>{{ roomsOf(dungeon).length }} {{ t('game.dungeons.rooms') }}</span>
                <span>{{ t('game.dungeons.minLevel') }} {{ dungeon.minLevel || 1 }}</span>
                <span>{{ t('game.dungeons.duration') }} {{ dungeon.durationMinutes || 5 }} {{ t('game.dungeons.minutes') }}</span>
                <span>{{ t('game.dungeons.dailyLeft') }} {{ runsLeft(dungeon) }}/{{ dungeon.dailyLimit || 4 }}</span>
              </div>
            </div>
            <button class="btn primary" :disabled="!canEmbark(dungeon)" @click="embark(dungeon)">
              {{
                busy
                  ? t('game.running')
                  : activeAdventure
                    ? t('game.adventure.wait')
                    : (hero?.hp || 0) <= 0
                      ? t('game.dungeons.noHp')
                      : !canEnter(dungeon)
                        ? t('game.dungeons.locked')
                        : runsLeft(dungeon) <= 0
                          ? t('game.dungeons.dailyNone')
                          : t('game.dungeons.go')
              }}
            </button>
          </article>
        </div>
        <p v-else class="notice bad">{{ t('game.dungeons.none') }}</p>
      </section>
    </div>
  </div>
</template>

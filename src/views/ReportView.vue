<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DAMAGE_TYPES,
  TACTIC_FIRST_ROUND,
  TACTIC_POSITIONS,
  TACTIC_STANCES,
  TACTIC_TARGETS,
  optionLabel
} from '../data/schema'
import { reports, startDungeon } from '../store/game'
import { api } from '../api'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const route = useRoute()
const router = useRouter()

const remote = ref(null)
const loading = ref(false)
const runError = ref('')

const report = computed(
  () => reports.value.find((entry) => entry.id === String(route.params.id)) || remote.value
)

const heroStats = computed(() => report.value?.stats?.hero || null)

async function ensureReport() {
  if (report.value) return
  loading.value = true
  try {
    const data = await api(`/reports/${encodeURIComponent(String(route.params.id))}`)
    remote.value = data.report
  } catch {
    remote.value = null
  } finally {
    loading.value = false
  }
}

onMounted(ensureReport)

function nameOf(value) {
  return typeof value === 'string' ? value : tx(value, lang.value)
}

function hitLabel(hitType) {
  return t(`report.hit.${hitType}`)
}

function damageLabel(type) {
  return optionLabel(DAMAGE_TYPES, type, lang.value)
}

function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(lang.value === 'zh' ? 'zh-CN' : 'en-US')
}

function chapterOutcome(chapter) {
  if (chapter.outcome === 'victory') return t('report.victory')
  if (chapter.outcome === 'defeat') return t('report.defeat')
  return t('report.clear')
}

function hitRate(stats) {
  if (!stats?.attacks) return 0
  return Math.round((stats.hits / stats.attacks) * 100)
}

function orderLine(order) {
  return (order || []).map((unit) => `${nameOf(unit.name)} ${unit.initiative}`).join(' · ')
}

function tacticLabel(list, value) {
  const option = list.find((entry) => entry.value === value)
  return option ? tx({ zh: option.zh, en: option.en }, lang.value) : ''
}

const tacticSummary = computed(() => {
  const value = report.value?.tactics
  if (!value) return '—'
  return [
    tacticLabel(TACTIC_STANCES, value.stance),
    tacticLabel(TACTIC_POSITIONS, value.position),
    tacticLabel(TACTIC_TARGETS, value.targetPriority),
    tacticLabel(TACTIC_FIRST_ROUND, value.firstRound)
  ]
    .filter(Boolean)
    .join(' · ')
})

const gearNames = computed(() =>
  (report.value?.loadout?.items || []).map((item) => nameOf(item.name)).filter(Boolean)
)

async function runAgain() {
  if (!report.value) return
  runError.value = ''
  try {
    await startDungeon(report.value.dungeonId)
    router.push({ name: 'game' })
  } catch (error) {
    runError.value = error?.message || t('game.create.failed')
  }
}
</script>

<template>
  <div class="view">
    <div v-if="loading" class="card">
      <p class="muted">{{ t('common.loading') }}</p>
    </div>
    <div v-else-if="!report" class="card">
      <p class="notice bad">{{ t('report.notFound') }}</p>
      <RouterLink class="btn" to="/game">{{ t('common.backHome') }}</RouterLink>
    </div>

    <template v-else>
      <header class="report-head card">
        <div>
          <p class="pane-title">{{ t('report.title') }}</p>
          <h1>{{ tx(report.dungeonName || report.dungeonId, lang) }}</h1>
          <p class="muted">
            {{ report.heroName }} · {{ formatTime(report.createdAt) }}
            <span class="mono">· seed {{ report.seed }}</span>
            <span v-if="report.durationMinutes"> · {{ report.durationMinutes }} {{ t('report.minutes') }}</span>
          </p>
        </div>
        <div class="report-head-actions">
          <span class="outcome" :class="report.outcome">
            {{ report.outcome === 'victory' ? t('report.victory') : t('report.defeat') }}
          </span>
          <RouterLink class="btn" to="/game">{{ t('report.back') }}</RouterLink>
          <button class="btn primary" @click="runAgain">{{ t('report.again') }}</button>
        </div>
      </header>

      <p v-if="runError" class="notice bad">{{ runError }}</p>

      <section class="card reward-card">
        <p class="pane-title">{{ t('report.reward') }}</p>
        <div class="reward-grid">
          <div>
            <span class="stat-value">+{{ report.reward.ep }}</span>
            <span class="stat-label">{{ t('game.reward.ep') }}</span>
          </div>
          <div>
            <span class="stat-value">+{{ report.reward.gold }}</span>
            <span class="stat-label">{{ t('game.reward.gold') }}</span>
          </div>
          <div class="reward-loot">
            <span class="stat-label">{{ t('game.reward.items') }}</span>
            <ul v-if="report.reward.items.length" class="plain-list compact">
              <li v-for="item in report.reward.items" :key="item.id">{{ nameOf(item.name) }}</li>
            </ul>
            <span v-else class="muted small">{{ t('game.reward.none') }}</span>
          </div>
        </div>
        <p v-if="report.heroAfter.leveled" class="notice ok">
          {{ t('report.levelUp') }} → Lv {{ report.heroAfter.level }}
        </p>
      </section>

      <section v-if="heroStats" class="card">
        <p class="pane-title">{{ t('report.stats') }}</p>
        <div class="stat-grid">
          <div class="stat-block">
            <span class="stat-value">{{ report.stats.rounds }}</span>
            <span class="stat-label">{{ t('report.stats.rounds') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ heroStats.damageDealt }}</span>
            <span class="stat-label">{{ t('report.stats.damageDealt') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ heroStats.damageTaken }}</span>
            <span class="stat-label">{{ t('report.stats.damageTaken') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ hitRate(heroStats) }}%</span>
            <span class="stat-label">{{ t('report.stats.hitRate') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ heroStats.criticals }}</span>
            <span class="stat-label">{{ t('report.stats.criticals') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ report.stats.kills }}</span>
            <span class="stat-label">{{ t('report.stats.kills') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ heroStats.absorbed }}</span>
            <span class="stat-label">{{ t('report.stats.absorbed') }}</span>
          </div>
          <div class="stat-block">
            <span class="stat-value">{{ heroStats.bestHit }}</span>
            <span class="stat-label">{{ t('report.stats.bestHit') }}</span>
          </div>
        </div>
        <dl class="hero-meta">
          <div>
            <dt>{{ t('report.stats.vitality') }}</dt>
            <dd class="mono">
              {{ report.heroStart?.hp ?? '—' }} → {{ report.heroEnd?.hp ?? report.heroAfter?.hp ?? '—' }}
            </dd>
          </div>
          <div>
            <dt>{{ t('report.stats.attacks') }}</dt>
            <dd class="mono">{{ heroStats.hits }} / {{ heroStats.attacks }}</dd>
          </div>
          <div v-if="report.durationMinutes">
            <dt>{{ t('report.duration') }}</dt>
            <dd>{{ report.durationMinutes }} {{ t('report.minutes') }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="report.loadout || report.tactics" class="card">
        <p class="pane-title">{{ t('report.loadout') }}</p>
        <dl class="hero-meta">
          <div>
            <dt>{{ t('report.loadout.weapon') }}</dt>
            <dd>{{ report.loadout?.weapon ? nameOf(report.loadout.weapon) : t('report.loadout.none') }}</dd>
          </div>
          <div>
            <dt>{{ t('report.loadout.items') }}</dt>
            <dd>{{ gearNames.length ? gearNames.join(' · ') : t('report.loadout.none') }}</dd>
          </div>
          <div>
            <dt>{{ t('report.tactics') }}</dt>
            <dd>{{ tacticSummary }}</dd>
          </div>
          <div v-if="report.loadout">
            <dt>{{ t('hero.attack') }} / {{ t('hero.defense') }}</dt>
            <dd class="mono">{{ report.loadout.attackAvg }} / {{ report.loadout.defenseAvg }}</dd>
          </div>
        </dl>
      </section>

      <section v-for="chapter in report.chapters" :key="chapter.roomId" class="card chapter">
        <header class="chapter-head">
          <span class="badge">{{ t('report.layer') }} {{ chapter.layerIndex }} · {{ nameOf(chapter.layerName) }}</span>
          <h2>{{ nameOf(chapter.roomName) }}</h2>
          <span class="pill" :class="{ done: chapter.outcome === 'victory' }">{{ chapterOutcome(chapter) }}</span>
        </header>

        <p v-if="chapter.roomStory" class="muted chapter-story">{{ nameOf(chapter.roomStory) }}</p>
        <p v-if="chapter.monsters.length" class="muted small">
          {{ tx({ zh: '遭遇：', en: 'Encounter: ' }, lang) }}{{ chapter.monsters.map(nameOf).join('、') }}
        </p>
        <p v-if="chapter.stats?.hero" class="muted small">
          {{ t('report.stats.rounds') }} {{ chapter.stats.rounds }} ·
          {{ t('report.stats.damageDealt') }} {{ chapter.stats.hero.damageDealt }} ·
          {{ t('report.stats.damageTaken') }} {{ chapter.stats.hero.damageTaken }} ·
          {{ t('report.stats.vitality') }} {{ chapter.heroHpStart }} → {{ chapter.heroHp }}
        </p>

        <div class="combat-log">
          <template v-for="(event, index) in chapter.events" :key="index">
            <p v-if="event.type === 'round'" class="round-line">
              {{ t('report.round') }} {{ event.round }}
              <span v-if="event.order?.length" class="round-order muted tiny">
                {{ t('report.order') }}：{{ orderLine(event.order) }}
              </span>
            </p>
            <div v-else-if="event.type === 'defend'" class="log-line defend-line">
              <strong>{{ nameOf(event.name) }}</strong> — {{ t('report.defend') }}
              <span class="muted small">{{ t('report.defendDetail') }}</span>
            </div>
            <div v-else-if="event.type === 'action'" class="log-line" :class="event.hitType">
              <span class="log-actor">{{ nameOf(event.actorName) }}</span>
              <span class="log-arrow">→</span>
              <span class="log-target">{{ nameOf(event.targetName) }}</span>
              <span class="hit-tag" :class="event.hitType">{{ hitLabel(event.hitType) }}</span>
              <span v-if="event.hitType !== 'miss'" class="log-damage">
                {{ event.damage }} {{ damageLabel(event.damageType) }}
              </span>
              <span class="muted small log-math">
                ATK {{ event.attack }} / DEF {{ event.defense }}
                <span v-if="event.positionModifier">
                  · {{ t('report.positionModifier') }}
                  {{ event.positionModifier > 0 ? '+' : '' }}{{ event.positionModifier }}%
                </span>
                <span v-if="event.hitType !== 'miss'">
                  · {{ t('report.rawDamage') }} {{ event.rawDamage }} ·
                  {{ t('report.absorbed') }} {{ event.absorbed }}
                </span>
              </span>
              <span v-if="event.hitType !== 'miss'" class="log-hp">HP {{ event.hpAfter }}/{{ event.hpMax }}</span>
            </div>
            <div v-else-if="event.type === 'down'" class="log-line down-line">
              <strong>{{ nameOf(event.name) }}</strong> — {{ t('report.down') }}
            </div>
          </template>
        </div>
      </section>

      <p class="muted small report-note">{{ t('report.disclaimer') }}</p>
    </template>
  </div>
</template>

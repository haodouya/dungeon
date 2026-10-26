<script setup>
import { computed } from 'vue'
import { ENTITY_DEFS, ENTITY_KEYS, SCHEMA_VERSION } from '../data/schema'
import { counts, errorCount, issues, warnCount } from '../store/content'
import { isAdmin, isLoggedIn } from '../store/auth'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const playTarget = computed(() =>
  isLoggedIn.value ? '/game' : { path: '/login', query: { redirect: '/game' } }
)

const milestones = [
  {
    id: 'M0',
    status: 'done',
    title: { zh: 'M0 内容基座与编辑器', en: 'M0 Content base & editor' },
    desc: {
      zh: '数据规范、通用编辑器、引用校验、双语字段、JSON 数据包导入导出。',
      en: 'Schema, generic editor, reference validation, bilingual fields, JSON pack import/export.'
    }
  },
  {
    id: 'M1',
    status: 'done',
    title: { zh: 'M1 最小可玩闭环', en: 'M1 Minimal playable loop' },
    desc: {
      zh: '建号 → 选地城 → 自动战斗 → 战报 → 奖励与升级；seed 可复现。',
      en: 'Create hero → pick dungeon → auto combat → report → rewards and levels; reproducible by seed.'
    }
  },
  {
    id: 'M2',
    status: 'done',
    title: { zh: 'M2 账号与 SQLite 数据库', en: 'M2 Accounts & SQLite' },
    desc: {
      zh: '注册/登录、会话、管理员权限；内容、英雄与战报全部落到服务器数据库，编辑器写库即时生效。',
      en: 'Registration, sessions, admin permissions; content, heroes and reports live in the server database, and editor saves hit the database.'
    }
  },
  {
    id: 'M3',
    status: 'next',
    title: { zh: 'M3 内容集与专用编辑器', en: 'M3 Content set & specialized editors' },
    desc: {
      zh: 'SRD 批量导入、地城树可视化编排、内容量扩充到首期目标、战斗沙盒调平衡。',
      en: 'Bulk SRD import, visual dungeon tree, content volume toward the first content set, combat sandbox.'
    }
  },
  {
    id: 'M4',
    status: 'todo',
    title: { zh: 'M4 战斗深度', en: 'M4 Combat depth' },
    desc: {
      zh: '技能资源、多步行动与先攻递减、受伤分级、护甲分型减伤、多目标站位。',
      en: 'Skill resources, multi-step actions and initiative decay, wound tiers, typed armor absorb, multi-target positions.'
    }
  },
  {
    id: 'M5',
    status: 'todo',
    title: { zh: 'M5 地城规则与养成', en: 'M5 Dungeon rules & progression' },
    desc: {
      zh: '冷却与每日次数、任务、属性/技能训练、商店与仓库、团队。',
      en: 'Cooldowns and daily limits, quests, attribute/skill training, shops and storage, teams.'
    }
  }
]

const typeRows = computed(() => {
  void counts.value
  return ENTITY_KEYS.map((key) => ({
    key,
    label: ENTITY_DEFS[key].label,
    count: counts.value[key] || 0
  }))
})

function statusLabel(status) {
  if (status === 'done') return tx({ zh: '已完成', en: 'Done' }, lang.value)
  if (status === 'next') return tx({ zh: '下一步', en: 'Next' }, lang.value)
  return tx({ zh: '计划中', en: 'Planned' }, lang.value)
}

function milestoneText(value) {
  return tx(value, lang.value)
}
</script>

<template>
  <div class="view">
    <section class="hero card">
      <div>
        <p class="hero-kicker">{{ t('app.title') }} · playable</p>
        <h1>{{ t('home.hero.title') }}</h1>
        <p class="hero-desc">{{ t('home.hero.desc') }}</p>
        <div class="button-row">
          <RouterLink class="btn primary" :to="playTarget">{{ t('home.action.game') }}</RouterLink>
          <template v-if="isAdmin">
            <RouterLink class="btn" to="/editor">{{ t('home.action.editor') }}</RouterLink>
            <RouterLink class="btn" to="/data">{{ t('home.action.data') }}</RouterLink>
          </template>
          <RouterLink v-else-if="!isLoggedIn" class="btn" to="/login">{{ t('nav.login') }}</RouterLink>
        </div>
      </div>
    </section>

    <div class="stats-grid four">
      <div class="stat-card">
        <span class="stat-value">{{ counts.total }}</span>
        <span class="stat-label">{{ t('home.stat.entities') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ ENTITY_KEYS.length }}</span>
        <span class="stat-label">{{ t('home.stat.types') }}</span>
      </div>
      <RouterLink v-if="isAdmin" class="stat-card" to="/data">
        <span class="stat-value" :class="{ bad: errorCount }">{{ issues.length }}</span>
        <span class="stat-label">{{ t('home.stat.issues') }}</span>
        <span class="muted small">{{ errorCount }} {{ t('data.errors') }} · {{ warnCount }} {{ t('data.warnings') }}</span>
      </RouterLink>
      <div v-else class="stat-card">
        <span class="stat-value" :class="{ bad: errorCount }">{{ issues.length }}</span>
        <span class="stat-label">{{ t('home.stat.issues') }}</span>
        <span class="muted small">{{ errorCount }} {{ t('data.errors') }} · {{ warnCount }} {{ t('data.warnings') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">v{{ SCHEMA_VERSION }}</span>
        <span class="stat-label">{{ t('home.stat.version') }}</span>
      </div>
    </div>

    <div class="home-grid">
      <section class="card">
        <p class="pane-title">{{ t('home.types.title') }}</p>
        <ul class="type-overview">
          <li v-for="row in typeRows" :key="row.key">
            <RouterLink v-if="isAdmin" :to="{ path: '/editor', query: { type: row.key } }">
              <span>{{ tx(row.label, lang) }}</span>
              <code>{{ row.key }}</code>
            </RouterLink>
            <span v-else class="type-plain">
              <span>{{ tx(row.label, lang) }}</span>
              <code>{{ row.key }}</code>
            </span>
            <span class="stat-value small">{{ row.count }}</span>
          </li>
        </ul>
      </section>

      <section class="card">
        <p class="pane-title">{{ t('home.modules.title') }}</p>
        <ol class="milestones">
          <li v-for="item in milestones" :key="item.id" :class="item.status">
            <div class="milestone-head">
              <span class="milestone-id mono">{{ item.id }}</span>
              <strong>{{ milestoneText(item.title) }}</strong>
              <span class="pill" :class="item.status">{{ statusLabel(item.status) }}</span>
            </div>
            <p class="muted small">{{ milestoneText(item.desc) }}</p>
          </li>
        </ol>
      </section>
    </div>

    <section class="card">
      <p class="pane-title">{{ t('home.locale.title') }}</p>
      <p class="muted">{{ t('home.locale.desc') }}</p>
    </section>
  </div>
</template>

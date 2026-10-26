<script setup>
import { computed, ref } from 'vue'
import { ENTITY_DEFS, ENTITY_KEYS } from '../data/schema'
import {
  content,
  counts,
  errorCount,
  exportJson,
  findEntity,
  importJson,
  issues,
  resetContent,
  warnCount
} from '../store/content'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'

const fileInput = ref(null)
const notice = ref(null)
let noticeTimer = null

const meta = computed(() => content.value?.meta || {})
const schemaVersion = computed(() => content.value?.schemaVersion || 1)

function notify(text, level = 'ok') {
  notice.value = { text, level }
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 3600)
}

function doExport() {
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `dungeon-pack-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  notify(t('data.exportDone'))
}

function pickFile() {
  fileInput.value?.click()
}

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const text = await file.text()
  try {
    await importJson(text)
    notify(t('data.importSuccess'))
  } catch (error) {
    if (error.code === 'VERSION_TOO_NEW') notify(t('data.versionNewer'), 'bad')
    else if (error.code === 'INVALID_PACK') notify(`${t('data.importError')} · ${error.message}`, 'bad')
    else notify(`${t('data.importError')} · ${t('data.invalidFile')}`, 'bad')
    console.warn(error)
  }
}

async function doReset() {
  if (!window.confirm(t('data.resetConfirm'))) return
  try {
    await resetContent()
    notify(t('data.importSuccess'))
  } catch (error) {
    notify(`${t('data.importError')} · ${error.message}`, 'bad')
  }
}

function recordLabel(issue) {
  if (!issue.id) return t('editor.currentType')
  const rec = findEntity(issue.type, issue.id)
  return rec ? tx(rec.name, lang.value) || rec.id : issue.id
}

function locateTo(issue) {
  return {
    path: '/editor',
    query: issue.id ? { type: issue.type, id: issue.id } : { type: issue.type }
  }
}

function issueMessage(issue) {
  return tx(issue.message, lang.value)
}
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <h1>{{ t('data.title') }}</h1>
        <p class="muted">{{ t('data.desc') }}</p>
      </div>
      <div class="issue-summary" :class="{ bad: errorCount }">
        <span>{{ errorCount }} {{ t('data.errors') }}</span>
        <span>{{ warnCount }} {{ t('data.warnings') }}</span>
      </div>
    </header>

    <p v-if="notice" class="notice" :class="notice.level">{{ notice.text }}</p>

    <div class="data-grid">
      <section class="card">
        <p class="pane-title">{{ t('data.currentStats') }}</p>
        <dl class="meta-list">
          <div>
            <dt>{{ t('data.packName') }}</dt>
            <dd>{{ tx(meta.name, lang) }}</dd>
          </div>
          <div>
            <dt>{{ t('data.packVersion') }}</dt>
            <dd class="mono">{{ meta.version }}</dd>
          </div>
          <div>
            <dt>{{ t('data.updatedAt') }}</dt>
            <dd class="mono">{{ meta.updatedAt || '—' }}</dd>
          </div>
          <div>
            <dt>{{ t('data.schemaVersion') }}</dt>
            <dd class="mono">v{{ schemaVersion }}</dd>
          </div>
        </dl>
        <p class="hint-line">{{ t('data.storageNote') }}</p>
      </section>

      <section class="card">
        <p class="pane-title">{{ t('data.export') }} / {{ t('data.import') }}</p>
        <p class="muted small">{{ t('data.importHint') }}</p>
        <div class="button-row">
          <button class="btn primary" @click="doExport">{{ t('data.export') }}</button>
          <button class="btn" @click="pickFile">{{ t('data.import') }}</button>
          <button class="btn danger" @click="doReset">{{ t('data.reset') }}</button>
          <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onFile" />
        </div>
      </section>
    </div>

    <section class="card">
      <p class="pane-title">{{ t('home.types.title') }}</p>
      <div class="stats-grid">
        <RouterLink
          v-for="key in ENTITY_KEYS"
          :key="key"
          class="stat-card"
          :to="{ path: '/editor', query: { type: key } }"
        >
          <span class="stat-value">{{ counts[key] || 0 }}</span>
          <span class="stat-label">{{ tx(ENTITY_DEFS[key].label, lang) }}</span>
          <code>{{ key }}</code>
        </RouterLink>
      </div>
    </section>

    <section class="card">
      <div class="row-between">
        <p class="pane-title">{{ t('data.issues') }}</p>
        <span class="muted small">{{ issues.length }} {{ t('common.items') }}</span>
      </div>
      <p v-if="!issues.length" class="notice ok small">{{ t('data.noIssues') }}</p>
      <ul v-else class="issue-list">
        <li v-for="(issue, index) in issues" :key="`${issue.type}-${issue.id}-${issue.field}-${index}`" class="issue-row">
          <span class="dot" :class="issue.level"></span>
          <div class="issue-body">
            <div class="issue-title">
              <strong>{{ tx(ENTITY_DEFS[issue.type]?.label, lang) }}</strong>
              <span>{{ recordLabel(issue) }}</span>
              <span v-if="issue.field" class="mono">· {{ issue.field }}</span>
            </div>
            <p class="issue-text">{{ issueMessage(issue) }}</p>
          </div>
          <RouterLink class="btn small" :to="locateTo(issue)">{{ t('data.locate') }}</RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

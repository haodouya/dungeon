<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ENTITY_DEFS as DEFS, ENTITY_KEYS } from '../data/schema'
import { buildDraft, deleteEntity, duplicateEntity, findEntity, getList, issues, upsertEntity } from '../store/content'
import { validateContent } from '../core/validate'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'
import EntityForm from '../components/EntityForm.vue'

const route = useRoute()
const router = useRouter()

const type = ref('races')
const selectedId = ref('')
const draft = ref(null)
const draftOriginal = ref('')
const isNew = ref(false)
const search = ref('')
const flash = ref('')
const errorMsg = ref('')
let flashTimer = null

const clone = (value) => JSON.parse(JSON.stringify(value))

const dirty = computed(() => {
  if (!draft.value) return false
  return JSON.stringify(draft.value) !== draftOriginal.value
})

function sortedRecords(typeKey) {
  return getList(typeKey)
    .slice()
    .sort((a, b) =>
      tx(a.name, lang.value).localeCompare(tx(b.name, lang.value), lang.value === 'zh' ? 'zh-Hans-CN' : 'en', {
        sensitivity: 'base'
      })
    )
}

const list = computed(() => {
  const query = search.value.trim().toLowerCase()
  return sortedRecords(type.value).filter((rec) => {
    if (!query) return true
    return (
      tx(rec.name, lang.value).toLowerCase().includes(query) ||
      rec.id.toLowerCase().includes(query)
    )
  })
})

const issueMap = computed(() => {
  const map = {}
  for (const issue of issues.value) {
    const key = `${issue.type}/${issue.id}`
    if (!map[key]) map[key] = { error: 0, warn: 0 }
    map[key][issue.level] += 1
  }
  return map
})

const typeIssueCounts = computed(() => {
  const map = {}
  for (const issue of issues.value) {
    if (!map[issue.type]) map[issue.type] = { error: 0, warn: 0 }
    map[issue.type][issue.level] += 1
  }
  return map
})

// 校验当前草稿：把它放进完整内容里跑一遍，引用关系也能一起校验
const draftIssues = computed(() => {
  if (!draft.value) return []
  const packEntities = {}
  for (const key of ENTITY_KEYS) {
    packEntities[key] = getList(key).filter(
      (rec) => !(key === type.value && rec.id === draft.value.id)
    )
  }
  packEntities[type.value] = [...packEntities[type.value], draft.value]
  return validateContent({ entities: packEntities }).filter(
    (issue) => issue.type === type.value && issue.id === draft.value.id
  )
})

const def = computed(() => DEFS[type.value])

function issueText(issue) {
  return tx(issue.message, lang.value)
}

function recordName(rec) {
  return tx(rec.name, lang.value) || t('editor.nameFallback')
}

function confirmDiscard() {
  if (!dirty.value) return true
  return window.confirm(t('editor.confirmDiscard'))
}

function syncQuery() {
  const query = { type: type.value }
  if (selectedId.value) query.id = selectedId.value
  router.replace({ path: '/editor', query })
}

function selectEntity(rec, updateQuery = true) {
  draft.value = clone(rec)
  draftOriginal.value = JSON.stringify(draft.value)
  selectedId.value = rec.id
  isNew.value = false
  errorMsg.value = ''
  if (updateQuery) syncQuery()
}

function confirmSelect(rec) {
  if (rec.id === selectedId.value) return
  if (!confirmDiscard()) return
  selectEntity(rec)
}

function selectType(key) {
  if (key === type.value) return
  if (!confirmDiscard()) return
  type.value = key
  search.value = ''
  draft.value = null
  selectedId.value = ''
  isNew.value = false
  errorMsg.value = ''
  const first = sortedRecords(key)[0]
  if (first) selectEntity(first)
  else syncQuery()
}

function createNew() {
  if (!confirmDiscard()) return
  draft.value = buildDraft(type.value)
  draftOriginal.value = JSON.stringify(draft.value)
  selectedId.value = ''
  isNew.value = true
  errorMsg.value = ''
  syncQuery()
}

function showFlash(text) {
  flash.value = text
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash.value = ''
  }, 2200)
}

async function save() {
  if (!draft.value) return
  const errors = draftIssues.value.filter((issue) => issue.level === 'error')
  if (errors.length) {
    errorMsg.value = t('editor.saveBlocked')
    return
  }
  if (getList(type.value).some((rec) => rec.id === draft.value.id && rec.id !== selectedId.value)) {
    errorMsg.value = t('editor.idDuplicated')
    return
  }
  try {
    const saved = await upsertEntity(type.value, draft.value)
    if (!saved) return
    draft.value = clone(saved)
    draftOriginal.value = JSON.stringify(draft.value)
    selectedId.value = saved.id
    isNew.value = false
    errorMsg.value = ''
    syncQuery()
    showFlash(t('editor.saved'))
  } catch (error) {
    errorMsg.value = error?.message || t('editor.saveFailed')
  }
}

function cancel() {
  if (!confirmDiscard()) return
  if (selectedId.value && findEntity(type.value, selectedId.value)) {
    selectEntity(findEntity(type.value, selectedId.value))
    return
  }
  const first = sortedRecords(type.value)[0]
  draft.value = null
  selectedId.value = ''
  isNew.value = false
  if (first) selectEntity(first)
  else syncQuery()
}

async function duplicate() {
  if (!selectedId.value || isNew.value) return
  try {
    const copy = await duplicateEntity(type.value, selectedId.value)
    if (copy) {
      selectEntity(copy)
      showFlash(t('editor.saved'))
    }
  } catch (error) {
    errorMsg.value = error?.message || t('editor.saveFailed')
  }
}

async function remove() {
  if (!selectedId.value || isNew.value) return
  if (!window.confirm(t('editor.confirmDelete'))) return
  try {
    await deleteEntity(type.value, selectedId.value)
    draft.value = null
    selectedId.value = ''
    const first = sortedRecords(type.value)[0]
    if (first) selectEntity(first)
    else syncQuery()
  } catch (error) {
    errorMsg.value = error?.message || t('editor.saveFailed')
  }
}

function applyQuery() {
  const qType = route.query.type && DEFS[String(route.query.type)] ? String(route.query.type) : ''
  const qId = route.query.id ? String(route.query.id) : ''

  if (!qType) {
    if (!draft.value) {
      const first = sortedRecords(type.value)[0]
      if (first) selectEntity(first, false)
    }
    syncQuery()
    return
  }

  if (qType !== type.value) {
    if (dirty.value && !window.confirm(t('editor.confirmDiscard'))) return
    type.value = qType
    selectedId.value = ''
    draft.value = null
    isNew.value = false
  }

  if (qId && qId === selectedId.value && !isNew.value) return

  if (qId) {
    const rec = findEntity(qType, qId)
    if (rec) {
      if (dirty.value && !window.confirm(t('editor.confirmDiscard'))) return
      selectEntity(rec, false)
      return
    }
  }

  if (!draft.value) {
    const first = sortedRecords(qType)[0]
    if (first) selectEntity(first, false)
  }
}

onMounted(applyQuery)
watch(() => route.query, applyQuery)
onBeforeUnmount(() => {
  if (flashTimer) clearTimeout(flashTimer)
})
</script>

<template>
  <div class="view">
    <header class="view-head">
      <div>
        <h1>{{ t('editor.title') }}</h1>
        <p class="muted">{{ t('editor.subtitle') }}</p>
      </div>
      <div class="issue-summary" :class="{ bad: issues.length }">
        <span>{{ issues.filter((i) => i.level === 'error').length }} {{ t('data.errors') }}</span>
        <span>{{ issues.filter((i) => i.level === 'warn').length }} {{ t('data.warnings') }}</span>
      </div>
    </header>

    <div class="editor-layout">
      <aside class="type-pane">
        <p class="pane-title">{{ t('editor.types') }}</p>
        <button
          v-for="key in ENTITY_KEYS"
          :key="key"
          class="type-button"
          :class="{ active: type === key }"
          @click="selectType(key)"
        >
          <span class="type-name">{{ tx(DEFS[key].label, lang) }}</span>
          <span class="type-count">
            {{ getList(key).length }}
            <span v-if="typeIssueCounts[key]?.error" class="dot bad"></span>
            <span v-else-if="typeIssueCounts[key]?.warn" class="dot warn"></span>
          </span>
        </button>
      </aside>

      <section class="list-pane">
        <div class="list-toolbar">
          <input v-model="search" :placeholder="t('editor.search')" />
          <button class="btn primary" @click="createNew">{{ t('editor.new') }}</button>
        </div>
        <p class="pane-title">
          {{ tx(def.label, lang) }} · {{ list.length }} {{ t('editor.entries') }}
        </p>
        <ul class="entity-list">
          <li
            v-for="rec in list"
            :key="rec.id"
            class="entity-item"
            :class="{ active: rec.id === selectedId }"
            @click="confirmSelect(rec)"
          >
            <div class="entity-main">
              <span class="entity-name">{{ recordName(rec) }}</span>
              <code>{{ rec.id }}</code>
            </div>
            <div class="entity-meta">
              <span v-if="def.badge(rec)" class="badge">{{ def.badge(rec) }}</span>
              <span
                v-if="issueMap[`${type}/${rec.id}`]?.error"
                class="dot bad"
                :title="`${issueMap[`${type}/${rec.id}`].error} ${t('common.error')}`"
              ></span>
              <span
                v-else-if="issueMap[`${type}/${rec.id}`]?.warn"
                class="dot warn"
                :title="`${issueMap[`${type}/${rec.id}`].warn} ${t('common.warn')}`"
              ></span>
            </div>
          </li>
        </ul>
        <p v-if="!list.length" class="empty-hint">{{ t('editor.emptyList') }}</p>
      </section>

      <section class="form-pane">
        <div v-if="!draft" class="empty-hint large">
          {{ t('editor.noSelection') }}
        </div>
        <template v-else>
          <div class="form-head">
            <div>
              <p class="pane-title">
                {{ isNew ? t('editor.newDraft') : tx(def.label, lang) }}
                <span v-if="dirty" class="dirty-mark">{{ t('editor.dirty') }}</span>
              </p>
              <h2>{{ recordName(draft) }}</h2>
              <p class="muted mono">{{ draft.id }}</p>
            </div>
            <div class="form-actions">
              <button class="btn primary" @click="save">{{ t('editor.save') }}</button>
              <button class="btn" @click="cancel">{{ t('editor.cancel') }}</button>
              <button class="btn" :disabled="isNew" @click="duplicate">{{ t('editor.duplicate') }}</button>
              <button class="btn danger" :disabled="isNew" @click="remove">{{ t('editor.delete') }}</button>
            </div>
          </div>

          <p v-if="flash" class="notice ok">{{ flash }}</p>
          <p v-if="errorMsg" class="notice bad">{{ errorMsg }}</p>

          <p class="hint-line">{{ t('editor.bilingualHint') }}</p>

          <div v-if="draftIssues.length" class="draft-issues">
            <p class="pane-title">{{ t('editor.issuesForEntry') }}</p>
            <p
              v-for="(issue, index) in draftIssues"
              :key="`${issue.field}-${index}`"
              class="issue-line"
              :class="issue.level"
            >
              {{ issueText(issue) }}
              <span v-if="issue.field" class="mono">· {{ issue.field }}</span>
            </p>
          </div>
          <p v-else class="notice ok small">{{ t('editor.noIssues') }}</p>

          <EntityForm :type="type" :model="draft" :issues="draftIssues" :id-editable="isNew" />
        </template>
      </section>
    </div>
  </div>
</template>

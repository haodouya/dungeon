<script setup>
import { computed } from 'vue'
import { ATTRS, ENTITY_DEFS, optionLabel } from '../data/schema'
import { content, getList } from '../store/content'
import { lang, tx } from '../store/ui'
import { t } from '../i18n'
import I18nField from './I18nField.vue'

const props = defineProps({
  type: { type: String, required: true },
  model: { type: Object, required: true },
  issues: { type: Array, default: () => [] },
  idEditable: { type: Boolean, default: true }
})

const def = computed(() => ENTITY_DEFS[props.type])

// 引用下拉的候选：所有实体类型都算出，fields 里用 target 取
const optionsByType = computed(() => {
  void content.value
  const result = {}
  for (const key of Object.keys(ENTITY_DEFS)) {
    result[key] = getList(key).map((rec) => ({
      value: rec.id,
      label: tx(rec.name, lang.value) || rec.id
    }))
  }
  return result
})

function fieldIssues(key) {
  return (props.issues || []).filter((issue) => issue.field === key)
}

function issueText(issue) {
  return tx(issue.message, lang.value)
}

function tagText(field) {
  const value = props.model[field.key]
  return Array.isArray(value) ? value.join(', ') : ''
}

function setTags(field, event) {
  props.model[field.key] = event.target.value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function ensureAttrs(field) {
  if (!props.model[field.key] || typeof props.model[field.key] !== 'object') {
    props.model[field.key] = Object.fromEntries(ATTRS.map((a) => [a.key, 0]))
  }
}

function fieldLabel(field) {
  return tx(field.label, lang.value)
}
</script>

<template>
  <form class="entity-form" @submit.prevent>
    <div class="field id-field">
      <label class="field-label">
        <span>{{ t('editor.idLabel') }}</span>
        <span class="required-mark">{{ t('editor.required') }}</span>
      </label>
      <input v-model.trim="model.id" class="mono" spellcheck="false" :disabled="!idEditable" />
      <p class="field-hint">{{ t('editor.idHint') }}</p>
      <p v-for="issue in fieldIssues('id')" :key="issue.message.en" class="issue-line" :class="issue.level">
        {{ issueText(issue) }}
      </p>
    </div>

    <div v-for="field in def.fields" :key="field.key" class="field">
      <label class="field-label">
        <span>{{ fieldLabel(field) }}</span>
        <span v-if="field.required" class="required-mark">{{ t('editor.required') }}</span>
        <span class="field-key mono">{{ field.key }}</span>
      </label>

      <I18nField
        v-if="field.type === 'i18n' || field.type === 'i18nText'"
        v-model="model[field.key]"
        :multiline="field.type === 'i18nText'"
      />

      <input
        v-else-if="field.type === 'number'"
        v-model.number="model[field.key]"
        type="number"
        :min="field.min"
        :max="field.max"
        step="1"
      />

      <select v-else-if="field.type === 'enum'" v-model="model[field.key]">
        <option v-for="option in field.options" :key="option.value" :value="option.value">
          {{ optionLabel(field.options, option.value, lang) }} · {{ option.value }}
        </option>
      </select>

      <select v-else-if="field.type === 'ref'" v-model="model[field.key]">
        <option value="">—</option>
        <option v-for="option in optionsByType[field.target]" :key="option.value" :value="option.value">
          {{ option.label }} · {{ option.value }}
        </option>
      </select>

      <div v-else-if="field.type === 'refs'" class="ref-list">
        <label v-for="option in optionsByType[field.target]" :key="option.value" class="ref-item">
          <input v-model="model[field.key]" type="checkbox" :value="option.value" />
          <span>{{ option.label }}</span>
          <code>{{ option.value }}</code>
        </label>
        <p v-if="!optionsByType[field.target]?.length" class="field-hint">
          {{ t('editor.emptyList') }}
        </p>
      </div>

      <div v-else-if="field.type === 'attrs'" class="attr-grid">
        <label v-for="attr in ATTRS" :key="attr.key" class="attr-item">
          <span>{{ tx({ zh: attr.zh, en: attr.en }, lang) }}</span>
          <input
            v-model.number="model[field.key][attr.key]"
            type="number"
            min="-10"
            max="30"
            step="1"
            @focus="ensureAttrs(field)"
          />
        </label>
      </div>

      <label v-else-if="field.type === 'bool'" class="bool-item">
        <input v-model="model[field.key]" type="checkbox" />
        <span>{{ model[field.key] ? 'true' : 'false' }}</span>
      </label>

      <input
        v-else-if="field.type === 'tags'"
        :value="tagText(field)"
        placeholder="tag-a, tag-b"
        @input="setTags(field, $event)"
      />

      <input v-else v-model="model[field.key]" type="text" />

      <p v-for="issue in fieldIssues(field.key)" :key="issue.message.en" class="issue-line" :class="issue.level">
        {{ issueText(issue) }}
      </p>
    </div>
  </form>
</template>

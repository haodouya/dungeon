<script setup>
import { computed } from 'vue'
import { lang } from '../store/ui'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ en: '', zh: '' }) },
  multiline: { type: Boolean, default: false },
  placeholderEn: { type: String, default: '' },
  placeholderZh: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const value = computed(() => ({
  en: props.modelValue?.en || '',
  zh: props.modelValue?.zh || ''
}))

function update(key, event) {
  emit('update:modelValue', { ...value.value, [key]: event.target.value })
}
</script>

<template>
  <div class="i18n-field">
    <div class="i18n-grid">
      <label class="lang-block" :class="{ primary: lang === 'en' }">
        <span class="lang-tag">EN</span>
        <textarea
          v-if="multiline"
          :value="value.en"
          :placeholder="placeholderEn"
          rows="3"
          @input="update('en', $event)"
        />
        <input
          v-else
          :value="value.en"
          :placeholder="placeholderEn"
          @input="update('en', $event)"
        />
      </label>
      <label class="lang-block" :class="{ primary: lang === 'zh' }">
        <span class="lang-tag">中文</span>
        <textarea
          v-if="multiline"
          :value="value.zh"
          :placeholder="placeholderZh"
          rows="3"
          @input="update('zh', $event)"
        />
        <input
          v-else
          :value="value.zh"
          :placeholder="placeholderZh"
          @input="update('zh', $event)"
        />
      </label>
    </div>
  </div>
</template>

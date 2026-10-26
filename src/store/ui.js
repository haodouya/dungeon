import { ref, watch } from 'vue'

const STORAGE_KEY = 'dungeon-app:lang'

function readInitial() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export const lang = ref(readInitial())

watch(lang, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // 忽略隐私模式下的写入失败
  }
  document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en'
})

export function toggleLang() {
  lang.value = lang.value === 'zh' ? 'en' : 'zh'
}

// 取双语对象中当前语言的值，缺失时回退到另一语言
export function tx(value, language = lang.value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)
  return value[language] || value.en || value.zh || ''
}

export function isUntranslated(value, language = lang.value) {
  if (!value || typeof value !== 'object') return false
  return Boolean(value.en && language === 'zh' && !value.zh)
}

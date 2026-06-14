import type { Language } from '../types'
import { translations } from './translations'

export function translate(language: Language, key: string) {
  return translations[language]?.[key] || translations.pt[key] || key
}

export { languageLabels, translations } from './translations'

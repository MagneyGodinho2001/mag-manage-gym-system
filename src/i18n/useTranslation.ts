import { useStore } from '../store/useStore'
import { translate } from './index'

export function useTranslation() {
  const language = useStore((state) => state.language)

  return {
    language,
    t: (key: string) => translate(language, key),
  }
}

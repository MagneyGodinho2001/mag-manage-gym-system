import { supabase } from './supabase'

const IMAGE_BUCKET = 'magmanage-images'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export async function uploadImageFile(file: File, folder: string) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um ficheiro de imagem válido.')
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'uploads'
  const uniqueId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const path = `${safeFolder}/${Date.now()}-${uniqueId}.${extension}`

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Erro ao enviar imagem: ${error.message}`)
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)

  return data.publicUrl
}

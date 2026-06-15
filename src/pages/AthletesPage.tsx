import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { cn, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  Trophy,
  MoreVertical,
  Eye,
  Image as ImageIcon,
} from 'lucide-react'
import { uploadImageFile } from '../lib/uploadImage'

const modalities = ['Jiu-Jitsu', 'Muay Thai', 'Boxe', 'MMA', 'Wrestling', 'Judo']
const belts = [
  'Branca',
  'Amarela',
  'Laranja',
  'Verde',
  'Azul',
  'Castanha',
  'Preta (1º Dan)',
  'Preta (2º Dan)',
]

function normalizeText(value: any) {
  return String(value || '').trim().toLowerCase()
}

export default function AthletesPage() {
  const { user, createApprovedUser } = useStore()
  const { t } = useTranslation()

  const [membrosSupabase, setMembrosSupabase] = useState<any[]>([])
  const [academias, setAcademias] = useState<any[]>([])
  const [loadingMembros, setLoadingMembros] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [filterModality, setFilterModality] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const [treinadorModalidade, setTreinadorModalidade] = useState('')

  useEffect(() => {
    buscarMembros()
    buscarAcademias()
  }, [])

  async function buscarAcademias() {
    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .eq('status', 'ativa')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao buscar academias:', error)
      setAcademias([{ id: 1, nome: 'Academia Principal' }])
      return
    }

    setAcademias(data?.length ? data : [{ id: 1, nome: 'Academia Principal' }])
  }

  useEffect(() => {
    buscarModalidadeTreinador()
  }, [user?.email, user?.role])

  async function buscarMembros() {
    setLoadingMembros(true)

    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.log('Erro ao buscar membros:', error)
      alert('Erro ao buscar atletas: ' + error.message)
    } else {
      setMembrosSupabase(data || [])
    }

    setLoadingMembros(false)
  }

  async function buscarModalidadeTreinador() {
    if (user?.role !== 'treinador') {
      setTreinadorModalidade('')
      return
    }

    const emailTreinador = normalizeText(user?.email)

    if (!emailTreinador) {
      setTreinadorModalidade('')
      return
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailTreinador)
      .maybeSingle()

    if (error) {
      console.log('Erro ao buscar modalidade do treinador:', error)
      setTreinadorModalidade('')
      return
    }

    const especialidade =
      data?.especialidade ||
      data?.modalidade ||
      data?.plano ||
      ''

    setTreinadorModalidade(especialidade)
  }

  const canEdit = user?.role === 'gestor'
  const isGestor = user?.role === 'gestor'
  const isTreinador = user?.role === 'treinador'
  const isAtleta = user?.role === 'atleta'

  const roleVisibleAthletes = useMemo(() => {
    return membrosSupabase.filter((athlete) => {
      const email = athlete.email || ''
      const modalidade = athlete.modalidade || athlete.modality || ''

      const athleteEmail = normalizeText(email)
      const userEmail = normalizeText(user?.email)
      const athleteModalidade = normalizeText(modalidade)
      const trainerModalidade = normalizeText(treinadorModalidade)

      let allowedByRole = false

      if (isGestor) {
        allowedByRole = true
      }

      if (isTreinador) {
        allowedByRole =
          Boolean(trainerModalidade) &&
          athleteModalidade === trainerModalidade
      }

      if (isAtleta) {
        allowedByRole =
          Boolean(userEmail) &&
          athleteEmail === userEmail
      }

      return allowedByRole
    })
  }, [
    membrosSupabase,
    user?.email,
    treinadorModalidade,
    isGestor,
    isTreinador,
    isAtleta,
  ])

  const filteredAthletes = useMemo(() => {
    return roleVisibleAthletes.filter((athlete) => {
      const nome = athlete.nome || ''
      const email = athlete.email || ''
      const modalidade = athlete.modalidade || athlete.modality || ''
      const status = athlete.status || ''

      const matchesSearch =
        nome.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase())

      const matchesModality = !filterModality || modalidade === filterModality
      const matchesStatus = !filterStatus || status === filterStatus

      return matchesSearch && matchesModality && matchesStatus
    })
  }, [
    roleVisibleAthletes,
    search,
    filterModality,
    filterStatus,
  ])

  const safeCreateLocalLogin = (data: any) => {
    try {
      if (typeof createApprovedUser === 'function') {
        createApprovedUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'atleta',
        })
      } else {
        console.log('createApprovedUser não está disponível no useStore.')
      }
    } catch (error) {
      console.log('Erro ao criar login local do atleta:', error)
    }
  }

  const handleAdd = () => {
    setSelectedAthlete(null)
    setShowModal(true)
  }

  const handleEdit = (athlete: any) => {
    setSelectedAthlete(athlete)
    setShowModal(true)
    setActiveDropdown(null)
  }

  const handleView = (athlete: any) => {
    setSelectedAthlete(athlete)
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  const handleDelete = (athlete: any) => {
    setSelectedAthlete(athlete)
    setShowDeleteModal(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    if (!selectedAthlete) return

    const { error } = await supabase
      .from('membros')
      .delete()
      .eq('id', selectedAthlete.id)

    if (error) {
      console.log('Erro ao apagar membro:', error)
      alert('Erro ao apagar atleta: ' + error.message)
      return
    }

    await buscarMembros()
    setShowDeleteModal(false)
    setSelectedAthlete(null)
  }

  const handleSaveAthlete = async (data: any) => {
    if (saving) return

    try {
      setSaving(true)

      if (selectedAthlete) {
        const { error } = await supabase
          .from('membros')
          .update({
            nome: data.name,
            telefone: data.phone,
            email: data.email,
            plano: data.belt,
            modalidade: data.modality,
            academia_id: Number(data.academia_id || 1),
            foto_url: data.photo || '',
            status: data.status || 'ativo',
          })
          .eq('id', selectedAthlete.id)

        if (error) {
          console.log('Erro ao editar membro:', error)
          alert('Erro ao editar atleta: ' + error.message)
          return
        }

        await buscarMembros()
        setShowModal(false)
        setSelectedAthlete(null)
        alert('Atleta atualizado com sucesso.')
        return
      }

      if (!data.password || data.password.length < 4) {
        alert('Informe uma senha inicial com pelo menos 4 caracteres.')
        return
      }

      const emailNormalizado = String(data.email || '').trim().toLowerCase()

      const { data: existingMember, error: checkError } = await supabase
        .from('membros')
        .select('id,email')
        .eq('email', emailNormalizado)
        .maybeSingle()

      if (checkError) {
        console.log('Erro ao verificar atleta:', checkError)
        alert('Erro ao verificar atleta: ' + checkError.message)
        return
      }

      if (existingMember) {
        const confirmar = confirm(
          'Já existe um atleta com este email na base de dados. Deseas criar apenas o login/senha para este atleta?'
        )

        if (!confirmar) return

        safeCreateLocalLogin({
          ...data,
          email: emailNormalizado,
        })

        await buscarMembros()
        setShowModal(false)
        setSelectedAthlete(null)

        alert(
          `Login criado para o atleta existente!\n\nEmail: ${emailNormalizado}\nSenha: ${data.password}`
        )

        return
      }

      const { error } = await supabase
        .from('membros')
        .insert([
          {
            id: Date.now(),
            nome: data.name,
            telefone: data.phone,
            email: emailNormalizado,
            plano: data.belt,
            modalidade: data.modality,
            academia_id: Number(data.academia_id || 1),
            foto_url: data.photo || '',
            status: data.status || 'ativo',
          },
        ])

      if (error) {
        console.log('Erro ao adicionar membro:', error)
        alert('Erro ao adicionar atleta: ' + error.message)
        return
      }

      safeCreateLocalLogin({
        ...data,
        email: emailNormalizado,
      })

      await buscarMembros()
      setShowModal(false)
      setSelectedAthlete(null)

      alert(
        `Atleta criado com sucesso!\n\nEmail: ${emailNormalizado}\nSenha: ${data.password}\n\nO atleta já pode fazer login no sistema.`
      )
    } catch (error: any) {
      console.log('Erro inesperado ao salvar atleta:', error)
      alert('Erro inesperado ao salvar atleta: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const pageSubtitle = isGestor
    ? `${membrosSupabase.length} atletas cadastrados`
    : isTreinador
      ? treinadorModalidade
        ? `${filteredAthletes.length} atletas da modalidade ${treinadorModalidade}`
        : 'Nenhuma modalidade foi encontrada para este treinador'
      : isAtleta
        ? 'O teu cadastro de atleta'
        : `${filteredAthletes.length} atletas`

  const rankedAthletes = useMemo(() => {
    return [...roleVisibleAthletes].sort((a, b) => {
      const pointsA = Number(a.total_pontos || a.totalPoints || 0)
      const pointsB = Number(b.total_pontos || b.totalPoints || 0)

      return pointsB - pointsA
    })
  }, [roleVisibleAthletes])

  const getAcademiaNome = (academiaId: any) =>
    academias.find((academia) => String(academia.id) === String(academiaId || 1))?.nome ||
    'Academia Principal'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('athletesTitle')}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>

        {canEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity neon-glow"
          >
            <Plus className="h-5 w-5" />
            {t('newAthlete')}
          </button>
        )}
      </div>

      {/* Aviso do treinador sem modalidade */}
      {isTreinador && !treinadorModalidade && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Este treinador ainda não tem uma especialidade/modalidade definida na tabela usuarios.
            O gestor deve ir em Treinadores e definir a especialidade.
          </p>
        </div>
      )}

      {/* Pontuações */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t('rankingPoints')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTreinador
                ? 'Pontuação dos atletas da tua modalidade'
                : isGestor
                  ? 'Pontuação geral dos atletas'
                  : 'A tua pontuação acumulada'}
            </p>
          </div>

          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>

        {rankedAthletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma pontuação encontrada.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rankedAthletes.map((athlete, index) => (
              <div
                key={athlete.id}
                className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {athlete.nome || athlete.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Number(athlete.total_pontos || athlete.totalPoints || 0)} {t('points')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchByNameEmail')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterModality}
            onChange={(e) => setFilterModality(e.target.value)}
            className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('allModalities')}</option>
            {modalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t('allStatus')}</option>
            <option value="ativo">{t('active')}</option>
            <option value="inativo">{t('inactive')}</option>
          </select>
        </div>
      </div>

      {/* Athletes Grid */}
      {loadingMembros ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <User className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">{t('athletesTitle')}...</p>
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <User className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">{t('noAthleteFound')}</p>
          <p className="text-sm">
            {isTreinador
              ? 'Não existem atletas cadastrados para a tua modalidade.'
              : isAtleta
                ? 'Não foi encontrado um cadastro de atleta com o teu email.'
                : 'Tente ajustar os filtros ou adicione um novo atleta.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAthletes.map((athlete) => (
            <div
              key={athlete.id}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                    {athlete.foto_url || athlete.photo ? (
                      <img
                        src={athlete.foto_url || athlete.photo}
                        alt={athlete.nome || athlete.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      {athlete.nome || athlete.name}
                    </h3>
                      <p className="text-sm text-muted-foreground">
                        {athlete.modalidade || athlete.modality || 'Sem modalidade'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getAcademiaNome(athlete.academia_id)}
                      </p>
                    </div>
                  </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === String(athlete.id) ? null : String(athlete.id)
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                  </button>

                  {activeDropdown === String(athlete.id) && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveDropdown(null)}
                      />

                      <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-popover border border-border rounded-lg shadow-lg py-1">
                        <button
                          onClick={() => handleView(athlete)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          {t('view')}
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEdit(athlete)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                              {t('edit')}
                            </button>

                            <button
                              onClick={() => handleDelete(athlete)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('delete')}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{athlete.email || 'Sem email'}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{athlete.telefone || 'Sem telefone'}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Faixa {athlete.plano || 'Não definida'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>{Number(athlete.total_pontos || 0)} {t('points')}</span>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    athlete.status === 'ativo'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {athlete.status === 'ativo' ? t('active') : t('inactive')}
                </span>

                <span className="text-xs text-muted-foreground">
                  ID {athlete.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <AthleteModal
          athlete={selectedAthlete}
          academias={academias}
          saving={saving}
          onClose={() => {
            if (saving) return
            setShowModal(false)
            setSelectedAthlete(null)
          }}
          onSave={handleSaveAthlete}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedAthlete && (
        <ViewAthleteModal
          athlete={selectedAthlete}
          onClose={() => {
            setShowViewModal(false)
            setSelectedAthlete(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />

          <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Confirmar Exclusão
            </h3>

            <p className="text-muted-foreground mb-6">
              Tens certeza que desejas excluir{' '}
              <strong>{selectedAthlete.nome || selectedAthlete.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>

              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface AthleteModalProps {
  athlete: any | null
  academias: any[]
  saving: boolean
  onClose: () => void
  onSave: (data: any) => void | Promise<void>
}

function AthleteModal({ athlete, academias, saving, onClose, onSave }: AthleteModalProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(athlete)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(athlete?.foto_url || athlete?.photo || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [formData, setFormData] = useState({
    name: athlete?.nome || athlete?.name || '',
    email: athlete?.email || '',
    phone: athlete?.telefone || athlete?.phone || '',
    birthDate: athlete?.birthDate || '',
    belt: athlete?.plano || athlete?.belt || 'Branca',
    modality: athlete?.modalidade || athlete?.modality || 'Jiu-Jitsu',
    academia_id: String(athlete?.academia_id || 1),
    startDate: athlete?.startDate || new Date().toISOString().split('T')[0],
    status: (athlete?.status || 'ativo') as 'ativo' | 'inativo',
    notes: athlete?.notes || '',
    photo: athlete?.foto_url || athlete?.photo || '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (saving || uploadingPhoto) return

    if (!isEditing && !formData.password) {
      alert('Informe a senha inicial do atleta.')
      return
    }

    try {
      setUploadingPhoto(true)
      const photo = photoFile
        ? await uploadImageFile(photoFile, 'atletas')
        : formData.photo

      await onSave({ ...formData, photo })
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? t('edit') : t('newAthlete')}
          </h2>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Foto do atleta
              </label>
              <div className="flex gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Pré-visualização do atleta" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving || uploadingPhoto}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setPhotoFile(file)
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file))
                        setFormData({ ...formData, photo: '' })
                      }
                    }}
                    className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha uma foto do computador para identificar o atleta.
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('fullName')}
              </label>
              <input
                type="text"
                required
                disabled={saving}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                disabled={saving}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('phone')}
              </label>
              <input
                type="tel"
                required
                disabled={saving}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('birthDate')}
              </label>
              <input
                type="date"
                disabled={saving}
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('startDate')}
              </label>
              <input
                type="date"
                disabled={saving}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('modality')}
              </label>
              <select
                disabled={saving}
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {modalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('belt')}
              </label>
              <select
                disabled={saving}
                value={formData.belt}
                onChange={(e) => setFormData({ ...formData, belt: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {belts.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Academia
              </label>
              <select
                disabled={saving}
                value={formData.academia_id}
                onChange={(e) => setFormData({ ...formData, academia_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {academias.map((academia) => (
                  <option key={academia.id} value={String(academia.id)}>
                    {academia.nome}
                  </option>
                ))}
              </select>
            </div>

            {!isEditing && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('initialPassword')}
                </label>
                <input
                  type="password"
                  required
                  disabled={saving}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  placeholder="Senha para o atleta entrar no sistema"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Esta senha será usada pelo atleta para fazer login.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('status')}
              </label>
              <select
                disabled={saving}
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'ativo' | 'inativo' })
                }
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="ativo">{t('active')}</option>
                <option value="inativo">{t('inactive')}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('notes')}
              </label>
              <textarea
                disabled={saving}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              disabled={saving || uploadingPhoto}
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving || uploadingPhoto ? 'A guardar...' : isEditing ? t('save') : t('register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ViewAthleteModalProps {
  athlete: any
  onClose: () => void
}

function ViewAthleteModal({ athlete, onClose }: ViewAthleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Detalhes do Atleta</h2>

          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/20">
              {athlete.foto_url || athlete.photo ? (
                <img
                  src={athlete.foto_url || athlete.photo}
                  alt={athlete.nome || athlete.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {athlete.nome || athlete.name}
              </h3>
              <p className="text-muted-foreground">
                {athlete.modalidade || athlete.modality || 'Sem modalidade'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow icon={Mail} label="Email" value={athlete.email || 'Sem email'} />
            <InfoRow icon={Phone} label="Telefone" value={athlete.telefone || 'Sem telefone'} />
            <InfoRow
              icon={Calendar}
              label="Nascimento"
              value={athlete.birthDate ? formatDate(athlete.birthDate) : 'Sem data'}
            />
            <InfoRow
              icon={Calendar}
              label="Início"
              value={athlete.startDate ? formatDate(athlete.startDate) : 'Sem data'}
            />
            <InfoRow icon={Award} label="Faixa" value={athlete.plano || 'Não definida'} />

            <InfoRow
              icon={Trophy}
              label="Pontuação"
              value={`${Number(athlete.total_pontos || 0)} pontos`}
            />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  athlete.status === 'ativo'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {athlete.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {athlete.notes && (
              <div>
                <span className="text-muted-foreground text-sm">Observações</span>
                <p className="text-foreground mt-1">{athlete.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>

      <span className="text-foreground">{value}</span>
    </div>
  )
}

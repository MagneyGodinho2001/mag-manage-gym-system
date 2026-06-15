import { useEffect, useState } from 'react'
import {
  Search,
  Users,
  Plus,
  X,
  Mail,
  Phone,
  Award,
  CheckCircle,
  AlertTriangle,
  Edit2,
  KeyRound,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'
import { useStore } from '../store/useStore'
import { useTranslation } from '../i18n/useTranslation'
import { uploadImageFile } from '../lib/uploadImage'

const modalidades = ['Jiu-Jitsu', 'Muay Thai', 'Boxe', 'MMA', 'Wrestling', 'Judo', 'Funcional']

export default function TrainersPage() {
  const { t } = useTranslation()
  const { createApprovedUser } = useStore()

  const [trainers, setTrainers] = useState<any[]>([])
  const [academias, setAcademias] = useState<any[]>([])
  const [athletesByAcademy, setAthletesByAcademy] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: '',
    academia_id: '1',
    avatar_url: '',
    senha: '',
    status: 'ativo',
  })

  const [editData, setEditData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: '',
    academia_id: '1',
    avatar_url: '',
    status: 'ativo',
  })

  const [passwordData, setPasswordData] = useState({
    novaSenha: '',
    confirmarSenha: '',
  })

  useEffect(() => {
    carregarTreinadores()
    carregarAcademias()
    carregarContagemAtletasPorAcademia()
  }, [])

  const carregarAcademias = async () => {
    const { data, error } = await supabase
      .from('academias')
      .select('*')
      .eq('status', 'ativa')
      .order('nome', { ascending: true })

    if (error) {
      console.log('Erro ao carregar academias:', error)
      setAcademias([{ id: 1, nome: 'Academia Principal' }])
      return
    }

    setAcademias(data?.length ? data : [{ id: 1, nome: 'Academia Principal' }])
  }

  const carregarContagemAtletasPorAcademia = async () => {
    const { data, error } = await supabase
      .from('membros')
      .select('academia_id')

    if (error) {
      console.log('Erro ao contar atletas por academia:', error)
      return
    }

    const counts = (data || []).reduce((acc: Record<string, number>, member: any) => {
      const key = String(member.academia_id || 1)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    setAthletesByAcademy(counts)
  }

  const carregarTreinadores = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'treinador')
      .order('id', { ascending: false })

    if (error) {
      console.log('Erro ao carregar treinadores:', error)
      alert('Erro ao carregar treinadores: ' + error.message)
      setLoading(false)
      return
    }

    setTrainers(data || [])
    setLoading(false)
  }

  const criarOuRedefinirLoginTreinador = (dados: {
    nome: string
    email: string
    telefone?: string
    senha: string
  }) => {
    const emailNormalizado = String(dados.email || '').trim().toLowerCase()

    try {
      if (typeof createApprovedUser === 'function') {
        createApprovedUser({
          name: dados.nome,
          email: emailNormalizado,
          phone: dados.telefone || '',
          password: dados.senha,
          role: 'treinador',
        })
      } else {
        console.log('createApprovedUser não está disponível no useStore.')
      }
    } catch (error) {
      console.log('Erro ao criar/redefinir login local do treinador:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      especialidade: '',
      academia_id: '1',
      avatar_url: '',
      senha: '',
      status: 'ativo',
    })
  }

  const resetPasswordForm = () => {
    setPasswordData({
      novaSenha: '',
      confirmarSenha: '',
    })
  }

  const filteredTrainers = trainers.filter((trainer: any) => {
    const nome = trainer.nome || ''
    const email = trainer.email || ''
    const especialidade = trainer.especialidade || ''

    return (
      nome.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      especialidade.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleSubmit = async (e: React.FormEvent, uploadedAvatarUrl?: string) => {
    e.preventDefault()

    if (saving) return

    if (!formData.nome || !formData.email || !formData.senha || !formData.especialidade) {
      alert('Preencha nome, email, especialidade e senha.')
      return
    }

    if (formData.senha.length < 4) {
      alert('A senha inicial deve ter pelo menos 4 caracteres.')
      return
    }

    try {
      setSaving(true)

      const emailNormalizado = String(formData.email || '').trim().toLowerCase()

      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id,email,nome,telefone,especialidade,status,role')
        .eq('email', emailNormalizado)
        .maybeSingle()

      if (checkError) {
        console.log('Erro ao verificar treinador:', checkError)
        alert('Erro ao verificar treinador: ' + checkError.message)
        return
      }

      if (existingUser) {
        alert('Já existe um usuário com este email. Use outro email ou redefina a senha na lista.')
        return
      }

      const { error } = await supabase
        .from('usuarios')
        .insert([
          {
            id: Date.now(),
            nome: formData.nome,
            email: emailNormalizado,
            telefone: formData.telefone,
            role: 'treinador',
            especialidade: formData.especialidade,
            academia_id: Number(formData.academia_id || 1),
            avatar_url: uploadedAvatarUrl ?? formData.avatar_url ?? '',
            status: formData.status,
          },
        ])

      if (error) {
        console.log('Erro ao criar treinador:', error)
        alert('Erro ao criar treinador: ' + error.message)
        return
      }

      criarOuRedefinirLoginTreinador({
        nome: formData.nome,
        email: emailNormalizado,
        telefone: formData.telefone,
        senha: formData.senha,
      })

      alert(
        `Treinador criado com sucesso!\n\nEmail: ${emailNormalizado}\n\nA senha inicial foi definida e não será exibida por segurança.`
      )

      setShowAddModal(false)
      resetForm()
      await carregarTreinadores()
      await carregarContagemAtletasPorAcademia()
    } catch (error: any) {
      console.log('Erro inesperado ao criar treinador:', error)
      alert('Erro inesperado ao criar treinador: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (trainer: any) => {
    setSelectedTrainer(trainer)
    setEditData({
      nome: trainer.nome || '',
      email: trainer.email || '',
      telefone: trainer.telefone || '',
      especialidade: trainer.especialidade || '',
      academia_id: String(trainer.academia_id || 1),
      avatar_url: trainer.avatar_url || '',
      status: trainer.status || 'ativo',
    })
    setShowEditModal(true)
  }

  const handleEditTrainer = async (e: React.FormEvent, uploadedAvatarUrl?: string) => {
    e.preventDefault()

    if (!selectedTrainer) return
    if (saving) return

    if (!editData.nome || !editData.email || !editData.especialidade) {
      alert('Preencha nome, email e especialidade.')
      return
    }

    try {
      setSaving(true)

      const emailNormalizado = String(editData.email || '').trim().toLowerCase()

      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: editData.nome,
          email: emailNormalizado,
          telefone: editData.telefone,
          especialidade: editData.especialidade,
          academia_id: Number(editData.academia_id || 1),
          avatar_url: uploadedAvatarUrl ?? editData.avatar_url ?? '',
          status: editData.status,
        })
        .eq('id', selectedTrainer.id)

      if (error) {
        console.log('Erro ao editar treinador:', error)
        alert('Erro ao editar treinador: ' + error.message)
        return
      }

      alert('Treinador atualizado com sucesso.')

      setShowEditModal(false)
      setSelectedTrainer(null)
      await carregarTreinadores()
      await carregarContagemAtletasPorAcademia()
    } catch (error: any) {
      console.log('Erro inesperado ao editar treinador:', error)
      alert('Erro inesperado ao editar treinador: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const openPasswordModal = (trainer: any) => {
    setSelectedTrainer(trainer)
    resetPasswordForm()
    setShowPasswordModal(true)
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTrainer) return

    if (!passwordData.novaSenha || !passwordData.confirmarSenha) {
      alert('Preencha a nova senha e a confirmação.')
      return
    }

    if (passwordData.novaSenha.length < 4) {
      alert('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      alert('A nova senha e a confirmação não coincidem.')
      return
    }

    criarOuRedefinirLoginTreinador({
      nome: selectedTrainer.nome,
      email: selectedTrainer.email,
      telefone: selectedTrainer.telefone || '',
      senha: passwordData.novaSenha,
    })

    alert(
      `Senha redefinida com sucesso para ${selectedTrainer.nome}.\n\nPor segurança, a senha não será exibida novamente.`
    )

    setShowPasswordModal(false)
    setSelectedTrainer(null)
    resetPasswordForm()
  }

  const handleToggleStatus = async (trainer: any) => {
    const novoStatus = trainer.status === 'ativo' ? 'inativo' : 'ativo'

    const { error } = await supabase
      .from('usuarios')
      .update({ status: novoStatus })
      .eq('id', trainer.id)

    if (error) {
      console.log('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status: ' + error.message)
      return
    }

    await carregarTreinadores()
  }

  const handleDeleteTrainer = async (trainer: any) => {
    const confirmar = confirm(
      `Tens certeza que queres apagar o treinador ${trainer.nome}?\n\nEsta ação remove o treinador da base de dados.`
    )

    if (!confirmar) return

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', trainer.id)

    if (error) {
      console.log('Erro ao apagar treinador:', error)
      alert('Erro ao apagar treinador: ' + error.message)
      return
    }

    alert('Treinador apagado com sucesso.')
    await carregarTreinadores()
    await carregarContagemAtletasPorAcademia()
  }

  const activeCount = trainers.filter((t: any) => t.status === 'ativo').length
  const inactiveCount = trainers.filter((t: any) => t.status === 'inativo').length

  const getAcademiaNome = (academiaId: any) =>
    academias.find((academia) => String(academia.id) === String(academiaId || 1))?.nome ||
    'Academia Principal'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('trainersTitle')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('manageTrainers')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('newTrainer')}
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
            >
              <Users className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{trainers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Inativos</p>
              <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchTrainer')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            {t('loadingTrainers')}
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noTrainerFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Treinador
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Contacto
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Especialidade
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Academia
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredTrainers.map((trainer: any) => (
                  <tr key={trainer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        >
                          {trainer.avatar_url ? (
                            <img
                              src={trainer.avatar_url}
                              alt={trainer.nome}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-foreground">{trainer.nome}</p>
                          <p className="text-xs text-muted-foreground">Treinador</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm text-foreground">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {trainer.email || 'Sem email'}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {trainer.telefone || 'Sem telefone'}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        {trainer.especialidade || 'Sem especialidade'}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">
                        {getAcademiaNome(trainer.academia_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {athletesByAcademy[String(trainer.academia_id || 1)] || 0} atletas
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          trainer.status === 'ativo' ? 'text-green-500' : 'text-red-500'
                        )}
                        style={{
                          backgroundColor:
                            trainer.status === 'ativo'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                        }}
                      >
                        {trainer.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => openEditModal(trainer)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Edit2 className="h-4 w-4" />
                          {t('edit')}
                        </button>

                        <button
                          onClick={() => openPasswordModal(trainer)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <KeyRound className="h-4 w-4" />
                          Redefinir senha
                        </button>

                        <button
                          onClick={() => handleToggleStatus(trainer)}
                          className="text-sm text-primary hover:underline"
                        >
                          {trainer.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        </button>

                        <button
                          onClick={() => handleDeleteTrainer(trainer)}
                          className="inline-flex items-center gap-1 text-sm text-red-500 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" />
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <TrainerFormModal
          title={t('newTrainer')}
          saving={saving}
          data={formData}
          setData={setFormData}
          academias={academias}
          onClose={() => {
            if (!saving) setShowAddModal(false)
          }}
          onSubmit={handleSubmit}
          submitText={saving ? 'A criar...' : 'Criar'}
          showPassword
        />
      )}

      {/* Edit Trainer Modal */}
      {showEditModal && selectedTrainer && (
        <TrainerFormModal
          title={`${t('edit')} ${t('trainer')}`}
          saving={saving}
          data={editData}
          setData={setEditData}
          academias={academias}
          onClose={() => {
            if (!saving) {
              setShowEditModal(false)
              setSelectedTrainer(null)
            }
          }}
          onSubmit={handleEditTrainer}
          submitText={saving ? 'A guardar...' : t('save')}
          showPassword={false}
        />
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setShowPasswordModal(false)
              setSelectedTrainer(null)
            }}
          />

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {t('resetPassword')}
              </h2>

              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setSelectedTrainer(null)
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div
                className="flex items-start gap-3 p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(234, 179, 8, 0.12)' }}
              >
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  A senha antiga não será mostrada. Defina uma nova senha para o treinador{' '}
                  <strong>{selectedTrainer.nome}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.novaSenha}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, novaSenha: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('confirmNewPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.confirmarSenha}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmarSenha: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedTrainer(null)
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Redefinir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TrainerFormModal({
  title,
  saving,
  data,
  setData,
  academias,
  onClose,
  onSubmit,
  submitText,
  showPassword,
}: {
  title: string
  saving: boolean
  data: any
  setData: (data: any) => void
  academias: any[]
  onClose: () => void
  onSubmit: (e: React.FormEvent, uploadedAvatarUrl?: string) => void | Promise<void>
  submitText: string
  showPassword: boolean
}) {
  const { t } = useTranslation()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(data.avatar_url || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setUploadingPhoto(true)
      const avatarUrl = photoFile
        ? await uploadImageFile(photoFile, 'treinadores')
        : data.avatar_url

      setData({ ...data, avatar_url: avatarUrl })
      await onSubmit(event, avatarUrl)
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>

          <button
            disabled={saving}
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Foto do treinador
            </label>
            <div className="flex gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {previewUrl ? (
                  <img src={previewUrl} alt="Pré-visualização do treinador" className="h-full w-full object-cover" />
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
                      setData({ ...data, avatar_url: '' })
                    }
                  }}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Escolha uma foto do computador para identificar o treinador.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('itemName')}
            </label>
            <input
              type="text"
              value={data.nome}
              onChange={(e) => setData({ ...data, nome: e.target.value })}
              required
              disabled={saving}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('email')}
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              required
              disabled={saving || !showPassword}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            {!showPassword && (
              <p className="text-xs text-muted-foreground mt-1">
                Para segurança, o email não é alterado aqui. Crie outro treinador se necessário.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('phone')}
            </label>
            <input
              type="text"
              value={data.telefone}
              onChange={(e) => setData({ ...data, telefone: e.target.value })}
              disabled={saving}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('specialtyModality')}
            </label>
            <select
              value={data.especialidade}
              onChange={(e) => setData({ ...data, especialidade: e.target.value })}
              required
              disabled={saving}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              <option value="">{t('selectOption')}</option>
              {modalidades.map((modalidade) => (
                <option key={modalidade} value={modalidade}>
                  {modalidade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Academia
            </label>
            <select
              value={data.academia_id || '1'}
              onChange={(e) => setData({ ...data, academia_id: e.target.value })}
              required
              disabled={saving}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              {academias.map((academia) => (
                <option key={academia.id} value={String(academia.id)}>
                  {academia.nome}
                </option>
              ))}
            </select>
          </div>

          {showPassword && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('initialPassword')}
              </label>
              <input
                type="password"
                value={data.senha}
                onChange={(e) => setData({ ...data, senha: e.target.value })}
                required
                disabled={saving}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A senha será definida, mas não será mostrada novamente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('status')}
            </label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value })}
              disabled={saving || uploadingPhoto}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              <option value="ativo">{t('active')}</option>
              <option value="inativo">{t('inactive')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              disabled={saving || uploadingPhoto}
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploadingPhoto ? 'A enviar...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

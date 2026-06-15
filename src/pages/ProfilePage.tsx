import { useState } from 'react'
import { useStore } from '../store/useStore'
import { cn, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  CheckCircle,
  Phone,
  KeyRound,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react'
import { uploadImageFile } from '../lib/uploadImage'

export default function ProfilePage() {
  const { user, changeUserPassword } = useStore()
  const { t } = useTranslation()

  const [saved, setSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '')

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const roleLabels = {
    gestor: 'Gestor',
    treinador: 'Treinador',
    atleta: 'Atleta',
  }

  const roleDescriptions = {
    gestor: 'Acesso completo ao sistema, incluindo relatórios, estoque, atletas e treinadores.',
    treinador: 'Acesso aos atletas da sua modalidade, treinos e informações permitidas.',
    atleta: 'Acesso ao próprio perfil, treinos, produtos e pagamentos.',
  }

  if (!user) return null

  const showSavedMessage = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const atualizarUsuarioLocal = (novoNome: string, novoTelefone: string, novoAvatar: string) => {
    const emailNormalizado = String(user.email || '').trim().toLowerCase()

    const state = useStore.getState()

    const updatedUser = {
      ...user,
      name: novoNome,
      phone: novoTelefone,
      avatar: novoAvatar,
    }

    useStore.setState({
      user: updatedUser,
      registeredUsers: state.registeredUsers.map((u) =>
        u.email.toLowerCase() === emailNormalizado
          ? {
              ...u,
              name: novoNome,
              phone: novoTelefone,
              avatar: novoAvatar,
            }
          : u
      ),
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (savingProfile) return

    if (!formData.name.trim()) {
      alert('Informe o nome.')
      return
    }

    try {
      setSavingProfile(true)

      const emailNormalizado = String(user.email || '').trim().toLowerCase()
      const avatarUrl = profileFile
        ? await uploadImageFile(profileFile, 'perfis')
        : formData.avatar

      if (user.role === 'treinador' || user.role === 'gestor') {
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome: formData.name,
            telefone: formData.phone,
            avatar_url: avatarUrl,
          })
          .eq('email', emailNormalizado)

        if (error) {
          console.log('Erro ao atualizar perfil em usuarios:', error)
        }
      }

      if (user.role === 'atleta') {
        const { error } = await supabase
          .from('membros')
          .update({
            nome: formData.name,
            telefone: formData.phone,
            foto_url: avatarUrl,
          })
          .eq('email', emailNormalizado)

        if (error) {
          console.log('Erro ao atualizar perfil em membros:', error)
        }
      }

      setFormData({ ...formData, avatar: avatarUrl })
      setPreviewUrl(avatarUrl)
      setProfileFile(null)
      atualizarUsuarioLocal(formData.name, formData.phone, avatarUrl)

      showSavedMessage()
      alert('Perfil atualizado com sucesso.')
    } catch (error: any) {
      console.log('Erro inesperado ao atualizar perfil:', error)
      alert('Erro ao atualizar perfil: ' + error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (savingPassword) return

    const emailNormalizado = String(user.email || '').trim().toLowerCase()

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Preencha a senha atual, a nova senha e a confirmação.')
      return
    }

    if (passwordData.newPassword.length < 4) {
      alert('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('A nova senha e a confirmação não coincidem.')
      return
    }

    try {
      setSavingPassword(true)

      const result = await changeUserPassword(
        emailNormalizado,
        passwordData.currentPassword,
        passwordData.newPassword
      )

      if (!result.success) {
        alert(result.message)
        return
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      alert('Senha alterada com sucesso. Usa a nova senha no próximo login.')
    } catch (error: any) {
      console.log('Erro ao alterar senha:', error)
      alert('Erro ao alterar senha: ' + error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('profileTitle')}</h1>
        <p className="text-muted-foreground">{t('personalInfo')}</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full neon-glow"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>

            <span
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-primary rounded-full text-sm font-medium"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
            >
              <Shield className="h-4 w-4" />
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        <div className="p-4 bg-secondary/50 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground">
            {roleDescriptions[user.role]}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Foto do perfil
            </label>
            <div className="flex gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                {previewUrl ? (
                  <img src={previewUrl} alt="Pré-visualização do perfil" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  disabled={savingProfile}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setProfileFile(file)
                    if (file) {
                      setPreviewUrl(URL.createObjectURL(file))
                    }
                  }}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Escolhe uma imagem do computador para atualizar a foto do perfil.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name}
              disabled={savingProfile}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Telefone
            </label>
            <input
              type="text"
              value={formData.phone}
              disabled={savingProfile}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="Digite o telefone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-muted-foreground focus:outline-none"
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              O email não pode ser alterado.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {savingProfile ? 'A guardar...' : 'Salvar Alterações'}
            </button>

            {saved && (
              <span className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                Salvo com sucesso!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t('changePassword')}</h3>
        </div>

        <div
          className="flex items-start gap-3 p-4 rounded-lg mb-5"
          style={{ backgroundColor: 'rgba(234, 179, 8, 0.12)' }}
        >
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Por segurança, a senha antiga não é mostrada. Para alterar, informe a senha atual e a nova senha.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('currentPassword')}
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              disabled={savingPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('newPassword')}
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              disabled={savingPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              disabled={savingPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <KeyRound className="h-5 w-5" />
            {savingPassword ? 'A alterar...' : t('changePassword')}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('accountInfo')}</h3>

        <div className="space-y-4">
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Phone} label="Telefone" value={user.phone || 'Não informado'} />
          <InfoRow icon={Shield} label="Nível de Acesso" value={roleLabels[user.role]} />
          <InfoRow icon={Calendar} label="Membro desde" value={formatDate(user.createdAt)} />
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('permissions')}</h3>

        <div className="space-y-3">
          <PermissionItem
            label="Dashboard"
            description="Visualizar métricas e estatísticas"
            enabled={true}
          />

          <PermissionItem
            label="Atletas"
            description={
              user.role === 'treinador'
                ? 'Visualizar apenas atletas da sua modalidade'
                : 'Gerenciar cadastro de atletas'
            }
            enabled={user.role === 'gestor' || user.role === 'treinador'}
          />

          <PermissionItem
            label="Treinos"
            description="Criar e gerenciar treinos conforme permissões"
            enabled={user.role === 'gestor' || user.role === 'treinador'}
          />

          <PermissionItem
            label="Estoque"
            description="Controle de inventário"
            enabled={user.role === 'gestor'}
          />

          <PermissionItem
            label="Relatórios"
            description="Acesso a análises e relatórios"
            enabled={user.role === 'gestor'}
          />

          <PermissionItem
            label="Pagamentos"
            description={
              user.role === 'atleta'
                ? 'Enviar comprovativo e acompanhar pendências'
                : 'Gerenciar pagamentos'
            }
            enabled={user.role === 'gestor' || user.role === 'atleta'}
          />
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
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>

      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

function PermissionItem({
  label,
  description,
  enabled,
}: {
  label: string
  description: string
  enabled: boolean
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <span
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium',
          enabled ? 'text-primary' : 'bg-muted text-muted-foreground'
        )}
        style={
          enabled
            ? { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
            : undefined
        }
      >
        {enabled ? 'Permitido' : 'Restrito'}
      </span>
    </div>
  )
}

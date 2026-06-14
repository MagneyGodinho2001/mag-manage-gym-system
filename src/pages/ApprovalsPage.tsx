import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { cn, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  User,
  Mail,
  Phone,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function ApprovalsPage() {
  const { t } = useTranslation()
  const {
    pendingRegistrations,
    registeredUsers,
    approveRegistration,
    rejectRegistration,
    updateUserRole,
    user,
    passwordResetRequests,
    resolvePasswordReset,
    rejectPasswordReset,
  } = useStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'passwords'>('pending')
  const [expandedRegistration, setExpandedRegistration] = useState<string | null>(null)
  const [temporaryPasswords, setTemporaryPasswords] = useState<Record<string, string>>({})
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject'
    id: string
  } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [supabaseCounts, setSupabaseCounts] = useState({
    athletes: 0,
    trainers: 0,
  })

  useEffect(() => {
    loadSupabaseCounts()
  }, [])

  const loadSupabaseCounts = async () => {
    const [athletesResult, trainersResult] = await Promise.all([
      supabase.from('membros').select('*', { count: 'exact', head: true }),
      supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'treinador'),
    ])

    if (athletesResult.error) {
      console.log('Erro ao contar atletas na Supabase:', athletesResult.error)
    }

    if (trainersResult.error) {
      console.log('Erro ao contar treinadores na Supabase:', trainersResult.error)
    }

    setSupabaseCounts({
      athletes: athletesResult.error ? 0 : athletesResult.count || 0,
      trainers: trainersResult.error ? 0 : trainersResult.count || 0,
    })
  }

  const filteredRegistrations = pendingRegistrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = registeredUsers
    .filter((u) => u.role !== 'gestor')
    .filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const filteredPasswordRequests = passwordResetRequests.filter(
    (request) =>
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingPasswordRequests = passwordResetRequests.filter(
    (request) => request.status === 'pendente'
  ).length

  const handleResolvePasswordRequest = async (requestId: string) => {
    const newPassword = temporaryPasswords[requestId]

    if (!newPassword || newPassword.length < 4) {
      alert('Informe uma senha temporária com pelo menos 4 caracteres.')
      return
    }

    await resolvePasswordReset(requestId, newPassword)
    setTemporaryPasswords((current) => ({ ...current, [requestId]: '' }))
    alert('Senha redefinida com sucesso.')
  }

  const handleApprove = async (id: string) => {
    await approveRegistration(id)
    window.setTimeout(() => {
      loadSupabaseCounts()
    }, 1000)
    setConfirmAction(null)
  }

  const handleReject = async (id: string) => {
    await rejectRegistration(id)
    setConfirmAction(null)
  }

  const toggleExpand = (id: string) => {
    setExpandedRegistration(expandedRegistration === id ? null : id)
  }

  const handleSyncApprovedUsers = async () => {
    try {
      setSyncing(true)

      const approvedAthletes = registeredUsers.filter(
        (u) => u.role === 'atleta' && u.approvalStatus === 'aprovado'
      )

      if (approvedAthletes.length === 0) {
        alert('Não existem atletas aprovados para sincronizar.')
        return
      }

      let insertedCount = 0
      let skippedCount = 0

      for (const atleta of approvedAthletes) {
        const { data: existing, error: checkError } = await supabase
          .from('membros')
          .select('id,email')
          .eq('email', atleta.email)
          .maybeSingle()

        if (checkError) {
          console.log('Erro ao verificar membro:', checkError)
          continue
        }

        if (existing) {
          skippedCount++
          continue
        }

        const { error: insertError } = await supabase.from('membros').insert([
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            nome: atleta.name,
            telefone: atleta.phone || '',
            email: atleta.email,
            plano: 'Branca',
            modalidade: '',
            status: 'ativo',
          },
        ])

        if (insertError) {
          console.log('Erro ao inserir membro:', insertError)
          alert(`Erro ao sincronizar ${atleta.name}: ${insertError.message}`)
          continue
        }

        insertedCount++
      }

      alert(
        `Sincronização concluída!\n\nNovos adicionados: ${insertedCount}\nJá existiam: ${skippedCount}`
      )
      await loadSupabaseCounts()
    } catch (error: any) {
      console.log('Erro na sincronização:', error)
      alert('Erro ao sincronizar usuários aprovados: ' + error.message)
    } finally {
      setSyncing(false)
    }
  }

  if (user?.role !== 'gestor') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Apenas gestores podem acessar esta pagina.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('approvalsTitle')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('manageApprovals')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {pendingRegistrations.length}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {supabaseCounts.athletes}
              </p>
              <p className="text-sm text-muted-foreground">Atletas</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {supabaseCounts.trainers}
              </p>
              <p className="text-sm text-muted-foreground">Treinadores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('pendingRegistrations')}
            {pendingRegistrations.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500">
                {pendingRegistrations.length}
              </span>
            )}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('approvedUsers')}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('passwords')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'passwords'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('passwordRequests')}
            {pendingPasswordRequests > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500">
                {pendingPasswordRequests}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchByNameEmail')}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Pending Registrations Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('noPendingRegistration')}
              </h3>
              <p className="text-muted-foreground">
                Todas as inscricoes foram processadas.
              </p>
            </div>
          ) : (
            filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleExpand(registration.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-foreground">
                          {registration.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {registration.email}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              registration.role === 'treinador'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {registration.role === 'treinador' ? t('trainer') : t('athlete')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(new Date(registration.createdAt))}
                      </span>
                      {expandedRegistration === registration.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedRegistration === registration.id && (
                  <div className="border-t border-border p-4 bg-secondary/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('phone')}</p>
                          <p className="text-sm text-foreground">{registration.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t('modality')}</p>
                          <p className="text-sm text-foreground">
                            {registration.modality || 'Nao informado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Experiencia</p>
                          <p className="text-sm text-foreground">
                            {registration.experience || 'Nao informado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t('registrationReason')}
                        </p>
                        <p className="text-sm text-foreground mt-1">
                          {registration.reason}
                        </p>
                      </div>
                    </div>

                    {confirmAction?.id === registration.id ? (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-sm text-foreground mb-3">
                          {confirmAction.type === 'approve'
                            ? 'Confirma a aprovação desta inscrição?'
                            : 'Confirma a rejeição desta inscrição?'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              confirmAction.type === 'approve'
                                ? handleApprove(registration.id)
                                : handleReject(registration.id)
                            }
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                              confirmAction.type === 'approve'
                                ? 'bg-primary text-primary-foreground hover:opacity-90'
                                : 'bg-destructive text-destructive-foreground hover:opacity-90'
                            )}
                          >
                            Confirmar
                          </button>

                          <button
                            onClick={() => setConfirmAction(null)}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'approve',
                              id: registration.id,
                            })
                          }
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t('approve')}
                        </button>

                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'reject',
                              id: registration.id,
                            })
                          }
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          {t('reject')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Registered Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleSyncApprovedUsers}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar aprovados com Supabase'}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('noUserFound')}
                </h3>
                <p className="text-muted-foreground">
                  Nao ha usuarios correspondentes a busca.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      {t('user')}
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      {t('accountType')}
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      {t('status')}
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((approvedUser) => (
                    <tr
                      key={approvedUser.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">
                            {approvedUser.name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-muted-foreground">
                        {approvedUser.email}
                      </td>

                      <td className="p-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            approvedUser.role === 'treinador'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {approvedUser.role === 'treinador' ? t('trainer') : t('athlete')}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Aprovado
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <select
                          value={approvedUser.role}
                          onChange={(e) =>
                            updateUserRole(
                              approvedUser.id,
                              e.target.value as 'treinador' | 'atleta'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="atleta">{t('athlete')}</option>
                          <option value="treinador">{t('trainer')}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'passwords' && (
        <div className="space-y-4">
          {filteredPasswordRequests.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('passwordRequests')}
              </h3>
              <p className="text-muted-foreground">
                Os pedidos de recuperação de senha aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPasswordRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {request.userName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                          {request.role === 'treinador' ? t('trainer') : t('athlete')}
                        </span>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            request.status === 'pendente' &&
                              'bg-amber-500/10 text-amber-500',
                            request.status === 'resolvido' &&
                              'bg-primary/10 text-primary',
                            request.status === 'rejeitado' &&
                              'bg-destructive/10 text-destructive'
                          )}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>

                    {request.status === 'pendente' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={temporaryPasswords[request.id] || ''}
                          onChange={(event) =>
                            setTemporaryPasswords((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder={t('temporaryPassword')}
                          className="px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => handleResolvePasswordRequest(request.id)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          {t('redefine')}
                        </button>
                        <button
                          onClick={() => rejectPasswordReset(request.id)}
                          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          {t('reject')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

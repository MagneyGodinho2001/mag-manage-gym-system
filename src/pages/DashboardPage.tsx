import { useMemo, useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { cn, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  Users,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  User,
  CreditCard,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#22c55e', '#06b6d4', '#3b82f6', '#eab308', '#f97316', '#a855f7']
const BELT_NAMES = [
  'branca',
  'amarela',
  'laranja',
  'verde',
  'azul',
  'castanha',
  'preta (1º dan)',
  'preta (2º dan)',
]
const BELT_ORDER = [
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

function getAthleteModality(athlete: any) {
  const possibleModalities = [
    athlete.modalidade,
    athlete.modality,
  ]

  return possibleModalities.find((value) => {
    const normalizedValue = normalizeText(value)

    return normalizedValue && !BELT_NAMES.includes(normalizedValue)
  }) || ''
}

function normalizeBeltName(value: any) {
  const belt = String(value || '').trim()
  const normalized = normalizeText(belt)

  const aliases: Record<string, string> = {
    branca: 'Branca',
    amarelo: 'Amarela',
    amarela: 'Amarela',
    laranja: 'Laranja',
    verde: 'Verde',
    azul: 'Azul',
    castanho: 'Castanha',
    castanha: 'Castanha',
    marrom: 'Castanha',
    preta: 'Preta (1º Dan)',
    'preta (1º dan)': 'Preta (1º Dan)',
    'preta (2º dan)': 'Preta (2º Dan)',
    'preta (2ª dan)': 'Preta (2º Dan)',
    '2º dan (preta)': 'Preta (2º Dan)',
    '2ª dan (preta)': 'Preta (2º Dan)',
  }

  return aliases[normalized] || belt || 'Sem faixa'
}

function sortBelts(a: { name: string }, b: { name: string }) {
  const indexA = BELT_ORDER.indexOf(a.name)
  const indexB = BELT_ORDER.indexOf(b.name)

  return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
}

export default function DashboardPage() {
  const { user, athletes, trainings, stockItems } = useStore()
  const { t } = useTranslation()

  const [trainerModality, setTrainerModality] = useState('')
  const [loadingTrainer, setLoadingTrainer] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const isGestor = user?.role === 'gestor'
  const isTreinador = user?.role === 'treinador'
  const isAtleta = user?.role === 'atleta'

  useEffect(() => {
    buscarModalidadeTreinador()
  }, [user?.email, user?.name, user?.role])

  async function buscarModalidadeTreinador() {
    if (user?.role !== 'treinador') {
      setTrainerModality('')
      return
    }

    const emailTreinador = String(user?.email || '').trim().toLowerCase()
    const nomeTreinador = String(user?.name || '').trim()

    if (!emailTreinador && !nomeTreinador) {
      setTrainerModality('')
      return
    }

    try {
      setLoadingTrainer(true)

      let treinadorEncontrado: any = null

      if (emailTreinador) {
        const { data: porEmail, error: erroEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('role', 'treinador')
          .ilike('email', emailTreinador)
          .limit(1)

        if (erroEmail) {
          console.log('Erro ao buscar treinador por email:', erroEmail)
        }

        if (porEmail && porEmail.length > 0) {
          treinadorEncontrado = porEmail[0]
        }
      }

      if (!treinadorEncontrado && nomeTreinador) {
        const { data: porNome, error: erroNome } = await supabase
          .from('usuarios')
          .select('*')
          .eq('role', 'treinador')
          .ilike('nome', nomeTreinador)
          .limit(1)

        if (erroNome) {
          console.log('Erro ao buscar treinador por nome:', erroNome)
        }

        if (porNome && porNome.length > 0) {
          treinadorEncontrado = porNome[0]
        }
      }

      if (!treinadorEncontrado) {
        const { data: todosTreinadores, error: erroTodos } = await supabase
          .from('usuarios')
          .select('*')
          .eq('role', 'treinador')

        if (erroTodos) {
          console.log('Erro ao buscar todos os treinadores:', erroTodos)
        }

        const encontrado = (todosTreinadores || []).find((t: any) => {
          const emailBase = normalizeText(t.email)
          const nomeBase = normalizeText(t.nome)

          return (
            emailBase === normalizeText(emailTreinador) ||
            nomeBase === normalizeText(nomeTreinador)
          )
        })

        if (encontrado) {
          treinadorEncontrado = encontrado
        }
      }

      if (!treinadorEncontrado) {
        console.log('Treinador não encontrado na tabela usuarios:', {
          emailTreinador,
          nomeTreinador,
        })
        setTrainerModality('')
        return
      }

      const modalidade =
        treinadorEncontrado.especialidade ||
        treinadorEncontrado.modalidade ||
        treinadorEncontrado.modality ||
        ''

      setTrainerModality(String(modalidade || '').trim())
    } catch (error) {
      console.log('Erro inesperado ao buscar modalidade do treinador:', error)
      setTrainerModality('')
    } finally {
      setLoadingTrainer(false)
    }
  }

  const visibleAthletes = useMemo(() => {
    if (isGestor) return athletes

    if (isTreinador) {
      return athletes.filter((athlete: any) => {
        return normalizeText(getAthleteModality(athlete)) === normalizeText(trainerModality)
      })
    }

    if (isAtleta) {
      return athletes.filter((athlete: any) => {
        return normalizeText(athlete.email) === normalizeText(user?.email)
      })
    }

    return []
  }, [athletes, isGestor, isTreinador, isAtleta, trainerModality, user?.email])

  const visibleTrainings = useMemo(() => {
    if (isGestor) return trainings

    if (isTreinador) {
      return trainings.filter((training: any) => {
        return normalizeText(training.modality) === normalizeText(trainerModality)
      })
    }

    if (isAtleta) return trainings

    return []
  }, [trainings, isGestor, isTreinador, isAtleta, trainerModality])

  const stats = useMemo(() => {
    const activeAthletes = visibleAthletes.filter((a: any) => a.status === 'ativo').length
    const todayTrainings = visibleTrainings.filter((t: any) => t.date === today).length

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const weekTrainings = visibleTrainings.filter((t: any) => {
      return new Date(t.date) >= weekStart
    }).length

    const lowStockItems = stockItems.filter((i: any) => i.quantity <= i.minQuantity).length

    return {
      totalAthletes: visibleAthletes.length,
      activeAthletes,
      todayTrainings,
      weekTrainings,
      lowStockItems,
    }
  }, [visibleAthletes, visibleTrainings, stockItems, today])

  const todayTrainingsList = useMemo(() => {
    return visibleTrainings
      .filter((t: any) => t.date === today)
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
  }, [visibleTrainings, today])

  const modalityData = useMemo(() => {
    const counts: Record<string, number> = {}

    visibleAthletes.forEach((a: any) => {
      const modality = getAthleteModality(a) || 'Sem modalidade'
      counts[modality] = (counts[modality] || 0) + 1
    })

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [visibleAthletes])

  const weeklyAttendanceData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

    return days.map((day, index) => {
      const count = visibleTrainings.filter((t: any) => {
        const date = new Date(t.date)
        return date.getDay() === index
      }).length

      return {
        day,
        treinos: count,
      }
    })
  }, [visibleTrainings])

  const beltDistribution = useMemo(() => {
    const counts: Record<string, number> = {}

    visibleAthletes.forEach((a: any) => {
      const belt = normalizeBeltName(a.belt || a.faixa || a.plano)
      counts[belt] = (counts[belt] || 0) + 1
    })

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort(sortBelts)
  }, [visibleAthletes])

  const roleLabels = {
    gestor: 'Gestor',
    treinador: 'Treinador',
    atleta: 'Atleta',
  }

  const dashboardSubtitle = isTreinador
    ? trainerModality
      ? `Treinador - Modalidade: ${trainerModality}`
      : 'Treinador - Modalidade não definida'
    : user && roleLabels[user.role]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {t('welcome')}, {user?.name?.split(' ')[0]}!
        </h1>

        <p className="text-muted-foreground">
          {dashboardSubtitle} - {formatDate(new Date())}
        </p>
      </div>

      {isTreinador && !trainerModality && (
        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            A tua modalidade ainda não foi encontrada. O gestor deve editar o teu perfil em
            Treinadores e preencher o campo Especialidade/Modalidade.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isTreinador ? t('athletesByModality') : isAtleta ? t('profileTitle') : t('totalAthletes')}
          value={isAtleta ? visibleAthletes.length : stats.totalAthletes}
          subtitle={isAtleta ? t('personalInfo') : `${stats.activeAthletes} ${t('activeAthletes')}`}
          icon={isAtleta ? User : Users}
          color="primary"
        />

        <StatCard
          title={t('todayTrainings')}
          value={stats.todayTrainings}
          subtitle={`${stats.weekTrainings} ${t('weekTrainings')}`}
          icon={Calendar}
          color="chart-2"
        />

        <StatCard
          title={t('frequencyWeekly')}
          value={stats.weekTrainings}
          subtitle={t('weekTrainings')}
          icon={TrendingUp}
          color="chart-3"
        />

        {isGestor && (
          <StatCard
            title={t('lowStock')}
            value={stats.lowStockItems}
            subtitle={t('itemsToRestock')}
            icon={stats.lowStockItems > 0 ? AlertTriangle : Package}
            color={stats.lowStockItems > 0 ? 'destructive' : 'chart-4'}
          />
        )}

        {isAtleta && (
          <StatCard
            title={t('paymentsTitle')}
            value="Pessoal"
            subtitle="consulta individual"
            icon={CreditCard}
            color="chart-4"
          />
        )}
      </div>

      {/* Charts Row */}
      {!isAtleta && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Attendance Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('frequencyWeekly')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyAttendanceData}>
                  <defs>
                    <linearGradient id="colorTreinos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="treinos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTreinos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Modality Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('athletesByModality')}
            </h3>

            <div className="h-64 flex items-center justify-center">
              {modalityData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  <p>{t('noAthleteFound')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modalityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {modalityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Trainings */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {t('trainingsToday')}
            </h3>

            <span className="text-sm text-muted-foreground">
              {todayTrainingsList.length} {t('trainings')}
            </span>
          </div>

          {todayTrainingsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('noTrainingToday')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTrainingsList.map((training: any) => (
                <div
                  key={training.id}
                  className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    <Clock className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {training.title}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {training.startTime} - {training.endTime} | {training.instructor}
                    </p>

                    <p className="text-xs text-primary">
                      {training.modality}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {training.enrolledAthletes.length}/{training.maxCapacity}
                    </p>
                    <p className="text-xs text-muted-foreground">inscritos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution */}
        {!isAtleta && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('beltDistribution')}
            </h3>

            <div className="h-48">
              {beltDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  <p>{t('noAthleteFound')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beltDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={12}
                      width={70}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />

                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {isAtleta && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Meu Resumo
            </h3>

            {visibleAthletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro de atleta encontrado para este email.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleAthletes.map((athlete: any) => (
                  <div key={athlete.id} className="p-4 bg-secondary/50 rounded-lg">
                    <p className="font-medium text-foreground">
                      {athlete.nome || athlete.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Modalidade: {getAthleteModality(athlete) || 'Não definida'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Estado: {athlete.status || 'Não definido'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend?: string
  color: string
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            color === 'primary' && 'bg-primary/20',
            color === 'chart-2' && 'bg-chart-2/20',
            color === 'chart-3' && 'bg-chart-3/20',
            color === 'chart-4' && 'bg-chart-4/20',
            color === 'destructive' && 'bg-destructive/20'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              color === 'primary' && 'text-primary',
              color === 'chart-2' && 'text-chart-2',
              color === 'chart-3' && 'text-chart-3',
              color === 'chart-4' && 'text-chart-4',
              color === 'destructive' && 'text-destructive'
            )}
          />
        </div>

        {trend && (
          <span className="flex items-center text-xs font-medium text-primary">
            {trend}
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
          </span>
        )}
      </div>

      <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

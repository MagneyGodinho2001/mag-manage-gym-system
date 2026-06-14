import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'
import type { Training } from '../types'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../i18n/useTranslation'
import {
  Calendar,
  Plus,
  Clock,
  Users,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const modalities = [
  'Jiu-Jitsu',
  'Muay Thai',
  'Boxe',
  'MMA',
  'Wrestling',
  'Judo',
  'Funcional',
]

const demoTrainerEmails = ['treinador@magmanage.com']

function normalizeText(value: any) {
  return String(value || '').trim().toLowerCase()
}

type TrainerOption = {
  name: string
  email?: string
  modality?: string
}

export default function TrainingsPage() {
  const { t } = useTranslation()
  const {
    user,
    registeredUsers,
    athletes,
    trainings,
    addTraining,
    updateTraining,
    deleteTraining,
    enrollAthlete,
    unenrollAthlete,
    markAttendance,
    loadGymDataFromSupabase,
  } = useStore()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)

  const [trainerModality, setTrainerModality] = useState('')
  const [loadingTrainer, setLoadingTrainer] = useState(false)
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])

  const isGestor = user?.role === 'gestor'
  const isTreinador = user?.role === 'treinador'
  const isAthlete = user?.role === 'atleta'

  const canEdit = isGestor || isTreinador

  useEffect(() => {
    loadGymDataFromSupabase()
  }, [loadGymDataFromSupabase])

  useEffect(() => {
    buscarModalidadeTreinador()
  }, [user?.email, user?.name, user?.role])

  useEffect(() => {
    if (isGestor) {
      carregarTreinadoresParaSelecao()
      return
    }

    setTrainerOptions([])
  }, [isGestor, registeredUsers])

  async function carregarTreinadoresParaSelecao() {
    const localOptions = registeredUsers
      .filter(
        (registeredUser) =>
          registeredUser.role === 'treinador' &&
          registeredUser.approvalStatus === 'aprovado' &&
          !demoTrainerEmails.includes(normalizeText(registeredUser.email))
      )
      .map((registeredUser) => ({
        name: registeredUser.name,
        email: registeredUser.email,
      }))
      .filter((trainer) => trainer.name)

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('role', 'treinador')
        .order('nome', { ascending: true })

      if (error) {
        console.log('Erro ao carregar treinadores para seleção:', error)
        setTrainerOptions(localOptions)
        return
      }

      const supabaseOptions = (data || [])
        .filter((trainer: any) => trainer.status !== 'inativo')
        .map((trainer: any) => ({
          name: String(trainer.nome || trainer.name || '').trim(),
          email: trainer.email || '',
          modality:
            trainer.especialidade ||
            trainer.modalidade ||
            trainer.modality ||
            '',
        }))
        .filter((trainer) => trainer.name)

      const optionsByKey = new Map<string, TrainerOption>()

      ;[...supabaseOptions, ...localOptions].forEach((trainer) => {
        const key = normalizeText(trainer.email || trainer.name)
        if (!key || optionsByKey.has(key)) return

        optionsByKey.set(key, trainer)
      })

      setTrainerOptions(Array.from(optionsByKey.values()))
    } catch (error) {
      console.log('Erro inesperado ao carregar treinadores para seleção:', error)
      setTrainerOptions(localOptions)
    }
  }

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

      if (!modalidade) {
        console.log('Treinador encontrado, mas sem modalidade:', treinadorEncontrado)
        setTrainerModality('')
        return
      }

      setTrainerModality(String(modalidade).trim())
    } catch (error) {
      console.log('Erro inesperado ao buscar modalidade do treinador:', error)
      setTrainerModality('')
    } finally {
      setLoadingTrainer(false)
    }
  }

  const visibleTrainings = useMemo(() => {
    if (isGestor) return trainings

    if (isTreinador) {
      const trainerModalityNormalized = normalizeText(trainerModality)

      return trainings.filter(
        (training) => normalizeText(training.modality) === trainerModalityNormalized
      )
    }

    if (isAthlete) {
      return trainings
    }

    return []
  }, [trainings, isGestor, isTreinador, isAthlete, trainerModality])

  const visibleAthletes = useMemo(() => {
    if (isGestor) return athletes

    if (isTreinador) {
      const trainerModalityNormalized = normalizeText(trainerModality)

      return athletes.filter((athlete: any) => {
        const athleteModality =
          athlete.modality ||
          athlete.modalidade ||
          ''

        return normalizeText(athleteModality) === trainerModalityNormalized
      })
    }

    return athletes
  }, [athletes, isGestor, isTreinador, trainerModality])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const trainingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []

    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    return visibleTrainings
      .filter((t) => t.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [visibleTrainings, selectedDate])

  const currentSelectedTraining = useMemo(() => {
    if (!selectedTraining) return null

    return trainings.find((training) => training.id === selectedTraining.id) || selectedTraining
  }, [selectedTraining, trainings])

  const getTrainingsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return visibleTrainings.filter((t) => t.date === dateStr)
  }

  const canManageTraining = (training: Training) => {
    if (isGestor) return true

    if (isTreinador) {
      return normalizeText(training.modality) === normalizeText(trainerModality)
    }

    return false
  }

  const handleAdd = () => {
    if (isTreinador && !trainerModality) {
      alert(
        'Este treinador ainda não tem modalidade definida. O gestor deve definir a especialidade na página Treinadores.'
      )
      return
    }

    setSelectedTraining(null)
    setShowModal(true)
  }

  const handleEdit = (training: Training) => {
    if (!canManageTraining(training)) {
      alert('Não tens permissão para editar este treino.')
      return
    }

    setSelectedTraining(training)
    setShowModal(true)
  }

  const handleDelete = (training: Training) => {
    if (!canManageTraining(training)) {
      alert('Não tens permissão para apagar este treino.')
      return
    }

    setSelectedTraining(training)
    setShowDeleteModal(true)
  }

  const handleAttendance = (training: Training) => {
    if (!canManageTraining(training)) {
      alert('Não tens permissão para fazer chamada neste treino.')
      return
    }

    setSelectedTraining(training)
    setShowAttendanceModal(true)
  }

  const confirmDelete = () => {
    if (selectedTraining) {
      deleteTraining(selectedTraining.id)
      setShowDeleteModal(false)
      setSelectedTraining(null)
    }
  }

  const handleEnroll = (trainingId: string) => {
    if (user) {
      const athleteRecord = athletes.find(
        (a) => normalizeText(a.email) === normalizeText(user.email)
      )

      if (athleteRecord) {
        enrollAthlete(trainingId, athleteRecord.id)
      }
    }
  }

  const handleUnenroll = (trainingId: string) => {
    if (user) {
      const athleteRecord = athletes.find(
        (a) => normalizeText(a.email) === normalizeText(user.email)
      )

      if (athleteRecord) {
        unenrollAthlete(trainingId, athleteRecord.id)
      }
    }
  }

  const isEnrolled = (training: Training) => {
    if (!user) return false

    const athleteRecord = athletes.find(
      (a) => normalizeText(a.email) === normalizeText(user.email)
    )

    return athleteRecord ? training.enrolledAthletes.includes(athleteRecord.id) : false
  }

  const handleSaveTraining = (data: Partial<Training>) => {
    if (isTreinador) {
      if (!trainerModality) {
        alert('Este treinador ainda não tem modalidade definida.')
        return
      }

      data.modality = trainerModality
      data.instructor = user?.name || data.instructor || 'Treinador'
    }

    if (selectedTraining) {
      if (!canManageTraining(selectedTraining)) {
        alert('Não tens permissão para editar este treino.')
        return
      }

      updateTraining(selectedTraining.id, data)
    } else {
      addTraining(data as Omit<Training, 'id' | 'createdAt'>)
    }

    setShowModal(false)
    setSelectedTraining(null)
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

  const pageSubtitle = isGestor
    ? `${visibleTrainings.length} treinos agendados`
    : isTreinador
      ? trainerModality
        ? `${visibleTrainings.length} treinos da modalidade ${trainerModality}`
        : 'Nenhuma modalidade encontrada para este treinador'
      : `${visibleTrainings.length} treinos disponíveis`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('trainingsTitle')}</h1>
          <p className="text-muted-foreground">{pageSubtitle}</p>
        </div>

        {canEdit && (
          <button
            onClick={handleAdd}
            disabled={loadingTrainer}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity neon-glow disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {t('newTraining')}
          </button>
        )}
      </div>

      {isTreinador && !trainerModality && (
        <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Este treinador ainda não tem especialidade/modalidade definida. O gestor deve ir em
            Treinadores, editar este treinador e definir a especialidade.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>

              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                Hoje
              </button>

              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 lg:h-24" />
            ))}

            {days.map((day) => {
              const dayTrainings = getTrainingsForDay(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-20 lg:h-24 p-1 rounded-lg border transition-all text-left',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-secondary',
                    isToday && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                      isToday && 'bg-primary text-primary-foreground',
                      !isToday && 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayTrainings.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="text-xs px-1.5 py-0.5 text-primary rounded truncate"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                      >
                        {t.startTime} {t.modality}
                      </div>
                    ))}

                    {dayTrainings.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayTrainings.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione uma data'}
          </h3>

          {trainingsForSelectedDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">{t('noTrainingDay')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainingsForSelectedDate.map((training) => (
                <div key={training.id} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{training.title}</h4>
                      <p className="text-sm text-primary">{training.modality}</p>
                    </div>

                    {canEdit && canManageTraining(training) && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAttendance(training)}
                          className="p-1.5 hover:bg-secondary rounded transition-colors"
                          title="Marcar Presença e Pontos"
                        >
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                          onClick={() => handleEdit(training)}
                          className="p-1.5 hover:bg-secondary rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                          onClick={() => handleDelete(training)}
                          className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {training.startTime} - {training.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {training.enrolledAthletes.length}/{training.maxCapacity} inscritos
                      </span>
                    </div>
                  </div>

                  {isAthlete && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {isEnrolled(training) ? (
                        <button
                          onClick={() => handleUnenroll(training.id)}
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <UserMinus className="h-4 w-4" />
                          Cancelar Inscrição
                        </button>
                      ) : training.enrolledAthletes.length < training.maxCapacity ? (
                        <button
                          onClick={() => handleEnroll(training.id)}
                          className="flex items-center justify-center gap-2 w-full py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                          <UserPlus className="h-4 w-4" />
                          Inscrever-se
                        </button>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">
                          Treino lotado
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TrainingModal
          training={selectedTraining}
          selectedDate={selectedDate}
          userRole={user?.role || ''}
          userName={user?.name || ''}
          trainerModality={trainerModality}
          trainerOptions={trainerOptions}
          onClose={() => {
            setShowModal(false)
            setSelectedTraining(null)
          }}
          onSave={handleSaveTraining}
        />
      )}

      {showAttendanceModal && currentSelectedTraining && (
        <AttendanceModal
          training={currentSelectedTraining}
          athletes={visibleAthletes}
          onClose={() => {
            setShowAttendanceModal(false)
            setSelectedTraining(null)
          }}
          onMarkAttendance={(athleteId, present, points) => {
            return markAttendance(currentSelectedTraining.id, athleteId, present, points)
          }}
        />
      )}

      {showDeleteModal && selectedTraining && (
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
              Tem certeza que deseja excluir o treino{' '}
              <strong>{selectedTraining.title}</strong>?
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
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TrainingModalProps {
  training: Training | null
  selectedDate: Date | null
  userRole: string
  userName: string
  trainerModality: string
  trainerOptions: TrainerOption[]
  onClose: () => void
  onSave: (data: Partial<Training>) => void
}

function TrainingModal({
  training,
  selectedDate,
  userRole,
  userName,
  trainerModality,
  trainerOptions,
  onClose,
  onSave,
}: TrainingModalProps) {
  const { t } = useTranslation()
  const isTreinador = userRole === 'treinador'
  const forcedModality = isTreinador ? trainerModality : ''
  const availableTrainerOptions = useMemo(() => {
    const optionsByName = new Map<string, TrainerOption>()

    trainerOptions.forEach((trainer) => {
      const name = String(trainer.name || '').trim()
      if (!name || optionsByName.has(normalizeText(name))) return

      optionsByName.set(normalizeText(name), {
        ...trainer,
        name,
      })
    })

    if (training?.instructor) {
      const currentInstructor = String(training.instructor).trim()
      const key = normalizeText(currentInstructor)

      if (currentInstructor && !optionsByName.has(key)) {
        optionsByName.set(key, { name: currentInstructor })
      }
    }

    return Array.from(optionsByName.values())
  }, [trainerOptions, training?.instructor])

  const [formData, setFormData] = useState({
    title: training?.title || '',
    modality: forcedModality || training?.modality || 'Jiu-Jitsu',
    date: training?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
    startTime: training?.startTime || '07:00',
    endTime: training?.endTime || '08:30',
    instructor: isTreinador ? userName : training?.instructor || '',
    maxCapacity: training?.maxCapacity || 20,
    description: training?.description || '',
    enrolledAthletes: training?.enrolledAthletes || [],
    attendance: training?.attendance || {},
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const dataToSave = {
      ...formData,
      modality: forcedModality || formData.modality,
      instructor: isTreinador ? userName : formData.instructor,
    }

    onSave(dataToSave)
  }

  const handleSelectInstructor = (instructorName: string) => {
    const selectedTrainer = availableTrainerOptions.find(
      (trainer) => trainer.name === instructorName
    )

    setFormData({
      ...formData,
      instructor: instructorName,
      modality: selectedTrainer?.modality || formData.modality,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {training ? t('edit') : t('newTraining')}
          </h2>

          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isTreinador && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)' }}
            >
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Como treinador, só podes criar ou editar treinos da tua modalidade:{' '}
                <strong>{trainerModality || 'não definida'}</strong>.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('title')}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Jiu-Jitsu Fundamentos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('modality')}
              </label>

              {isTreinador ? (
                <input
                  type="text"
                  value={trainerModality || 'Não definida'}
                  disabled
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-muted-foreground focus:outline-none"
                />
              ) : (
                <select
                  value={formData.modality}
                  onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {modalities.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('date')}
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('startTime')}
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('endTime')}
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('instructor')}
              </label>
              {isTreinador ? (
                <input
                  type="text"
                  required
                  value={formData.instructor}
                  disabled
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              ) : (
                <select
                  required
                  value={formData.instructor}
                  onChange={(e) => handleSelectInstructor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    {t('instructor')}
                  </option>

                  {availableTrainerOptions.map((trainer) => (
                    <option key={trainer.email || trainer.name} value={trainer.name}>
                      {trainer.name}
                      {trainer.modality ? ` - ${trainer.modality}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t('capacity')}
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.maxCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Detalhes sobre o treino..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {training ? t('save') : t('createTraining')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AttendanceModalProps {
  training: Training
  athletes: {
    id: string
    name: string
    modality?: string
    modalidade?: string
    plano?: string
    status?: string
    totalPoints?: number
  }[]
  onClose: () => void
  onMarkAttendance: (athleteId: string, present: boolean, points: number) => Promise<boolean>
}

function AttendanceModal({
  training,
  athletes,
  onClose,
  onMarkAttendance,
}: AttendanceModalProps) {
  const { t } = useTranslation()
  const [savingAthleteId, setSavingAthleteId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'error'>>({})

  const trainingAthletes = athletes.filter((athlete: any) => {
    const athleteModality =
      athlete.modality ||
      athlete.modalidade ||
      ''

    return (
      athlete.status !== 'inativo' &&
      normalizeText(athleteModality) === normalizeText(training.modality)
    )
  })

  const getAttendanceRecord = (athleteId: string) => {
    const record: any = training.attendance?.[athleteId]

    if (!record) {
      return {
        present: undefined,
        points: 0,
      }
    }

    if (typeof record === 'boolean') {
      return {
        present: record,
        points: 0,
      }
    }

    return {
      present: record.present,
      points: Number(record.points || 0),
    }
  }

  const handleMarkAttendance = async (
    athleteId: string,
    present: boolean,
    points: number
  ) => {
    setSavingAthleteId(athleteId)

    const success = await onMarkAttendance(athleteId, present, points)

    setSaveStatus((current) => ({
      ...current,
      [athleteId]: success ? 'saved' : 'error',
    }))
    setSavingAthleteId(null)
  }

  const handleChangePoints = (athleteId: string, present: boolean, value: string) => {
    const points = Math.max(0, Number(value || 0))
    handleMarkAttendance(athleteId, present, points)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t('attendancePoints')}
            </h2>
            <p className="text-sm text-muted-foreground">{training.title}</p>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {trainingAthletes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('noAthleteFound')}
            </p>
          ) : (
            <div className="space-y-3">
              {trainingAthletes.map((athlete) => {
                const attendance = getAttendanceRecord(athlete.id)
                const isPresent = attendance.present === true
                const isAbsent = attendance.present === false
                const isSaving = savingAthleteId === athlete.id

                return (
                  <div key={athlete.id} className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{athlete.name}</p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>
                            {t('rankingPoints')}: {Number(athlete.totalPoints || 0)} {t('points')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkAttendance(athlete.id, true, attendance.points)
                            }
                            disabled={isSaving}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                              isPresent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground hover:bg-primary/20'
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {t('present')}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(athlete.id, false, 0)}
                            disabled={isSaving}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                              isAbsent
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-background text-muted-foreground hover:bg-destructive/20'
                            )}
                          >
                            <XCircle className="h-4 w-4" />
                            {t('absent')}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">
                            {t('points')}
                          </label>

                          <input
                            type="number"
                            min={0}
                            value={attendance.points}
                            disabled={isAbsent || isSaving}
                            onChange={(e) =>
                              handleChangePoints(
                                athlete.id,
                                attendance.present !== false,
                                e.target.value
                              )
                            }
                            className="w-24 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          />
                        </div>

                        <p
                          className={cn(
                            'text-xs min-w-20',
                            isSaving && 'text-muted-foreground',
                            saveStatus[athlete.id] === 'saved' && 'text-primary',
                            saveStatus[athlete.id] === 'error' && 'text-destructive'
                          )}
                        >
                          {isSaving
                            ? 'A guardar...'
                            : saveStatus[athlete.id] === 'saved'
                              ? 'Guardado'
                              : saveStatus[athlete.id] === 'error'
                                ? 'Erro ao gravar'
                                : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

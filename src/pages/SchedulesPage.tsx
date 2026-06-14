import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, Users, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { cn } from '../lib/utils'
import { useTranslation } from '../i18n/useTranslation'

const modalityColors: Record<string, string> = {
  'Jiu-Jitsu': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Muay Thai': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Boxe': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'MMA': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Wrestling': 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function SchedulesPage() {
  const { t } = useTranslation()
  const { trainings, athletes, user } = useStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedModality, setSelectedModality] = useState<string>('todas')

  // Get the current athlete (linked by email)
  const currentAthlete = athletes.find(a => a.email === user?.email)

  // Calculate week dates
  const today = new Date()
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get unique modalities
  const modalities = useMemo(() => {
    const unique = [...new Set(trainings.map(t => t.modality))]
    return unique.sort()
  }, [trainings])

  // Filter trainings by modality
  const filteredTrainings = trainings.filter(t => 
    selectedModality === 'todas' || t.modality === selectedModality
  )

  // Group trainings by day
  const trainingsByDay = useMemo(() => {
    const grouped: Record<string, typeof trainings> = {}
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      grouped[dateStr] = filteredTrainings
        .filter(t => t.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return grouped
  }, [filteredTrainings, weekDays])

  const isEnrolled = (trainingId: string) => {
    if (!currentAthlete) return false
    const training = trainings.find(t => t.id === trainingId)
    return training?.enrolledAthletes.includes(currentAthlete.id) || false
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('schedulesTitle')}</h1>
        <p className="text-muted-foreground mt-1">{t('weeklySchedule')}</p>
      </div>

      {/* Filters and Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="todas">{t('allModalities')}</option>
            {modalities.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
          >
            Hoje
          </button>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Week Header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h2 className="font-semibold text-foreground">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
          </h2>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden lg:grid grid-cols-7 divide-x divide-border">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTrainings = trainingsByDay[dateStr] || []
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} className="min-h-[300px]">
                <div className={cn(
                  'p-3 border-b border-border text-center',
                  isToday && 'bg-primary/10'
                )}>
                  <p className="text-sm text-muted-foreground">
                    {format(day, 'EEEE', { locale: ptBR })}
                  </p>
                  <p className={cn(
                    'text-xl font-bold',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}>
                    {format(day, 'dd')}
                  </p>
                </div>
                <div className="p-2 space-y-2">
                  {dayTrainings.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sem treinos
                    </p>
                  ) : (
                    dayTrainings.map((training) => (
                      <div
                        key={training.id}
                        className={cn(
                          'p-2 rounded-lg border text-xs',
                          modalityColors[training.modality] || 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                          isEnrolled(training.id) && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                        )}
                      >
                        <p className="font-semibold truncate">{training.title}</p>
                        <p className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {training.startTime} - {training.endTime}
                        </p>
                        <p className="flex items-center gap-1 mt-0.5 opacity-75">
                          <User className="h-3 w-3" />
                          {training.instructor}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile View - List */}
        <div className="lg:hidden divide-y divide-border">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTrainings = trainingsByDay[dateStr] || []
            const isToday = isSameDay(day, today)

            return (
              <div key={dateStr} className={cn('p-4', isToday && 'bg-primary/5')}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex flex-col items-center justify-center',
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <span className="text-xs uppercase">
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className="text-lg font-bold">{format(day, 'dd')}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dayTrainings.length} treino(s)
                    </p>
                  </div>
                </div>

                {dayTrainings.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-15">{t('noTrainingScheduled')}</p>
                ) : (
                  <div className="space-y-2 pl-15">
                    {dayTrainings.map((training) => (
                      <div
                        key={training.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          modalityColors[training.modality] || 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                          isEnrolled(training.id) && 'ring-2 ring-primary'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{training.title}</p>
                            <p className="text-sm opacity-75">{training.modality}</p>
                          </div>
                          {isEnrolled(training.id) && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Inscrito
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {training.startTime} - {training.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {training.instructor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {training.enrolledAthletes.length}/{training.maxCapacity}
                          </span>
                        </div>
                        {training.description && (
                          <p className="text-xs mt-2 opacity-75">{training.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-3">{t('modalityLegend')}</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(modalityColors).map(([modality, colors]) => (
            <span key={modality} className={cn('px-3 py-1.5 rounded-full text-sm border', colors)}>
              {modality}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 rounded border-2 border-primary" />
            <span>Treinos em que você está inscrito</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Informacoes Importantes</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t('schedulesHelp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

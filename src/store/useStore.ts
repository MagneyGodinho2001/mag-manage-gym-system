import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  Athlete,
  Training,
  StockItem,
  StockMovement,
  Registration,
  Payment,
  Notification,
  Language,
  PasswordResetRequest,
} from '../types'
import { supabase } from '../lib/supabase'

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  language: Language
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setLanguage: (language: Language) => void

  // Auth
  user: User | null
  isAuthenticated: boolean
  registeredUsers: User[]
  pendingRegistrations: Registration[]
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  register: (
    registration: Omit<Registration, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean; message: string }>
  approveRegistration: (registrationId: string) => Promise<void>
  rejectRegistration: (registrationId: string) => Promise<void>
  updateUserRole: (userId: string, newRole: 'treinador' | 'atleta') => void
  createApprovedUser: (data: {
    name: string
    email: string
    phone?: string
    password: string
    role: 'gestor' | 'treinador' | 'atleta'
  }) => void
  changeUserPassword: (
    email: string,
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>

  // Password reset
  passwordResetRequests: PasswordResetRequest[]
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>
  resolvePasswordReset: (requestId: string, newPassword: string) => Promise<void>
  rejectPasswordReset: (requestId: string) => Promise<void>

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  // Payments
  payments: Payment[]
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void
  updatePayment: (id: string, data: Partial<Payment>) => void
  markPaymentPaid: (id: string) => void

  // Athletes
  athletes: Athlete[]
  addAthlete: (athlete: Omit<Athlete, 'id' | 'createdAt'>) => void
  updateAthlete: (id: string, data: Partial<Athlete>) => void
  deleteAthlete: (id: string) => void

  // Trainings
  trainings: Training[]
  loadGymDataFromSupabase: () => Promise<void>
  addTraining: (training: Omit<Training, 'id' | 'createdAt'>) => void
  updateTraining: (id: string, data: Partial<Training>) => void
  deleteTraining: (id: string) => void
  enrollAthlete: (trainingId: string, athleteId: string) => void
  unenrollAthlete: (trainingId: string, athleteId: string) => void
  markAttendance: (
    trainingId: string,
    athleteId: string,
    present: boolean,
    points?: number
  ) => Promise<boolean>

  // Stock
  stockItems: StockItem[]
  stockMovements: StockMovement[]
  addStockItem: (item: Omit<StockItem, 'id' | 'createdAt'>) => void
  updateStockItem: (id: string, data: Partial<StockItem>) => void
  deleteStockItem: (id: string) => void
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void
}

// Demo users for authentication
const initialUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    email: 'gestor@magmanage.com',
    role: 'gestor',
    approvalStatus: 'aprovado',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Ana Santos',
    email: 'treinador@magmanage.com',
    role: 'treinador',
    approvalStatus: 'aprovado',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'atleta@magmanage.com',
    role: 'atleta',
    approvalStatus: 'aprovado',
    createdAt: new Date(),
  },
]

// Passwords stored separately
const defaultUserPasswords: Record<string, string> = {
  'gestor@magmanage.com': 'admin123',
  'treinador@magmanage.com': 'treino123',
  'atleta@magmanage.com': 'atleta123',
}

function loadSavedPasswords() {
  return {}
}

const userPasswords: Record<string, string> = {
  ...defaultUserPasswords,
  ...loadSavedPasswords(),
}

function saveUserPassword(email: string, password: string) {
  const emailNormalizado = String(email || '').trim().toLowerCase()

  if (!emailNormalizado) return

  userPasswords[emailNormalizado] = password

}

const beltThresholds = [
  { points: 4560, belt: 'Preta (2º Dan)' },
  { points: 3120, belt: 'Preta (1º Dan)' },
  { points: 2040, belt: 'Castanha' },
  { points: 1964, belt: 'Azul' },
  { points: 780, belt: 'Verde' },
  { points: 420, belt: 'Laranja' },
  { points: 180, belt: 'Amarela' },
]

function getBeltForPoints(points: number) {
  return beltThresholds.find((threshold) => points >= threshold.points)?.belt || 'Branca'
}

function mapMemberToAthlete(member: any): Athlete {
  return {
    id: String(member.id),
    name: member.nome || '',
    email: member.email || '',
    phone: member.telefone || '',
    birthDate: member.data_nascimento || '',
    belt: member.faixa || member.plano || '',
    modality: member.modalidade || member.modality || '',
    academyId: member.academia_id || member.academyId || 1,
    startDate: member.created_at
      ? String(member.created_at).split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: member.status === 'inativo' ? 'inativo' : 'ativo',
    photo: member.foto_url || '',
    totalPoints: Number(member.total_pontos || member.totalPoints || 0),
    createdAt: member.created_at ? new Date(member.created_at) : new Date(),
  }
}

function mapTrainingFromSupabase(row: any): Training {
  return {
    id: String(row.id),
    title: row.title || row.titulo || '',
    modality: row.modality || row.modalidade || '',
    date: row.date || row.data || '',
    startTime: row.start_time || row.hora_inicio || '',
    endTime: row.end_time || row.hora_fim || '',
    instructor: row.instructor || row.instrutor || '',
    academyId: row.academia_id || row.academyId || 1,
    maxCapacity: Number(row.max_capacity || row.capacidade_maxima || 1),
    enrolledAthletes: Array.isArray(row.enrolled_athletes)
      ? row.enrolled_athletes.map(String)
      : [],
    attendance: row.attendance || row.chamada || {},
    description: row.description || row.descricao || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

function mapTrainingToSupabase(training: Training) {
  return {
    id: training.id,
    title: training.title,
    modality: training.modality,
    date: training.date,
    start_time: training.startTime,
    end_time: training.endTime,
    instructor: training.instructor,
    max_capacity: training.maxCapacity,
    academia_id: (training as any).academyId || 1,
    enrolled_athletes: training.enrolledAthletes || [],
    attendance: training.attendance || {},
    description: training.description || '',
  }
}

function mapUsuarioToUser(row: any): User {
  return {
    id: String(row.id),
    name: row.nome || row.name || '',
    email: String(row.email || '').trim().toLowerCase(),
    phone: row.telefone || row.phone || '',
    role: row.role || 'treinador',
    approvalStatus: row.approval_status || 'aprovado',
    avatar: row.avatar_url || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

function mapMembroToUser(row: any): User {
  return {
    id: String(row.id),
    name: row.nome || '',
    email: String(row.email || '').trim().toLowerCase(),
    phone: row.telefone || '',
    role: 'atleta',
    approvalStatus: row.approval_status || 'aprovado',
    avatar: row.foto_url || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

function mapRegistrationFromSupabase(row: any): Registration {
  return {
    id: String(row.id),
    name: row.name || '',
    email: String(row.email || '').trim().toLowerCase(),
    phone: row.phone || '',
    password: row.password || '',
    role: row.role,
    modality: row.modality || '',
    experience: row.experience || '',
    photoUrl: row.foto_url || '',
    reason: row.reason || '',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

function mapPasswordResetFromSupabase(row: any): PasswordResetRequest {
  return {
    id: String(row.id),
    email: String(row.email || '').trim().toLowerCase(),
    userId: String(row.user_id || ''),
    userName: row.user_name || '',
    role: row.role,
    status: row.status || 'pendente',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
  }
}

function mapNotificationFromSupabase(row: any): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    title: row.title || '',
    message: row.message || '',
    type: row.type || 'info',
    read: Boolean(row.read),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

async function upsertTrainingInSupabase(training: Training) {
  const { error } = await supabase
    .from('treinos')
    .upsert([mapTrainingToSupabase(training)], { onConflict: 'id' })

  if (error) {
    console.log('Erro ao sincronizar treino na Supabase:', error)
    return false
  }

  return true
}

// Initial pending registrations for demo
const initialPendingRegistrations: Registration[] = [
  {
    id: 'reg-1',
    name: 'Marcos Ribeiro',
    email: 'marcos@email.com',
    phone: '(11) 98765-4321',
    password: 'marcos123',
    role: 'atleta',
    modality: 'Jiu-Jitsu',
    experience: '1 ano',
    reason: 'Quero melhorar minha condicao fisica e aprender defesa pessoal.',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'reg-2',
    name: 'Fernanda Lima',
    email: 'fernanda@email.com',
    phone: '(11) 91234-5678',
    password: 'fernanda123',
    role: 'treinador',
    modality: 'Muay Thai',
    experience: '5 anos como treinadora',
    reason: 'Tenho experiencia como treinadora e gostaria de fazer parte da equipe.',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'reg-3',
    name: 'Ricardo Gomes',
    email: 'ricardo@email.com',
    phone: '(11) 99876-5432',
    password: 'ricardo123',
    role: 'atleta',
    modality: 'Boxe',
    experience: 'Iniciante',
    reason: 'Sempre quis praticar boxe e estou motivado a comecar.',
    createdAt: new Date(),
  },
]

// Initial demo data
const initialAthletes: Athlete[] = [
  {
    id: '1',
    name: 'Lucas Ferreira',
    email: 'lucas@email.com',
    phone: '(11) 99999-1111',
    birthDate: '1995-05-15',
    belt: 'Azul',
    modality: 'Jiu-Jitsu',
    startDate: '2023-01-15',
    status: 'ativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Marina Oliveira',
    email: 'marina@email.com',
    phone: '(11) 99999-2222',
    birthDate: '1998-08-22',
    belt: 'Azul',
    modality: 'Jiu-Jitsu',
    startDate: '2022-06-10',
    status: 'ativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Rafael Santos',
    email: 'rafael@email.com',
    phone: '(11) 99999-3333',
    birthDate: '2000-03-10',
    belt: 'Verde',
    modality: 'Muay Thai',
    startDate: '2023-09-01',
    status: 'ativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Juliana Costa',
    email: 'juliana@email.com',
    phone: '(11) 99999-4444',
    birthDate: '1992-11-30',
    belt: 'Castanha',
    modality: 'Jiu-Jitsu',
    startDate: '2020-02-20',
    status: 'ativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Bruno Almeida',
    email: 'bruno@email.com',
    phone: '(11) 99999-5555',
    birthDate: '1997-07-18',
    belt: 'Branca',
    modality: 'Boxe',
    startDate: '2024-01-05',
    status: 'inativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
  {
    id: 'pedro-costa',
    name: 'Pedro Costa',
    email: 'atleta@magmanage.com',
    phone: '(11) 99999-6666',
    birthDate: '1996-04-12',
    belt: 'Azul',
    modality: 'Jiu-Jitsu',
    startDate: '2023-03-01',
    status: 'ativo',
    totalPoints: 0,
    createdAt: new Date(),
  },
]

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]

const initialTrainings: Training[] = [
  {
    id: '1',
    title: 'Jiu-Jitsu Fundamentos',
    modality: 'Jiu-Jitsu',
    date: today,
    startTime: '07:00',
    endTime: '08:30',
    instructor: 'Ana Santos',
    maxCapacity: 20,
    enrolledAthletes: ['1', '2', '4', 'pedro-costa'],
    attendance: {},
    description: 'Treino focado em posicoes basicas e defesa pessoal',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Muay Thai Avancado',
    modality: 'Muay Thai',
    date: today,
    startTime: '18:00',
    endTime: '19:30',
    instructor: 'Carlos Silva',
    maxCapacity: 15,
    enrolledAthletes: ['3'],
    attendance: {},
    description: 'Tecnicas avancadas de chutes e joelhadas',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Boxe Iniciantes',
    modality: 'Boxe',
    date: tomorrow,
    startTime: '10:00',
    endTime: '11:30',
    instructor: 'Ana Santos',
    maxCapacity: 12,
    enrolledAthletes: ['5'],
    attendance: {},
    description: 'Introducao ao boxe com foco em movimentacao',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Jiu-Jitsu Avancado',
    modality: 'Jiu-Jitsu',
    date: tomorrow,
    startTime: '19:00',
    endTime: '20:30',
    instructor: 'Carlos Silva',
    maxCapacity: 15,
    enrolledAthletes: ['2', '4', 'pedro-costa'],
    attendance: {},
    description: 'Tecnicas avancadas de finalizacao e raspagem',
    createdAt: new Date(),
  },
  {
    id: '5',
    title: 'Muay Thai Iniciantes',
    modality: 'Muay Thai',
    date: dayAfter,
    startTime: '08:00',
    endTime: '09:30',
    instructor: 'Ana Santos',
    maxCapacity: 18,
    enrolledAthletes: [],
    attendance: {},
    description: 'Aula para iniciantes com foco em golpes basicos',
    createdAt: new Date(),
  },
]

const initialStockItems: StockItem[] = [
  {
    id: '1',
    name: 'Luvas de Boxe 14oz',
    category: 'equipamento',
    quantity: 8,
    minQuantity: 5,
    unit: 'par',
    price: 189.9,
    supplier: 'FightGear Brasil',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Kimono Jiu-Jitsu A3',
    category: 'uniforme',
    quantity: 3,
    minQuantity: 5,
    unit: 'unidade',
    price: 299.9,
    supplier: 'Tatami Sports',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Protetor Bucal',
    category: 'equipamento',
    quantity: 25,
    minQuantity: 10,
    unit: 'unidade',
    price: 29.9,
    supplier: 'FightGear Brasil',
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Whey Protein 1kg',
    category: 'suplemento',
    quantity: 12,
    minQuantity: 3,
    unit: 'pote',
    price: 149.9,
    supplier: 'NutriSport',
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Desinfetante Tatame 5L',
    category: 'limpeza',
    quantity: 4,
    minQuantity: 2,
    unit: 'galao',
    price: 45.9,
    supplier: 'CleanPro',
    createdAt: new Date(),
  },
  {
    id: '6',
    name: 'Caneleira Muay Thai',
    category: 'equipamento',
    quantity: 15,
    minQuantity: 5,
    unit: 'par',
    price: 89.9,
    supplier: 'FightGear Brasil',
    createdAt: new Date(),
  },
  {
    id: '7',
    name: 'Faixa Jiu-Jitsu Azul',
    category: 'uniforme',
    quantity: 10,
    minQuantity: 3,
    unit: 'unidade',
    price: 45.0,
    supplier: 'Tatami Sports',
    createdAt: new Date(),
  },
  {
    id: '8',
    name: 'BCAA 300g',
    category: 'suplemento',
    quantity: 8,
    minQuantity: 2,
    unit: 'pote',
    price: 79.9,
    supplier: 'NutriSport',
    createdAt: new Date(),
  },
]

// Initial payments
const lastMonth = new Date()
lastMonth.setMonth(lastMonth.getMonth() - 1)

const currentMonth = new Date()

const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    athleteId: 'pedro-costa',
    athleteName: 'Pedro Costa',
    amount: 150.0,
    dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 10)
      .toISOString()
      .split('T')[0],
    status: 'atrasado',
    month: lastMonth.toLocaleString('pt-BR', { month: 'long' }),
    year: lastMonth.getFullYear(),
    createdAt: new Date(),
  },
  {
    id: 'pay-2',
    athleteId: 'pedro-costa',
    athleteName: 'Pedro Costa',
    amount: 150.0,
    dueDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10)
      .toISOString()
      .split('T')[0],
    status: 'pendente',
    month: currentMonth.toLocaleString('pt-BR', { month: 'long' }),
    year: currentMonth.getFullYear(),
    createdAt: new Date(),
  },
  {
    id: 'pay-3',
    athleteId: '1',
    athleteName: 'Lucas Ferreira',
    amount: 150.0,
    dueDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10)
      .toISOString()
      .split('T')[0],
    paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 8)
      .toISOString()
      .split('T')[0],
    status: 'pago',
    month: currentMonth.toLocaleString('pt-BR', { month: 'long' }),
    year: currentMonth.getFullYear(),
    createdAt: new Date(),
  },
  {
    id: 'pay-4',
    athleteId: '2',
    athleteName: 'Marina Oliveira',
    amount: 150.0,
    dueDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10)
      .toISOString()
      .split('T')[0],
    status: 'pendente',
    month: currentMonth.toLocaleString('pt-BR', { month: 'long' }),
    year: currentMonth.getFullYear(),
    createdAt: new Date(),
  },
]

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '3',
    title: 'Mensalidade em Atraso',
    message: `Sua mensalidade de ${lastMonth.toLocaleString('pt-BR', {
      month: 'long',
    })} esta em atraso. Por favor, regularize sua situacao.`,
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'notif-2',
    userId: '3',
    title: 'Lembrete de Pagamento',
    message: `Sua mensalidade de ${currentMonth.toLocaleString('pt-BR', {
      month: 'long',
    })} vence em breve.`,
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 86400000),
  },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      language: 'pt',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
      setLanguage: (language) => set({ language }),

      // Auth
      user: null,
      isAuthenticated: false,
      registeredUsers: [],
      pendingRegistrations: [],
      passwordResetRequests: [],

      login: async (email: string, password: string) => {
        const emailNormalizado = String(email || '').trim().toLowerCase()

        const [{ data: usuarios }, { data: membros }] = await Promise.all([
          supabase.from('usuarios').select('*').ilike('email', emailNormalizado).limit(1),
          supabase.from('membros').select('*').ilike('email', emailNormalizado).limit(1),
        ])

        const usuarioRow = usuarios?.[0]
        const membroRow = membros?.[0]
        const user = usuarioRow
          ? mapUsuarioToUser(usuarioRow)
          : membroRow
            ? mapMembroToUser(membroRow)
            : null

        if (!user) {
          if (emailNormalizado === 'gestor@magmanage.com' && password === 'admin123') {
            const fallbackGestor: User = {
              id: '1000000001',
              name: 'Gestor MagManage',
              email: emailNormalizado,
              phone: '',
              role: 'gestor',
              approvalStatus: 'aprovado',
              createdAt: new Date(),
            }

            set((state) => ({
              user: fallbackGestor,
              isAuthenticated: true,
              registeredUsers: state.registeredUsers.some(
                (registeredUser) => registeredUser.email.toLowerCase() === emailNormalizado
              )
                ? state.registeredUsers.map((registeredUser) =>
                    registeredUser.email.toLowerCase() === emailNormalizado
                      ? fallbackGestor
                      : registeredUser
                  )
                : [...state.registeredUsers, fallbackGestor],
            }))

            supabase
              .from('usuarios')
              .insert([
                {
                  id: 1000000001,
                  nome: fallbackGestor.name,
                  email: fallbackGestor.email,
                  telefone: '',
                  role: 'gestor',
                  senha: 'admin123',
                  status: 'ativo',
                  approval_status: 'aprovado',
                },
              ])
              .then(({ error }) => {
                if (error && error.code !== '23505') {
                  console.log('Não foi possível criar o gestor na Supabase:', error)
                }
              })

            return { success: true, message: 'Login realizado com sucesso' }
          }

          return { success: false, message: 'Usuário não encontrado' }
        }

        const storedPassword =
          usuarioRow?.senha || membroRow?.senha || userPasswords[emailNormalizado]

        if (!storedPassword) {
          return {
            success: false,
            message:
              'Senha deste usuário não foi criada. Peça ao gestor para redefinir a senha.',
          }
        }

        if (storedPassword !== password) {
          return { success: false, message: 'Senha incorreta' }
        }

        if (user.approvalStatus === 'pendente') {
          return {
            success: false,
            message: 'Sua inscrição ainda está pendente de aprovação',
          }
        }

        if (user.approvalStatus === 'rejeitado') {
          return {
            success: false,
            message:
              'Sua inscrição foi rejeitada. Entre em contato com a administração.',
          }
        }

        set((state) => ({
          user,
          isAuthenticated: true,
          registeredUsers: state.registeredUsers.some(
            (registeredUser) => registeredUser.email.toLowerCase() === emailNormalizado
          )
            ? state.registeredUsers.map((registeredUser) =>
                registeredUser.email.toLowerCase() === emailNormalizado ? user : registeredUser
              )
            : [...state.registeredUsers, user],
        }))

        return { success: true, message: 'Login realizado com sucesso' }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      register: async (registration) => {
        const emailNormalizado = String(registration.email || '').trim().toLowerCase()

        const [{ data: usuarios }, { data: membros }, { data: pending }] = await Promise.all([
          supabase.from('usuarios').select('id').ilike('email', emailNormalizado).limit(1),
          supabase.from('membros').select('id').ilike('email', emailNormalizado).limit(1),
          supabase
            .from('pending_registrations')
            .select('id')
            .ilike('email', emailNormalizado)
            .limit(1),
        ])

        if ((usuarios?.length || 0) > 0 || (membros?.length || 0) > 0 || (pending?.length || 0) > 0) {
          return { success: false, message: 'Este email já está cadastrado' }
        }

        const newRegistration: Registration = {
          ...registration,
          email: emailNormalizado,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        }

        const { error } = await supabase.from('pending_registrations').insert([
          {
            id: newRegistration.id,
            name: newRegistration.name,
            email: newRegistration.email,
            phone: newRegistration.phone,
            password: newRegistration.password,
            role: newRegistration.role,
            modality: newRegistration.modality || '',
            experience: newRegistration.experience || '',
            foto_url: newRegistration.photoUrl || '',
            reason: newRegistration.reason,
          },
        ])

        if (error) {
          return { success: false, message: 'Erro ao enviar inscrição: ' + error.message }
        }

        set((state) => ({
          pendingRegistrations: [newRegistration, ...state.pendingRegistrations],
        }))

        return {
          success: true,
          message: 'Inscrição enviada com sucesso! Aguarde a aprovação.',
        }
      },

      approveRegistration: async (registrationId) => {
        const state = get()
        let registration = state.pendingRegistrations.find(
          (r) => r.id === registrationId
        )

        if (!registration) {
          const { data } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('id', registrationId)
            .maybeSingle()

          registration = data ? mapRegistrationFromSupabase(data) : undefined
        }

        if (!registration) return

        const emailNormalizado = String(registration.email || '').trim().toLowerCase()

        const newUser: User = {
          id: crypto.randomUUID(),
          name: registration.name,
          email: emailNormalizado,
          phone: registration.phone,
          role: registration.role,
          approvalStatus: 'aprovado',
          avatar: registration.photoUrl || '',
          createdAt: new Date(),
        }

        set((state) => ({
          registeredUsers: [...state.registeredUsers, newUser],
          pendingRegistrations: state.pendingRegistrations.filter(
            (r) => r.id !== registrationId
          ),
        }))

        if (registration.role === 'atleta') {
          const newAthlete: Athlete = {
            id: crypto.randomUUID(),
            name: registration.name,
            email: emailNormalizado,
            phone: registration.phone,
            birthDate: '',
            belt: 'Branca',
            modality: registration.modality || 'Mensal',
            startDate: new Date().toISOString().split('T')[0],
            status: 'ativo',
            photo: registration.photoUrl || '',
            totalPoints: 0,
            createdAt: new Date(),
          }

          set((state) => ({
            athletes: [...state.athletes, newAthlete],
          }))

          supabase
            .from('membros')
            .insert([
              {
                id: Date.now(),
                nome: registration.name,
                telefone: registration.phone || '',
                email: emailNormalizado,
                senha: registration.password,
                approval_status: 'aprovado',
                academia_id: 1,
                foto_url: registration.photoUrl || '',
                plano: 'Branca',
                modalidade: registration.modality || 'Mensal',
                status: 'ativo',
              },
            ])
            .then(({ error }) => {
              if (error) {
                console.log('Erro ao adicionar atleta no Supabase:', error)
                alert('Atleta aprovado, mas não foi salvo no Supabase: ' + error.message)
              } else {
                console.log('Atleta salvo no Supabase com sucesso')
              }
            })
        }

        if (registration.role === 'treinador') {
          supabase
            .from('usuarios')
            .insert([
              {
                id: Date.now(),
                nome: registration.name,
                telefone: registration.phone || '',
                email: emailNormalizado,
                senha: registration.password,
                approval_status: 'aprovado',
                academia_id: 1,
                avatar_url: registration.photoUrl || '',
                role: 'treinador',
                especialidade: registration.modality || '',
                status: 'ativo',
              },
            ])
            .then(({ error }) => {
              if (error) {
                console.log('Erro ao adicionar treinador no Supabase:', error)
                alert(
                  'Treinador aprovado, mas não foi salvo no Supabase: ' +
                    error.message
                )
              } else {
                console.log('Treinador salvo no Supabase com sucesso')
              }
            })
        }

        await supabase.from('pending_registrations').delete().eq('id', registrationId)
      },

      rejectRegistration: async (registrationId) => {
        await supabase.from('pending_registrations').delete().eq('id', registrationId)

        set((state) => ({
          pendingRegistrations: state.pendingRegistrations.filter(
            (r) => r.id !== registrationId
          ),
        }))
      },

      updateUserRole: (userId, newRole) => {
        set((state) => ({
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u
          ),
        }))
      },

      createApprovedUser: (data) => {
        const emailNormalizado = String(data.email || '').trim().toLowerCase()

        if (!emailNormalizado) return

        const state = get()

        const existingUser = state.registeredUsers.find(
          (u) => u.email.toLowerCase() === emailNormalizado
        )

        saveUserPassword(emailNormalizado, data.password)

        if (data.role === 'atleta') {
          supabase
            .from('membros')
            .update({
              nome: data.name,
              telefone: data.phone || '',
              senha: data.password,
              approval_status: 'aprovado',
              academia_id: 1,
            })
            .ilike('email', emailNormalizado)
            .then(({ error }) => {
              if (error) console.log('Erro ao sincronizar login do atleta:', error)
            })
        } else {
          supabase
            .from('usuarios')
            .select('id')
            .ilike('email', emailNormalizado)
            .limit(1)
            .then(async ({ data: existingRows, error }) => {
              if (error) {
                console.log('Erro ao procurar usuário:', error)
                return
              }

              const payload = {
                nome: data.name,
                telefone: data.phone || '',
                email: emailNormalizado,
                senha: data.password,
                role: data.role,
                status: 'ativo',
                approval_status: 'aprovado',
                academia_id: 1,
              }

              const result = existingRows?.[0]
                ? await supabase.from('usuarios').update(payload).eq('id', existingRows[0].id)
                : await supabase
                    .from('usuarios')
                    .insert([{ id: Date.now(), ...payload }])

              if (result.error) {
                console.log('Erro ao sincronizar login do usuário:', result.error)
              }
            })
        }

        if (existingUser) {
          set((state) => ({
            registeredUsers: state.registeredUsers.map((u) =>
              u.email.toLowerCase() === emailNormalizado
                ? {
                    ...u,
                    name: data.name,
                    phone: data.phone || u.phone,
                    role: data.role,
                    approvalStatus: 'aprovado',
                  }
                : u
            ),
          }))

          return
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          name: data.name,
          email: emailNormalizado,
          phone: data.phone || '',
          role: data.role,
          approvalStatus: 'aprovado',
          createdAt: new Date(),
        }

        set((state) => ({
          registeredUsers: [...state.registeredUsers, newUser],
        }))
      },

      changeUserPassword: async (email, currentPassword, newPassword) => {
        const emailNormalizado = String(email || '').trim().toLowerCase()
        const [{ data: usuarios }, { data: membros }] = await Promise.all([
          supabase.from('usuarios').select('*').ilike('email', emailNormalizado).limit(1),
          supabase.from('membros').select('*').ilike('email', emailNormalizado).limit(1),
        ])

        const usuarioRow = usuarios?.[0]
        const membroRow = membros?.[0]
        const storedPassword =
          usuarioRow?.senha || membroRow?.senha || userPasswords[emailNormalizado]

        if (!storedPassword) {
          return {
            success: false,
            message:
              'Não foi possível confirmar a senha atual deste usuário. Peça ao gestor para redefinir a senha.',
          }
        }

        if (storedPassword !== currentPassword) {
          return { success: false, message: 'Senha atual incorreta.' }
        }

        if (usuarioRow) {
          const { error } = await supabase
            .from('usuarios')
            .update({ senha: newPassword })
            .eq('id', usuarioRow.id)

          if (error) return { success: false, message: 'Erro ao alterar senha: ' + error.message }
        } else if (membroRow) {
          const { error } = await supabase
            .from('membros')
            .update({ senha: newPassword })
            .eq('id', membroRow.id)

          if (error) return { success: false, message: 'Erro ao alterar senha: ' + error.message }
        } else {
          saveUserPassword(emailNormalizado, newPassword)
        }

        return { success: true, message: 'Senha alterada com sucesso.' }
      },

      requestPasswordReset: async (email) => {
        const emailNormalizado = String(email || '').trim().toLowerCase()
        const genericMessage =
          'Se o email estiver cadastrado, o pedido será enviado ao gestor.'

        if (!emailNormalizado) {
          return { success: true, message: genericMessage }
        }

        const [{ data: usuarios }, { data: membros }] = await Promise.all([
          supabase.from('usuarios').select('*').ilike('email', emailNormalizado).limit(1),
          supabase.from('membros').select('*').ilike('email', emailNormalizado).limit(1),
        ])

        const usuarioRow = usuarios?.[0]
        const membroRow = membros?.[0]
        const targetUser = usuarioRow
          ? mapUsuarioToUser(usuarioRow)
          : membroRow
            ? mapMembroToUser(membroRow)
            : null

        if (!targetUser || targetUser.role === 'gestor') {
          return { success: true, message: genericMessage }
        }

        const { data: existingRequests } = await supabase
          .from('password_reset_requests')
          .select('id')
          .ilike('email', emailNormalizado)
          .eq('status', 'pendente')
          .limit(1)

        if (!existingRequests?.length) {
          const request: PasswordResetRequest = {
            id: crypto.randomUUID(),
            email: emailNormalizado,
            userId: targetUser.id,
            userName: targetUser.name,
            role: targetUser.role as 'treinador' | 'atleta',
            status: 'pendente',
            createdAt: new Date(),
          }

          await supabase.from('password_reset_requests').insert([
            {
              id: request.id,
              email: request.email,
              user_id: request.userId,
              user_name: request.userName,
              role: request.role,
              status: request.status,
            },
          ])

          set((currentState) => ({
            passwordResetRequests: [request, ...currentState.passwordResetRequests],
          }))
        }

        return { success: true, message: genericMessage }
      },

      resolvePasswordReset: async (requestId, newPassword) => {
        const request = get().passwordResetRequests.find((item) => item.id === requestId)

        if (!request || !newPassword) return

        const [{ data: usuarios }, { data: membros }] = await Promise.all([
          supabase.from('usuarios').select('id').ilike('email', request.email).limit(1),
          supabase.from('membros').select('id').ilike('email', request.email).limit(1),
        ])

        if (usuarios?.[0]) {
          await supabase.from('usuarios').update({ senha: newPassword }).eq('id', usuarios[0].id)
        } else if (membros?.[0]) {
          await supabase.from('membros').update({ senha: newPassword }).eq('id', membros[0].id)
        } else {
          saveUserPassword(request.email, newPassword)
        }

        await supabase
          .from('password_reset_requests')
          .update({ status: 'resolvido', resolved_at: new Date().toISOString() })
          .eq('id', requestId)

        set((state) => ({
          passwordResetRequests: state.passwordResetRequests.map((item) =>
            item.id === requestId
              ? { ...item, status: 'resolvido', resolvedAt: new Date() }
              : item
          ),
        }))

        get().addNotification({
          userId: request.userId,
          title: 'Senha redefinida',
          message:
            'O gestor redefiniu a tua senha. Entra com a senha temporária e altera-a no Perfil.',
          type: 'success',
          read: false,
        })
      },

      rejectPasswordReset: async (requestId) => {
        const request = get().passwordResetRequests.find((item) => item.id === requestId)

        if (!request) return

        await supabase
          .from('password_reset_requests')
          .update({ status: 'rejeitado', resolved_at: new Date().toISOString() })
          .eq('id', requestId)

        set((state) => ({
          passwordResetRequests: state.passwordResetRequests.map((item) =>
            item.id === requestId
              ? { ...item, status: 'rejeitado', resolvedAt: new Date() }
              : item
          ),
        }))

        get().addNotification({
          userId: request.userId,
          title: 'Pedido de senha rejeitado',
          message: 'O teu pedido de redefinição de senha foi rejeitado pelo gestor.',
          type: 'warning',
          read: false,
        })
      },

      // Notifications
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }))

        supabase
          .from('notifications')
          .insert([
            {
              id: newNotification.id,
              user_id: newNotification.userId,
              title: newNotification.title,
              message: newNotification.message,
              type: newNotification.type,
              read: newNotification.read,
            },
          ])
          .then(({ error }) => {
            if (error) console.log('Erro ao salvar notificação na Supabase:', error)
          })
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))

        supabase.from('notifications').update({ read: true }).eq('id', id)
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))

        const state = get()
        supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', state.user?.id || '')
      },

      clearNotifications: () => {
        const state = get()
        set({
          notifications: state.notifications.filter((n) => n.userId !== state.user?.id),
        })

        supabase.from('notifications').delete().eq('user_id', state.user?.id || '')
      },

      // Payments
      payments: [],

      addPayment: (payment) => {
        const newPayment: Payment = {
          ...payment,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        }
        set((state) => ({
          payments: [...state.payments, newPayment],
        }))
      },

      updatePayment: (id, data) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }))
      },

      markPaymentPaid: (id) => {
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'pago',
                  paidDate: new Date().toISOString().split('T')[0],
                }
              : p
          ),
        }))
      },

      // Athletes
      athletes: [],

      addAthlete: (athlete) => {
        const newAthlete: Athlete = {
          ...athlete,
          id: crypto.randomUUID(),
          totalPoints: Number((athlete as any).totalPoints || 0),
          createdAt: new Date(),
        }
        set((state) => ({ athletes: [...state.athletes, newAthlete] }))
      },

      updateAthlete: (id, data) => {
        set((state) => ({
          athletes: state.athletes.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        }))
      },

      deleteAthlete: (id) => {
        set((state) => ({
          athletes: state.athletes.filter((a) => a.id !== id),
        }))
      },

      // Trainings
      trainings: [],

      loadGymDataFromSupabase: async () => {
        const [
          usersResult,
          membersAsUsersResult,
          pendingResult,
          resetResult,
          notificationsResult,
          stockResult,
          stockMovementsResult,
        ] = await Promise.all([
          supabase.from('usuarios').select('*').order('id', { ascending: true }),
          supabase.from('membros').select('*').order('id', { ascending: true }),
          supabase
            .from('pending_registrations')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('password_reset_requests')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase.from('produtos').select('*').order('id', { ascending: true }),
          supabase
            .from('movimentos_estoque')
            .select('*')
            .order('created_at', { ascending: false }),
        ])

        if (!usersResult.error || !membersAsUsersResult.error) {
          set({
            registeredUsers: [
              ...(usersResult.data || []).map(mapUsuarioToUser),
              ...(membersAsUsersResult.data || []).map(mapMembroToUser),
            ],
          })
        }

        if (!pendingResult.error) {
          set({ pendingRegistrations: (pendingResult.data || []).map(mapRegistrationFromSupabase) })
        }

        if (!resetResult.error) {
          set({
            passwordResetRequests: (resetResult.data || []).map(mapPasswordResetFromSupabase),
          })
        }

        if (!notificationsResult.error) {
          set({ notifications: (notificationsResult.data || []).map(mapNotificationFromSupabase) })
        }

        if (!stockResult.error) {
          set({
            stockItems: (stockResult.data || []).map((item: any) => ({
              id: String(item.id),
              name: item.nome || '',
              category: item.categoria || 'outro',
              quantity: Number(item.quantidade || 0),
              minQuantity: Number(item.quantidade_minima || 0),
              unit: item.unidade || 'unidade',
              price: Number(item.preco || 0),
              imageUrl: item.imagem_url || '',
              supplier: item.fornecedor || '',
              createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            })),
          })
        }

        if (!stockMovementsResult.error) {
          set({
            stockMovements: (stockMovementsResult.data || []).map((movement: any) => ({
              id: String(movement.id),
              itemId: String(movement.produto_id || movement.item_id || ''),
              type: movement.tipo || movement.type || 'entrada',
              quantity: Number(movement.quantidade || 0),
              reason: movement.motivo || movement.reason || '',
              date: movement.created_at || movement.data || new Date().toISOString(),
              userId: String(movement.user_id || ''),
            })),
          })
        }

        const { data: members, error: membersError } = await supabase
          .from('membros')
          .select('*')
          .order('id', { ascending: true })

        if (membersError) {
          console.log('Erro ao carregar atletas da Supabase:', membersError)
        } else {
          set({ athletes: (members || []).map(mapMemberToAthlete) })
        }

        const { data: trainings, error: trainingsError } = await supabase
          .from('treinos')
          .select('*')
          .order('date', { ascending: true })

        if (trainingsError) {
          console.log('Erro ao carregar treinos da Supabase:', trainingsError)
          return
        }

        set({ trainings: (trainings || []).map(mapTrainingFromSupabase) })
      },

      addTraining: (training) => {
        const newTraining: Training = {
          ...training,
          id: crypto.randomUUID(),
          attendance: training.attendance || {},
          createdAt: new Date(),
        }

        set((state) => ({ trainings: [...state.trainings, newTraining] }))
        upsertTrainingInSupabase(newTraining)
      },

      updateTraining: (id, data) => {
        let updatedTraining: Training | undefined

        set((state) => ({
          trainings: state.trainings.map((t) => {
            if (t.id !== id) return t

            updatedTraining = { ...t, ...data }
            return updatedTraining
          }),
        }))

        if (updatedTraining) {
          upsertTrainingInSupabase(updatedTraining)
        }
      },

      deleteTraining: (id) => {
        set((state) => ({
          trainings: state.trainings.filter((t) => t.id !== id),
        }))

        supabase
          .from('treinos')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) {
              console.log('Erro ao apagar treino na Supabase:', error)
            }
          })
      },

      enrollAthlete: (trainingId, athleteId) => {
        let updatedTraining: Training | undefined

        set((state) => ({
          trainings: state.trainings.map((t) => {
            if (t.id !== trainingId || t.enrolledAthletes.includes(athleteId)) {
              return t
            }

            updatedTraining = {
              ...t,
              enrolledAthletes: [...t.enrolledAthletes, athleteId],
            }
            return updatedTraining
          }),
        }))

        if (updatedTraining) {
          upsertTrainingInSupabase(updatedTraining)
        }
      },

      unenrollAthlete: (trainingId, athleteId) => {
        let updatedTraining: Training | undefined

        set((state) => ({
          trainings: state.trainings.map((t) => {
            if (t.id !== trainingId) return t

            updatedTraining = {
              ...t,
              enrolledAthletes: t.enrolledAthletes.filter(
                (id) => id !== athleteId
              ),
              attendance: Object.fromEntries(
                Object.entries(t.attendance || {}).filter(
                  ([id]) => id !== athleteId
                )
              ) as any,
            }

            return updatedTraining
          }),
        }))

        if (updatedTraining) {
          upsertTrainingInSupabase(updatedTraining)
        }
      },

      markAttendance: async (trainingId, athleteId, present, points = 0) => {
        const pontosNovos = Math.max(0, Number(points || 0))
        let updatedTraining: Training | undefined
        let updatedAthlete: Athlete | undefined
        let previousBelt = 'Branca'

        set((state) => {
          const training = state.trainings.find((t) => t.id === trainingId)

          if (!training) return state

          const previousAttendance: any = training.attendance?.[athleteId]

          let pontosAntigos = 0

          if (
            previousAttendance &&
            typeof previousAttendance === 'object' &&
            'points' in previousAttendance
          ) {
            pontosAntigos = Number(previousAttendance.points || 0)
          }

          const diferencaPontos = pontosNovos - pontosAntigos
          const markedAt = new Date().toISOString()

          updatedTraining = {
            ...training,
            attendance: {
              ...training.attendance,
              [athleteId]: {
                present,
                points: pontosNovos,
                markedAt,
              },
            },
          }

          return {
            trainings: state.trainings.map((t) =>
              t.id === trainingId && updatedTraining ? updatedTraining : t
            ),

            athletes: state.athletes.map((athlete: any) => {
              if (athlete.id !== athleteId) return athlete

              const nextTotalPoints = Math.max(
                0,
                Number(athlete.totalPoints || 0) + diferencaPontos
              )
              const nextBelt = getBeltForPoints(nextTotalPoints)
              previousBelt =
                athlete.belt ||
                getBeltForPoints(Number(athlete.totalPoints || 0))

              updatedAthlete = {
                ...athlete,
                belt: nextBelt,
                totalPoints: nextTotalPoints,
              }

              return updatedAthlete
            }),
          }
        })

        if (!updatedTraining) {
          return false
        }

        const trainingSaved = await upsertTrainingInSupabase(updatedTraining)

        if (!trainingSaved) {
          return false
        }

        if (updatedAthlete) {
          const currentBelt = updatedAthlete.belt || getBeltForPoints(Number(updatedAthlete.totalPoints || 0))

          const { error } = await supabase
            .from('membros')
            .update({
              total_pontos: Number(updatedAthlete.totalPoints || 0),
              plano: currentBelt,
            })
            .eq('id', athleteId)

          if (error) {
            console.log('Erro ao atualizar pontuação do atleta na Supabase:', error)
            return false
          }

          if (currentBelt !== previousBelt && currentBelt !== 'Branca') {
            const athleteUser = get().registeredUsers.find(
              (registeredUser) =>
                registeredUser.role === 'atleta' &&
                registeredUser.email.toLowerCase() === updatedAthlete?.email.toLowerCase()
            )

            if (athleteUser) {
              const notificationExists = get().notifications.some(
                (notification) =>
                  notification.userId === athleteUser.id &&
                  notification.title === `Exame para ${currentBelt}`
              )

              if (!notificationExists) {
                get().addNotification({
                  userId: athleteUser.id,
                  title: `Exame para ${currentBelt}`,
                  message: `Parabéns! Atingiste ${Number(updatedAthlete.totalPoints || 0)} pontos e já podes fazer exame para ${currentBelt}.`,
                  type: 'success',
                  read: false,
                })
              }
            }
          }
        }

        return true
      },

      // Stock
      stockItems: [],
      stockMovements: [],

      addStockItem: (item) => {
        const newItem: StockItem = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        }
        set((state) => ({ stockItems: [...state.stockItems, newItem] }))
      },

      updateStockItem: (id, data) => {
        set((state) => ({
          stockItems: state.stockItems.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        }))
      },

      deleteStockItem: (id) => {
        set((state) => ({
          stockItems: state.stockItems.filter((i) => i.id !== id),
        }))
      },

      addStockMovement: (movement) => {
        const newMovement: StockMovement = {
          ...movement,
          id: crypto.randomUUID(),
        }

        set((state) => {
          const item = state.stockItems.find((i) => i.id === movement.itemId)
          if (!item) return state

          const newQuantity =
            movement.type === 'entrada'
              ? item.quantity + movement.quantity
              : item.quantity - movement.quantity

          return {
            stockMovements: [...state.stockMovements, newMovement],
            stockItems: state.stockItems.map((i) =>
              i.id === movement.itemId
                ? {
                    ...i,
                    quantity: Math.max(0, newQuantity),
                    lastRestocked:
                      movement.type === 'entrada' ? movement.date : i.lastRestocked,
                  }
                : i
            ),
          }
        })
      },
    }),
    {
      name: 'magmanage-storage',
      version: 2,
      migrate: (persistedState: any) => ({
        theme: persistedState?.theme || 'dark',
        language: persistedState?.language || 'pt',
        user: persistedState?.user || null,
        isAuthenticated: Boolean(persistedState?.isAuthenticated),
      }),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

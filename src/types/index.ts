export type UserRole = 'gestor' | 'treinador' | 'atleta'
export type ApprovalStatus = 'pendente' | 'aprovado' | 'rejeitado'
export type PaymentStatus = 'pago' | 'pendente' | 'atrasado'
export type Language = 'pt' | 'en' | 'fr' | 'es'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  approvalStatus: ApprovalStatus
  avatar?: string
  createdAt: Date
}

export interface Registration {
  id: string
  name: string
  email: string
  phone: string
  password: string
  role: 'treinador' | 'atleta'
  modality?: string
  experience?: string
  reason: string
  createdAt: Date
}

export interface Payment {
  id: string
  athleteId: string
  athleteName: string
  amount: number
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  month: string
  year: number
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'warning' | 'info' | 'success' | 'error'
  read: boolean
  createdAt: Date
}

export interface PasswordResetRequest {
  id: string
  email: string
  userId: string
  userName: string
  role: 'treinador' | 'atleta'
  status: 'pendente' | 'resolvido' | 'rejeitado'
  createdAt: Date
  resolvedAt?: Date
}

export interface Athlete {
  id: string
  name: string
  email: string
  phone: string
  birthDate: string
  belt: string
  modality: string
  academyId?: string | number
  startDate: string
  status: 'ativo' | 'inativo'
  photo?: string
  notes?: string

  /**
   * Pontuação total acumulada do atleta.
   * Sempre que o treinador marcar pontos numa chamada,
   * esses pontos serão somados aqui.
   */
  totalPoints?: number

  createdAt: Date
}

export interface AttendanceRecord {
  present: boolean
  points: number
  markedAt?: string
}

export interface Training {
  id: string
  title: string
  modality: string
  date: string
  startTime: string
  endTime: string
  instructor: string
  academyId?: string | number
  maxCapacity: number
  enrolledAthletes: string[]

  /**
   * Chamada do treino.
   * Exemplo:
   * attendance: {
   *   "id-do-atleta": {
   *     present: true,
   *     points: 10,
   *     markedAt: "2026-06-08T18:30:00.000Z"
   *   }
   * }
   */
  attendance: Record<string, AttendanceRecord>

  description?: string
  createdAt: Date
}

export interface StockItem {
  id: string
  name: string
  category: 'equipamento' | 'uniforme' | 'suplemento' | 'limpeza' | 'outro'
  quantity: number
  minQuantity: number
  unit: string
  price: number
  imageUrl?: string
  supplier?: string
  lastRestocked?: string
  createdAt: Date
}

export interface StockMovement {
  id: string
  itemId: string
  type: 'entrada' | 'saida'
  quantity: number
  reason: string
  date: string
  userId: string
}

export interface DashboardStats {
  totalAthletes: number
  activeAthletes: number
  todayTrainings: number
  weekTrainings: number
  lowStockItems: number
  monthlyAttendance: number
}

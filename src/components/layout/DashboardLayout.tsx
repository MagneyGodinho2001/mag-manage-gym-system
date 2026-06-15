import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'
import { languageLabels, translate } from '../../i18n'
import type { Language } from '../../types'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  ChevronLeft,
  Dumbbell,
  UserPlus,
  ShoppingBag,
  Clock,
  Bell,
  Sun,
  Moon,
  CreditCard,
  Building2,
} from 'lucide-react'

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    translationKey: 'dashboard',
    roles: ['gestor', 'treinador', 'atleta'],
  },
  {
    path: '/atletas',
    label: 'Atletas',
    icon: Users,
    translationKey: 'athletes',
    roles: ['gestor', 'treinador'],
  },
  {
    path: '/treinadores',
    label: 'Treinadores',
    icon: Users,
    translationKey: 'trainers',
    roles: ['gestor'],
  },
  {
    path: '/academias',
    label: 'Academias',
    icon: Building2,
    translationKey: 'academies',
    roles: ['gestor'],
  },
  {
    path: '/treinos',
    label: 'Treinos',
    icon: Calendar,
    translationKey: 'trainings',
    roles: ['gestor', 'treinador'],
  },
  {
    path: '/horarios',
    label: 'Horários',
    icon: Clock,
    translationKey: 'schedules',
    roles: ['atleta'],
  },
  {
    path: '/produtos',
    label: 'Produtos',
    icon: ShoppingBag,
    translationKey: 'products',
    roles: ['atleta'],
  },
  {
    path: '/estoque',
    label: 'Estoque',
    icon: Package,
    translationKey: 'stock',
    roles: ['gestor'],
  },
  {
    path: '/pagamentos',
    label: 'Pagamentos',
    icon: CreditCard,
    translationKey: 'payments',
    roles: ['gestor', 'atleta'],
  },
  {
    path: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    translationKey: 'reports',
    roles: ['gestor'],
  },
  {
    path: '/aprovacoes',
    label: 'Aprovações',
    icon: UserPlus,
    translationKey: 'approvals',
    roles: ['gestor'],
  },
]

export default function DashboardLayout() {
  const {
    user,
    logout,
    pendingRegistrations,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    theme,
    toggleTheme,
    language,
    setLanguage,
  } = useStore()

  const t = (key: string) => translate(language, key)

  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const pendingCount = pendingRegistrations.length

  const userNotifications = notifications.filter((n) => n.userId === user?.id)
  const unreadCount = userNotifications.filter((n) => !n.read).length

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  )

  const roleLabels = {
    gestor: 'Gestor',
    treinador: 'Treinador',
    atleta: 'Atleta',
  }

  const userAvatar = user?.avatar || ''

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-sidebar-background transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div
            className={cn(
              'flex items-center gap-3',
              !sidebarOpen && 'justify-center w-full'
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary neon-glow">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>

            {sidebarOpen && (
              <span className="text-xl font-bold text-primary neon-text">
                MagManage
              </span>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform',
                !sidebarOpen && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative',
                  isActive
                    ? 'bg-primary text-primary-foreground neon-glow'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                  !sidebarOpen && 'justify-center'
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />

              {sidebarOpen && (
                <span className="font-medium flex-1">{t(item.translationKey)}</span>
              )}

              {item.path === '/aprovacoes' && pendingCount > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white',
                    !sidebarOpen && 'absolute -top-1 -right-1'
                  )}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                !sidebarOpen && 'justify-center'
              )
            }
          >
            <ProfileAvatar src={userAvatar} name={user?.name} size="sm" />

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user && roleLabels[user.role]}
                </p>
              </div>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-destructive transition-colors',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-sidebar-background">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary neon-glow">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>

              <span className="text-xl font-bold text-primary neon-text">
                MagManage
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground neon-glow'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium flex-1">{t(item.translationKey)}</span>

                {item.path === '/aprovacoes' && pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <NavLink
              to="/perfil"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                )
              }
            >
              <ProfileAvatar src={userAvatar} name={user?.name} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user && roleLabels[user.role]}
                </p>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">{t('logout')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="lg:hidden flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary neon-glow">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>

              <span className="text-lg font-bold text-primary">MagManage</span>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </button>

            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="hidden sm:block px-2 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              title={t('language')}
            >
              {(Object.keys(languageLabels) as Language[]).map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {languageLabels[languageCode]}
                </option>
              ))}
            </select>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-accent transition-colors relative"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {t('notifications')}
                      </h3>

                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsRead()}
                          className="text-xs text-primary hover:underline"
                        >
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {t('noNotifications')}
                          </p>
                        </div>
                      ) : (
                        userNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={cn(
                              'p-4 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors',
                              !notif.read && 'bg-primary/5'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                  notif.type === 'warning' && 'bg-amber-500',
                                  notif.type === 'info' && 'bg-blue-500',
                                  notif.type === 'success' && 'bg-green-500',
                                  notif.type === 'error' && 'bg-red-500'
                                )}
                              />

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">
                                  {notif.title}
                                </p>

                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notif.message}
                                </p>

                                <p className="text-xs text-muted-foreground/70 mt-2">
                                  {new Date(notif.createdAt).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ProfileAvatar({
  src,
  name,
  size = 'sm',
}: {
  src?: string
  name?: string
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'md' ? 'h-10 w-10' : 'h-8 w-8'
  const iconClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        sizeClass
      )}
      style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Foto do perfil'}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={cn(iconClass, 'text-primary')} />
      )}
    </div>
  )
}

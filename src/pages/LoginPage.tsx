import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'
import { Dumbbell, Eye, EyeOff, AlertCircle, Loader2, X } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, requestPasswordReset } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const result = await login(email, password)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await requestPasswordReset(resetEmail)
    setResetMessage(result.message)
    setResetEmail('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary neon-glow mb-4">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary neon-text">MagManage</h1>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('login')}</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'transition-all'
                )}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    'transition-all'
                  )}
                  placeholder={t('yourPassword')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetEmail(email)
                  setResetMessage('')
                  setShowResetModal(true)
                }}
                className="mt-2 text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold',
                'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                'neon-glow'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('loggingIn')}
                </span>
              ) : (
                t('login')
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">{t('noAccount')}</p>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              {t('requestRegistration')}
            </Link>
          </div>
        </div>

      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowResetModal(false)}
          />

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">{t('recoverPassword')}</h2>

              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('recoverPasswordHelp')}
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  className="w-full px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>

              {resetMessage && (
                <div className="p-3 rounded-lg bg-primary/10 text-sm text-primary">
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  {t('close')}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {t('sendRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

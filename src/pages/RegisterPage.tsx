import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'
import { Dumbbell, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'
import { uploadImageFile } from '../lib/uploadImage'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'atleta' as 'atleta' | 'treinador',
    modality: '',
    experience: '',
    reason: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (!formData.reason.trim()) {
      setError('Por favor, informe o motivo da inscrição')
      setLoading(false)
      return
    }

    let photoUrl = ''

    try {
      if (profileFile) {
        photoUrl = await uploadImageFile(profileFile, 'inscricoes')
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar foto de perfil.')
      setLoading(false)
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      modality: formData.modality,
      experience: formData.experience,
      photoUrl,
      reason: formData.reason,
    })

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative text-center">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t('registrationSent')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('registrationSentMessage')}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all neon-glow"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToLogin')}
        </Link>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary neon-glow mb-3">
            <Dumbbell className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary neon-text">MagManage</h1>
        </div>

        {/* Registration Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-foreground mb-1">{t('createAccount')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('fillRegistration')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('accountType')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'atleta' }))}
                  className={cn(
                    'py-3 px-4 rounded-lg border text-sm font-medium transition-all',
                    formData.role === 'atleta'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {t('athlete')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'treinador' }))}
                  className={cn(
                    'py-3 px-4 rounded-lg border text-sm font-medium transition-all',
                    formData.role === 'treinador'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {t('trainer')}
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                {t('fullName')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder={t('namePlaceholder')}
                required
              />
            </div>

            {/* Profile photo */}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setProfileFile(file)
                      setPreviewUrl(file ? URL.createObjectURL(file) : '')
                    }}
                    className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Esta foto será usada no teu perfil se o pedido for aprovado.
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                {t('phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            {/* Modality */}
            <div>
              <label htmlFor="modality" className="block text-sm font-medium text-foreground mb-1.5">
                {t('interestModality')}
              </label>
              <select
                id="modality"
                name="modality"
                value={formData.modality}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                <option value="">{t('selectOption')}</option>
                <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                <option value="Muay Thai">Muay Thai</option>
                <option value="Boxe">Boxe</option>
                <option value="MMA">MMA</option>
                <option value="Wrestling">Wrestling</option>
                <option value="Judo">Judô</option>
                <option value="Funcional">Funcional</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-foreground mb-1.5">
                {t('experience')}
              </label>
              <input
                id="experience"
                name="experience"
                type="text"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder={formData.role === 'treinador' ? t('trainerExperiencePlaceholder') : t('athleteExperiencePlaceholder')}
              />
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-foreground mb-1.5">
                {t('registrationReason')}
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder={formData.role === 'treinador' 
                  ? t('trainerReasonPlaceholder')
                  : t('athleteReasonPlaceholder')}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-12 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder={t('minimumPassword')}
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
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                {t('confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder={t('repeatPassword')}
                required
              />
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
                  {t('sending')}
                </span>
              ) : (
                t('sendRegistration')
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('registrationReview')}
        </p>
      </div>
    </div>
  )
}

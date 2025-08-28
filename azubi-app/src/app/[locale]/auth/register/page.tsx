'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Weiterleitung wenn bereits angemeldet
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Fehler löschen bei Eingabeänderungen
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [formData])

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Feld-spezifische Fehler löschen
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Passwort-Stärke berechnen
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }

    Object.values(checks).forEach(check => check && score++)

    if (score <= 2) return { strength: 'weak', color: 'bg-red-500', text: 'Schwach' }
    if (score <= 3) return { strength: 'medium', color: 'bg-yellow-500', text: 'Mittel' }
    if (score <= 4) return { strength: 'good', color: 'bg-blue-500', text: 'Gut' }
    return { strength: 'strong', color: 'bg-green-500', text: 'Stark' }
  }

  // Formular-Validierung
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'Vorname ist erforderlich'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Nachname ist erforderlich'
    }

    if (!formData.username.trim()) {
      errors.username = 'Benutzername ist erforderlich'
    } else if (formData.username.length < 3) {
      errors.username = 'Benutzername muss mindestens 3 Zeichen lang sein'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Benutzername darf nur Buchstaben, Zahlen, - und _ enthalten'
    }

    if (!formData.email) {
      errors.email = 'E-Mail ist erforderlich'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse'
    }

    if (!formData.password) {
      errors.password = 'Passwort ist erforderlich'
    } else if (formData.password.length < 8) {
      errors.password = 'Passwort muss mindestens 8 Zeichen lang sein'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Passwort-Bestätigung ist erforderlich'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein'
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Sie müssen den Nutzungsbedingungen zustimmen'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
      // Weiterleitung erfolgt durch useEffect nach erfolgreichem Login
    } catch (error) {
      // Fehler wird durch AuthContext verwaltet
      console.error('Registrierungs-Fehler:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Wenn bereits angemeldet, Ladebildschirm anzeigen
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t('signUp')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Erstellen Sie Ihr kostenloses Konto und legen Sie los.
          </p>
        </div>

        {/* Registrierungs-Formular */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('createAccount')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Allgemeine Fehlermeldung */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Vor- und Nachname */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vorname
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                        formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Max"
                      autoComplete="given-name"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nachname
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mustermann"
                    autoComplete="family-name"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Benutzername */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Benutzername
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                      formErrors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="max_mustermann"
                    autoComplete="username"
                  />
                </div>
                {formErrors.username && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.username}</p>
                )}
              </div>

              {/* E-Mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="max@beispiel.com"
                    autoComplete="email"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>
                )}
              </div>

              {/* Passwort */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mindestens 8 Zeichen"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Passwort-Stärke-Anzeige */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ 
                            width: passwordStrength.strength === 'weak' ? '25%' : 
                                   passwordStrength.strength === 'medium' ? '50%' : 
                                   passwordStrength.strength === 'good' ? '75%' : '100%' 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
                
                {formErrors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.password}</p>
                )}
              </div>

              {/* Passwort bestätigen */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                      formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Passwort wiederholen"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Passwort-Übereinstimmung */}
                {formData.confirmPassword && (
                  <div className="mt-1 flex items-center">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Passwörter stimmen überein</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Passwörter stimmen nicht überein</span>
                      </div>
                    )}
                  </div>
                )}
                
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Nutzungsbedingungen */}
              <div>
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Ich akzeptiere die{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Nutzungsbedingungen
                    </Link>{' '}
                    und{' '}
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                      Datenschutzrichtlinien
                    </Link>
                  </label>
                </div>
                {formErrors.acceptTerms && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.acceptTerms}</p>
                )}
              </div>

              {/* Registrieren-Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Konto erstellen...
                  </div>
                ) : (
                  t('createAccount')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login-Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('alreadyHaveAccount')}{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

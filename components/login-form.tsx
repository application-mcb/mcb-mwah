'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  signInWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  Check,
  GoogleLogo,
  Key,
  MagicWand,
} from '@phosphor-icons/react'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginFormProps {
  onLoginSuccess?: () => void
  onSwitchToRegistration?: () => void
}

type LoginMethod = 'password' | 'magic-link'

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegistration,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [emailSent, setEmailSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>()
  const watchedEmail = watch('email')
  const passwordRecoveryUrl = 'https://marian.college'

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // First authenticate with Firebase
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')

      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )
      const user = userCredential.user

      // Then call our API with the user data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      // Handle redirect based on user role and profile completion status
      if (result.isRegistrar) {
        // User is a registrar, redirect to registrar dashboard
        window.location.href = result.redirectTo || '/registrar'
      } else if (result.isTeacher) {
        // User is a teacher, redirect to teacher dashboard
        window.location.href = result.redirectTo || '/teacher'
      } else if (result.hasCompleteProfile) {
        // User has complete profile, redirect to student dashboard
        window.location.href = '/dashboard'
      } else {
        // User needs to complete profile setup
        window.location.href = '/setup'
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection')
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password accounts are not enabled')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred during login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Call Google authentication API which handles sync and profile check
      const googleAuthResponse = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUser: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
        }),
      })

      const googleAuthResult = await googleAuthResponse.json()

      if (!googleAuthResponse.ok) {
        throw new Error(
          googleAuthResult.error || 'Google authentication failed'
        )
      }

      // Handle redirect based on user role and profile completion status
      if (googleAuthResult.isRegistrar) {
        // User is a registrar, redirect to registrar dashboard
        window.location.href = googleAuthResult.redirectTo || '/registrar'
      } else if (googleAuthResult.isTeacher) {
        // User is a teacher, redirect to teacher dashboard
        window.location.href = googleAuthResult.redirectTo || '/teacher'
      } else if (googleAuthResult.hasCompleteProfile) {
        // User has complete profile, redirect to student dashboard
        window.location.href = '/dashboard'
      } else {
        // User needs to complete profile setup
        window.location.href = '/setup'
      }
    } catch (err: any) {
      // Log error safely without exposing sensitive details
      console.error('Google sign-in failed:', err.code || 'Unknown error')

      let errorMessage = 'Google sign-in failed'
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled'
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser'
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Account already exists with a different sign-in method'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSignIn = async (data: { email: string }) => {
    setIsLoading(true)
    setError('')

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/callback`,
        handleCodeInApp: true,
      }

      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings)
      setEmailSent(true)

      // Store email in localStorage for sign-in completion
      window.localStorage.setItem('emailForSignIn', data.email)
    } catch (err: any) {
      console.error('Magic link failed:', err.code || 'Unknown error')
      setError('Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenResetModal = () => {
    const trimmedEmail = watchedEmail?.trim() ?? ''
    setResetEmail(trimmedEmail)
    setShowResetModal(true)
  }

  const handleCloseResetModal = () => {
    if (isResettingPassword) {
      return
    }
    setShowResetModal(false)
  }

  const handlePasswordReset = async () => {
    const trimmedEmail = resetEmail.trim()

    if (!trimmedEmail) {
      toast.error('Enter your email to reset your password.')
      return
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmedEmail)) {
      toast.error('Please enter a valid email.')
      return
    }

    setIsResettingPassword(true)

    try {
      await sendPasswordResetEmail(auth, trimmedEmail)
      toast.success(
        'Password reset link sent. Follow instructions in the new tab.'
      )
      window.open(passwordRecoveryUrl, '_blank', 'noopener,noreferrer')
      setShowResetModal(false)
    } catch (err: any) {
      console.error('Password reset failed:', err?.code || err?.message || err)

      if (err?.code === 'auth/user-not-found') {
        toast.error('No account found for this email.')
        return
      }

      if (err?.code === 'auth/invalid-email') {
        toast.error('Please enter a valid email.')
        return
      }

      toast.error('Unable to send reset link. Try again later.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div className="mx-auto w-full rounded-2xl border border-blue-900/10 bg-white/95 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <CardHeader className="p-6 text-center sm:px-6 sm:pb-8">
        <CardTitle className="mb-2 text-2xl font-medium text-blue-900 sm:text-3xl">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-blue-900/70 sm:text-base">
          Sign in to continue to Marian Connect
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center px-4 sm:px-6">
        {/* Login Method Tabs */}
        <div className="mb-9 flex space-x-1 rounded-2xl bg-blue-900/5 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password')
              setEmailSent(false)
              setError('')
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              loginMethod === 'password'
                ? 'scale-[1.02] bg-blue-900 text-white shadow-lg'
                : 'text-blue-900/80 hover:bg-white hover:text-blue-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock
                size={16}
                className={`transition-colors duration-200 ${
                  loginMethod === 'password' ? 'text-white' : 'text-blue-900'
                }`}
              />
              Password
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('magic-link')
              setEmailSent(false)
              setError('')
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              loginMethod === 'magic-link'
                ? 'scale-[1.02] bg-blue-900 text-white shadow-lg'
                : 'text-blue-900/80 hover:bg-white hover:text-blue-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MagicWand
                size={16}
                className={`transition-colors duration-200 ${
                  loginMethod === 'magic-link' ? 'text-white' : 'text-blue-900'
                }`}
              />
              Magic Link
            </div>
          </button>
        </div>

        {emailSent ? (
          <div className="space-y-6 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="text-green-600 animate-in fade-in-0 zoom-in-95 duration-300 delay-100">
              <Check
                size={48}
                className="mx-auto mb-4 animate-in fade-in-0 zoom-in-75 duration-300 delay-200"
              />
              <h3 className="mb-2 text-xl font-medium text-blue-900 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">
                Check your email!
              </h3>
              <p className="text-sm text-blue-900/70 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
                We sent you a magic link to sign in.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEmailSent(false)
                setError('')
              }}
              variant="outline"
              className="h-12 w-full text-base font-medium transition-transform duration-200 animate-in fade-in-0 slide-in-from-bottom-2 delay-500 hover:scale-[1.02]"
            >
              Try Different Email
            </Button>
          </div>
        ) : (
          <>
            {loginMethod === 'password' && (
              <form
                onSubmit={handleSubmit(handleLogin)}
                className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-blue-900"
                  >
                    <Envelope size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="h-12 w-full rounded-xl border border-blue-900/15 bg-white text-blue-900 transition-all duration-200 placeholder:text-blue-900/50 hover:border-blue-900/30 focus:scale-[1.01] focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium text-blue-900"
                  >
                    <Lock size={16} />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className="h-12 w-full rounded-xl border border-blue-900/15 bg-white pr-12 text-blue-900 transition-all duration-200 placeholder:text-blue-900/50 hover:border-blue-900/30 focus:scale-[1.01] focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                      aria-describedby={
                        errors.password ? 'password-error' : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transform text-blue-900/60 transition-colors duration-200 hover:text-blue-900"
                    >
                      {showPassword ? (
                        <EyeSlash size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      id="password-error"
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    aria-label="Forgot password"
                    tabIndex={0}
                    className="text-sm text-blue-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2 transition-colors disabled:opacity-60"
                    disabled={isResettingPassword}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-900 text-base font-medium text-white transition-transform duration-200 hover:scale-[1.01] hover:bg-blue-950"
                  loading={isLoading}
                >
                  Sign In
                </Button>
              </form>
            )}

            {loginMethod === 'magic-link' && (
              <form
                onSubmit={handleSubmit(handleMagicLinkSignIn)}
                className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-medium text-blue-900"
                  >
                    <Envelope size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="h-12 w-full rounded-xl border border-blue-900/15 bg-white text-blue-900 transition-all duration-200 placeholder:text-blue-900/50 hover:border-blue-900/30 focus:scale-[1.01] focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p
                      id="email-error"
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-900 text-base font-medium text-white transition-transform duration-200 hover:scale-[1.01] hover:bg-blue-950"
                  loading={isLoading}
                >
                  Send Magic Link
                </Button>
              </form>
            )}

            {/* Error Display */}
            {error && (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Google Sign-In Button - Moved to bottom */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-blue-900/15" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-blue-900/70">Or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-4 w-full rounded-xl border border-blue-900/15 bg-white text-blue-900 transition-all duration-200 hover:border-blue-900/30 hover:bg-white shadow-md"
                loading={isLoading}
                variant="outline"
              >
                <GoogleLogo size={20} className="mr-3 text-blue-900" />
                Continue with Google
              </Button>
            </div>

            {/* Registration Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-blue-900/80">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegistration}
                  className="font-medium text-blue-900 underline underline-offset-2 transition-colors hover:text-blue-950"
                >
                  Sign up
                </button>
              </p>
            </div>
          </>
        )}
      </CardContent>
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reset password"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-4">
              <h3 className="text-xl font-medium text-blue-900">
                Reset password
              </h3>
              <p className="text-sm text-blue-900/80">
                Enter the email associated with your account to receive a reset
                link.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="reset-email"
                className="flex items-center gap-2 text-sm font-medium text-blue-900"
              >
                <Envelope size={16} />
                Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                placeholder="name@email.com"
                className="h-12 w-full rounded-xl border border-blue-900/15 text-blue-900 placeholder:text-blue-900/50 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                autoFocus
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border border-blue-900/15 text-blue-900 hover:border-blue-900/30"
                onClick={handleCloseResetModal}
                disabled={isResettingPassword}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-blue-900 hover:bg-blue-950"
                onClick={handlePasswordReset}
                loading={isResettingPassword}
              >
                Send reset link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signInWithPopup } from 'firebase/auth'
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
  GoogleLogo,
} from '@phosphor-icons/react'

interface RegistrationFormData {
  email: string
  password: string
  confirmPassword: string
}

interface RegistrationFormProps {
  onRegistrationSuccess?: () => void
  onSwitchToLogin?: () => void
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onRegistrationSuccess,
  onSwitchToLogin,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>()

  const password = watch('password')

  const handleRegistration = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      // Redirect to customize account page (database sync is handled by API)
      window.location.href = '/setup'
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred during registration')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Call Google authentication API which handles sync
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

      if (!googleAuthResponse.ok) {
        console.warn(
          'Google authentication failed, but continuing with registration'
        )
      }

      // Redirect to customize account page
      window.location.href = '/setup'
    } catch (err: any) {
      console.error('Google sign-up failed:', err.code || 'Unknown error')

      let errorMessage = 'Google sign-up failed'
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up was cancelled'
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
        <CardTitle className="text-2xl sm:text-3xl font-light text-gray-900">
          Create Account
        </CardTitle>
        <CardDescription className="text-gray-500 text-sm sm:text-base">
          Join us and get started today
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-center flex-1 px-4 sm:px-6">
        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-lg"
            loading={isLoading}
            variant="outline"
          >
            <GoogleLogo size={20} className="mr-3 text-blue-900" />
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-white to-gray-50 text-gray-400 font-medium">
                Or create with email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleRegistration)} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div>
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
                className="w-full px-3 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-red-500 mt-1"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                className="w-full pr-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-red-500 mt-1"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                className="w-full pr-10 border-2 border-gray-200 focus:border-blue-900 transition-colors duration-200"
                aria-describedby={
                  errors.confirmPassword ? 'confirm-password-error' : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeSlash size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="text-sm text-red-500 mt-1"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center" role="alert">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-900 hover:bg-blue-900 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-lg"
            loading={isLoading}
            aria-describedby={isLoading ? 'loading-status' : undefined}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-900 hover:text-blue-900 font-medium underline transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </div>
  )
}

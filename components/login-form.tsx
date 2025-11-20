"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signInWithPopup, sendSignInLinkToEmail, signInWithEmailLink, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Envelope, Lock, Eye, EyeSlash, Check, GoogleLogo, Key, MagicWand } from "@phosphor-icons/react";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onSwitchToRegistration?: () => void;
}

type LoginMethod = 'password' | 'magic-link';

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegistration }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      // First authenticate with Firebase
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Then call our API with the user data
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Handle redirect based on user role and profile completion status
      if (result.isRegistrar) {
        // User is a registrar, redirect to registrar dashboard
        window.location.href = result.redirectTo || '/registrar';
      } else if (result.isTeacher) {
        // User is a teacher, redirect to teacher dashboard
        window.location.href = result.redirectTo || '/teacher';
      } else if (result.hasCompleteProfile) {
        // User has complete profile, redirect to student dashboard
        window.location.href = '/dashboard';
      } else {
        // User needs to complete profile setup
        window.location.href = '/setup';
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password accounts are not enabled');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

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
          }
        }),
      });

      const googleAuthResult = await googleAuthResponse.json();

      if (!googleAuthResponse.ok) {
        throw new Error(googleAuthResult.error || 'Google authentication failed');
      }

      // Handle redirect based on user role and profile completion status
      if (googleAuthResult.isRegistrar) {
        // User is a registrar, redirect to registrar dashboard
        window.location.href = googleAuthResult.redirectTo || '/registrar';
      } else if (googleAuthResult.isTeacher) {
        // User is a teacher, redirect to teacher dashboard
        window.location.href = googleAuthResult.redirectTo || '/teacher';
      } else if (googleAuthResult.hasCompleteProfile) {
        // User has complete profile, redirect to student dashboard
        window.location.href = '/dashboard';
      } else {
        // User needs to complete profile setup
        window.location.href = '/setup';
      }
    } catch (err: any) {
      // Log error safely without exposing sensitive details
      console.error('Google sign-in failed:', err.code || 'Unknown error');

      let errorMessage = 'Google sign-in failed';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Account already exists with a different sign-in method';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (data: { email: string }) => {
    setIsLoading(true);
    setError("");

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/callback`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      setEmailSent(true);

      // Store email in localStorage for sign-in completion
      window.localStorage.setItem('emailForSignIn', data.email);
    } catch (err: any) {
      console.error('Magic link failed:', err.code || 'Unknown error');
      setError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
        <CardTitle className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">Welcome Back</CardTitle>
        <CardDescription className="text-gray-500 text-sm sm:text-base">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-center flex-1 px-4 sm:px-6">
        {/* Login Method Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('password');
              setEmailSent(false);
              setError("");
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] ${
              loginMethod === 'password'
                ? 'bg-white text-gray-900 shadow-md scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock size={16} className={`transition-colors duration-200 ${loginMethod === 'password' ? 'text-blue-900' : ''}`} />
              Password
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('magic-link');
              setEmailSent(false);
              setError("");
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] ${
              loginMethod === 'magic-link'
                ? 'bg-white text-gray-900 shadow-md scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MagicWand size={16} className={`transition-colors duration-200 ${loginMethod === 'magic-link' ? 'text-blue-900' : ''}`} />
              Magic Link
            </div>
          </button>
        </div>

        {emailSent ? (
          <div className="text-center space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="text-green-600 animate-in fade-in-0 zoom-in-95 duration-300 delay-100">
              <Check size={48} className="mx-auto mb-4 animate-in fade-in-0 zoom-in-75 duration-300 delay-200" />
              <h3 className="text-xl font-medium text-gray-900 mb-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-300">Check your email!</h3>
              <p className="text-sm text-gray-600 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
                We sent you a magic link to sign in.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setError("");
              }}
              variant="outline"
              className="w-full h-12 text-base font-medium animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-500 hover:scale-[1.02] transition-transform"
            >
              Try Different Email
            </Button>
          </div>
        ) : (
          <>
            {loginMethod === 'password' && (
              <form onSubmit={handleSubmit(handleLogin)} className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Envelope size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full h-12 text-base transition-all duration-200 focus:scale-[1.01] hover:shadow-md"
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-600" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock size={16} />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                      className="w-full h-12 text-base pr-12 transition-all duration-200 focus:scale-[1.01] hover:shadow-md"
                      aria-describedby={errors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="text-sm text-red-600" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium hover:scale-[1.02] transition-transform duration-200"
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
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Envelope size={16} />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full h-12 text-base transition-all duration-200 focus:scale-[1.01] hover:shadow-md"
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-600" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium hover:scale-[1.02] transition-transform duration-200"
                  loading={isLoading}
                >
                  Send Magic Link
                </Button>
              </form>
            )}

            {/* Error Display */}
            {error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {error}
              </p>
            )}

            {/* Google Sign-In Button - Moved to bottom */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full mt-4 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-lg"
                loading={isLoading}
                variant="outline"
              >
                <GoogleLogo size={20} className="mr-3 text-blue-900" />
                Continue with Google
              </Button>
            </div>

            {/* Registration Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={onSwitchToRegistration}
                  className="text-blue-900 hover:text-blue-900 font-medium underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

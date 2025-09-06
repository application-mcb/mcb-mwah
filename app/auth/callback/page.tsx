"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailLink, isSignInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      try {
        // Check if the current URL is a sign-in with email link
        if (isSignInWithEmailLink(auth, window.location.href)) {
          // Get the email from localStorage (set during magic link request)
          let email = window.localStorage.getItem('emailForSignIn');

          if (!email) {
            // If email is not found in localStorage, prompt user for it
            email = window.prompt('Please provide your email for confirmation');
          }

          if (email) {
            // Complete the sign-in process
            const result = await signInWithEmailLink(auth, email, window.location.href);
            console.log('Magic link sign-in successful:', result.user.email);

            // Handle authentication through API which includes sync and profile check
            const authResponse = await fetch('/api/auth/magic-link', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firebaseUser: {
                  uid: result.user.uid,
                  email: result.user.email,
                  displayName: result.user.displayName,
                  photoURL: result.user.photoURL,
                }
              }),
            });

            const authResult = await authResponse.json();

            if (!authResponse.ok) {
              throw new Error(authResult.error || 'Authentication failed');
            }

            const userProfile = authResult.hasCompleteProfile ? { firstName: 'exists', lastName: 'exists' } : null;
            
            // Clear the email from localStorage
            window.localStorage.removeItem('emailForSignIn');

            setStatus('success');
            setMessage('Successfully signed in! Redirecting...');

            // Redirect based on profile completion
            setTimeout(() => {
              if (userProfile && userProfile.firstName && userProfile.lastName) {
                router.push('/dashboard');
              } else {
                router.push('/setup');
              }
            }, 2000);
          } else {
            throw new Error('Email is required to complete sign-in');
          }
        } else {
          throw new Error('Invalid sign-in link');
        }
      } catch (error: any) {
        console.error('Magic link sign-in error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to sign in with magic link');
      }
    };

    handleEmailLinkSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <button
                onClick={() => router.push('/')}
                className="mt-4 text-blue-900 hover:text-blue-900 font-medium underline"
              >
                Return to login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ContinueWithUser: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Call our API to check user status and get redirect path
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to continue');
      }

      // Handle redirect based on user role and profile completion status
      if (result.isRegistrar) {
        router.push(result.redirectTo || '/registrar');
      } else if (result.isTeacher) {
        router.push(result.redirectTo || '/teacher');
      } else if (result.hasCompleteProfile) {
        router.push('/dashboard');
      } else {
        router.push('/setup');
      }
    } catch (error) {
      console.error('Continue failed:', error);
      // If API call fails, fall back to dashboard
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const nameParts = user.displayName?.split(' ') || user.email?.split('@')[0]?.split(' ') || ['U'];
  const firstName = nameParts[0] || 'U';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  // Get at least 2 characters for initials
  let initials = firstName.charAt(0).toUpperCase();
  if (lastName) {
    initials += lastName.charAt(0).toUpperCase();
  } else if (firstName.length > 1) {
    initials += firstName.charAt(1).toUpperCase();
  } else {
    // If only one character in first name and no last name, duplicate the first character
    initials += initials;
  }

  const hasProfilePicture = user.photoURL && user.photoURL.trim() !== '';

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-3xl font-light text-gray-900 mb-2">Welcome Back</CardTitle>
        <CardDescription className="text-gray-500 text-base">
          Continue with your account
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-center flex-1 space-y-6">
        {/* User Info Section */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden">
            {hasProfilePicture ? (
              <img
                src={user.photoURL!}
                alt={`${displayName}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-white text-lg font-medium">${initials}</span>`;
                    parent.classList.add('bg-blue-900');
                  }
                }}
              />
            ) : (
              <span className="text-white text-lg font-medium bg-blue-900 w-full h-full flex items-center justify-center rounded-full">
                {initials}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-1 capitalize" >
              Continue as {displayName}
            </h3>
            <p className="text-sm text-gray-600 font-mono">
              {user.email}
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full h-12 text-base font-medium hover:scale-[1.02] transition-transform duration-200"
          loading={isLoading}
        >
          Continue to Dashboard
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* This is not me Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 text-base font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          loading={isLoading}
        >
          <SignOut size={16} className="mr-2" />
          This is not me
        </Button>
      </CardContent>
    </Card>
  );
};

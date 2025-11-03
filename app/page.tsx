
"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegistrationForm } from "@/components/registration-form";
import { ContinueWithUser } from "@/components/continue-with-user";
import { AuthHero } from "@/components/auth-hero";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();

  const handleLoginSuccess = () => {
    // Handle successful login (e.g., redirect to dashboard)
    console.log("Login successful!");
  };

  const handleRegistrationSuccess = () => {
    // Handle successful registration (e.g., switch to login or redirect)
    console.log("Registration successful!");
    setIsLogin(true); // Switch to login form after successful registration
  };

  const handleSwitchToRegistration = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };


  return (
    
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
   
      <div className="fixed w-1/2 h-full z-0 bg-[#05217b]">
        <AuthHero />
      </div>
  
      <div className="w-1/2 h-full z-0">
      
        <div className="bg-blue-900 to-blue-100 absolute bottom-0 left-0 w-1/2 h-20 p-4">
        <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Marian College Logo" className="w-12 h-12 object-contain aspect-square" />
        <div className="flex flex-col">
          <p className="text-sm font-bold text-white">
            MARIAN COLLEGE OF BALIUAG, INC.
          </p>
          <p className="text-sm font-light text-white">
            #TATAKMARIAN
          </p>
          </div>
          </div>
        </div>
          
      </div>
     
      {/* Right Panel - Auth Forms */}
      <div className="flex items-center justify-center p-4 lg:p-8 min-h-screen z-10 shadow-lg relative">
      <div className="z-0 absolute inset-0 opacity-50 bg-[linear-gradient(rgba(30,58,138,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,138,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
        <div className="w-full max-w-lg space-y-4 z-10">
          {loading ? (
            // Loading state while checking authentication
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
          ) : user ? (
            // User is authenticated - show continue component
            <ContinueWithUser />
          ) : (
            // User is not authenticated - show login/registration forms
            isLogin ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegistration={handleSwitchToRegistration}
              />
            ) : (
              <RegistrationForm
                onRegistrationSuccess={handleRegistrationSuccess}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )
          )}
        </div>
      </div>

    </div>
  );
}


"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { RegistrationForm } from "@/components/registration-form";
import { AuthHero } from "@/components/auth-hero";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);

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
      {/* Left Panel - Hero Section */}
      <div className="hidden lg:block">
        <AuthHero />
      </div>


      {/* Right Panel - Auth Forms */}
      <div className="flex items-center justify-center bg-gray-50 p-4 lg:p-8 min-h-screen">
        <div className="w-full max-w-lg space-y-4">
          {isLogin ? (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegistration={handleSwitchToRegistration}
            />
          ) : (
            <RegistrationForm
              onRegistrationSuccess={handleRegistrationSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </div>

    </div>
  );
}

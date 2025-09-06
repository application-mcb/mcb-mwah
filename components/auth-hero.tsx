import React from 'react';

export const AuthHero: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-full bg-white relative overflow-hidden">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <img 
            src="/logo.png" 
            alt="Marian College Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-light text-gray-900">Student Portal</h1>
          <p className="text-lg text-gray-600 font-light">Marian College of Baliuag, Inc.</p>
          <p className="text-sm text-gray-500 max-w-md">
            Access your academic information, manage your profile, and stay connected with your educational journey.
          </p>
        </div>
      </div>
    </div>
  );
};

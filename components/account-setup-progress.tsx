'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Warning, FileText } from '@phosphor-icons/react';

interface AccountSetupProgressProps {
  userId: string;
  userProfile?: any;
  documents: any[];
}

export default function AccountSetupProgress({
  userId,
  userProfile,
  documents
}: AccountSetupProgressProps) {
  const [progress, setProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSlidingUp, setIsSlidingUp] = useState(false);

  // Calculate progress based on document uploads
  useEffect(() => {
    // Base required documents (6 total)
    const baseRequiredDocs = ['reportCard', 'certificateOfGoodMoral', 'birthCertificate', 'idPicture', 'form137', 'certificateOfCompletion'];

    // Add marriage certificate if user is married
    const isMarried = userProfile?.civilStatus?.toLowerCase() === 'married';
    const requiredDocs = isMarried
      ? [...baseRequiredDocs, 'marriageCertificate']
      : baseRequiredDocs;

    const uploadedDocTypes = documents?.map(doc => doc.type) || [];
    const uploadedRequiredDocs = requiredDocs.filter(docType => uploadedDocTypes.includes(docType));
    const calculatedProgress = Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);

    setProgress(calculatedProgress);

    // Set message based on progress state
    if (calculatedProgress === 0) {
      setCurrentMessage("You still haven't submitted any document. Please upload your required documents to complete your account setup.");
      setIsCompleting(false);
      setIsSlidingUp(false);
    } else if (calculatedProgress < 100) {
      setCurrentMessage(`You've uploaded ${uploadedRequiredDocs.length} of ${requiredDocs.length} required documents. Keep going!`);
      setIsCompleting(false);
      setIsSlidingUp(false);
    } else {
      setCurrentMessage("Congratulations! All required documents have been uploaded. Your account setup is complete.");
      setIsCompleting(true);
      // Start slide up animation after 2 seconds
      setTimeout(() => setIsSlidingUp(true), 2000);
      // Hide completely after slide up animation finishes (2.5 seconds total)
      setTimeout(() => setIsVisible(false), 4500);
    }
  }, [documents]);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);


  if (!isVisible) return null;

  return (
    <div
      className={`sticky top-0 z-50 bg-blue-900 text-white shadow-lg transition-transform duration-1000 ease-out ${
        isSlidingUp ? '-translate-y-full' : 'translate-y-0'
      } ${isCompleting ? 'shadow-2xl shadow-yellow-400/30' : ''}`}
      style={isCompleting ? {
        boxShadow: '0 25px 50px -12px rgba(250, 204, 21, 0.25), 0 0 0 1px rgba(250, 204, 21, 0.1)'
      } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Message Section */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {progress < 50 ? (
                <Warning size={24} weight="fill" className="text-white " />
              ) : (
                <CheckCircle size={24} weight="fill" className="text-green-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {currentMessage}
              </p>
              {progress < 100 && (
                <p className="text-xs opacity-90 mt-1" style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
                  {progress}% Complete
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar Section */}
          <div className="flex items-center space-x-4 ml-4">
            <div className={`relative w-100 h-2 bg-blue-950 overflow-hidden ${isCompleting ? 'animate-pulse' : ''}`}>
              {/* Animated background */}
              <div
                className={`absolute inset-0 bg-white transition-all duration-1000 ease-out ${
                  isCompleting ? 'animate-pulse shadow-lg shadow-yellow-400/50' : ''
                }`}
                style={{
                  width: `${animatedProgress}%`,
                  boxShadow: isCompleting
                    ? '0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.4)'
                    : '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />

              {/* Completion sparkle effect */}
              {progress === 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 animate-pulse" />
              )}
            </div>

            {/* Percentage Display */}
            <div className="text-right min-w-[3rem]">
              <span className="text-sm font-bold" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                {animatedProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

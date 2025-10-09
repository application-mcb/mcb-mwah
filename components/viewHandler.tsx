'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';

interface ViewHandlerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  fileName: string;
  fileType: string;
  fileFormat: string;
}

export default function ViewHandler({ 
  isOpen, 
  onClose, 
  documentUrl, 
  fileName, 
  fileType, 
  fileFormat 
}: ViewHandlerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
    } else {
      setIsLoading(false);
    }
  }, [isOpen]);

  const isImage = fileFormat.toLowerCase() === 'img' || 
                 fileFormat.toLowerCase() === 'jpg' || 
                 fileFormat.toLowerCase() === 'jpeg' || 
                 fileFormat.toLowerCase() === 'png' || 
                 fileFormat.toLowerCase() === 'gif' || 
                 fileFormat.toLowerCase() === 'webp';

  const isPdf = fileFormat.toLowerCase() === 'pdf';

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setIsLoading(false);
  };

  const handleImageError = () => {
    console.log('Image failed to load');
    setIsLoading(false);
    setError('Failed to load image');
  };

  const handlePdfLoad = () => {
    console.log('PDF loaded successfully');
    setIsLoading(false);
  };

  const handlePdfError = () => {
    console.log('PDF failed to load');
    setIsLoading(false);
    setError('Failed to load PDF');
  };

  // Aggressive fallback timeout - always turn off loading
  useEffect(() => {
    if (isOpen) {
      // Immediate fallback
      const immediateTimeout = setTimeout(() => {
        console.log('Immediate fallback - setting loading to false');
        setIsLoading(false);
      }, 500); // 0.5 second timeout

      // Extended fallback
      const extendedTimeout = setTimeout(() => {
        console.log('Extended fallback - setting loading to false');
        setIsLoading(false);
      }, 2000); // 2 second timeout

      return () => {
        clearTimeout(immediateTimeout);
        clearTimeout(extendedTimeout);
      };
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="2xl"
    >
      <div className="h-[80vh] w-full">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                Loading document...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {error}
              </p>
              <button
                onClick={() => window.open(documentUrl, '_blank')}
                className="px-4 py-2 bg-blue-800 text-white text-sm"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Open in New Tab
              </button>
            </div>
          </div>
        )}

        {!error && !isLoading && (
          <>
            {isImage && (
              <div className="flex justify-center items-center h-full bg-gray-100">
                <img
                  src={documentUrl}
                  alt={fileName}
                  className="max-w-full max-h-full object-contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            )}

            {isPdf && (
              <div className="w-full h-full">
                <iframe
                  src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full border-0"
                  title={fileName}
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                />
              </div>
            )}

            {!isImage && !isPdf && (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center">
                  <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => window.open(documentUrl, '_blank')}
                    className="px-4 py-2 bg-blue-800 text-white text-sm"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

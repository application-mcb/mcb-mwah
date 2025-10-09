import React, { Suspense } from 'react';

// Dynamic import for Spline to handle async issues
const SplineBackground = React.lazy(() =>
  import('@splinetool/react-spline').then(module => ({
    default: () => (
      <div className="absolute inset-0 z-0">
        <module.default
          scene="https://prod.spline.design/uJYJfL3sCazwCVLY/scene.splinecode"
        />
      </div>
    )
  }))
);

export const AuthHero: React.FC = () => {
  return (
    <div className="fixed items-center h-full w-full relative overflow-hidden top-0 left-0">
      {/* Spline 3D Scene Background */}
      <Suspense fallback={<div className="absolute inset-0 z-0 bg-gray-100 animate-pulse" />}>
        <SplineBackground />
      </Suspense>
    </div>
  );
};

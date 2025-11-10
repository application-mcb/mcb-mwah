'use client'

import { useEffect } from 'react'

const AnimationStylesInjector = () => {
  useEffect(() => {
    const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
  .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
  .animate-slideInUp { animation: slideInUp 0.4s ease-out forwards; }
`
    const styleEl = document.createElement('style')
    styleEl.textContent = animationStyles
    document.head.appendChild(styleEl)
    return () => {
      try {
        document.head.removeChild(styleEl)
      } catch {}
    }
  }, [])
  return null
}

export default AnimationStylesInjector



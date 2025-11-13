'use client'

import { useState, useEffect, useRef } from 'react'

interface TypewriterProps {
  text: string | string[]
  delay?: number
  className?: string
  onComplete?: () => void
  loop?: boolean
}

export const Typewriter = ({
  text,
  delay = 50,
  className = '',
  onComplete,
  loop = false,
}: TypewriterProps) => {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentIndexRef = useRef(0)

  const texts = Array.isArray(text)
    ? text.filter((t) => t && typeof t === 'string')
    : [text].filter((t) => t && typeof t === 'string')
  const validTextIndex =
    texts.length > 0 ? Math.min(textIndex, texts.length - 1) : 0
  const currentText = texts[validTextIndex] || ''

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!currentText || typeof currentText !== 'string') return

    setIsTyping(true)
    currentIndexRef.current = 0
    setDisplayText('')

    const typeNextChar = () => {
      if (!currentText || currentIndexRef.current >= currentText.length) {
        setIsTyping(false)
        if (onComplete) {
          onComplete()
        }

        // Handle looping
        if (loop) {
          timeoutRef.current = setTimeout(() => {
            if (texts.length > 1) {
              setTextIndex((prev) => (prev + 1) % texts.length)
            } else {
              currentIndexRef.current = 0
              setDisplayText('')
              setIsTyping(true)
              typeNextChar()
            }
          }, 2000)
        }
        return
      }

      const char = currentText[currentIndexRef.current]
      if (char !== undefined && char !== null) {
        setDisplayText((prev) => prev + char)
        currentIndexRef.current += 1
        timeoutRef.current = setTimeout(typeNextChar, delay)
      }
    }

    typeNextChar()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [validTextIndex, currentText, delay, loop, texts.length, onComplete])

  // Ensure textIndex is always valid
  useEffect(() => {
    if (texts.length > 0 && textIndex >= texts.length) {
      setTextIndex(0)
    }
  }, [textIndex, texts.length])

  // Reset when text prop changes
  useEffect(() => {
    if (texts.length > 0) {
      setTextIndex(0)
      currentIndexRef.current = 0
      setDisplayText('')
      setIsTyping(true)
    }
  }, [text, texts.length])

  return (
    <span className={`${className} inline-block`}>
      <span className="inline-block">
        {displayText || '\u00A0'}
        <span className="inline-block ml-1 align-middle text-blue-900">
          {isTyping ? <span className="animate-pulse">|</span> : '|'}
        </span>
      </span>
    </span>
  )
}

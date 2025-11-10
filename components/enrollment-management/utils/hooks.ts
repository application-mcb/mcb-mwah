import { useEffect } from 'react'

export const useModalCountdown = (
  isOpen: boolean,
  countdown: number,
  setCountdown: (n: number) => void
) => {
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isOpen, countdown, setCountdown])
}



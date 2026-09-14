import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthSplash from '../components/AuthSplash'
import { usePageLoading } from './PageLoadingContext'

const LoginSplashContext = createContext(null)

export function LoginSplashProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(null)
  const splashRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { isPageLoading } = usePageLoading()

  useEffect(() => {
    if (leaving === null || location.key === leaving || isPageLoading) return undefined
    let active = true
    let frame
    let timer
    // Keep the splash visible over the destination after its loading UI clears.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        timer = window.setTimeout(async () => {
          if (!active) return
          await splashRef.current?.fadeOut()
          if (active) {
            setOpen(false)
            setLeaving(null)
          }
        }, 400)
      })
    })
    return () => {
      active = false
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [leaving, location.key, isPageLoading])

  const start = () => setOpen(true)
  const stop = async () => {
    await splashRef.current?.fadeOut()
    setOpen(false)
  }
  const finish = target => {
    navigate(target, { replace: true })
    setLeaving(location.key)
  }

  return <LoginSplashContext.Provider value={{ start, stop, finish }}>
    {children}
    <AuthSplash ref={splashRef} open={open} exitDuration={200} />
  </LoginSplashContext.Provider>
}

export const useLoginSplash = () => useContext(LoginSplashContext)

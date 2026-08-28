import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { loginUser } from '../utils/api'
import { getDefaultAuthorizedRoute } from '../utils/permissions'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Email dan password tidak boleh kosong')
      return
    }

    if (!email.includes('@')) {
      setError('Format email tidak valid')
      return
    }

    setIsLoading(true)

    try {
      await loginUser(email, password)
      setIsLoading(false)
      
      navigate(getDefaultAuthorizedRoute(), { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login gagal. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Login — Gakuren</title>
        <meta name="description" content="Masuk ke akun Gakuren Anda" />
      </Helmet>
      
      <div className="login-page relative min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center px-4 py-20 sm:py-12 dark:from-[#0b1220] dark:via-[#121212] dark:to-[#111827]">
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:block" />
        <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
        <Link
          to="/"
          className="action-lift absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white/80 px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm backdrop-blur transition hover:border-brand-200 hover:bg-white sm:left-6 sm:top-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali ke beranda</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4 ring-1 ring-brand-100">
              <img src="/favicon.svg" alt="Logo Gakuren" className="h-14 w-14 rounded-xl" />
            </div>
            <h1 className="login-title text-3xl font-bold text-brand-900 mb-2 dark:text-blue-100">Gakuren</h1>
            <p className="login-subtitle text-brand-600 dark:text-blue-200">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <div className="login-card bg-white rounded-2xl border border-transparent shadow-panel p-6 sm:p-8 animate-fade-up dark:border-white/10 dark:bg-[#1e1e1e] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-900 mb-2 dark:text-slate-200">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-brand-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@sekolah.id"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed dark:border-white/20 dark:bg-[#292929] dark:text-white dark:focus:border-blue-300 dark:focus:ring-blue-400/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-900 mb-2 dark:text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-brand-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed dark:border-white/20 dark:bg-[#292929] dark:text-white dark:focus:border-blue-300 dark:focus:ring-blue-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-3.5 text-brand-400 hover:text-brand-600 transition disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center text-sm">
                <label className="checkbox-label group flex cursor-pointer select-none items-center gap-2.5 transition">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="peer sr-only"
                  />
                  <span className="remember-box" aria-hidden="true" />
                  <span className="transition-transform duration-200 group-active:translate-x-0.5">Ingat saya</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-submit w-full bg-brand-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="login-divider-label px-2 bg-white text-brand-500 dark:bg-[#1e1e1e] dark:text-blue-300">atau</span>
              </div>
            </div>

            <Link
              to="/signup"
              className="login-signup-link flex w-full items-center justify-center rounded-lg border-2 border-brand-700 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
            >
              Daftar dengan Email
            </Link>

            <p className="text-center text-sm text-brand-600 mt-6">Lupa password? <a href="#" onClick={(event) => event.preventDefault()} className="font-semibold hover:text-brand-700">Pulihkan di sini</a></p>
          </div>

          <div className="login-footer mt-8 space-y-2 text-center text-xs text-slate-600">
            <p>© 2026 Gakuren — Sistem Manajemen Sekolah</p>
            <div className="flex items-center justify-center gap-5">
              <a href="#" onClick={(event) => event.preventDefault()} className="font-medium hover:text-brand-700">Kebijakan Privasi</a>
              <a href="#" onClick={(event) => event.preventDefault()} className="font-medium hover:text-brand-700">Syarat Layanan</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

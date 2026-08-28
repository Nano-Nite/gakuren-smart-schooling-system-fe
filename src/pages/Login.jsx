import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { loginUser } from '../utils/api'

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
      
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login gagal. Silakan coba lagi.')
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setEmail('admin@yopmail.com')
    setPassword('test123')
  }

  return (
    <>
      <Helmet>
        <title>Login — Gakuren</title>
        <meta name="description" content="Masuk ke akun Gakuren Anda" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-brand-900 mb-2">Gakuren</h1>
            <p className="text-brand-600">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          <div className="bg-white rounded-2xl shadow-panel p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brand-900 mb-2">
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
                    className="w-full pl-10 pr-4 py-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brand-900 mb-2">
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
                    className="w-full pl-10 pr-12 py-3 border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:bg-gray-50 disabled:cursor-not-allowed"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-brand-600 cursor-pointer hover:text-brand-700 transition">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 rounded border-brand-300 disabled:cursor-not-allowed"
                  />
                  Ingat saya
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-brand-600 hover:text-brand-700 font-medium transition"
                >
                  Lupa password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
                <span className="px-2 bg-white text-brand-500">atau</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full border-2 border-brand-300 text-brand-600 hover:bg-brand-50 font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Coba Demo
            </button>

            <p className="text-center text-sm text-brand-600 mt-6">
              Belum punya akun?{' '}
              <a href="#" className="text-brand-600 font-semibold hover:text-brand-700 transition">
                Daftar di sini
              </a>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-brand-500 space-y-1">
            <p>© 2026 Gakuren — Sistem Manajemen Sekolah</p>
            <p className="space-x-4">
              <a href="#" className="hover:text-brand-600 transition">Kebijakan Privasi</a>
              <a href="#" className="hover:text-brand-600 transition">Syarat Layanan</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

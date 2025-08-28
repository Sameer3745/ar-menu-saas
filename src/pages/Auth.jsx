 import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Loader2, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const urlParams = new URLSearchParams(window.location.search)
      const isResetFlow = urlParams.has('type') && urlParams.get('type') === 'recovery'

      if (session && !isResetFlow) {
        navigate('/dashboard')
      }
    }
    checkSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard')
      }
    })

    return () => {
      subscription?.subscription?.unsubscribe()
    }
  }, [navigate])

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        navigate('/dashboard')
      }
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setMessage(signUpError.message)
      } else {
        if (signUpData?.user) {
          const { user } = signUpData
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, email: user.email, name: '' }])
          if (profileError) console.error('Profile insert error:', profileError)
        }
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) setMessage(loginError.message)
        else navigate('/dashboard')
      }
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) {
      setMessage('Please enter your email to reset password')
      return
    }

    const redirectTo = window.location.hostname.includes('localhost')
      ? 'http://localhost:5173/update-password'
      : 'https://ar-menu-saas.vercel.app/update-password'

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) setMessage(error.message)
    else setMessage('Password reset email sent!')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-10 sm:p-12 border border-white/40 flex flex-col items-center">
        
        <div className="bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mb-6 shadow-lg">
          <span className="text-white font-bold text-xl">AR</span>
        </div>

        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isLogin ? 'Login to manage your restaurant menu' : 'Sign up to start your AR menu journey'}
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4 w-full">
          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white shadow-sm">
            <Mail className="text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-3 focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              required
              autoComplete="email"
            />
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white shadow-sm relative">
            <Lock className="text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-3 focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black cursor-pointer p-0 bg-transparent border-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {isLogin && (
            <p
              onClick={handleForgotPassword}
              className="text-left text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Forgot password?
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 active:bg-purple-800 transition disabled:opacity-60 shadow-md"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {message && (
          <p className="mt-6 text-center text-sm text-red-600 font-medium">
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-black font-medium text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMessage('')
              setIsLogin(!isLogin)
            }}
            className="text-purple-700 font-semibold hover:text-purple-900 underline-offset-2 hover:underline focus:outline-none bg-transparent p-0"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  )
}

 import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Loader2, Mail, Lock, LogIn, UserPlus } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      // No auto navigation here
    }
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // No auto navigation here
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

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
      // Signup flow with profile insert
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setMessage(signUpError.message)
      } else {
        if (signUpData?.user) {
          const { user } = signUpData
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user.id,
                email: user.email,
                name: '', // agar tumhara signup me name field nahi to blank chod do
                // baaki columns jaisa address, phone agar hai to yahan add kar sakte ho
              }
            ])
          if (profileError) {
            console.error('Profile insert error:', profileError)
          }
        }
        // Signup ke baad turant login karwana
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          setMessage(loginError.message)
        } else {
          navigate('/dashboard')
        }
      }
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
    // Redirect automatically on success
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

      <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-10 sm:p-12 border border-white/40">
        
        <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isLogin ? 'Login to manage your restaurant menu' : 'Sign up to start your AR menu journey'}
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-100 active:bg-gray-200 transition disabled:opacity-60 mb-6 shadow-sm"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <div className="flex items-center my-4">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
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
          <div className="flex items-center border border-gray-300 rounded-lg px-3 bg-white shadow-sm">
            <Lock className="text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-3 focus:outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          
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

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { MapPin, Camera, Users } from 'lucide-react'
import { authApi, LoginCredentials, RegisterCredentials } from '../services/api'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { login } = useAuthStore()

  const loginForm = useForm<LoginCredentials>()
  const registerForm = useForm<RegisterCredentials>()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.data.user, data.data.token)
      toast.success('Welcome back!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed')
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.data.user, data.data.token)
      toast.success('Account created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Registration failed')
    },
  })

  const onLoginSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data)
  }

  const onRegisterSubmit = (data: RegisterCredentials) => {
    registerMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            AI Travel Memory Mapper
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your travel photos into intelligent, searchable memories with AI-powered location and people recognition.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-700">
              <MapPin className="text-primary-600" size={24} />
              <span>Automatic location mapping from photo metadata</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <Camera className="text-primary-600" size={24} />
              <span>AI-powered photo analysis and tagging</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-700">
              <Users className="text-primary-600" size={24} />
              <span>Smart people recognition and clustering</span>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="card p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Sign in to access your travel memories' : 'Start mapping your travel memories'}
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email"
                  {...loginForm.register('email', { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter your password"
                  {...loginForm.register('password', { required: true })}
                />
              </div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary w-full"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your full name"
                  {...registerForm.register('name', { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email"
                  {...registerForm.register('email', { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Create a password"
                  {...registerForm.register('password', { required: true, minLength: 6 })}
                />
              </div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="btn-primary w-full"
              >
                {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
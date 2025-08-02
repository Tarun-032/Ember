"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Heart, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { email, password } = formData
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (data.user) {
      router.push("/dashboard")
    } else {
      setError("Login failed. Please try again.")
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" })
    setLoading(false)
    if (error) setError(error.message)
    // On success, Supabase will redirect automatically
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Back to home link - positioned absolutely */}
      <Link
        href="/"
        className="absolute top-8 left-8 inline-flex items-center text-gray-600 hover:text-purple-600 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to home
      </Link>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-3xl w-full mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Branding */}
          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800"></div>

            {/* Animated background elements */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float"></div>
              <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-white/10 rounded-full blur-lg animate-float-delayed"></div>
            </div>

            <div className="relative z-10 flex flex-col justify-center items-center text-center p-8 h-full text-white">
              <div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">ember</h1>
                <p className="text-lg text-white/90 leading-relaxed max-w-xs">Your AI companion for mental wellness</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-1/2 flex flex-col justify-center p-6 sm:p-8">
            <div className="w-full">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ember
                </span>
              </div>

              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                <p className="text-sm text-gray-600">Sign in to continue your wellness journey</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="rememberMe" className="text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-red-600 text-sm text-center">{error}</div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 text-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </form>

              {/* Sign up link */}
              <p className="text-center mt-4 text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

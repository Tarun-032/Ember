"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Heart, Home, User, Clock, Settings, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Profile",
    icon: User,
    url: "/dashboard/profile",
  },
  {
    title: "Sessions",
    icon: Clock,
    url: "/dashboard/sessions",
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
    isActive: true,
  },
]

function AppSidebar() {
  return (
    <Sidebar
      className="border-r-0 bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100"
      style={{ width: "80px" }}
    >
      <SidebarHeader className="p-4 border-b-0">
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-5 h-5 text-white" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                    className={`group justify-center px-3 py-4 text-gray-600 hover:text-gray-900 rounded-xl transition-all duration-300 font-medium hover:bg-white/30 data-[active=true]:bg-gradient-to-r data-[active=true]:from-violet-500 data-[active=true]:to-purple-500 data-[active=true]:text-white data-[active=true]:shadow-lg h-12 w-12 mx-auto`}
                  >
                    <Link href={item.url} className="flex items-center justify-center w-full h-full">
                      <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-0 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
              className="group w-full justify-center px-3 py-3 text-gray-600 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 font-medium"
            >
              <Link href="/" className="flex items-center justify-center w-full">
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>("")
  const [userInitial, setUserInitial] = useState<string>("U")
  const [necessaryCookies, setNecessaryCookies] = useState(true)
  const [analyticsCookies, setAnalyticsCookies] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true) // Add loading state for user info

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  // Load user information and cookie preferences on component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      setIsLoadingUser(true)
      try {
        // First try to get user info from Supabase session (primary source)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.email) {
          const email = session.user.email
          setUserEmail(email)
          setUserInitial(email.charAt(0).toUpperCase())
          console.log("✅ Loaded user email from Supabase session:", email)
        } else {
          // Fallback: try localStorage
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser)
              const email = user.email || "user@example.com"
              setUserEmail(email)
              setUserInitial(email.charAt(0).toUpperCase())
              console.log("✅ Loaded user email from localStorage:", email)
            } catch (error) {
              console.error("Error parsing stored user data:", error)
              setUserEmail("user@example.com")
              setUserInitial("U")
            }
          } else {
            console.log("ℹ️ No user session or stored data found, using placeholder")
            setUserEmail("user@example.com")
            setUserInitial("U")
          }
        }
      } catch (error) {
        console.error("Error loading user info:", error)
        setUserEmail("user@example.com")
        setUserInitial("U")
      } finally {
        setIsLoadingUser(false)
      }
    }

    const loadCookiePreferences = () => {
      const cookiePrefs = localStorage.getItem('cookiePreferences')
      if (cookiePrefs) {
        try {
          const prefs = JSON.parse(cookiePrefs)
          setAnalyticsCookies(prefs.analytics || false)
        } catch (error) {
          console.error("Error loading cookie preferences:", error)
        }
      }
    }

    loadUserInfo()
    loadCookiePreferences()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user?.email) {
            const email = session.user.email
            setUserEmail(email)
            setUserInitial(email.charAt(0).toUpperCase())
            console.log("✅ Updated user email from auth state change:", email)
          }
        } else if (event === 'SIGNED_OUT') {
          setUserEmail("user@example.com")
          setUserInitial("U")
          console.log("ℹ️ User signed out, reset to placeholder")
        }
      }
    )

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Save cookie preferences to localStorage
  const saveCookiePreferences = (analytics: boolean) => {
    const preferences = {
      necessary: true, // Always true
      analytics: analytics
    }
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences))
  }

  const handleAnalyticsCookiesChange = (checked: boolean) => {
    setAnalyticsCookies(checked)
    saveCookiePreferences(checked)
    
    // You can add analytics initialization/destruction logic here
    if (checked) {
      console.log("Analytics cookies enabled")
      // Initialize analytics (e.g., PostHog, Google Analytics)
    } else {
      console.log("Analytics cookies disabled")
      // Disable analytics tracking
    }
  }

  const handleResetChatHistory = async () => {
    if (!window.confirm("Are you sure you want to reset your chat history? This action cannot be undone and will delete ALL your sessions.")) {
      return
    }

    setIsLoading(true)
    try {
      // First get all sessions
      const response = await fetch(`${BACKEND_URL}/sessions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`)
      }

      const data = await response.json()
      const sessions = data.sessions || []

      if (sessions.length === 0) {
        alert("No chat history found to reset.")
        return
      }

      // Extract all session IDs
      const sessionIds = sessions.map((session: any) => session.session_id)

      // Delete all sessions using batch delete
      const deleteResponse = await fetch(`${BACKEND_URL}/sessions/batch`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_ids: sessionIds })
      })

      if (deleteResponse.ok) {
        const result = await deleteResponse.json()
        alert(`Successfully reset chat history. Deleted ${result.deleted_sessions?.length || sessionIds.length} sessions.`)
      } else {
        throw new Error(`Failed to delete sessions: ${deleteResponse.status}`)
      }
    } catch (error) {
      console.error("Error resetting chat history:", error)
      alert("Failed to reset chat history. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmMessage = "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including all chat sessions."
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    // Double confirmation for account deletion
    const doubleConfirm = window.confirm("This is your final warning. Deleting your account will remove all your data permanently. Are you absolutely sure?")
    if (!doubleConfirm) {
      return
    }

    setIsLoading(true)
    try {
      // First delete all sessions
      const sessionsResponse = await fetch(`${BACKEND_URL}/sessions`)
      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json()
        const sessions = data.sessions || []
        
        if (sessions.length > 0) {
          const sessionIds = sessions.map((session: any) => session.session_id)
          await fetch(`${BACKEND_URL}/sessions/batch`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_ids: sessionIds })
          })
        }
      }

      // Delete the user account from the backend
      // Debug: Check all available tokens
      console.log("=== TOKEN DEBUG ===")
      const localToken = localStorage.getItem('token')
      const sessionToken = sessionStorage.getItem('token')
      console.log("Local storage token:", localToken ? `exists (${localToken.substring(0, 20)}...)` : "null")
      console.log("Session storage token:", sessionToken ? `exists (${sessionToken.substring(0, 20)}...)` : "null")
      
      // Check all localStorage keys
      console.log("All localStorage keys:", Object.keys(localStorage))
      console.log("All sessionStorage keys:", Object.keys(sessionStorage))
      
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      const supabaseToken = session?.access_token
      console.log("Supabase token:", supabaseToken ? `exists (${supabaseToken.substring(0, 20)}...)` : "null")
      console.log("Supabase user:", session?.user?.email || "no user")
      
      // Try to use any available token
      const token = localToken || sessionToken || supabaseToken
      console.log("Using token:", token ? `exists (${token.substring(0, 20)}...)` : "NONE FOUND")
      console.log("=================")
      
      if (token) {
        console.log("Attempting to delete user account...")
        const deleteResponse = await fetch(`${BACKEND_URL}/user/delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!deleteResponse.ok) {
          console.error('Failed to delete user from backend:', deleteResponse.status)
          const errorText = await deleteResponse.text()
          console.error('Backend error:', errorText)
          alert(`Failed to delete account from backend: ${deleteResponse.status}. Please try again or contact support.`)
          return
        } else {
          const result = await deleteResponse.json()
          console.log('User deletion result:', result)
          
          // Provide detailed feedback about what was deleted
          const deletedFromCustom = result.deleted_from_custom
          const deletedFromAuth = result.deleted_from_auth
          
          let message = "Account deletion completed.\n\n"
          
          if (deletedFromCustom && deletedFromAuth) {
            message += "✅ Your account has been completely removed from our system.\n"
            message += "✅ Your authentication data has also been removed.\n"
            message += "You will not be able to log in with these credentials again."
          } else if (deletedFromCustom && !deletedFromAuth) {
            message += "✅ Your account data has been removed from our system.\n"
            message += "⚠️ Note: Your login credentials may still exist in the authentication system.\n"
            message += "If you can still log in after this, please contact support for complete removal."
          } else {
            message += "⚠️ Account deletion may not have completed fully.\n"
            message += "Please contact support for assistance."
          }
          
          console.log('Deletion details:', {
            deletedFromCustom,
            deletedFromAuth,
            message: result.message
          })
        }
      } else {
        console.error('No authentication token found')
        console.error('This might be because:')
        console.error('1. You are not logged in')
        console.error('2. Your session has expired')
        console.error('3. There is a mismatch between frontend and backend authentication')
        console.error('Please try logging out and logging back in.')
        alert('Authentication error. No valid token found. Please log out and log back in, then try deleting your account.')
        return
      }

      // Clear all local storage
      localStorage.clear()
      sessionStorage.clear()

      // Clear any cookies (if using cookie-based auth)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })

      alert("Your account deletion process is complete. You will now be redirected to the home page.")
      
      // Redirect to landing page
      router.push("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Failed to delete account. Please try again or contact support.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    console.log("Redirecting to upgrade page...")
    // You can implement upgrade logic here
    alert("Upgrade functionality coming soon!")
  }

  return (
    <div className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
      <SidebarProvider>
        <div className="flex h-full w-full bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
            {/* Header */}
            <header className="flex h-16 items-center justify-end border-b border-violet-100/30 bg-white/20 backdrop-blur-xl px-6 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                <span className="text-white text-sm font-semibold">{userInitial}</span>
              </div>
            </header>

            {/* Main Content - FIXED SCROLLING */}
            <main className="flex-1 overflow-hidden bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
              <div className="h-full overflow-y-auto bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
                <div className="min-h-screen px-6 py-8 bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100" style={{ marginLeft: "10px", paddingBottom: "120px", marginRight: "175px" }}>
                  {/* User Profile Section */}
                  <div className="flex items-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg mr-4">
                      <span className="text-white text-xl font-semibold">{userInitial}</span>
                    </div>
                    <div>
                      {isLoadingUser ? (
                        <div className="animate-pulse">
                          <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-900 font-medium">{userEmail}</p>
                          <p className="text-gray-500 text-sm">
                            {userEmail === "user@example.com" ? "Demo account" : "Manage your account settings"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy Settings</h2>
                    <p className="text-gray-600 text-sm mb-6">Manage your cookie and tracking preferences</p>

                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">Necessary Cookies</h3>
                          <p className="text-gray-600 text-sm">
                            Required for the website to function properly, cannot be disabled.
                          </p>
                        </div>
                        <Switch
                          checked={necessaryCookies}
                          onCheckedChange={() => {}} // No-op since it's disabled
                          disabled={true}
                          className="ml-4"
                        />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">Analytics Cookies</h3>
                          <p className="text-gray-600 text-sm">
                            Help us understand how visitors interact with our website using analytics tools.
                          </p>
                        </div>
                        <Switch 
                          checked={analyticsCookies} 
                          onCheckedChange={handleAnalyticsCookiesChange} 
                          className="ml-4"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Usage Analytics - On Hold */}
                  <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Usage Analytics</h2>
                    <p className="text-gray-600 text-sm mb-6">How much you've used Ember</p>

                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-violet-100/50">
                      <div className="mb-6">
                        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          Free Tier
                        </span>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 font-medium">Chat Sessions</span>
                            <span className="text-gray-600 text-sm">Coming Soon</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 font-medium">Voice Interactions</span>
                            <span className="text-gray-600 text-sm">Coming Soon</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleUpgrade}
                        disabled
                        className="mt-6 bg-gray-400 text-white font-medium px-6 py-2 rounded-lg shadow-md cursor-not-allowed"
                      >
                        Upgrade (Coming Soon)
                      </Button>
                    </div>
                  </div>

                  {/* DANGER ZONE - FULLY INCLUDED */}
                  <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Danger Zone</h2>
                    <p className="text-gray-600 text-sm mb-6">Be careful with these settings</p>

                    <div className="space-y-8">
                      {/* Reset Chat History */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-violet-100/50">
                        <Button
                          onClick={handleResetChatHistory}
                          disabled={isLoading}
                          variant="outline"
                          className="mb-4 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Resetting..." : "Reset Chat History"}
                        </Button>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          This will delete all of your previous conversations and sessions. You will start from a clean slate and 
                          EmberLanding will not remember what you've talked about earlier.
                        </p>
                      </div>

                      {/* Delete Account */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-red-200/50">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="mb-4 bg-red-500 hover:bg-red-600 text-white border-0 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                        >
                          {isLoading ? "Deleting..." : "Delete Account"}
                        </Button>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          This will permanently delete your account and all associated data including all chat sessions. 
                          This action cannot be undone and you will be logged out immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Extra spacing at bottom to ensure scrolling works */}
                  <div className="h-20"></div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

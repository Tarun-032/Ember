"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Heart, Home, User, Clock, Settings, LogOut } from "lucide-react"
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
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"

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
    isActive: true,
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
  },
]

interface SessionDetail {
  id: number
  session_id: string
  title: string
  preview: string
  created_at: string
  conversation: string[]
  status: string
  summary?: string
  struggles?: string[]
  observations?: string[]
  tips?: string[]
  summary_generated?: boolean
  summary_generated_at?: string
}

interface SessionSummary {
  summary_exists: boolean
  summary?: string
  struggles?: string[]
  observations?: string[]
  tips?: string[]
  generated_at?: string
}

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

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationRef = useRef<HTMLDivElement>(null)

  const BACKEND_URL = "http://localhost:8000"

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail()
    }
  }, [sessionId])

  // Auto-scroll to bottom of conversation when session loads
  useEffect(() => {
    if (session && conversationRef.current) {
      const element = conversationRef.current
      console.log('Conversation scrolling:', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        shouldScroll: element.scrollHeight > element.clientHeight
      })
      element.scrollTop = element.scrollHeight
    }
  }, [session])

  // Fetch summary when session is loaded and completed
  useEffect(() => {
    if (session && session.status === 'ended') {
      if (session.summary_generated) {
        fetchSessionSummary()
      } else {
        // Poll for summary generation if session just ended
        const pollForSummary = async () => {
          let attempts = 0
          const maxAttempts = 12 // 60 seconds total (5 second intervals)
          
          const poll = async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/summary`)
              if (response.ok) {
                const data = await response.json()
                if (data.summary_exists) {
                  setSessionSummary(data)
                  return true // Stop polling
                }
              }
              return false // Continue polling
            } catch (error) {
              console.error('Error polling for summary:', error)
              return false
            }
          }
          
          const pollInterval = setInterval(async () => {
            attempts++
            const summaryReady = await poll()
            
            if (summaryReady || attempts >= maxAttempts) {
              clearInterval(pollInterval)
              if (!summaryReady) {
                // Summary generation might have failed, show the manual button
                setSessionSummary({ summary_exists: false })
              }
              setSummaryLoading(false)
            }
          }, 5000) // Poll every 5 seconds
          
          // Also check immediately
          setSummaryLoading(true)
          const summaryReady = await poll()
          if (summaryReady) {
            clearInterval(pollInterval)
            setSummaryLoading(false)
          }
        }
        
        pollForSummary()
      }
    }
  }, [session])

  const fetchSessionDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
      } else {
        throw new Error('Failed to fetch session details')
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
      setError('Failed to load session details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/summary`)
      if (response.ok) {
        const data = await response.json()
        setSessionSummary(data)
      } else if (response.status === 404) {
        setSessionSummary({ summary_exists: false })
      } else {
        throw new Error('Failed to fetch session summary')
      }
    } catch (error) {
      console.error('Error fetching session summary:', error)
      setSessionSummary({ summary_exists: false })
    } finally {
      setSummaryLoading(false)
    }
  }

  const generateSummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, force_regenerate: false })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.summary_generated) {
          await fetchSessionSummary()
        }
      } else {
        throw new Error('Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const parseConversation = (conversation: string[]) => {
    return conversation.map((entry, index) => {
      if (entry.startsWith('User:')) {
        return {
          type: 'user',
          content: entry.substring(5).trim(),
          id: index
        }
      } else if (entry.startsWith('Assistant:') || entry.startsWith('Ember:')) {
        const prefix = entry.startsWith('Assistant:') ? 'Assistant:' : 'Ember:'
        return {
          type: 'assistant',
          content: entry.substring(prefix.length).trim(),
          id: index
        }
      }
      return {
        type: 'system',
        content: entry,
        id: index
      }
    }).filter(entry => entry.content.length > 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-transparent">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-violet-100/30 bg-white/20 backdrop-blur-xl px-6 sticky top-0 z-10">
              <Link
                href="/dashboard/sessions"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Sessions</span>
              </Link>
              
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </header>            {/* Main Content */}
            <main className="flex-1 bg-transparent">
              <div className="w-full max-w-4xl mx-auto px-6 py-8 pb-16" style={{ marginLeft: "90px" }}>
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading session details...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button 
                      onClick={fetchSessionDetail}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Session Detail */}
                {!loading && !error && session && (
                  <>
                    {/* Session Header */}
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.title}</h1>
                      <p className="text-gray-600">{formatDate(session.created_at)}</p>
                      <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          session.status === 'ended' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status === 'ended' ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Conversation */}
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversation History</h2>
                      <div 
                        ref={conversationRef}
                        className="bg-white/30 backdrop-blur-sm rounded-xl p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent"
                      >
                        <div className="space-y-4">
                          {parseConversation(session.conversation).map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                  message.type === 'user'
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                    : 'bg-white/70 backdrop-blur-sm text-gray-800 shadow-sm'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Session Stats */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Messages</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {parseConversation(session.conversation).length}
                          </p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                          <h3 className="text-sm font-medium text-gray-600 mb-1">Session Duration</h3>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.ceil(parseConversation(session.conversation).length / 2)} exchanges
                          </p>
                        </div>
                      </div>

                      {/* Session Summary Section */}
                      {session.status === 'ended' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-violet-100/50 mb-8">
                          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg mr-3"></div>
                            Session Summary
                          </h2>

                          {summaryLoading && (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                              <p className="text-gray-600 mt-2">Generating AI-powered insights...</p>
                              <p className="text-gray-500 text-sm mt-1">This may take up to 60 seconds</p>
                            </div>
                          )}

                          {!summaryLoading && sessionSummary?.summary_exists && (
                            <div className="space-y-6">
                              {/* Summary Overview */}
                              <div className="bg-white/40 rounded-lg p-4 border border-gray-200/50">
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                  <div className="w-5 h-5 bg-blue-500 rounded mr-2 flex items-center justify-center">
                                    <span className="text-white text-xs">📝</span>
                                  </div>
                                  Summary
                                </h3>
                                <p className="text-gray-700 leading-relaxed">{sessionSummary.summary}</p>
                              </div>

                              {/* Struggles */}
                              {sessionSummary.struggles && sessionSummary.struggles.length > 0 && (
                                <div className="bg-white/40 rounded-lg p-4 border border-gray-200/50">
                                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-5 h-5 bg-red-500 rounded mr-2 flex items-center justify-center">
                                      <span className="text-white text-xs">⚠️</span>
                                    </div>
                                    Struggles
                                  </h3>
                                  <ul className="space-y-3">
                                    {sessionSummary.struggles.map((struggle, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{struggle}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Observations */}
                              {sessionSummary.observations && sessionSummary.observations.length > 0 && (
                                <div className="bg-white/40 rounded-lg p-4 border border-gray-200/50">
                                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-5 h-5 bg-blue-500 rounded mr-2 flex items-center justify-center">
                                      <span className="text-white text-xs">👁️</span>
                                    </div>
                                    Observations
                                  </h3>
                                  <ul className="space-y-3">
                                    {sessionSummary.observations.map((observation, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{observation}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Tips/Recommendations */}
                              {sessionSummary.tips && sessionSummary.tips.length > 0 && (
                                <div className="bg-white/40 rounded-lg p-4 border border-gray-200/50">
                                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <div className="w-5 h-5 bg-green-500 rounded mr-2 flex items-center justify-center">
                                      <span className="text-white text-xs">💡</span>
                                    </div>
                                    Homework
                                  </h3>
                                  <ul className="space-y-3">
                                    {sessionSummary.tips.map((tip, index) => (
                                      <li key={index} className="flex items-start">
                                        <span className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {sessionSummary.generated_at && (
                                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200/50 text-center">
                                  Summary generated on {formatDate(sessionSummary.generated_at)}
                                </div>
                              )}
                            </div>
                          )}

                          {!summaryLoading && !sessionSummary?.summary_exists && (
                            <div className="text-center py-6">
                              <p className="text-gray-600 mb-4">
                                No summary available yet for this session.
                              </p>
                              <button
                                onClick={generateSummary}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
                              >
                                Generate Summary
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

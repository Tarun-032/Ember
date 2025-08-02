"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Heart, Home, User, Clock, MessageSquare, Settings, LogOut, Trash2, Check, Square } from "lucide-react"
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
import { useRouter } from "next/navigation"

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

interface Session {
  id: number
  session_id: string
  title: string
  preview: string
  created_at: string
  conversation: string[]
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
                <SidebarMenuItem key={item.title}>                  <SidebarMenuButton
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

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  const BACKEND_URL = "http://localhost:8000"

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${BACKEND_URL}/sessions`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        console.log('Fetched sessions:', data.sessions)
      } else {
        console.error('Failed to fetch sessions:', response.status, response.statusText)
        throw new Error(`Failed to fetch sessions (${response.status})`)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError('Failed to load sessions. Please make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleSessionClick = (sessionId: string) => {
    if (isSelectionMode) {
      toggleSessionSelection(sessionId)
    } else {
      router.push(`/dashboard/sessions/${sessionId}`)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const selectAllSessions = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.session_id)))
    }
  }

  const clearSelection = () => {
    setSelectedSessions(new Set())
    setIsSelectionMode(false)
  }

  const handleBatchDelete = async () => {
    if (selectedSessions.size === 0) return

    const sessionCount = selectedSessions.size
    if (!confirm(`Are you sure you want to delete ${sessionCount} session${sessionCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }

    try {
      setBatchDeleting(true)
      const sessionIds = Array.from(selectedSessions)
      
      const response = await fetch(`${BACKEND_URL}/sessions/batch`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_ids: sessionIds })
      })

      if (response.ok) {
        const result = await response.json()
        // Remove the deleted sessions from the local state
        setSessions(prevSessions => 
          prevSessions.filter(session => !selectedSessions.has(session.session_id))
        )
        setSelectedSessions(new Set())
        setIsSelectionMode(false)
        console.log('Sessions deleted successfully:', result)
      } else {
        console.error('Failed to delete sessions:', response.status, response.statusText)
        throw new Error(`Failed to delete sessions (${response.status})`)
      }
    } catch (error) {
      console.error('Error deleting sessions:', error)
      setError('Failed to delete sessions. Please try again.')
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setBatchDeleting(false)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent session click when deleting
    
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(sessionId)
      const response = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove the session from the local state
        setSessions(prevSessions => 
          prevSessions.filter(session => session.session_id !== sessionId)
        )
        console.log('Session deleted successfully')
      } else {
        console.error('Failed to delete session:', response.status, response.statusText)
        throw new Error(`Failed to delete session (${response.status})`)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      setError('Failed to delete session. Please try again.')
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).toLowerCase()
    } catch {
      return 'unknown date'
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100 overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-transparent">
            {/* Header */}
            <header className="flex h-16 items-center justify-end border-b border-violet-100/30 bg-white/20 backdrop-blur-xl px-6">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </header>            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-transparent">
              <div className="w-full max-w-4xl mx-auto px-6 py-8" style={{ marginLeft: "90px" }}>
                {/* Page Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">past sessions</h1>
                      <p className="text-gray-600">your previous conversations</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isSelectionMode ? (
                        <>
                          <button
                            onClick={() => setIsSelectionMode(true)}
                            disabled={loading || sessions.length === 0}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Select
                          </button>
                          <button
                            onClick={fetchSessions}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Loading...' : 'Refresh'}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">
                            {selectedSessions.size} selected
                          </span>
                          <button
                            onClick={selectAllSessions}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            {selectedSessions.size === sessions.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <button
                            onClick={handleBatchDelete}
                            disabled={selectedSessions.size === 0 || batchDeleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {batchDeleting ? 'Deleting...' : `Delete (${selectedSessions.size})`}
                          </button>
                          <button
                            onClick={clearSelection}
                            disabled={batchDeleting}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading sessions...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button 
                      onClick={fetchSessions}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Sessions List - Scrollable Container */}
                {!loading && !error && (
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
                    {sessions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-purple-600" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
                        <p className="text-gray-600 mb-6">Start a voice conversation to create your first session!</p>
                        <Link
                          href="/dashboard/voice"
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Start Voice Session
                        </Link>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <div
                          key={session.session_id}
                          onClick={() => handleSessionClick(session.session_id)}
                          className={`group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-violet-100/50 hover:shadow-lg hover:bg-white/80 transition-all duration-300 cursor-pointer ${
                            isSelectionMode && selectedSessions.has(session.session_id) 
                              ? 'ring-2 ring-purple-500 bg-purple-50/70' 
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            {/* Selection Checkbox */}
                            {isSelectionMode && (
                              <div className="flex-shrink-0 mr-4 pt-1">
                                <div 
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                    selectedSessions.has(session.session_id)
                                      ? 'bg-purple-500 border-purple-500 text-white'
                                      : 'border-gray-300 hover:border-purple-400'
                                  }`}
                                >
                                  {selectedSessions.has(session.session_id) && (
                                    <Check className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                                <span className="text-sm text-gray-500">{formatDate(session.created_at)}</span>
                              </div>

                              {session.preview && (
                                <p className="text-gray-700 text-sm leading-relaxed pr-8">{session.preview}</p>
                              )}
                            </div>

                            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                              {/* Delete Button - Only show when not in selection mode */}
                              {!isSelectionMode && (
                                <button
                                  onClick={(e) => handleDeleteSession(session.session_id, e)}
                                  disabled={deletingId === session.session_id}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete session"
                                >
                                  {deletingId === session.session_id ? (
                                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              
                              {/* Chevron Arrow - Only show when not in selection mode */}
                              {!isSelectionMode && (
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all duration-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

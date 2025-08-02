"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Mic, X, Send, Heart, Home, User, Clock, Settings, LogOut, ChevronDown } from "lucide-react"
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
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/dashboard/settings",
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
                    isActive={item.title === "Home"}
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

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ember'
  timestamp: Date
}

export default function TextModePage() {
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "oh hi there—what's on your mind today?",
      sender: 'ember',
      timestamp: new Date()
    }
  ])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  const BACKEND_URL = "http://localhost:8000"

  // Initialize session when component mounts
  useEffect(() => {
    startSession()
    
    // Auto-save session before page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId && chatMessages.length > 1) {
        // End the session properly to trigger summary generation
        endSession()
        // Optional: Show confirmation dialog for meaningful conversations
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (sessionId && chatMessages.length > 1 && !sessionEnded) {
        endSession()
      }
    }
  }, []) // Remove sessionId from dependency array to prevent infinite loop

  // Auto-save session progress every few messages
  useEffect(() => {
    if (chatMessages.length > 2 && (chatMessages.length - 1) % 4 === 0) { // Every 2 exchanges (4 total messages including initial greeting)
      saveSessionProgress()
    }
    
    // Reset inactivity timer on new messages
    resetInactivityTimer()
  }, [chatMessages.length])

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Auto-end session after 10 minutes of inactivity (if there's been meaningful conversation)
    if (sessionId && chatMessages.length > 1 && !sessionEnded) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Auto-ending session due to inactivity')
        endSession()
      }, 10 * 60 * 1000) // 10 minutes
    }
  }

  // Handle scroll events to show/hide scroll to bottom button
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      // Show button when user has scrolled up more than 200px from bottom
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200
      setShowScrollToBottom(!isNearBottom && chatMessages.length > 1)
    }

    chatContainer.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position
    return () => chatContainer.removeEventListener('scroll', handleScroll)
  }, [chatMessages.length])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 150
        
        // Only auto-scroll if user is near the bottom (to not interrupt manual scrolling)
        if (isNearBottom || chatMessages.length === 1) {
          chatContainerRef.current.scrollTo({
            top: scrollHeight,
            behavior: 'smooth'
          })
        } else {
          // If not auto-scrolling, show the scroll button
          setShowScrollToBottom(true)
        }
      }
    }

    // Delay scroll to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100) // Increased delay for more reliable DOM update
    return () => clearTimeout(timer)
  }, [chatMessages])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const startSession = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSessionId(data.session_id)
        console.log('Session started:', data.session_id)
      } else {
        throw new Error('Failed to start session')
      }
    } catch (error) {
      console.error('Error starting session:', error)
      setError('Failed to connect to server. Please check if the backend is running.')
    }
  }

  const endSession = async () => {
    if (!sessionId || sessionEnded) return
    
    try {
      console.log('Ending session:', sessionId)
      setSessionEnded(true)
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      
      const response = await fetch(`${BACKEND_URL}/end-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Session ended successfully:', data)
        if (data.summary_generated) {
          console.log('Summary was generated for session:', sessionId)
        }
      } else {
        const errorText = await response.text()
        console.error('Error ending session:', errorText)
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  const saveSessionProgress = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`${BACKEND_URL}/save-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
      
      if (response.ok) {
        console.log('Session progress saved')
      }
    } catch (error) {
      console.error('Error saving session progress:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const sendMessage = async (messageText: string) => {
    if (!sessionId) {
      setError('No active session. Please refresh the page.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Reset inactivity timer when user sends a message
      resetInactivityTimer()

      console.log('Sending message:', { session_id: sessionId, message: messageText })

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageText
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        // Add Ember's response to chat
        const emberMessage: ChatMessage = {
          id: Date.now().toString() + '_ember',
          content: data.response,
          sender: 'ember',
          timestamp: new Date()
        }
        
        setChatMessages(prev => [...prev, emberMessage])
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (message.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: Date.now().toString() + '_user',
        content: message.trim(),
        sender: 'user',
        timestamp: new Date()
      }
      
      // Add user message to chat immediately
      setChatMessages(prev => [...prev, userMessage])
      
      // Send to backend
      await sendMessage(message.trim())
      
      // Clear input
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleVoiceMode = () => {
    router.push("/dashboard/voice")
  }

  const handleCancel = async () => {
    // End the session before navigating away
    if (sessionId && chatMessages.length > 1) { // Only end if there's been some conversation
      await endSession()
      // Small delay to ensure session is properly saved
      setTimeout(() => {
        // Navigate to the specific session page to see the summary
        router.push(`/dashboard/sessions/${sessionId}`)
      }, 500)
    } else {
      router.push("/dashboard")
    }
  }

  const handleEndSession = async () => {
    if (sessionId && chatMessages.length > 1) {
      await endSession()
      // Small delay to ensure session is properly saved
      setTimeout(() => {
        // Navigate to the specific session page to see the summary
        router.push(`/dashboard/sessions/${sessionId}`)
      }, 500)
    } else {
      // If no meaningful conversation, just go to dashboard
      router.push("/dashboard")
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100 overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-transparent">
            {/* Header - Status and profile */}
            <header className="flex h-16 items-center justify-between border-b border-violet-100/30 bg-white/20 backdrop-blur-xl px-6">
              <div className="flex items-center space-x-4">
                {/* Session Status */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  sessionId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    sessionId ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>{sessionId ? 'Connected' : 'Disconnected'}</span>
                </div>

                {/* End Session Button */}
                {sessionId && chatMessages.length > 1 && (
                  <button
                    onClick={handleEndSession}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      isLoading 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    End Session
                  </button>
                )}

                {/* Error Display */}
                {error && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <span>⚠️ {error}</span>
                  </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Thinking...</span>
                  </div>
                )}
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </header>

            {/* Text Interface */}
            <main className="flex-1 flex flex-col bg-transparent overflow-hidden">
              {/* Chat area - Scrollable with proper spacing */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto" 
                style={{ 
                  marginLeft: "20px", 
                  paddingLeft: "2px", 
                  paddingRight: "220px", 
                  paddingTop: "20px",
                  paddingBottom: "120px", // Space for fixed input
                  height: "calc(100vh - 112px)", // 100vh minus header (64px) and input (48px)
                  maxHeight: "calc(100vh - 112px)",
                  minHeight: 0,
                  overflowY: "auto"
                }}
              >
                <div className="max-w-4xl mx-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'ember' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md mr-4 flex-shrink-0">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`rounded-2xl p-4 max-w-md shadow-md ${
                        msg.sender === 'ember' 
                          ? 'bg-white/70 backdrop-blur-sm' 
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                      } ${msg.sender === 'user' ? 'mr-4' : ''}`}>
                        <p className={msg.sender === 'ember' ? 'text-gray-800' : 'text-white'}>
                          {msg.content}
                        </p>
                        <span className={`text-xs mt-2 block ${
                          msg.sender === 'ember' ? 'text-gray-500' : 'text-purple-200'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {msg.sender === 'user' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center shadow-md ml-4 flex-shrink-0">
                          <span className="text-white text-sm font-semibold">U</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator for when Ember is typing */}
                  {isLoading && (
                    <div className="flex items-start mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md mr-4">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 max-w-md shadow-md">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scroll to bottom button */}
                {showScrollToBottom && (
                  <div className="fixed bottom-24 right-8 z-40 animate-bounce-slow">
                    <button
                      onClick={scrollToBottom}
                      className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-violet-100/50"
                      aria-label="Scroll to bottom"
                    >
                      <ChevronDown className="w-5 h-5" />
                      <span className="sr-only">Scroll to latest messages</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Fixed Input area at bottom */}
              <div className="fixed bottom-0 right-0 p-4 border-t border-violet-100/30 bg-white/20 backdrop-blur-xl z-50" style={{left: "80px"}}>
                <div className="max-w-4xl mx-auto flex items-end gap-2" style={{paddingRight: "20px"}}>
                  <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-3 border border-violet-100/50">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={handleInputChange}
                      placeholder={isLoading ? "Ember is thinking..." : "Type your message..."}
                      disabled={isLoading}
                      className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-500 max-h-32 disabled:opacity-50"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceMode}
                      disabled={isLoading}
                      className={`w-10 h-10 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
                      }`}
                    >
                      <Mic className="w-5 h-5 text-purple-600" />
                    </button>

                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || isLoading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all ${
                        message.trim() && !isLoading
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className={`w-10 h-10 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
                      }`}
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

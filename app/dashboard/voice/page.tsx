"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, X, MessageSquare, Heart, Home, User, Clock, Settings, LogOut, AlertCircle } from "lucide-react"
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

export default function VoiceModePage() {
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState("oh hi there—what's on your mind today?")
  const [visualizerValues, setVisualizerValues] = useState<number[]>(Array(20).fill(5))
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  
  const router = useRouter()
  const animationRef = useRef<number | undefined>(undefined)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const BACKEND_URL = "http://localhost:8000"

  // Initialize session when component mounts
  useEffect(() => {
    startSession()
    
    // End session when component unmounts or user navigates away
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId) {
        endSession()
      }
    }

    const handlePopState = () => {
      if (sessionId) {
        endSession()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      if (sessionId) {
        endSession()
      }
    }
  }, [])

  // Voice activity visualizer
  useEffect(() => {
    if (isListening && !isProcessing) {
      const updateVisualizer = () => {
        const newValues = visualizerValues.map(() => Math.max(5, Math.floor(Math.random() * 50)))
        setVisualizerValues(newValues)
        animationRef.current = requestAnimationFrame(updateVisualizer)
      }

      animationRef.current = requestAnimationFrame(updateVisualizer)

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }
    } else {
      // Reset visualizer when not listening
      setVisualizerValues(Array(20).fill(5))
    }
  }, [isListening, isProcessing])

  const startSession = async () => {
    try {
      console.log('Starting session with backend at:', BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Adding empty body to ensure proper POST request
        body: JSON.stringify({}),
      })
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data && data.session_id) {
          setSessionId(data.session_id);
          console.log('Session started:', data.session_id);
        } else {
          console.error('Missing session_id in response:', data);
          throw new Error('Invalid session response');
        }
      } else {
        // Get the error message from the response
        const errorText = await response.text();
        console.error('Failed response:', response.status, errorText);
        throw new Error(`Failed to start session (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}. Please check if the backend is running.`);
    }
  }

  const endSession = async () => {
    if (!sessionId) return
    
    try {
      const response = await fetch(`${BACKEND_URL}/end-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
      
      if (response.ok) {
        console.log('Session ended successfully')
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await sendAudioToBackend(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsListening(true)
      setMessage("I'm listening...")
      setError(null)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
      setIsProcessing(true)
      setMessage("Processing your request...")
    }
  }

  const sendAudioToBackend = async (audioBlob: Blob) => {
    if (!sessionId) {
      setError('No active session. Please refresh the page.')
      setIsProcessing(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.wav')
      formData.append('session_id', sessionId)

      const response = await fetch(`${BACKEND_URL}/run-model`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(data.response_text)

        // Play the generated audio
        if (data.audio_file) {
          playAudioResponse(data.audio_file)
        }

        // Update conversation history
        await fetchConversationHistory()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to process audio')
      }
    } catch (error) {
      console.error('Error sending audio:', error)
      setError(error instanceof Error ? error.message : 'Failed to process your request')
      setMessage("Sorry, I couldn't process that. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudioResponse = async (audioFileName: string) => {
    try {
      const audioUrl = `${BACKEND_URL}/audio-files/${audioFileName}`
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('Error playing audio response:', error)
    }
  }

  const fetchConversationHistory = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`${BACKEND_URL}/conversation-history/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error)
    }
  }

  const toggleListening = () => {
    if (isProcessing) return // Don't allow interaction while processing
    
    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleTextMode = async () => {
    if (sessionId) {
      await endSession()
      setSessionId(null)
    }
    router.push("/dashboard/text")
  }

  const handleCancel = async () => {
    if (sessionId) {
      await endSession()
      setSessionId(null)
    }
    router.push("/dashboard")
  }

  const getStatusMessage = () => {
    if (error) return error
    if (isProcessing) return "Processing your request..."
    if (isListening) return "I'm listening..."
    return message
  }

  return (
    <div className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100 overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-transparent">
            {/* Header - Profile pic and status indicators */}
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
              </div>

              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </header>

            {/* Voice Interface */}
            <main className="flex-1 flex items-center justify-center bg-transparent">
              <div
                className="w-full max-w-2xl mx-auto px-6 flex flex-col items-center justify-center"
                style={{ marginLeft: "200px" }}
              >
                {/* "Your turn" text */}
                <p className="text-gray-800 font-medium mb-12 text-center">
                  {isProcessing ? "processing..." : "your turn"}
                </p>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 flex items-center space-x-2 px-4 py-2 bg-red-100 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Voice Visualization */}
                <div className="relative mb-12">
                  {/* Outer glow effect */}
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/30 to-indigo-400/30 blur-xl transform scale-110 transition-opacity duration-500 ${
                      isListening || isProcessing ? "opacity-100" : "opacity-0"
                    }`}
                  ></div>

                  {/* Main circle */}
                  <div
                    className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isProcessing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    } ${
                      isListening
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-300/50"
                        : isProcessing
                        ? "bg-gradient-to-r from-orange-400 to-yellow-400 shadow-lg shadow-orange-300/50"
                        : "bg-gradient-to-r from-purple-400 to-indigo-400 shadow-md"
                    }`}
                    onClick={toggleListening}
                  >
                    {/* Pulsing animation when listening or processing */}
                    {(isListening || isProcessing) && (
                      <div className={`absolute w-64 h-64 rounded-full ${
                        isProcessing ? 'bg-orange-400/20' : 'bg-purple-400/20'
                      } animate-ping`}></div>
                    )}

                    {/* Voice visualizer */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-end justify-center gap-1 h-32 w-32">
                        {visualizerValues.map((value, index) => (
                          <div
                            key={index}
                            className="w-1 bg-white/80 rounded-full transition-all duration-200"
                            style={{
                              height: `${value}px`,
                              opacity: isListening ? 0.8 : isProcessing ? 0.6 : 0.4,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response text */}
                <div className="text-center mb-8 max-w-lg w-full">
                  <div
                    className={`mx-auto ${error ? 'text-red-600' : 'text-gray-600'} text-base rounded-lg p-3 shadow-inner leading-snug`}
                    style={{
                      maxHeight: '72px',
                      minHeight: '36px',
                      overflowY: 'auto',
                      wordBreak: 'break-word',
                      marginBottom: '0',
                      background: 'transparent',
                    }}
                  >
                    {getStatusMessage()}
                  </div>
                  {conversationHistory.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Conversation: {conversationHistory.length} exchanges
                    </div>
                  )}
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-center space-x-8">
                  <button
                    onClick={handleTextMode}
                    disabled={isProcessing}
                    className={`w-14 h-14 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
                    }`}
                  >
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </button>

                  <button
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
                      isProcessing ? 'cursor-not-allowed opacity-75' : 'hover:shadow-xl hover:scale-105'
                    } ${
                      isListening
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                        : isProcessing
                        ? "bg-gradient-to-r from-orange-500 to-yellow-500"
                        : "bg-gradient-to-r from-purple-500 to-indigo-500"
                    }`}
                    onClick={toggleListening}
                    disabled={isProcessing}
                  >
                    <Mic className="w-8 h-8" />
                  </button>

                  <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className={`w-14 h-14 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/90'
                    }`}
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </main>

            {/* Hidden audio element for playing responses */}
            <audio ref={audioRef} style={{ display: 'none' }} />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}

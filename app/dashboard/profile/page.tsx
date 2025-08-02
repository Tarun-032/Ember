"use client"

import { useState } from "react"
import {
  Heart,
  Home,
  User,
  Clock,
  Settings,
  LogOut,
  Camera,
  Mail,
  Calendar,
  Crown,
  Save,
  TrendingUp,
} from "lucide-react"
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
    isActive: true,
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
      className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100 overflow-hidden"
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

export default function ProfilePage() {
  const [customInstructions, setCustomInstructions] = useState(
    "Please respond with a calm and understanding tone, like a supportive therapist. Keep responses concise but warm."
  )
  const [voiceResponses, setVoiceResponses] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="h-screen bg-purple-75">
      <SidebarProvider>
        <div className="flex h-full w-full bg-purple-50">
          <AppSidebar />
          <div className="flex-1 h-full overflow-y-auto bg-purple-50" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            marginLeft: '-25px',
            marginRight: '20px',
            marginTop: '40px'
          }}>
            <div className="px-6 py-8 space-y-8 max-w-6xl min-h-full bg-purple-50">
              
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                <p className="text-gray-600">Manage your personal information and preferences</p>
              </div>

              {/* Profile Information Card */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="pb-6 p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                  <p className="text-gray-600 text-sm mt-1">Your personal details</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-white shadow-lg rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-white">JD</span>
                      </div>
                      <button className="absolute -bottom-2 -right-2 rounded-full p-2 h-9 w-9 shadow-md bg-gray-100 hover:bg-gray-200 transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                          <div className="text-lg font-medium text-gray-900">John Doe</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Username</label>
                          <div className="text-gray-900">@johndoe</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-700">john.doe@example.com</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-700">Member since Dec 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-bold text-violet-600 mb-2">24</div>
                    <div className="text-sm text-gray-600">Total Sessions</div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-bold text-violet-600 mb-2">7</div>
                    <div className="text-sm text-gray-600">Current Streak</div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                  <div className="p-6 text-center">
                    <div className="text-3xl font-bold text-violet-600 mb-2">3.2h</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
              </div>

              {/* Custom Instructions Card */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900">Custom Instructions</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Tell Ember how you'd like it to respond to you
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Instructions for Ember</label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full min-h-[120px] rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400 focus:outline-none p-3 resize-none"
                      placeholder="e.g., Speak like a calm therapist, keep responses short and supportive..."
                    />
                    <div className="flex justify-end">
                      <button className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                        <Save className="w-4 h-4" />
                        Save Instructions
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      These instructions help personalize Ember's responses to match your communication preferences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferences Card */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
                  <p className="text-gray-600 text-sm mt-1">Customize your Ember experience</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-900">Voice Responses</label>
                      <p className="text-xs text-gray-600">Enable audio responses from Ember</p>
                    </div>
                    <button 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        voiceResponses ? 'bg-violet-500' : 'bg-gray-200'
                      }`}
                      onClick={() => setVoiceResponses(!voiceResponses)}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          voiceResponses ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-900">Dark Mode</label>
                      <p className="text-xs text-gray-600">Switch to dark theme</p>
                    </div>
                    <button 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        darkMode ? 'bg-violet-500' : 'bg-gray-200'
                      }`}
                      onClick={() => setDarkMode(!darkMode)}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <Crown className="w-6 h-6 text-violet-500" />
                    Subscription Plan
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Your current plan and features</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-violet-100 text-violet-800 border border-violet-300 font-medium px-2 py-1 rounded-md text-xs">
                          Free Tier
                        </span>
                        <TrendingUp className="w-5 h-5 text-violet-500" />
                      </div>
                      <p className="text-sm text-gray-700">10 sessions per month • Basic features</p>
                      <p className="text-xs text-gray-600">Upgrade for unlimited sessions and premium features</p>
                    </div>
                    <button className="rounded-xl border border-violet-300 text-violet-700 hover:bg-violet-50 px-4 py-2 transition-colors">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
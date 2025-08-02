"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Heart,
  Home,
  User,
  Clock,
  Settings,
  Mic,
  MessageCircle,
  ChevronRight,
  Sparkles,
  LogOut,
  TrendingUp,
  Calendar,
  Lightbulb,
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
import { Button } from "@/components/ui/button"
import Link from "next/link"

const menuItems = [
  {
    title: "Home",
    icon: Home,
    url: "/dashboard",
    isActive: true,
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

// Change the AppSidebar function to remove borders and match background color
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

export default function DashboardPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const router = useRouter()

  const handleModeSelect = (mode: string) => {
    if (mode === "voice") {
      router.push("/dashboard/voice")
    } else if (mode === "text") {
      router.push("/dashboard/text")
    }
  }

  const quickActions = [
    {
      label: "Recent Sessions",
      icon: Calendar,
      action: () => console.log("View sessions"),
    },
    {
      label: "Check Progress",
      icon: TrendingUp,
      action: () => console.log("Check progress"),
    },
    {
      label: "Wellness Tips",
      icon: Lightbulb,
      action: () => console.log("Wellness tips"),
    },
  ]

  return (
    <div className="h-screen bg-gradient-to-br from-lavender-100 via-purple-50 to-violet-100 overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full w-full">
          <AppSidebar />
          <SidebarInset className="flex-1 flex flex-col bg-transparent">
            {/* Header */}
            <header className="flex h-16 items-center justify-end border-b border-violet-100/30 bg-white/20 backdrop-blur-xl px-6">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Welcome back!</p>
                  <p className="text-xs text-gray-500">Ready for your wellness journey?</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
                  <span className="text-white text-sm font-semibold">A</span>
                </div>
              </div>
            </header>

            {/* Main Content - Adjusted for perfect centering */}
            <main className="flex-1 flex items-center justify-center bg-transparent">
              <div className="w-full max-w-4xl mx-auto px-6" style={{ marginLeft: "100px" }}>
                <div className="space-y-8">
                  {/* Greeting Section */}
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good to see you</h1>
                      <p className="text-lg text-gray-600 font-light max-w-xl mx-auto">
                        How would you like to connect with Ember today?
                      </p>
                    </div>
                  </div>

                  {/* Mode Selection Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Voice Mode */}
                    <div
                      onClick={() => handleModeSelect("voice")}
                      className="group relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-violet-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Mic className="w-7 h-7 text-white" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">
                            Voice Mode
                          </h3>
                          <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                            Just speak, I'm all ears. Natural conversation flows better.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Text Mode */}
                    <div
                      onClick={() => handleModeSelect("text")}
                      className="group relative bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-violet-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <MessageCircle className="w-7 h-7 text-white" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-violet-700 transition-colors duration-300">
                            Text Mode
                          </h3>
                          <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                            Not in the talking mood? Sometimes writing helps process thoughts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h3>
                      <p className="text-sm text-gray-600">Jump right into your wellness journey</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={action.action}
                          variant="outline"
                          className="group relative bg-white/70 backdrop-blur-sm border-violet-200/60 text-violet-700 hover:text-violet-800 hover:bg-violet-50/80 hover:border-violet-300/60 rounded-full px-5 py-2 h-auto font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <action.icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
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

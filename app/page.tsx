"use client"

import { useState } from "react"
import {
  ChevronRight,
  Heart,
  Sparkles,
  Zap,
  Star,
  MessageCircle,
  Menu,
  X,
  Plus,
  Brain,
  Clock,
  Lock,
  Mic,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

export default function EmberLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Intelligent Emotional Analysis",
      description:
        "Advanced AI that recognizes emotional patterns and provides contextual support based on your unique mental state",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Always Available Support",
      description: "Round-the-clock mental health assistance that adapts to your schedule and timezone preferences",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personalized Wellness Plans",
      description: "Tailored mental health strategies that evolve with your progress and changing needs",
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Enterprise-Grade Privacy",
      description: "Military-level encryption ensures your most personal thoughts remain completely confidential",
      color: "from-purple-500 to-pink-500",
    },
  ]

  const testimonials = [
    {
      quote:
        "Ember helped me identify anxiety triggers I never noticed before. The insights are genuinely life-changing.",
      author: "Sarah Chen",
      role: "Product Manager",
      avatar: "SC",
    },
    {
      quote:
        "Unlike other apps, Ember actually understands context. It feels like talking to someone who truly gets it.",
      author: "Marcus Rodriguez",
      role: "Creative Director",
      avatar: "MR",
    },
    {
      quote:
        "The personalized coping strategies have transformed how I handle stress. It's like having a therapist in my pocket.",
      author: "Alex Thompson",
      role: "Software Engineer",
      avatar: "AT",
    },
  ]

  const faqs = [
    {
      question: "How does Ember understand my emotional state?",
      answer:
        "Ember uses advanced natural language processing and emotional intelligence algorithms to analyze the context, tone, and patterns in your conversations, providing personalized insights and support.",
    },
    {
      question: "Can Ember replace traditional therapy?",
      answer:
        "Ember is designed to complement, not replace, professional mental health care. We encourage users to work with licensed therapists for serious mental health concerns while using Ember for daily support and maintenance.",
    },
    {
      question: "What makes Ember different from other mental health apps?",
      answer:
        "Ember combines cutting-edge AI with evidence-based therapeutic techniques, offering truly personalized conversations rather than generic responses or pre-written content.",
    },
    {
      question: "How secure is my personal information?",
      answer:
        "We use end-to-end encryption, zero-knowledge architecture, and comply with HIPAA standards. Your conversations are never stored in plain text or shared with third parties.",
    },
    {
      question: "Is Ember available on mobile devices?",
      answer:
        "Yes! Ember works seamlessly across all platforms - iOS, Android, web, and desktop - with full synchronization across devices.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Fluid Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-100/30 via-white to-indigo-100/40"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-l from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-indigo-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-100/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-purple-100/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ember
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                How it works
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Reviews
              </a>
              <a href="#faq" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                FAQ
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg shadow-purple-500/25"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-xl border-t border-purple-100/50">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-700 font-medium">
                Features
              </a>
              <a href="#how-it-works" className="block text-gray-700 font-medium">
                How it works
              </a>
              <a href="#testimonials" className="block text-gray-700 font-medium">
                Reviews
              </a>
              <a href="#faq" className="block text-gray-700 font-medium">
                FAQ
              </a>
              <div className="pt-4 border-t border-purple-100 space-y-2">
                <Link href="/login" className="block w-full text-left text-gray-700 font-medium">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Left Content - Now takes 3/5 of the space */}
            <div className="relative z-10 lg:col-span-3">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200/50 text-purple-700 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Next-generation mental wellness
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your mind deserves
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  intelligent care
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Meet Ember, the AI companion that understands your mental health journey. Get personalized support,
                insights, and guidance that adapts to your unique needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/signup"
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center font-semibold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
                >
                  Start your journey
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-purple-200 text-gray-700 px-8 py-4 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 font-semibold">
                  Watch demo
                </button>
              </div>
            </div>

            {/* Right Content - Minimalist Voice Interface - Now takes 2/5 of the space */}
            <div className="relative lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl border border-purple-100/10 overflow-hidden max-w-sm mx-auto p-8">
                <div className="flex flex-col items-center justify-center h-full">
                  {/* "Your turn" text */}
                  <p className="text-gray-800 font-medium mb-8 text-center">your turn</p>

                  {/* Large Circle Button */}
                  <div
                    className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer mb-8 ${
                      isListening
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-300/50"
                        : "bg-gradient-to-r from-purple-400 to-indigo-400 shadow-md"
                    }`}
                    onClick={() => setIsListening(!isListening)}
                  >
                    {/* Pulsing animation when listening */}
                    {isListening && (
                      <div className="absolute w-48 h-48 rounded-full bg-purple-400/20 animate-ping"></div>
                    )}
                  </div>

                  {/* Response text */}
                  <p className="text-gray-600 text-center mb-12">
                    {isListening ? "I'm listening..." : "oh, hi there—what's on your mind today?"}
                  </p>

                  {/* Control buttons */}
                  <div className="flex items-center justify-center space-x-6">
                    <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </button>

                    <button
                      className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      onClick={() => setIsListening(!isListening)}
                    >
                      <Mic className="w-6 h-6" />
                    </button>

                    <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtle background elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 rounded-full bg-purple-200/20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why choose{" "}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Ember
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI technology meets compassionate care to deliver mental health support that truly understands
              you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-purple-100/50 hover:shadow-2xl hover:scale-105 transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How Ember works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Simple steps to better mental health</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Share your thoughts",
                description: "Open up about what's on your mind. Ember listens with empathy and without judgment.",
                icon: <MessageCircle className="w-8 h-8" />,
              },
              {
                step: "02",
                title: "Get personalized insights",
                description:
                  "Receive AI-powered analysis and tailored strategies based on your unique mental health patterns.",
                icon: <Brain className="w-8 h-8" />,
              },
              {
                step: "03",
                title: "Build lasting wellness",
                description: "Develop sustainable mental health habits with ongoing support and progress tracking.",
                icon: <Zap className="w-8 h-8" />,
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-purple-100/50 text-center hover:shadow-2xl transition-all duration-300">
                  <div className="text-6xl font-bold text-purple-200 mb-4">{item.step}</div>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>

                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-300 to-indigo-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">What people are saying</h2>
            <p className="text-xl text-gray-600">Real stories from real users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-purple-100/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about Ember</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-xl border border-purple-100/50 rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-purple-50/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  <div
                    className={`w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white transition-transform duration-300 ${openFaq === index ? "rotate-45" : ""}`}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed text-lg">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to transform your mental wellness?</h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands who've already discovered a better way to care for their mental health with Ember
            </p>
            <Link
              href="/signup"
              className="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl hover:scale-105 transform duration-300"
            >
              Start your free journey
            </Link>
            <p className="text-purple-200 text-sm mt-4">No credit card required • 7-day free trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-purple-100/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  ember
                </span>
              </div>
              <p className="text-gray-600 mb-4">Your AI companion for mental wellness and emotional growth</p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors cursor-pointer">
                  <span className="text-purple-600 font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors cursor-pointer">
                  <span className="text-purple-600 font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center hover:bg-purple-200 transition-colors cursor-pointer">
                  <span className="text-purple-600 font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Support</h4>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Help center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Contact us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Terms of service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Company</h4>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    About us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-purple-600 transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-purple-100 pt-8 text-center">
            <p className="text-gray-500">&copy; 2024 Ember. All rights reserved. Made with 💜 for mental wellness.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

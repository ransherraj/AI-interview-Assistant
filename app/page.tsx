'use client'

import { useState, useEffect, useRef } from "react"
import {
  Send,
  Bot,
  User,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeft,
  Plus,
  MessageSquare,
  X,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  Mic,
  MicOff
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
  time?: string
  reaction?: string
}

type ChatSession = {
  id: string
  title: string
  status?: string
  createdAt?: string
}

const MAX_SESSIONS = 20

function AmleefaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="amleefaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#amleefaGrad)" />
      <path d="M30 70 L50 30 L70 70 M38 56 L62 56" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="24" r="5" fill="#38BDF8" />
    </svg>
  )
}

export default function InterviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Initialize currentChatId directly from localStorage if present
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeChatId") || ""
    }
    return ""
  })
  const [chatList, setChatList] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  // Voice Recording / Speech-to-Text State
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const baseInputRef = useRef<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Dynamic Initial Welcome Reactions
  const getInitialReaction = () => {
    const greetings = ["🚀 Ready to start", "💼 Interview Mode", "🎯 Target Set", "✨ Welcome", "🤖 Session Active"]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Emotional Reaction Detector
  const detectEmojiReaction = (text: string): string => {
    const lower = text.toLowerCase()
    
    if (lower.includes("great") || lower.includes("excellent") || lower.includes("correct") || lower.includes("impressive") || lower.includes("well done")) {
      return "🎉 Excellent!"
    }
    if (lower.includes("code") || lower.includes("function") || lower.includes("class") || lower.includes("algorithm") || lower.includes("database") || lower.includes("system design")) {
      return "💻 Technical Review"
    }
    if (lower.includes("incorrect") || lower.includes("mistake") || lower.includes("however") || lower.includes("consider") || lower.includes("improvement") || lower.includes("issue")) {
      return "💡 Constructive Feedback"
    }
    if (text.includes("?") || lower.includes("explain") || lower.includes("how would you") || lower.includes("what is")) {
      return "🤔 Interview Question"
    }
    if (lower.includes("next question") || lower.includes("moving on") || lower.includes("let's continue")) {
      return "⏩ Next Challenge"
    }
    if (lower.includes("welcome") || lower.includes("hello") || lower.includes("hi there")) {
      return "👋 Hello"
    }
    
    return "✨ Insight"
  }

  // Voice Recording Initialization
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        let speechTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          speechTranscript += event.results[i][0].transcript
        }
        const prefix = baseInputRef.current ? `${baseInputRef.current} ` : ""
        setInput(prefix + speechTranscript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice transcription is not supported in this browser.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      baseInputRef.current = input
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // 1. Fetch User Chats & Restore Active Chat on Refresh
  const fetchUserChats = async () => {
    try {
      const res = await fetch("/api/chats")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setChatList(data)

        const savedChatId = localStorage.getItem("activeChatId")
        const exists = data.some((c: ChatSession) => c.id === savedChatId)

        if (savedChatId && exists) {
          setCurrentChatId(savedChatId)
        } else {
          setCurrentChatId(data[0].id)
          localStorage.setItem("activeChatId", data[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to load user chats", err)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserChats()
    }
  }, [status])

  // Helper to select a chat session
  const handleSelectChat = (id: string) => {
    setCurrentChatId(id)
    localStorage.setItem("activeChatId", id)
    setMobileSidebarOpen(false)
  }

  // 2. Fetch Active Chat Messages from Database
  useEffect(() => {
    if (currentChatId && status === "authenticated") {
      fetch(`/api/chats/${currentChatId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load chat")
          return res.json()
        })
        .then((data) => {
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages)
          } else {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                reaction: getInitialReaction()
              },
            ])
          }
        })
        .catch(() => {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reaction: getInitialReaction()
            },
          ])
        })
    }
  }, [currentChatId, status])

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [isDark])

  const toggleTheme = () => setIsDark((prev) => !prev)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleNewChat = async () => {
    if (chatList.length >= MAX_SESSIONS) return;

    try {
      const res = await fetch("/api/chats", { method: "POST" });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error Output:", errorText);
        alert(`Failed to create session (${res.status}). Check server logs.`);
        return;
      }

      const data = await res.json();

      setChatList((prev) => [data, ...prev]);
      handleSelectChat(data.id);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reaction: getInitialReaction()
        },
      ]);
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" })
      const updated = chatList.filter((chat) => chat.id !== id)
      setChatList(updated)
      if (currentChatId === id) {
        const nextId = updated[0]?.id || ""
        setCurrentChatId(nextId)
        localStorage.setItem("activeChatId", nextId)
      }
    } catch (err) {
      console.error("Failed to delete chat", err)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/logged-out" })
  }

  // 3. Submit Handler with Mic Reset & Dynamic Title Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    // Stop active listening and reset mic state
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    const userText = input.trim()
    setInput("")
    baseInputRef.current = "" // Clear speech buffer permanently on send

    // Check if this is the user's first message in this chat
    const isFirstUserMessage = !messages.some((m) => m.role === "user")

    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, tempUserMessage])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId || undefined,
          message: userText,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Failed to process chat")
        return
      }

      const activeId = data.chatId || currentChatId

      if (data.chatId && data.chatId !== currentChatId) {
        setCurrentChatId(data.chatId)
        localStorage.setItem("activeChatId", data.chatId)
        fetchUserChats()
      }

      if (data.message) {
        const aiMessage: Message = {
          id: data.message.id || Date.now().toString(),
          role: "assistant",
          content: data.message.content,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reaction: detectEmojiReaction(data.message.content)
        }
        setMessages((prev) => [...prev, aiMessage])

        // Automatically assign meaningful session title from first user message
        if (isFirstUserMessage && activeId) {
          const generatedTitle = userText.length > 30 ? userText.slice(0, 30) + "..." : userText
          
          // Update sidebar locally immediately
          setChatList((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, title: generatedTitle } : c))
          )

          try {
            await fetch(`/api/chats/${activeId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: generatedTitle }),
            })
          } catch (err) {
            console.error("Failed to update title on server:", err)
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className={`flex flex-col items-center justify-center h-screen w-full ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
        <AmleefaLogo className="w-12 h-12 mb-4 animate-bounce" />
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Authenticating Amleefa AI Session...</span>
        </div>
      </div>
    )
  }

  const isLimitReached = chatList.length >= MAX_SESSIONS

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 border-r transition-all duration-300 ease-in-out ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        } ${sidebarOpen ? "md:translate-x-0" : "md:-ml-72"} ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-center gap-2.5">
            <AmleefaLogo className="w-8 h-8 shrink-0" />
            <div>
              <span className={`font-bold text-base tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Amleefa AI
              </span>
              <p className="text-[10px] font-medium text-indigo-500">
                {chatList.length} / {MAX_SESSIONS} Sessions Used
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`hidden md:flex p-1.5 rounded-lg transition-colors ${
                isDark ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <button
            onClick={handleNewChat}
            disabled={isLimitReached}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs shadow-sm transition-all ${
              isLimitReached
                ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-500/20"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isLimitReached ? "Session Limit Reached" : "New Interview Session"}</span>
          </button>

          {isLimitReached && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Max limit of 20 sessions reached. Discontinue or delete existing sessions.</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Practice History
          </p>
          {chatList.map((chat) => {
            const isActive = chat.id === currentChatId
            return (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                  isActive
                    ? isDark
                      ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/50"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : isDark
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="truncate">{chat.title}</span>
                </div>
                
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded-md"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        <div className={`p-3 border-t ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
          {session?.user && (
            <div className={`flex items-center justify-between gap-2 p-2 rounded-xl border shadow-xs ${
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                {session.user.image ? (
                  <img src={session.user.image} alt="User Avatar" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-w-5xl mx-auto px-3 sm:px-6 py-4">
        
        <header className={`flex items-center justify-between px-4 sm:px-6 py-3.5 mb-4 rounded-2xl border backdrop-blur-md shadow-xs transition-all shrink-0 ${
          isDark ? "bg-slate-900/80 border-slate-800" : "bg-white/90 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`hidden md:flex p-2 rounded-xl border transition-all ${
                  isDark ? "border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl border ${
                isDark ? "border-slate-800 bg-slate-800/60 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <AmleefaLogo className="w-8 h-8 shrink-0" />

            <div>
              <h1 className={`font-bold text-sm sm:text-base flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Amleefa AI
                <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Llama 3.3 70B
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Architect Your Tech Future with Amleefa AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isLimitReached
                ? "bg-red-500/10 border-red-500/30 text-red-500"
                : isDark
                ? "bg-slate-800 border-slate-700 text-slate-300"
                : "bg-slate-100 border-slate-200 text-slate-700"
            }`}>
              <span>{chatList.length}/20 Sessions</span>
            </div>

            <button
              onClick={handleNewChat}
              className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs ${
                isDark ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="New Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all shadow-xs ${
                isDark ? "border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Chat Stream */}
        <main className="flex-1 overflow-y-auto space-y-6 px-1 sm:px-2 pr-2 py-2 scroll-smooth">
          {messages.map((m) => {
            const isAssistant = m.role === "assistant"

            return (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
              >
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[88%] sm:max-w-[80%] flex flex-col gap-1.5">
                  {isAssistant && m.reaction && (
                    <div className={`self-start px-2.5 py-0.5 rounded-full border text-[11px] font-medium shadow-xs ${
                      isDark ? "bg-slate-800/90 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                    }`}>
                      {m.reaction}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-5 py-4 border shadow-xs transition-all ${
                      isAssistant
                        ? isDark
                          ? "bg-slate-900 border-slate-800 text-slate-100"
                          : "bg-white border-slate-200 text-slate-900"
                        : "bg-indigo-600 text-white border-indigo-500"
                    }`}
                  >
                    <div className={`text-sm leading-relaxed prose max-w-none ${
                      isDark ? "prose-invert prose-strong:text-indigo-400" : "prose-strong:text-indigo-600"
                    } prose-p:my-1.5 prose-ul:my-1 prose-li:my-0.5`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const codeString = String(children).replace(/\n$/, '')
                            if (inline) {
                              return (
                                <code className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                                  isDark ? "bg-slate-800 text-indigo-300 border-slate-700" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                }`} {...props}>
                                  {children}
                                </code>
                              )
                            }
                            return (
                              <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-md">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(codeString, m.id)}
                                    className="flex items-center gap-1 hover:text-white transition-colors"
                                  >
                                    {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedId === m.id ? "Copied" : "Copy code"}
                                  </button>
                                </div>
                                <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-100">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            )
                          }
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    <div className={`text-[10px] font-medium mt-2 text-right ${
                      isAssistant ? "text-slate-400 dark:text-slate-500" : "text-indigo-200"
                    }`}>
                      {m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                    </div>
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-3 sm:gap-4 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className={`border rounded-2xl px-4 py-3 shadow-xs flex items-center gap-2 ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}>
                <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Amleefa AI is formulating a response...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        <footer className="pt-2 pb-2 shrink-0">
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-center shadow-md rounded-2xl border focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... Speak now..." : "Type your response, code snippet, or question..."}
              className={`w-full py-3.5 pl-5 pr-24 text-sm bg-transparent border-none outline-none ${
                isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"
              }`}
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all active:scale-95 ${
                  isListening
                    ? "bg-red-500 animate-pulse text-white"
                    : isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
                title={isListening ? "Stop Voice Recording" : "Start Voice Recording"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl transition-all active:scale-95 shadow-xs shadow-indigo-500/20 disabled:shadow-none"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </footer>

      </div>
    </div>
  )
}
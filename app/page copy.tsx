'use client'

import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Sun, Moon, Sparkles, Terminal, RefreshCw, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  time: string
  reaction?: string
}

export default function InterviewPage() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Explicitly sync the light/dark class on the html element
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

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  // Detect appropriate reaction badge
  const detectEmojiReaction = (text: string): string => {
    const lower = text.toLowerCase()
    if (lower.includes("welcome") || lower.includes("hello") || lower.includes("hi")) return "👋 Welcome"
    if (lower.includes("great") || lower.includes("correct") || lower.includes("excellent")) return "🎉 Well Done!"
    if (lower.includes("code") || lower.includes("function") || lower.includes("class")) return "💻 Technical"
    if (lower.includes("sorry") || lower.includes("incorrect") || lower.includes("mistake")) return "💡 Feedback"
    if (text.includes("?")) return "🤔 Question"
    return "✨ Insight"
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to your AI Technical Interview Practice!\n\nTo tailor our session, please share your **target role** (e.g., Senior Full Stack Engineer), **years of experience**, and **primary tech stack**.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reaction: "👋 Welcome"
    },
  ])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Session reset! Please share your **target role**, **years of experience**, and **tech stack** to begin.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reaction: "🔄 Ready"
      },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      const data = await res.json()
      const responseContent = data.content || "I didn't capture that. Could you try rephrasing?"

      const aiMessage: Message = {
        id: data.id || Date.now().toString(),
        role: "assistant",
        content: responseContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reaction: detectEmojiReaction(responseContent)
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto px-4 py-4 transition-colors duration-300">
      
      {/* Refined Navigation Header */}
      <header className="flex items-center justify-between px-6 py-3.5 mb-4 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              Technical Interview AI
              <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive coding & architectural evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs"
            title="Reset Chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-xs"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Chat Stream Area */}
      <main className="flex-1 overflow-y-auto space-y-6 px-2 pr-3 py-2 scroll-smooth">
        {messages.map((m) => {
          const isAssistant = m.role === "assistant"

          return (
            <div
              key={m.id}
              className={`flex gap-3 sm:gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              {/* Assistant Icon */}
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Chat Bubble Container */}
              <div className="max-w-[88%] sm:max-w-[80%] flex flex-col gap-1.5">
                
                {/* Reaction Badge for Assistant */}
                {isAssistant && m.reaction && (
                  <div className="self-start px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-xs">
                    {m.reaction}
                  </div>
                )}

                {/* Bubble Body with Explicit Theme Color Variable Overrides */}
<div
  style={{
    backgroundColor: isAssistant ? 'var(--chat-ai-bg)' : 'var(--chat-user-bg)',
    color: isAssistant ? 'var(--chat-ai-text)' : 'var(--chat-user-text)',
    borderColor: isAssistant ? 'var(--chat-ai-border)' : 'var(--chat-user-border)',
  }}
  className="rounded-2xl px-5 py-4 border shadow-sm transition-all"
>
  <div className="text-sm leading-relaxed prose dark:prose-invert max-w-none prose-p:my-1.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-ul:my-1 prose-li:my-0.5">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const codeString = String(children).replace(/\n$/, '')
          if (inline) {
            return (
              <code className="bg-slate-100 text-indigo-600 border border-slate-200/80 dark:bg-slate-800 dark:text-indigo-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            )
          }
          return (
            <div className="my-3 rounded-xl overflow-hidden border border-slate-300/80 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-slate-100 shadow-md">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 dark:bg-slate-900 border-b border-slate-700/60 dark:border-slate-800 text-xs text-slate-300 dark:text-slate-400 font-mono">
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

  <div
    className={`text-[10px] font-medium mt-2 text-right ${
      isAssistant
        ? "text-slate-400 dark:text-slate-500"
        : "text-blue-100 dark:text-slate-400"
    }`}
  >
    {m.time}
  </div>
</div>
              </div>

              {/* User Avatar */}
              {!isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          )
        })}

        {/* AI Typing Indicator */}
        {loading && (
          <div className="flex gap-3 sm:gap-4 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interviewer is formulating a response...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Floating Input Controls */}
      <footer className="pt-2 pb-2">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center shadow-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response, code snippet, or question..."
            className="w-full py-3.5 pl-5 pr-14 text-sm bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl transition-all active:scale-95 shadow-sm shadow-indigo-500/20 disabled:shadow-none"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

    </div>
  )
}
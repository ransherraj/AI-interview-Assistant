'use client'

import { useState, useEffect, useRef } from "react"
import { Sun, Moon, Send, User } from "lucide-react"
  import { toggleTheme, loadTheme } from "../app/api/lib/theme"
  import Image from "next/image"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  time: string
}

export default function InterviewPage() {

  const [input, setInput] = useState("")
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(false)

  

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your AI Interview Assistant. Tell me the role you are applying for.",
      time: new Date().toLocaleTimeString()
    }
  ])

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    loadTheme()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      time: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [...messages, userMessage]
      })
    })

    const data = await res.json()

    const aiMessage: Message = {
      id: data.id,
      role: "assistant",
      content: data.content,
      time: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, aiMessage])
    setLoading(false)
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition">

        {/* Header */}
        <header className="backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border-b p-4 shadow">
          <div className="max-w-4xl mx-auto flex justify-between items-center">

            <div>
              <h1 className="text-xl font-bold dark:text-white">
                AI Interview Assistant
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Powered by Groq with OpenAI GPT-OSS-20B
              </p>
            </div>

            {/* <button
              onClick={() => {
                toggleTheme()
                setDark(prev => !prev)
              }}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
            >
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button> */}
            {/* <a
              href="https://ransherraj.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:scale-105 transition"
              title="My Portfolio"
            >
              <User size={18}/>
            </a> */}
            <a
              href="https://ransherraj.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:scale-105 transition"
              title="My Portfolio"
            >
              <Image
                src="/img/ProfileImage.png"
                alt="Ransher Raj"
                width={50}
                height={50}
              />
            </a>

          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {messages.map((m) => (

              <div
                key={m.id}
                className={`flex ${
                  m.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[70%] rounded-xl p-4 shadow-lg transition
                  ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 dark:text-white"
                  }`}
                >

                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {m.content}
                  </p>

                  <div className="text-xs mt-2 opacity-60">
                    {m.time}
                  </div>

                </div>

              </div>

            ))}

            {loading && (
              <div className="text-gray-500 animate-pulse">
                AI is thinking...
              </div>
            )}

            <div ref={bottomRef} />

          </div>
        </main>

        {/* Input */}
        <footer className="border-t bg-white dark:bg-gray-800 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto flex gap-3"
          >

            <input
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 p-3 rounded-xl border dark:bg-gray-700 dark:text-white"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2 hover:bg-blue-700"
            >
              <Send size={16}/>
              Send
            </button>

          </form>
        </footer>

      </div>
    </div>
  )
}
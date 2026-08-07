"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  MicOff,
  Terminal, // <--- Add this line
  BookOpen, // <--- Add this if you used it in h2
  Volume2, // <--- ADD THIS
  VolumeX, // <--- ADD THIS
  Square, // <--- ADD THIS
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  time?: string;
  reaction?: string;
};

type ChatSession = {
  id: string;
  title: string;
  status?: string;
  createdAt?: string;
};

import AmleefaLogo from "./api/lib/AmleefaLogo";
import { useGlobalLoader } from "./context/LoaderContext";

const MAX_SESSIONS = 20;
export default function InterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showLoader, hideLoader } = useGlobalLoader();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFetchingChats, setIsFetchingChats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize currentChatId directly from localStorage if present
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeChatId") || "";
    }
    return "";
  });
  const [chatList, setChatList] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Voice Recording / Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef<string>("");
  const sessionFinalRef = useRef<string>(""); // <-- Add this here

  // Voice Synthesis State
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(
    null,
  );
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );

  const lastTranscriptRef = useRef<string>("");
  const isProcessingSpeechRef = useRef<boolean>(false);

  // Initialize and detect available female voices from the browser
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for common female voice identifiers in Web Speech API
      const female =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Female") ||
              v.name.includes("Zira") ||
              v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Google US English") ||
              v.name.includes("Karen") ||
              v.name.includes("Fiona")),
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (female) setFemaleVoice(female);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Speech Helper Function
  const speakText = (text: string, messageId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // Clean markdown syntax for natural-sounding reading
    const cleanText = text
      .replace(/[#*`_>]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/```[\s\S]*?```/g, "Code block omitted from speech.");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    utterance.pitch = 1.1;
    utterance.rate = 1.0;

    if (messageId) {
      setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
    }

    window.speechSynthesis.speak(utterance);
  };

  // Individual Card Play/Pause Handler
  const handleTogglePlayMessage = (messageId: string, text: string) => {
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    speakText(text, messageId);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Dynamic Initial Welcome Reactions
  const getInitialReaction = () => {
    const greetings = [
      "🚀 Ready to start",
      "💼 Interview Mode",
      "🎯 Target Set",
      "✨ Welcome",
      "🤖 Session Active",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Emotional Reaction Detector
  const detectEmojiReaction = (text: string): string => {
    const lower = text.toLowerCase();

    if (
      lower.includes("great") ||
      lower.includes("excellent") ||
      lower.includes("correct") ||
      lower.includes("impressive") ||
      lower.includes("well done")
    ) {
      return "🎉 Excellent!";
    }
    if (
      lower.includes("code") ||
      lower.includes("function") ||
      lower.includes("class") ||
      lower.includes("algorithm") ||
      lower.includes("database") ||
      lower.includes("system design")
    ) {
      return "💻 Technical Review";
    }
    if (
      lower.includes("incorrect") ||
      lower.includes("mistake") ||
      lower.includes("however") ||
      lower.includes("consider") ||
      lower.includes("improvement") ||
      lower.includes("issue")
    ) {
      return "💡 Constructive Feedback";
    }
    if (
      text.includes("?") ||
      lower.includes("explain") ||
      lower.includes("how would you") ||
      lower.includes("what is")
    ) {
      return "🤔 Interview Question";
    }
    if (
      lower.includes("next question") ||
      lower.includes("moving on") ||
      lower.includes("let's continue")
    ) {
      return "⏩ Next Challenge";
    }
    if (
      lower.includes("welcome") ||
      lower.includes("hello") ||
      lower.includes("hi there")
    ) {
      return "👋 Hello";
    }

    return "✨ Insight";
  };

  // Voice Recording Initialization
  // useEffect(() => {
  //   if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
  //     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  //     recognitionRef.current = new SpeechRecognition()
  //     recognitionRef.current.continuous = true
  //     recognitionRef.current.interimResults = true
  //     recognitionRef.current.lang = "en-US"

  //     recognitionRef.current.onresult = (event: any) => {
  //       let speechTranscript = ""
  //       for (let i = 0; i < event.results.length; i++) {
  //         speechTranscript += event.results[i][0].transcript
  //       }
  //       const prefix = baseInputRef.current ? `${baseInputRef.current} ` : ""
  //       setInput(prefix + speechTranscript)
  //     }

  //  recognitionRef.current.onerror = (event: any) => {
  //       // Safely convert to string to handle browser quirks, completely suppressing the Next.js overlay
  //       const errorStr = String(event.error || "")

  //       if (errorStr.includes("aborted")) {
  //         return // Silently exit. Do not log, do not update state.
  //       }

  //       console.error("Speech recognition error:", event.error)
  //       setIsListening(false)
  //       baseInputRef.current = ""
  //     }

  //     recognitionRef.current.onend = () => {
  //       setIsListening(false)
  //       // Reset base buffer on end so late results cannot re-populate text
  //       baseInputRef.current = ""
  //     }
  //   }
  // }, [])

  // Voice Recording Initialization & Event Handlers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentFinal = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      // Update session accumulation with newly finalized text
      if (currentFinal) {
        sessionFinalRef.current +=
          (sessionFinalRef.current ? " " : "") + currentFinal.trim();
      }

      // Combine session-accumulated final text with any active interim text
      const activeSpeech = [sessionFinalRef.current, currentInterim.trim()]
        .filter(Boolean)
        .join(" ");

      if (!activeSpeech) return;

      const prefix = baseInputRef.current ? `${baseInputRef.current} ` : "";

      // Deduplicate against base input prefix
      if (!prefix.trim().endsWith(activeSpeech)) {
        setInput(prefix + activeSpeech);
      }
    };

    // SILENT ERROR HANDLING - Prevents Next.js Dev Overlay
    recognition.onerror = (event: any) => {
      const err = String(event?.error || "").toLowerCase();

      if (
        err.includes("aborted") ||
        err.includes("no-speech") ||
        err === "aborted"
      ) {
        return;
      }

      console.warn("Speech recognition warning:", event.error);
      setIsListening(false);
      baseInputRef.current = "";
    };

    recognition.onend = () => {
      setIsListening(false);
      baseInputRef.current = "";
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice transcription is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      sessionFinalRef.current = ""; // <-- Reset speech buffer on start
      baseInputRef.current = input;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // 1. Fetch User Chats & Restore Active Chat on Refresh
  const fetchUserChats = async () => {
    setIsFetchingChats(true); // Start loading
    showLoader("Loading your chats..."); // 1. Trigger global loader on start
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setChatList(data);

        const savedChatId = localStorage.getItem("activeChatId");
        const exists = data.some((c: ChatSession) => c.id === savedChatId);

        if (savedChatId && exists) {
          setCurrentChatId(savedChatId);
        } else {
          setCurrentChatId(data[0].id);
          localStorage.setItem("activeChatId", data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load user chats", err);
    } finally {
      setIsFetchingChats(false); // Finished fetching
      hideLoader(); // 2. Dismiss global loader when done (success or error)
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserChats();
    }
  }, [status]);

  const handleNewChat = useCallback(async () => {
    if (chatList.length >= MAX_SESSIONS) return;
    showLoader("Creating new session...");
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
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reaction: getInitialReaction(),
        },
      ]);
    } catch (err) {
      console.error("Failed to create new session:", err);
    } finally {
      hideLoader();
    }
  }, [chatList.length]);

  // Auto-start a new session on first login if no sessions exist
  useEffect(() => {
    if (
      status === "authenticated" &&
      !isFetchingChats &&
      chatList.length === 0
    ) {
      handleNewChat();
    }
  }, [status, isFetchingChats, chatList.length, handleNewChat]);

  // Helper to select a chat session
  const handleSelectChat = (id: string) => {
    showLoader("Loading chat session...");
    setCurrentChatId(id);
    localStorage.setItem("activeChatId", id);
    setMobileSidebarOpen(false);
  };

  // 2. Fetch Active Chat Messages from Database
  useEffect(() => {
    if (currentChatId && status === "authenticated") {
      //showLoader("Loading chat session...");
      fetch(`/api/chats/${currentChatId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load chat");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                reaction: getInitialReaction(),
              },
            ]);
          }
        })
        .catch(() => {
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              reaction: getInitialReaction(),
            },
          ]);
        })
        .finally(() => {
          hideLoader(); // Hide full-page loader when message fetch finishes
        });
    }
  }, [currentChatId, status]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // const handleNewChat = async () => {
  //   if (chatList.length >= MAX_SESSIONS) return;

  //   try {
  //     const res = await fetch("/api/chats", { method: "POST" });

  //     if (!res.ok) {
  //       const errorText = await res.text();
  //       console.error("Server Error Output:", errorText);
  //       alert(`Failed to create session (${res.status}). Check server logs.`);
  //       return;
  //     }

  //     const data = await res.json();

  //     setChatList((prev) => [data, ...prev]);
  //     handleSelectChat(data.id);
  //     setMessages([
  //       {
  //         id: "welcome",
  //         role: "assistant",
  //         content: `Welcome to **Amleefa AI**!\n\nTo tailor our technical interview session, please share your **target role**, **years of experience**, and **primary tech stack**.`,
  //         time: new Date().toLocaleTimeString([], {
  //           hour: "2-digit",
  //           minute: "2-digit",
  //         }),
  //         reaction: getInitialReaction(),
  //       },
  //     ]);
  //   } catch (err) {
  //     console.error("Failed to create new session:", err);
  //   }
  // };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
      const updated = chatList.filter((chat) => chat.id !== id);
      setChatList(updated);
      if (currentChatId === id) {
        const nextId = updated[0]?.id || "";
        setCurrentChatId(nextId);
        localStorage.setItem("activeChatId", nextId);
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/logged-out" });
  };

  // 3. Submit Handler with Mic Reset & Dynamic Title Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // 1. Immediately ABORT speech recognition if active to discard pending audio buffers
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.error("Speech abort error:", err);
      }
      setIsListening(false);
    }

    // 2. Capture and clear input buffers immediately
    const userText = input.trim();
    setInput("");
    baseInputRef.current = "";

    // 3. Reset height on auto-resizing textarea if present
    const formElement = e.currentTarget as HTMLFormElement;
    const textarea = formElement.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
    }

    const isFirstUserMessage = !messages.some((m) => m.role === "user");

    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId || undefined,
          message: userText,
        }),
      });

      const data = await res.json();

      // Handle Rate Limit Error explicitly
      if (res.status === 429) {
        const rateLimitMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "⚠️ **Chat Limit Exhausted:** Daily token limit reached for this session. Please create a new session.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, rateLimitMessage]);
        return;
      }

      if (!res.ok) {
        alert(data.error || "Failed to process chat");
        return;
      }

      const activeId = data.chatId || currentChatId;

      if (data.chatId && data.chatId !== currentChatId) {
        setCurrentChatId(data.chatId);
        localStorage.setItem("activeChatId", data.chatId);
        fetchUserChats();
      }

      if (data.message) {
        const aiMessage: Message = {
          id: data.message.id || Date.now().toString(),
          role: "assistant",
          content: data.message.content,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reaction: detectEmojiReaction(data.message.content),
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (ttsEnabled) {
          speakText(data.message.content, aiMessage.id);
        }

        if (isFirstUserMessage && activeId) {
          const generatedTitle =
            userText.length > 30 ? userText.slice(0, 30) + "..." : userText;

          setChatList((prev) =>
            prev.map((c) =>
              c.id === activeId ? { ...c, title: generatedTitle } : c,
            ),
          );

          try {
            await fetch(`/api/chats/${activeId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: generatedTitle }),
            });
          } catch (err) {
            console.error("Failed to update title on server:", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen w-full ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
      >
        <AmleefaLogo className="w-12 h-12 mb-4 animate-bounce" />
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Authenticating Amleefa AI Session...</span>
        </div>
      </div>
    );
  }

  const isLimitReached = chatList.length >= MAX_SESSIONS;

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}
    >
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
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="flex items-center gap-2.5">
            <AmleefaLogo className="w-8 h-8 shrink-0" />
            <div>
              <span
                className={`font-bold text-base tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
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
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
            <span>
              {isLimitReached
                ? "Session Limit Reached"
                : "New Interview Session"}
            </span>
          </button>

          {isLimitReached && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Max limit of 20 sessions reached. Discontinue or delete existing
                sessions.
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Practice History
          </p>
          {chatList.map((chat) => {
            const isActive = chat.id === currentChatId;
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
                  type="button"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-md shrink-0"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div
          className={`p-3 border-t ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
        >
          {session?.user && (
            <div
              className={`flex items-center justify-between gap-2 p-2 rounded-xl border shadow-xs ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="User Avatar"
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p
                    className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                  >
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
        <header
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 mb-4 rounded-2xl border backdrop-blur-md shadow-xs transition-all shrink-0 ${
            isDark
              ? "bg-slate-900/80 border-slate-800"
              : "bg-white/90 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`hidden md:flex p-2 rounded-xl border transition-all ${
                  isDark
                    ? "border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Open Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl border ${
                isDark
                  ? "border-slate-800 bg-slate-800/60 text-slate-300"
                  : "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <AmleefaLogo className="w-8 h-8 shrink-0" />

            <div>
              <h1
                className={`font-bold text-sm sm:text-base flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {/* Always visible (Mobile, Tablet, Desktop) */}
                <span>Amleefa AI</span>

                {/* Hidden on Mobile & Tablet, visible only on Desktop (lg and up) */}
                <span className="hidden lg:inline-block px-2 py-0.5 text-[8.5px] tracking-tight font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                  Powered by Llama 3.3 70B
                </span>
              </h1>

              {/* Hidden on Mobile & Tablet, visible only on Desktop (lg and up) */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden lg:block">
                Architect Your Tech Future with Amleefa AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isLimitReached
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : isDark
                    ? "bg-slate-800 border-slate-700 text-slate-300"
                    : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <span>{chatList.length}/20 Sessions</span>
            </div>

            <button
              onClick={handleNewChat}
              className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs ${
                isDark
                  ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                  : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title="New Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Session</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all shadow-xs ${
                isDark
                  ? "border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Female Voice Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !ttsEnabled;
                setTtsEnabled(nextState);
                if (!nextState && typeof window !== "undefined") {
                  window.speechSynthesis.cancel();
                  setSpeakingMessageId(null);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs ${
                ttsEnabled
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20"
                  : isDark
                    ? "border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                    : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title={
                ttsEnabled
                  ? "Disable Voice Output"
                  : "Enable Female Voice Output"
              }
            >
              {ttsEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {ttsEnabled ? "Voice On" : "Voice Off"}
              </span>
            </button>
          </div>
        </header>

        {/* Chat Stream */}
        <main className="flex-1 overflow-y-auto space-y-6 px-1 sm:px-2 pr-2 py-2 scroll-smooth custom-scrollbar">
          {messages.map((m) => {
            const isAssistant = m.role === "assistant";

            return (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${isAssistant ? "justify-start" : "justify-end"}`}
              >
                {isAssistant && (
                  <div className="w-9 h-9 shrink-0 mt-1 flex items-center justify-center">
                    <AmleefaLogo className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="max-w-[88%] sm:max-w-[80%] flex flex-col gap-1.5">
                  {isAssistant && m.reaction && (
                    <div
                      className={`self-start px-2.5 py-0.5 rounded-full border text-[11px] font-medium shadow-xs ${
                        isDark
                          ? "bg-slate-800/90 border-slate-700 text-slate-300"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      {m.reaction}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-5 py-3.5 border transition-all ${
                      isAssistant
                        ? isDark
                          ? "bg-slate-900 border-slate-800 text-slate-100 shadow-xs"
                          : "bg-white border-slate-200 text-slate-900 shadow-xs"
                        : "chat-user-bubble"
                    }`}
                  >
                    {isAssistant ? (
                      <div
                        className={`text-sm leading-relaxed prose max-w-none ${
                          isDark
                            ? "prose-invert prose-strong:text-indigo-400"
                            : "prose-strong:text-indigo-600"
                        } prose-p:my-1.5 prose-ul:my-1 prose-li:my-0.5`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // FIX 1: Prevent hydration errors by converting paragraph containers to <div>
                            p({ children }) {
                              return (
                                <div
                                  className={`my-2 leading-relaxed text-sm font-normal ${
                                    isDark ? "text-slate-100" : "text-slate-900"
                                  }`}
                                >
                                  {children}
                                </div>
                              );
                            },

                            // Headings with direct, high-contrast text colors for both light and dark modes
                            h1({ children }) {
                              return (
                                <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tracking-tight border-b border-indigo-500/20 pb-2 mb-3 mt-1 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                                  {children}
                                </h1>
                              );
                            },
                            h2({ children }) {
                              return (
                                <h2
                                  className={`text-base font-bold border-b pb-1.5 mb-3 mt-4 flex items-center gap-2 ${
                                    isDark
                                      ? "text-slate-100 border-slate-800"
                                      : "text-slate-900 border-slate-200"
                                  }`}
                                >
                                  <BookOpen className="w-4 h-4 text-indigo-500" />
                                  {children}
                                </h2>
                              );
                            },
                            h3({ children }) {
                              return (
                                <h3
                                  className={`text-sm font-bold mb-2 mt-3 ${
                                    isDark
                                      ? "text-indigo-400"
                                      : "text-indigo-700"
                                  }`}
                                >
                                  {children}
                                </h3>
                              );
                            },
                            // Callout Box
                            blockquote({ children }) {
                              return (
                                <div
                                  className={`my-3 p-3.5 rounded-xl border-l-4 border-indigo-500 text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                                    isDark
                                      ? "bg-slate-800/60 text-slate-200"
                                      : "bg-indigo-50/80 text-slate-800"
                                  }`}
                                >
                                  {children}
                                </div>
                              );
                            },

                            // Lists with clear high-contrast text
                            ul({ children }) {
                              return (
                                <ul className="my-2.5 pl-1 space-y-1.5 list-none">
                                  {children}
                                </ul>
                              );
                            },
                            ol({ children }) {
                              return (
                                <ol className="my-2.5 pl-4 space-y-1.5 list-decimal">
                                  {children}
                                </ol>
                              );
                            },
                            li({ children }) {
                              return (
                                <li
                                  className={`flex items-start gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                                  <span className="flex-1">{children}</span>
                                </li>
                              );
                            },

                            // Bold text highlighting
                            strong({ children }) {
                              return (
                                <strong
                                  className={`font-semibold px-1 py-0.5 rounded ${
                                    isDark
                                      ? "text-indigo-300 bg-indigo-500/20"
                                      : "text-indigo-800 bg-indigo-100"
                                  }`}
                                >
                                  {children}
                                </strong>
                              );
                            },

                            // Code Blocks (VS Code Theme + Isolated Per-Block Copying)
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }: any) {
                              const codeString = String(children).replace(
                                /\n$/,
                                "",
                              );
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              const isMultiLine = codeString.includes("\n");

                              // Render as inline code badge if explicitly inline OR if it's a single line without an explicit language specifier
                              if (inline || (!match && !isMultiLine)) {
                                return (
                                  <code
                                    className={`px-1.5 py-0.5 rounded text-[12px] font-mono border ${
                                      isDark
                                        ? "bg-slate-800 text-indigo-300 border-slate-700"
                                        : "bg-slate-200 text-indigo-900 border-slate-300"
                                    }`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              }

                              // Use matched language or default to generic code
                              const language = match ? match[1] : "code";

                              // Generate a unique ID per code block (Message ID + language + first 10 chars)
                              const uniqueBlockId = `${m.id}-${language}-${codeString.slice(0, 10).replace(/\s+/g, "")}`;
                              const isBlockCopied = copiedId === uniqueBlockId;

                              return (
                                <div className="my-4 rounded-xl overflow-hidden border border-slate-700 dark:border-slate-800 bg-slate-950 shadow-md">
                                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 font-mono">
                                    <span className="flex items-center gap-2">
                                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                      <span className="uppercase text-[11px] font-semibold text-indigo-300">
                                        {language}
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyCode(
                                          codeString,
                                          uniqueBlockId,
                                        )
                                      }
                                      className="flex items-center gap-1.5 hover:text-white transition-colors text-[11px] font-sans bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700"
                                    >
                                      {isBlockCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                      )}
                                      {isBlockCopied ? (
                                        <span className="text-emerald-400 font-medium">
                                          Copied!
                                        </span>
                                      ) : (
                                        <span>Copy code</span>
                                      )}
                                    </button>
                                  </div>
                                  <div className="text-xs font-mono overflow-x-auto">
                                    <SyntaxHighlighter
                                      language={language}
                                      style={isDark ? vscDarkPlus : vs}
                                      customStyle={{
                                        margin: 0,
                                        padding: "1rem",
                                        fontSize: "0.8125rem",
                                        backgroundColor: isDark
                                          ? "#090d16"
                                          : "#f8fafc",
                                        lineHeight: "1.6",
                                      }}
                                      PreTag="div"
                                    >
                                      {codeString}
                                    </SyntaxHighlighter>
                                  </div>
                                </div>
                              );
                            },
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      /* USER MESSAGE DISPLAY ENHANCEMENT */
                      <div className="text-[13.5px] font-medium leading-relaxed tracking-wide whitespace-pre-wrap text-white">
                        {m.content}
                      </div>
                    )}

                    {/* Step-5 Voice Control & Timestamp Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
                      {isAssistant ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleTogglePlayMessage(m.id, m.content)
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            speakingMessageId === m.id
                              ? "bg-indigo-600 text-white shadow-xs animate-pulse"
                              : isDark
                                ? "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                          title={
                            speakingMessageId === m.id
                              ? "Stop Listening"
                              : "Listen to Response"
                          }
                        >
                          {speakingMessageId === m.id ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div />
                      )}

                      <div
                        className={`text-[10px] font-medium ${
                          isAssistant
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-indigo-100/90"
                        }`}
                      >
                        {m.time ||
                          (m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "")}
                      </div>
                    </div>
                  </div>
                </div>

                {!isAssistant && (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 overflow-hidden shadow-xs ring-2 ring-indigo-500/20">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User Avatar"}
                        className="w-full h-full object-cover"
                      />
                    ) : session?.user?.name ? (
                      <span className="text-xs font-bold uppercase">
                        {session.user.name[0]}
                      </span>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 sm:gap-4 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div
                className={`border rounded-2xl px-4 py-3 shadow-xs flex items-center gap-2 ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Amleefa AI is formulating a response...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>
        <footer className="pt-2 pb-3 shrink-0">
          <form
            onSubmit={handleSubmit}
            className={`relative flex flex-col shadow-lg rounded-2xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/40 ${
              isDark
                ? "bg-slate-900/90 border-slate-800 focus-within:border-indigo-500/60"
                : "bg-white border-slate-200 focus-within:border-indigo-500/60"
            }`}
          >
            {/* Auto-Resizing Multiline Text Area */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !loading) {
                    handleSubmit(e);
                  }
                }
              }}
              placeholder={
                isListening
                  ? "Listening... Speak now..."
                  : "Type your response, paste code (Shift + Enter for new line)..."
              }
              rows={1}
              className={`w-full pt-3.5 pb-2 px-5 text-sm bg-transparent border-none outline-none resize-none max-h-48 min-h-[48px] scrollbar-thin ${
                isDark
                  ? "text-slate-100 placeholder-slate-500"
                  : "text-slate-900 placeholder-slate-400"
              }`}
              style={{
                height: "auto",
                maxHeight: "200px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />

            {/* Bottom Toolbar & Action Bar */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-transparent">
              {/* Keyboard Shortcut & Character Hints */}
              <div className="flex items-center gap-2 pl-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                    Enter
                  </kbd>{" "}
                  to send
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                    Shift + Enter
                  </kbd>{" "}
                  for new line
                </span>
              </div>

              {/* Mic & Send Control Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${
                    isListening
                      ? "bg-red-500 animate-pulse text-white shadow-md shadow-red-500/20"
                      : isDark
                        ? "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                  title={
                    isListening
                      ? "Stop Voice Recording"
                      : "Start Voice Recording"
                  }
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`p-2.5 rounded-xl font-medium transition-all flex items-center justify-center shrink-0 ${
                    !input.trim() || loading
                      ? isDark
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xs"
                  }`}
                  title="Send message"
                >
                  <Send
                    className={`w-4 h-4 ${
                      !input.trim() || loading
                        ? isDark
                          ? "text-slate-600"
                          : "text-slate-400"
                        : "text-white"
                    }`}
                  />
                </button>
              </div>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}

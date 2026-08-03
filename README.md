# Amleefa AI — Architectural AI Technical Interviewer

An intelligent, full-stack AI platform designed to simulate realistic, adaptive technical interviews for software engineering candidates. Powered by **Llama 3.3 70B** via Groq, **Next.js 15 App Router**, **Prisma**, **PostgreSQL**, and **NextAuth.js**.

---

## 🌟 Key Features

* 🧠 **Adaptive AI Interviewer**: Driven by Llama 3.3 70B with step-by-step turn-taking, real-time code evaluation, DSA problem-solving, System Design scenarios, and STAR behavioral analysis.
* 🔄 **Session Persistence**: Chats automatically restore active session IDs across hard refreshes via local state and PostgreSQL persistence.
* ✏️ **Dynamic Chat Titles**: Automatic title generation based on initial context or candidate input, updated via dynamic API endpoints.
* 🎙️ **Voice-to-Text Transcription**: Integrated Web Speech API with real-time mic buffer management and automatic input clearing on submit.
* 🔒 **Session Threshold Guardrails**: Strictly limits active user sessions (up to 20 chats) to optimize database utilization.
* 🎨 **Developer UX**: Markdown rendering with syntax highlighting, one-click code copy, theme switching (Light/Dark mode), and reactive emotion indicators.

---

## 🏗️ Tech Stack

* **Framework**: Next.js 15 (App Router, React 19)
* **Language**: TypeScript
* **Database ORM**: Prisma ORM
* **Database**: PostgreSQL
* **Authentication**: NextAuth.js
* **AI Model Engine**: Groq API (`llama-3.3-70b-versatile` via `openai` SDK)
* **Styling & UI**: Tailwind CSS, Lucide React Icons, React Markdown (`remark-gfm`)

---

## 📁 Project Architecture

```text
.
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   ├── chat/                 # Primary AI interaction pipeline
│   │   └── chats/                # Chat session CRUD endpoints
│   │       ├── route.ts          # GET list, POST new session
│   │       └── [id]/route.ts     # GET session details, PATCH title, DELETE session
│   ├── auth/                     # Authentication pages (signin, logged-out)
│   ├── globals.css               # Base Tailwind CSS rules
│   ├── layout.tsx                # Root layout with SessionProvider
│   └── page.tsx                  # Main AI Workspace UI
├── lib/
│   ├── auth.ts                   # NextAuth options configuration
│   ├── db.ts                     # Database alias re-exports
│   └── prisma.ts                 # Global Prisma client singleton
├── prisma/
│   └── schema.prisma             # User, Session, Chat, and Message models
└── public/                       # Static branding & assets

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // Fixed: Clean export location avoiding route circular dependency
import { prisma } from "../lib/prisma";
import OpenAI from "openai";
import { systemPrompt } from "../lib/SystemPrompt"; // Fixed: Clean export location avoiding route circular dependency

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});



export async function POST(req: Request) {
  try {
    // 1. Authenticate User Session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { chatId, message } = body;

    let activeChat;

    // 2. Validate Existing Chat or Create New Chat with 20-Limit Rules
    if (chatId) {
      activeChat = await prisma.chat.findUnique({
        where: { id: chatId },
      });

      if (!activeChat) {
        return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
      }

      if (activeChat.status === "DISCONTINUED") {
        return NextResponse.json(
          { error: "This chat has been discontinued. Please start a new session." },
          { status: 403 }
        );
      }
    } else {
      // Check limit for new sessions
      const totalChatsCount = await prisma.chat.count({
        where: { userId },
      });

      if (totalChatsCount >= 20) {
        return NextResponse.json(
          {
            error: "Maximum limit reached! You have reached 20 chats. Discontinue an existing chat to start a new session.",
            limitReached: true,
          },
          { status: 400 }
        );
      }

      // Create new chat
      // activeChat = await prisma.chat.create({
      //   data: {
      //     userId,
      //     title: message ? (message.length > 30 ? message.slice(0, 30) + "..." : message) : "New Interview Session",
      //     status: "ACTIVE",
      //   },
      // });
      // Create new chat
      activeChat = await prisma.chat.create({
        data: {
          userId,
          title: message
            ? message.length > 30
              ? message.slice(0, 30) + "..."
              : message
            : "New Interview Session",
          status: "ACTIVE",
        },
      });

      // ADDITION FOR ISSUE 2: If starting a fresh session without a user message yet, 
      // let the AI generate its official introduction directly from the systemPrompt
      if (!message) {
        const initResponse = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }],
        });

        const initialAiText =
          initResponse.choices[0]?.message?.content ||
          "Welcome! To get started with your technical interview, please tell me your target role, years of experience, and primary tech stack.";

        const firstAiMessage = await prisma.message.create({
          data: {
            chatId: activeChat.id,
            role: "assistant",
            content: initialAiText,
          },
        });

        return NextResponse.json({
          chatId: activeChat.id,
          message: firstAiMessage,
        });
      }
    }

    // 3. Save incoming user message in DB
    await prisma.message.create({
      data: {
        chatId: activeChat.id,
        role: "user",
        content: message,
      },
    });

    // 4. Load past conversation history for Groq context window
    const dbMessages = await prisma.message.findMany({
      where: { chatId: activeChat.id },
      orderBy: { createdAt: "asc" },
    });

    const fullConversation = [
      { role: "system" as const, content: systemPrompt },
      ...dbMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // 5. Query Groq API
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: fullConversation,
    });

    const aiText = response.choices[0]?.message?.content || "I missed that. Could you rephrase?";

    // 6. Save AI Response in DB
    const savedAiMessage = await prisma.message.create({
      data: {
        chatId: activeChat.id,
        role: "assistant",
        content: aiText,
      },
    });

    return NextResponse.json({
      chatId: activeChat.id,
      message: savedAiMessage,
    });
  } catch (error: any) {
  console.error("Groq / Chat API Error:", error);

  // Type-safe check for 429 rate limits
  const status = error?.status || error?.response?.status;
  const code = error?.code || error?.error?.code;

  if (status === 429 || code === "rate_limit_exceeded") {
    return NextResponse.json(
      {
        error: "Daily token limit exhausted for this session. Please create a new session or try again later.",
        isRateLimit: true,
      },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: "Failed to process chat request." },
    { status: 500 }
  );
}
}
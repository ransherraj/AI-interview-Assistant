import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { systemPrompt } from "../lib/SystemPrompt"; // Fixed: Clean export location avoiding route circular dependency

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// GET: Fetch active chats for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userChats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(userChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// POST: Create a new session
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check 20-session limit
    const totalChatsCount = await prisma.chat.count({
      where: { userId },
    });

    if (totalChatsCount >= 20) {
      return NextResponse.json(
        {
          error: "Maximum limit reached! You have reached 20 chats.",
          limitReached: true,
        },
        { status: 400 }
      );
    }

    // Dynamically generate AI initial message using system prompt
    const initResponse = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "system", content: systemPrompt }],
    });

    const initialAiText =
      initResponse.choices[0]?.message?.content ||
      "Welcome! To get started with your technical interview, please tell me your target role, years of experience, and primary tech stack.";

    // Create a new session in Prisma with dynamically generated initial message
    const newChat = await prisma.chat.create({
      data: {
        userId,
        title: "New Interview Session",
        status: "ACTIVE",
        messages: {
          create: [
            {
              role: "assistant",
              content: initialAiText,
            },
          ],
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create new chat" }, { status: 500 });
  }
}

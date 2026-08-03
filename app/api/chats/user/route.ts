import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch chats only belonging to the authenticated user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: Replace with your database adapter (Prisma, Mongoose, Supabase, Drizzle, etc.)
  // Example Prisma:
  // const userChats = await prisma.chatSession.findMany({ where: { userId: session.user.id } })
  const userChats: any[] = [] // Fetch user's chats from DB

  return NextResponse.json(userChats)
}

// POST: Create or Save a Chat for the authenticated user
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

    // Create a new session in Prisma
    const newChat = await prisma.chat.create({
      data: {
        userId,
        title: "New Interview Session",
        status: "ACTIVE",
      },
    });

    return NextResponse.json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create new chat" }, { status: 500 });
  }
}
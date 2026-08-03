import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { chatId } = await req.json()

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
  })

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  }

  const updatedChat = await prisma.chat.update({
    where: { id: chatId },
    data: { status: "DISCONTINUED" },
  })

  return NextResponse.json({ success: true, chat: updatedChat })
}
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // Fixed: Clean export location avoiding route circular dependency
import { prisma } from "../lib/prisma";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const systemPrompt = `
# ROLE AND PURPOSE
You are a Staff/Principal Software Engineer and Technical Interviewer at a top-tier technology company. Your objective is to conduct a realistic, rigorous, and adaptive technical interview tailored specifically to the candidate's target role, experience level, and tech stack.

---

# CORE CONSTRAINTS (NON-NEGOTIABLE)
1. ONE QUESTION AT A TIME: Ask exactly ONE primary question or follow-up per response. Never list multiple interview questions together.
2. CONVERSATIONAL TURN-TAKING: You MUST wait for the candidate to answer before giving feedback or asking the next question.
3. ADAPTIVE LISTENING: Every question and follow-up must explicitly build upon the candidate's previous response, resume details, or stated tech stack. Avoid generic stock questions.
4. FEEDBACK FIRST: Before moving to a new topic or question, provide brief, constructive feedback on the candidate's last answer.

---

# INTERVIEW STRUCTURE & COVERAGE
You will guide the candidate through three core modules. Tailor the depth of each module based on the candidate's seniority level:

1. Dynamic Setup & Calibration (1 turn)
   - If the candidate hasn't specified their background, open by asking for their target role, years of experience, and primary technical stack (e.g., "Senior Backend Engineer, 6 YOE, Go / Distributed Systems").

2. Data Structures & Algorithms (DSA) / Problem Solving
   - Focus on practical algorithmic thinking, trade-off analysis, time/space complexity ($O(N)$ notation), edge cases, and code structure.
   - Tailor difficulty based on seniority (Junior: basic structures; Mid/Senior: dynamic programming, graphs, concurrency, edge-case handling).

3. System Design & Architecture
   - Focus on scalability, fault tolerance, API design, database selection (SQL vs. NoSQL), caching, message queues, and trade-offs (CAP theorem, latency vs. throughput).
   - Adjust scale based on seniority (e.g., Senior candidates must address data partitioning, consistency models, and single points of failure).

4. Behavioral & Leadership (STAR Method)
   - Ask targeted questions using the STAR framework (Situation, Task, Action, Result).
   - Evaluate communication, conflict resolution, technical mentorship, and handling production outages or architectural debates.

---

# EVALUATION & FEEDBACK GUIDELINES
When giving feedback after an answer:
- Acknowledge strong points (e.g., correct time complexity identification, clear trade-off analysis).
- Point out missing edge cases, unaddressed failure modes, or areas for improvement gently but directly.
- Maintain a professional, encouraging, yet rigorous engineering tone.

---

# EDGE CASE & GENERAL QUERY HANDLING
1. DIRECT SHORT ANSWERS: If the candidate asks a simple, concise, or non-interview question (e.g., "What is my name?", "What is the color of a mango?", or a quick off-topic inquiry), answer it directly, accurately, and concisely first.
2. RE-ENGAGEMENT: After providing the direct answer, seamlessly steer the conversation back to the technical interview session in a polite and natural manner.

---

# EXECUTION PROTOCOL
- Step 1: Identify or ask for candidate context (Role, YOE, Stack).
- Step 2: Transition into Module 1 (DSA/Problem Solving) with a targeted problem.
- Step 3: Evaluate candidate response -> Give brief feedback -> Probe deeper OR move to the next logical step/question.
- Step 4: Seamlessly transition to System Design, then Behavioral.
- Step 5: At the end of the interview, provide a detailed final evaluation summary breaking down strengths, areas for growth, and a hiring recommendation.

# Output Formatting Directives:
1. Use markdown headers (## for main sections, ### for sub-questions/topics) to clearly structure your output.
2. Wrap key takeaways, summary points, or interviewer notes inside markdown blockquotes (>) so they render as callout boxes.
3. Highlight critical technical concepts, role keywords, and key parameters using **bold** syntax.
4. Naturally integrate expressive emojis (e.g., 🎯, 💡, 💻, ⏳, ⚠️, ✅, 🚀) to establish clear visual anchors.
5. Provide code solutions inside clear Markdown code blocks with appropriate language tags.
6. Use bullet points for steps, feedback, and structured lists.

Begin by introducing yourself briefly as the interviewer and ask the candidate for their target role, experience level, and preferred stack to get started.
`;

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
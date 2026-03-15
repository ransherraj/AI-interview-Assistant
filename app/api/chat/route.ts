import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const systemPrompt = `
You are a senior software engineer interviewer.

Rules:
1. Ask only ONE question at a time.
2. Wait for candidate answer.
3. Give feedback.
4. Ask next question.
5. Cover DSA, system design, and behavior.
`;

export async function POST(req: Request) {

  const body = await req.json();
  const messages = body.messages || [];

  // Last user message
  const lastMessage = messages[messages.length - 1]?.content || "";

  try {

    const response = await client.responses.create({
      model: "openai/gpt-oss-20b",
      input: systemPrompt + "\n\nUser: " + lastMessage,
    });

    const aiText = response.output_text;

    return Response.json({
      id: Date.now().toString(),
      role: "assistant",
      content: aiText,
    });

  } catch (error) {

    console.error(error);

    return Response.json({
      role: "assistant",
      content: "Error generating response",
    });

  }
}
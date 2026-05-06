import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Texto muito curto. Digite pelo menos 20 caracteres." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Você é um assistente de estudos. Com base no texto abaixo, gere exatamente 5 flashcards para revisão.

Responda APENAS com um JSON válido neste formato, sem explicações:
{
  "flashcards": [
    { "front": "pergunta", "back": "resposta" }
  ]
}

Texto:
${text}`,
        },
      ],
    });

    const raw =
  message.content[0].type === "text" ? message.content[0].text : "";
const cleaned = raw.replace(/```json|```/g, "").trim();
const json = JSON.parse(cleaned);

    return NextResponse.json(json);
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json(
      { error: "Erro interno. Verifique o terminal para detalhes." },
      { status: 500 }
    );
  }
}
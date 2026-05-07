import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

// ─── In-memory rate limiter (resets on server restart) ───────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;          // max requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: entry.resetAt - now };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const { allowed, remaining, resetIn } = checkRateLimit(ip);

    if (!allowed) {
      const secondsLeft = Math.ceil(resetIn / 1000);
      return NextResponse.json(
        { error: `Limite atingido. Tente novamente em ${secondsLeft}s.` },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(secondsLeft),
          },
        }
      );
    }

    const { text } = await req.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Texto muito curto. Digite pelo menos 20 caracteres." },
        { status: 400 }
      );
    }

    if (text.trim().length > 10_000) {
      return NextResponse.json(
        { error: "Texto muito longo. Use até 10.000 caracteres." },
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

    return NextResponse.json(json, {
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json(
      { error: "Erro interno. Verifique o terminal para detalhes." },
      { status: 500 }
    );
  }
}
"use client";

import { useState } from "react";

type Flashcard = {
  front: string;
  back: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setFlashcards([]);
    setFlipped(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setFlashcards(data.flashcards || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">StudySnap ⚡</h1>
      <p className="text-gray-500 text-lg mb-8">
        Cole um texto e gere flashcards com IA
      </p>

      <textarea
        className="w-full max-w-xl p-4 border rounded-xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
        rows={6}
        placeholder="Cole aqui o texto que você quer estudar..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Gerando..." : "Gerar Flashcards"}
      </button>

      {flashcards.length > 0 && (
        <div className="mt-10 w-full max-w-xl flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Seus Flashcards
          </h2>
          {flashcards.map((card, i) => (
            <div
              key={i}
              onClick={() => setFlipped(flipped === i ? null : i)}
              className="cursor-pointer p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-purple-500 font-medium mb-1">
                {flipped === i ? "Resposta" : "Pergunta"}
              </p>
              <p className="text-gray-800">
                {flipped === i ? card.back : card.front}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Clique para {flipped === i ? "ver a pergunta" : "revelar a resposta"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
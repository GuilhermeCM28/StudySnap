"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

type Flashcard = { front: string; back: string };
type Deck = { id: string; title: string; flashcards: Flashcard[]; created_at: string };

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "mydecks">("generate");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadDecks();
    });
  }, []);

  useEffect(() => {
    if (user) loadDecks();
  }, [user]);

  async function loadDecks() {
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .order("created_at", { ascending: false });
    setDecks(data || []);
  }

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setDecks([]);
  }

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

  async function handleSave() {
    if (!user) { alert("Faça login para salvar!"); return; }
    const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
    await supabase.from("flashcard_decks").insert({
      user_id: user.id,
      title,
      flashcards,
    });
    alert("Deck salvo!");
    loadDecks();
  }

  async function handleDelete(id: string) {
    await supabase.from("flashcard_decks").delete().eq("id", id);
    loadDecks();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">StudySnap ⚡</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
              Sair
            </button>
          </div>
        ) : (
          <button onClick={handleLogin} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
            Entrar com Google
          </button>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "generate" ? "bg-purple-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
          >
            Gerar Flashcards
          </button>
          <button
            onClick={() => setActiveTab("mydecks")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "mydecks" ? "bg-purple-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
          >
            Meus Decks {decks.length > 0 && `(${decks.length})`}
          </button>
        </div>

        {/* Aba Gerar */}
        {activeTab === "generate" && (
          <div>
            <textarea
  className="w-full p-4 border rounded-xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
  style={{ color: '#000000' }}
  rows={6}
  placeholder="Cole aqui o texto que você quer estudar..."
  value={text}
  onChange={(e) => setText(e.target.value)}
/>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Gerando..." : "Gerar Flashcards"}
            </button>

            {flashcards.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-700">Seus Flashcards</h2>
                  {user && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                      Salvar Deck
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {flashcards.map((card, i) => (
                    <div
                      key={i}
                      onClick={() => setFlipped(flipped === i ? null : i)}
                      className="cursor-pointer p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-purple-500 font-medium mb-1">
                        {flipped === i ? "Resposta" : "Pergunta"}
                      </p>
                      <p className="text-gray-800">{flipped === i ? card.back : card.front}</p>
                      <p className="text-xs text-gray-400 mt-3">
                        Clique para {flipped === i ? "ver a pergunta" : "revelar a resposta"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba Meus Decks */}
        {activeTab === "mydecks" && (
          <div>
            {!user ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">Faça login para ver seus decks salvos.</p>
                <button onClick={handleLogin} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                  Entrar com Google
                </button>
              </div>
            ) : decks.length === 0 ? (
              <p className="text-center text-gray-400 py-16">Nenhum deck salvo ainda.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {decks.map((deck) => (
                  <div key={deck.id} className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{deck.title}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {deck.flashcards.length} flashcards · {new Date(deck.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(deck.id)} className="text-sm text-red-400 hover:text-red-600">
                        Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
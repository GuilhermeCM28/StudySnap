"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

type Flashcard = { front: string; back: string };
type Deck = { id: string; title: string; flashcards: Flashcard[]; created_at: string };
type Toast = { id: number; message: string; type: "success" | "error" | "info" };

// ─── Icons (inline SVG) ────────────────────────────────────────────────────
function BoltIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.09 12.96H11L10 22l8.91-10.96H13z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3"/>
      <path d="M2 10h20"/>
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>
    </svg>
  );
}

// ─── Loading Dots ───────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  );
}

// ─── Close Icon ─────────────────────────────────────────────────────────────
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Toast Notification ─────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} className="toast-item" style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: t.type === "success" ? "rgba(34,197,94,0.15)" : t.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(139,92,246,0.15)",
          border: `1px solid ${t.type === "success" ? "rgba(34,197,94,0.3)" : t.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(139,92,246,0.3)"}`,
          borderRadius: "var(--radius-lg)",
          backdropFilter: "blur(12px)",
          color: t.type === "success" ? "#4ade80" : t.type === "error" ? "#f87171" : "var(--accent-light)",
          fontSize: "0.875rem", fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          pointerEvents: "all", minWidth: "220px", maxWidth: "320px",
        }}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7, padding: "2px", display: "flex" }}><XIcon /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Deck Preview Modal ──────────────────────────────────────────────────────
function DeckModal({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const [flipped, setFlipped] = useState<number | null>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-card" style={{ width: "100%", maxWidth: "640px", maxHeight: "80vh", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{deck.title}</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{deck.flashcards.length} cartões · clique para revelar</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer", padding: "0.375rem", display: "flex" }}><XIcon /></button>
        </div>
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.25rem" }}>
          {deck.flashcards.map((card, i) => {
            const isFlipped = flipped === i;
            return (
              <div key={i} onClick={() => setFlipped(isFlipped ? null : i)} className="glass-card" style={{ padding: "1rem 1.25rem", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "6px", background: isFlipped ? "rgba(34,197,94,0.12)" : "rgba(139,92,246,0.12)", border: `1px solid ${isFlipped ? "rgba(34,197,94,0.25)" : "rgba(139,92,246,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 600, color: isFlipped ? "#4ade80" : "var(--accent-light)" }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: isFlipped ? "#4ade80" : "var(--accent-light)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{isFlipped ? "Resposta" : "Pergunta"}</p>
                    <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.55 }}>{isFlipped ? card.back : card.front}</p>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: "0.6875rem", color: "var(--text-muted)" }}>{isFlipped ? "←" : "→"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [decksLoading, setDecksLoading] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "mydecks">("generate");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

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

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  async function loadDecks() {
    setDecksLoading(true);
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .order("created_at", { ascending: false });
    setDecks(data || []);
    setDecksLoading(false);
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
    addToast("Sessão encerrada.", "info");
  }

  async function handleGenerate() {
    setLoading(true);
    setFlashcards([]);
    setFlipped(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Erro ao gerar flashcards.", "error");
      } else {
        setFlashcards(data.flashcards || []);
      }
    } catch {
      addToast("Erro de conexão. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) { addToast("Faça login para salvar!", "error"); return; }
    const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
    const { error } = await supabase.from("flashcard_decks").insert({ user_id: user.id, title, flashcards });
    if (error) { addToast("Erro ao salvar o deck.", "error"); return; }
    setSaveSuccess(true);
    addToast("Deck salvo com sucesso! ✓", "success");
    setTimeout(() => setSaveSuccess(false), 2500);
    loadDecks();
  }

  async function handleDelete(id: string) {
    await supabase.from("flashcard_decks").delete().eq("id", id);
    addToast("Deck removido.", "info");
    loadDecks();
  }

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Deck preview modal */}
      {previewDeck && <DeckModal deck={previewDeck} onClose={() => setPreviewDeck(null)} />}

      {/* Ambient glow */}
      <div className="hero-glow" />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* ── Header ── */}
        <header
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            background: "rgba(2, 6, 23, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "0 2rem",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 4px 16px var(--accent-glow)",
                }}
              >
                <BoltIcon size={16} />
              </div>
              <span style={{ fontWeight: 700, fontSize: "1.0625rem", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                StudySnap
              </span>
            </div>

            {/* Auth */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{user.email}</span>
                <button className="btn-outline" style={{ padding: "0.375rem 0.875rem" }} onClick={handleLogout}>
                  Sair
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={handleLogin} style={{ gap: "0.5rem" }}>
                <GoogleIcon />
                Entrar com Google
              </button>
            )}
          </div>
        </header>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, maxWidth: "1100px", width: "100%", margin: "0 auto", padding: "2.5rem 2rem 4rem" }}>

          {/* Page title — only for logged-in users */}
          {user && (
            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Olá, <span className="gradient-text">{user.email?.split("@")[0]}</span> 👋
              </h1>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
                Cole um texto e deixe a IA gerar cartões de estudo automaticamente.
              </p>
            </div>
          )}

          {/* Tabs — only shown when logged in */}
          {user && (
            <div
              style={{
                display: "inline-flex",
                gap: "0.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                padding: "0.25rem",
                marginBottom: "2rem",
              }}
            >
              {(["generate", "mydecks"] as const).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-lg)",
                      border: "none",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "#fff" : "var(--text-secondary)",
                      boxShadow: active ? "0 2px 12px var(--accent-glow)" : "none",
                    }}
                  >
                    {tab === "generate" ? <CardIcon /> : <LayersIcon />}
                    {tab === "generate" ? "Gerar" : `Meus Decks${decks.length > 0 ? ` (${decks.length})` : ""}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Logged-out: hero CTA ── */}
          {!user && (
            <div className="animate-fade-in-up" style={{ textAlign: "center", padding: "2rem 0 3rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 1rem",
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  color: "var(--accent-light)",
                  marginBottom: "1.5rem",
                }}
              >
                <SparkleIcon /> Powered by IA
              </div>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1rem", lineHeight: 1.15 }}>
                Transforme qualquer texto em<br />
                <span className="gradient-text">flashcards de estudo</span>
              </h1>
              <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)", marginBottom: "2.5rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
                Cole um texto e nossa IA gera cartões de pergunta e resposta em segundos.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={handleLogin} style={{ gap: "0.5rem", padding: "0.875rem 2rem", fontSize: "1rem" }}>
                  <GoogleIcon /> Entrar com Google
                </button>
                <button
                  className="btn-outline"
                  style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
                  onClick={() => {
                    setShowGenerator(true);
                    setTimeout(() => {
                      document.getElementById('guest-generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      document.getElementById('study-text-guest')?.focus();
                    }, 50);
                  }}
                >
                  Experimentar sem login
                </button>
              </div>

              {/* Feature cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "4rem", textAlign: "left" }}>
                {[
                  { icon: <SparkleIcon />, title: "IA Generativa", desc: "GPT-4o mini gera perguntas inteligentes a partir do seu texto" },
                  { icon: <CardIcon />, title: "Flashcards interativos", desc: "Clique para revelar a resposta e fixar o conteúdo" },
                  { icon: <LayersIcon />, title: "Salve seus decks", desc: "Organize e acesse seus baralhos a qualquer momento" },
                ].map((f, i) => (
                  <div key={i} className="glass-card" style={{ padding: "1.5rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-light)", marginBottom: "0.875rem" }}>{f.icon}</div>
                    <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: "0.375rem" }}>{f.title}</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Logged-out generator ── */}
          {!user && showGenerator && (
            <div id="guest-generator" className="animate-fade-in-up" style={{ marginTop: "2rem" }}>
              <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "0.875rem" }}>
                <label
                  htmlFor="study-text-guest"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.625rem", letterSpacing: "0.01em" }}
                >
                  TEXTO PARA ESTUDO
                </label>
                <textarea
                  id="study-text-guest"
                  rows={7}
                  placeholder="Cole aqui o texto que você quer estudar..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", resize: "none", fontSize: "0.9375rem", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: text.trim().length < 20 ? "#f87171" : text.trim().length < 80 ? "#fbbf24" : "#4ade80", transition: "color 0.3s", fontWeight: 500 }}>
                    {text.trim().length < 20 ? `${20 - text.trim().length} chars para ativar` : `${text.length} caracteres`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading || text.trim().length < 20}
                className="btn-primary"
                style={{ width: "100%", padding: "0.875rem", fontSize: "0.9375rem" }}
              >
                {loading ? <>Gerando flashcards <LoadingDots /></> : <><SparkleIcon /> Gerar Flashcards com IA</>}
              </button>

              {flashcards.length > 0 && (
                <div style={{ marginTop: "2rem" }} className="animate-fade-in-up">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Flashcards gerados</h2>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{flashcards.length} cartões · clique para revelar</p>
                    </div>
                    <button className="btn-primary" onClick={handleLogin} style={{ gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.8125rem" }}>
                      <GoogleIcon /> Salvar com login
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {flashcards.map((card, i) => {
                      const isFlipped = flipped === i;
                      return (
                        <div key={i} onClick={() => setFlipped(isFlipped ? null : i)} className="glass-card" style={{ padding: "1.25rem 1.5rem", cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                            <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "6px", background: isFlipped ? "rgba(34,197,94,0.12)" : "rgba(139,92,246,0.12)", border: `1px solid ${isFlipped ? "rgba(34,197,94,0.25)" : "rgba(139,92,246,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 600, color: isFlipped ? "#4ade80" : "var(--accent-light)" }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: isFlipped ? "#4ade80" : "var(--accent-light)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{isFlipped ? "Resposta" : "Pergunta"}</p>
                              <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.55 }}>{isFlipped ? card.back : card.front}</p>
                            </div>
                            <span style={{ flexShrink: 0, fontSize: "0.6875rem", color: "var(--text-muted)" }}>{isFlipped ? "←" : "→"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Logged-in: 2-column layout ── */}
          {user && activeTab === "generate" && (
            <div className="animate-fade-in-up" style={{ display: "grid", gridTemplateColumns: flashcards.length > 0 ? "1fr 1fr" : "1fr", gap: "1.5rem", alignItems: "start", transition: "grid-template-columns 0.4s ease" }}>
              {/* LEFT: Input */}
              <div>
              {/* Textarea card */}
              <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "0.875rem" }}>
                <label
                  htmlFor="study-text"
                  style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.625rem", letterSpacing: "0.01em" }}
                >
                  TEXTO PARA ESTUDO
                </label>
                <textarea
                  id="study-text"
                  rows={7}
                  placeholder="Cole aqui o texto que você quer estudar..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    resize: "none",
                    fontSize: "0.9375rem",
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: text.trim().length < 20 ? "#f87171" : text.trim().length < 80 ? "#fbbf24" : "#4ade80", transition: "color 0.3s", fontWeight: 500 }}>
                    {text.trim().length < 20 ? `${20 - text.trim().length} chars para ativar` : `${text.length} caracteres`}
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || text.trim().length < 20}
                className="btn-primary"
                style={{ width: "100%", padding: "0.875rem", fontSize: "0.9375rem" }}
              >
                {loading ? (
                  <>Gerando flashcards <LoadingDots /></>
                ) : (
                  <><SparkleIcon /> Gerar Flashcards com IA</>
                )}
              </button>
            </div>

            {/* RIGHT: Flashcards result */}
            {flashcards.length > 0 && (
              <div className="animate-fade-in-up">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Flashcards gerados</h2>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {flashcards.length} {flashcards.length === 1 ? "cartão" : "cartões"} · clique para revelar
                    </p>
                  </div>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{ background: saveSuccess ? "var(--accent-dark)" : undefined, padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
                  >
                    {saveSuccess ? "✓ Salvo!" : "Salvar Deck"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "70vh", overflowY: "auto", paddingRight: "0.25rem" }}>
                  {flashcards.map((card, i) => {
                    const isFlipped = flipped === i;
                    return (
                      <div key={i}
                        onClick={() => setFlipped(isFlipped ? null : i)}
                        className="glass-card"
                        style={{ padding: "1rem 1.25rem", cursor: "pointer", animationDelay: `${i * 60}ms` }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "6px", background: isFlipped ? "rgba(34,197,94,0.12)" : "rgba(139,92,246,0.12)", border: `1px solid ${isFlipped ? "rgba(34,197,94,0.25)" : "rgba(139,92,246,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 600, color: isFlipped ? "#4ade80" : "var(--accent-light)", transition: "all var(--transition)" }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: isFlipped ? "#4ade80" : "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{isFlipped ? "Resposta" : "Pergunta"}</p>
                              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{i + 1} / {flashcards.length}</span>
                            </div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{isFlipped ? card.back : card.front}</p>
                          </div>
                          <span style={{ flexShrink: 0, fontSize: "0.6875rem", color: "var(--text-muted)" }}>{isFlipped ? "←" : "→"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

          {/* ── Tab: My Decks (logged in) ── */}
          {user && activeTab === "mydecks" && (
            <div className="animate-fade-in-up">
              {decksLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                  {[1,2,3].map((n) => (
                    <div key={n} className="glass-card skeleton" style={{ padding: "1.375rem 1.5rem", height: "90px" }} />
                  ))}
                </div>
              ) : decks.length === 0 ? (
                <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "var(--accent-light)" }}>
                    <LayersIcon />
                  </div>
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Nenhum deck salvo ainda</h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.75rem" }}>Gere flashcards e salve seus primeiros decks.</p>
                  <button className="btn-outline" onClick={() => setActiveTab("generate")}>Gerar agora</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                  {decks.map((deck, i) => (
                    <div key={deck.id} className="glass-card" style={{ padding: "1.375rem 1.5rem", animationDelay: `${i * 60}ms`, cursor: "pointer" }} onClick={() => setPreviewDeck(deck)}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span className="badge" style={{ fontSize: "0.6875rem" }}>{deck.flashcards.length} cards</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(deck.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <button className="btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(deck.id); }}><TrashIcon /> Deletar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "1.25rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            StudySnap · Feito com IA &amp; ☕
          </p>
        </footer>
      </div>
    </>
  );
}
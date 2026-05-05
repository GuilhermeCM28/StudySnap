export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        StudySnap ⚡
      </h1>
      <p className="text-gray-500 text-lg">
        Cole um texto e gere flashcards com IA
      </p>
      <textarea
        className="mt-8 w-full max-w-xl p-4 border rounded-xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
        rows={6}
        placeholder="Cole aqui o texto que você quer estudar..."
      />
      <button className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors">
        Gerar Flashcards
      </button>
    </main>
  )
}
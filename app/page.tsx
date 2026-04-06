'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter()
  const [slug, setSlug] = useState('')


  function handleNamedPad() {
    if (slug.trim()) {
      router.push('/' + slug.trim())
    }
    else {
      router.push('/' + Math.random().toString(36).slice(2, 8))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-8">
      <h1 className="text-6xl font-bold text-white tracking-tight">codesnap</h1>
      <p className="text-zinc-500 text-lg">real-time collaborative code editor</p>

      <div className="flex gap-2">
        <input
          value={slug}
          onChange={e => setSlug(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleNamedPad()}
          placeholder="your codesnap name"
          className="bg-zinc-900 text-white border border-zinc-700 rounded px-4 py-2 focus:outline-none focus:border-zinc-400 w-48 placeholder:text-zinc-600 transition"
        />
        <button onClick={handleNamedPad} className="bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700 transition">
          Go
        </button>
      </div>
      <p className="text-zinc-600 text-sm">leave empty for a random name</p>
    </div>
  );
}
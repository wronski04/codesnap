import { supabase } from "@/lib/supabase"
import PadEditor from "@/components/PadEditor"

export default async function PadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await supabase
    .from('pads')
    .select('*')
    .eq('slug', slug)
    .single()

  let pad = data

  if (!data) {
    const { data: newPad } = await supabase
      .from('pads')
      .insert({ slug })
      .select('*')
      .single()
    pad = newPad
  }


  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-black z-10 relative">
        <a href="/" className="text-xl font-bold tracking-tight">codesnap</a>
        <span className="text-zinc-500 text-sm font-mono">{slug}</span>
      </header>
      <main className="flex-1 flex flex-col">
        <PadEditor content={pad?.content || ''} slug={slug} />
      </main>
    </div>
  )
}
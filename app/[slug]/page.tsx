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
    <div style={{ padding: "2rem" }}>
      <h1>Pad: {slug}</h1>
      <p>To będzie collaborative editor</p>
      <PadEditor content={pad?.content || ''} slug={slug} />
    </div>
  )
}
export default async function PadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Pad: {slug}</h1>
      <p>To będzie collaborative editor</p>
    </div>
  )
}
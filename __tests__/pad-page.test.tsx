import { describe, it, expect, vi } from 'vitest'

// WAŻNE: vi.mock jest hoistowany na górę pliku przez Vitest,
// więc fabryka MUSI być self-contained — żadnych zewnętrznych zmiennych.
vi.mock('@/lib/supabase', () => {
  const single = vi.fn().mockResolvedValue({ data: { slug: 'abc', content: 'hello' }, error: null })
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
        insert: vi.fn(() => ({ select: vi.fn(() => ({ single })) })),
      })),
    },
  }
})

vi.mock('@/components/PadEditor', () => ({
  default: ({ content, slug }: { content: string; slug: string }) => (
    <div data-testid="pad-editor" data-content={content} data-slug={slug} />
  ),
}))

import PadPage from '@/app/[slug]/page'
import { render, screen } from '@testing-library/react'

describe('PadPage', () => {
  it('renderuje stronę z edytorem dla istniejącego pada', async () => {
    const jsx = await PadPage({ params: Promise.resolve({ slug: 'abc' }) })
    render(jsx)
    expect(screen.getByTestId('pad-editor')).toBeTruthy()
    expect(screen.getByText('abc')).toBeTruthy()
  })

  it('tworzy nowy pad gdy supabase zwraca null', async () => {
    const { supabase } = await import('@/lib/supabase')
    // Nadpisz mockowanie dla tego testu — brak danych przy SELECT, tworzenie przy INSERT
    const noData = vi.fn().mockResolvedValue({ data: null, error: null })
    const newData = vi.fn().mockResolvedValue({ data: { slug: 'new', content: '' }, error: null })
    ;(supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: noData })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: newData })) })),
    })

    const jsx = await PadPage({ params: Promise.resolve({ slug: 'new' }) })
    render(jsx)
    expect(screen.getAllByTestId('pad-editor').length).toBeGreaterThan(0)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js before importing lib/supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates client with env vars', async () => {
    const { createClient } = await import('@supabase/supabase-js')

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'

    await import('@/lib/supabase')

    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-key'
    )
  })
})

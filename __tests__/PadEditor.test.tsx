import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import PadEditor from '@/components/PadEditor'

// EditorView.updateListener.of musi istnieć jako statyczna metoda na klasie
const mockUpdateListener = { of: vi.fn(() => []) }
const mockEditorViewInstance = {
  destroy: vi.fn(),
  focus: vi.fn(),
  state: { doc: { toString: () => '', length: 0 } },
  dispatch: vi.fn(),
}

vi.mock('@codemirror/view', () => {
  class MockEditorView {
    static updateListener = { of: vi.fn(() => []) }
    destroy = vi.fn()
    focus = vi.fn()
    state = { doc: { toString: () => '', length: 0 } }
    dispatch = vi.fn()
    constructor() {
      Object.assign(mockEditorViewInstance, this)
    }
  }
  return {
    EditorView: MockEditorView,
    placeholder: vi.fn(() => []),
  }
})

vi.mock('codemirror', () => ({ basicSetup: [] }))
vi.mock('@codemirror/lang-javascript', () => ({ javascript: vi.fn(() => []) }))
vi.mock('@/lib/theme', () => ({ theme: [] }))

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

describe('PadEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Przywróć mock kanału po clearAllMocks
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('renderuje kontener edytora', () => {
    const { container } = render(<PadEditor content="hello world" slug="test-slug" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('subskrybuje na kanał Supabase po zamontowaniu', async () => {
    const { supabase } = await import('@/lib/supabase')
    render(<PadEditor content="" slug="my-pad" />)

    expect(supabase.channel).toHaveBeenCalledWith(
      'pad:my-pad:messages',
      expect.objectContaining({ config: { private: false } })
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('usuwa kanał po odmontowaniu', async () => {
    const { supabase } = await import('@/lib/supabase')
    const { unmount } = render(<PadEditor content="" slug="cleanup-slug" />)
    unmount()
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })
})

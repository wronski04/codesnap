import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PadEditor from '@/components/PadEditor'

const mockEditorViewInstance = {
  destroy: vi.fn(),
  focus: vi.fn(),
  state: { doc: { toString: () => '', length: 0 } },
  dispatch: vi.fn(),
}

vi.mock('@codemirror/view', () => {
  class MockEditorView {
    static updateListener = { of: vi.fn(() => []) }
    destroy = mockEditorViewInstance.destroy
    focus = mockEditorViewInstance.focus
    state = mockEditorViewInstance.state
    dispatch = mockEditorViewInstance.dispatch
  }
  return {
    EditorView: MockEditorView,
    placeholder: vi.fn(() => []),
  }
})

// Compartment musi mieć metodę .of() i .reconfigure()
vi.mock('@codemirror/state', () => ({
  Compartment: class {
    of = vi.fn(() => [])
    reconfigure = vi.fn(() => ({ type: 'reconfigure' }))
  },
}))

vi.mock('codemirror', () => ({ basicSetup: [] }))

// Wszystkie języki jako vi.fn() zwracające []
vi.mock('@codemirror/lang-javascript', () => ({ javascript: vi.fn(() => []) }))
vi.mock('@codemirror/lang-python',     () => ({ python: vi.fn(() => []) }))
vi.mock('@codemirror/lang-rust',       () => ({ rust: vi.fn(() => []) }))
vi.mock('@codemirror/lang-cpp',        () => ({ cpp: vi.fn(() => []) }))
vi.mock('@codemirror/lang-java',       () => ({ java: vi.fn(() => []) }))
vi.mock('@codemirror/lang-css',        () => ({ css: vi.fn(() => []) }))
vi.mock('@codemirror/lang-html',       () => ({ html: vi.fn(() => []) }))
vi.mock('@codemirror/lang-json',       () => ({ json: vi.fn(() => []) }))
vi.mock('@codemirror/lang-markdown',   () => ({ markdown: vi.fn(() => []) }))
vi.mock('@codemirror/lang-sql',        () => ({ sql: vi.fn(() => []) }))

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
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
  })

  it('renderuje kontener edytora', () => {
    const { container } = render(<PadEditor content="hello world" slug="test-slug" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renderuje dropdown z językami', () => {
    render(<PadEditor content="" slug="lang-test" />)
    const select = screen.getByRole('combobox')
    expect(select).toBeTruthy()
    expect(screen.getByText('JavaScript')).toBeTruthy()
    expect(screen.getByText('Python')).toBeTruthy()
  })

  it('domyślnie wybrany jest JavaScript', () => {
    render(<PadEditor content="" slug="lang-default" />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('javascript')
  })

  it('zmiana języka aktualizuje select i wywołuje dispatch na edytorze', () => {
    render(<PadEditor content="" slug="lang-change" />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'python' } })
    expect((select as HTMLSelectElement).value).toBe('python')
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

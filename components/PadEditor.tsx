'use client'

import { useRef, useEffect, useState } from 'react'
import { EditorView, placeholder } from '@codemirror/view'
import { Compartment } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { supabase } from '@/lib/supabase'
import { basicSetup } from 'codemirror'
import { theme } from '@/lib/theme'

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript', ext: () => javascript() },
  { label: 'TypeScript', value: 'typescript', ext: () => javascript({ typescript: true }) },
  { label: 'Python',     value: 'python',     ext: () => python() },
  { label: 'Rust',       value: 'rust',       ext: () => rust() },
  { label: 'C++',        value: 'cpp',        ext: () => cpp() },
  { label: 'Java',       value: 'java',       ext: () => java() },
  { label: 'CSS',        value: 'css',        ext: () => css() },
  { label: 'HTML',       value: 'html',       ext: () => html() },
  { label: 'JSON',       value: 'json',       ext: () => json() },
  { label: 'Markdown',   value: 'markdown',   ext: () => markdown() },
  { label: 'SQL',        value: 'sql',        ext: () => sql() },
] as const

type LangValue = typeof LANGUAGES[number]['value']

export default function PadEditor({ content, slug }: { content: string, slug: string }) {
    const editorRef = useRef<HTMLDivElement>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const viewRef = useRef<EditorView | null>(null)
    const isRemoteUpdate = useRef(false)
    const langCompartment = useRef(new Compartment())
    const [lang, setLang] = useState<LangValue>('javascript')

    useEffect(() => {
        const channel = supabase
            .channel(`pad:${slug}:messages`, {
                config: { private: false },
            })
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pads' },
                (payload => {
                    const currentContent = viewRef.current?.state.doc.toString()
                    const newContent = (payload.new as { content: string }).content
                    if (currentContent !== newContent) {
                        isRemoteUpdate.current = true
                        viewRef.current?.dispatch({
                            changes: {
                                from: 0,
                                to: viewRef.current.state.doc.length,
                                insert: newContent
                            }
                        })
                    }
                })
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    useEffect(() => {
        if (!editorRef.current) return
        const initialLang = LANGUAGES.find(l => l.value === lang)!
        const view = new EditorView({
            doc: content,
            extensions: [
                basicSetup,
                langCompartment.current.of(initialLang.ext()),
                theme,
                placeholder('start typing...'),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        if (isRemoteUpdate.current) {
                            isRemoteUpdate.current = false
                            return
                        }
                        clearTimeout(timer.current || undefined)
                        timer.current = setTimeout(async () => {
                            try {
                                const currentContent = view.state.doc.toString()
                                await supabase
                                    .from('pads')
                                    .update({ content: currentContent })
                                    .eq('slug', slug)
                            } catch (error) {
                                console.log('Save failed:', error)
                            }
                        }, 1000)
                    }
                })],
            parent: editorRef.current
        })
        viewRef.current = view
        return () => view.destroy()
    }, [])

    function handleLangChange(newLang: LangValue) {
        setLang(newLang)
        const ext = LANGUAGES.find(l => l.value === newLang)!.ext()
        viewRef.current?.dispatch({
            effects: langCompartment.current.reconfigure(ext)
        })
    }

    return (
        <div className="relative h-full">
            <div
                style={{ background: '#151515', height: '100%', width: '100%', overflowY: 'auto' }}
                onClick={() => viewRef.current?.focus()}
            >
                <div ref={editorRef} />
            </div>
            <select
                value={lang}
                onChange={e => handleLangChange(e.target.value as LangValue)}
                className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur-sm text-zinc-500 hover:text-zinc-200 text-xs font-mono border border-zinc-800 hover:border-zinc-600 rounded-md px-2 py-1 focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
            >
                {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                ))}
            </select>
        </div>
    )
}

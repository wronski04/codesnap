'use client'

import { useRef, useEffect } from 'react'
import { EditorView, placeholder } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { supabase } from '@/lib/supabase'
import { basicSetup } from 'codemirror'
import { theme } from '@/lib/theme'


export default function PadEditor({ content, slug }: { content: string, slug: string }) {
    const editorRef = useRef<HTMLDivElement>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const viewRef = useRef<EditorView | null>(null)
    const isRemoteUpdate = useRef(false)

    useEffect(() => {
        const channel = supabase
            .channel(`pad:${slug}:messages`, {
                config: { private: false },
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pads'
                },
                (
                    payload => {
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
        const view = new EditorView({
            doc: content,
            extensions: [
                basicSetup,
                javascript(),
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

    return (
        <div
            style={{ background: '#151515', height: '100%', width: '100%', overflowY: 'auto' }}
            onClick={() => viewRef.current?.focus()}
        >
            <div ref={editorRef} />
        </div>
    )
}
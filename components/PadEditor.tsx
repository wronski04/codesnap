'use client'

import { useRef, useEffect } from 'react'
import { EditorView} from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { supabase } from '@/lib/supabase'



export default function PadEditor({ content, slug }: {content: string, slug: string}) {
    const editorRef = useRef<HTMLDivElement>(null)

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!editorRef.current) return  
        const view = new EditorView({
            doc: content,
            extensions: [javascript(), EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    clearTimeout(timer.current || undefined)
                    timer.current = setTimeout(async () => {
                        try {
                            const currentContent = view.state.doc.toString()
                            await supabase
                            .from('pads')
                            .update({ content: currentContent })
                            .eq('slug', slug)
                        } catch(error) {
                            console.log('Save failed:', error)
                        }
                    }, 1000)
                }
            })],
            parent: editorRef.current
        })
        return () => view.destroy()
    }, [])

  

    return <div ref = {editorRef} style={{background: '#707070'}} ></div>
}
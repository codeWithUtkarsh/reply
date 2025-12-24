'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Edit2, Save, X } from 'lucide-react'
import { VideoNotes, NoteSection, notesApi } from '@/lib/api'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { marked } from 'marked'

/* ======================================================
   Mermaid Diagram
====================================================== */
function MermaidDiagram({ code, theme }: { code: string; theme: 'light' | 'dark' }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      const mermaid = (await import('mermaid')).default

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: theme === 'dark' ? 'dark' : 'default',
      })

      if (!ref.current || cancelled) return

      ref.current.innerHTML = ''
      const pre = document.createElement('pre')
      pre.className = 'mermaid'
      pre.textContent = code
      ref.current.appendChild(pre)

      await mermaid.run({ nodes: [pre] })
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code, theme])

  return <div ref={ref} className="my-6 flex justify-center overflow-x-auto" />
}

/* ======================================================
   Notion-Style Toolbar
====================================================== */
function MenuBar({ editor }: { editor: any }) {
  const state = useEditorState({
    editor,
    selector: ctx => ({
      bold: ctx.editor.isActive('bold'),
      italic: ctx.editor.isActive('italic'),
      bullet: ctx.editor.isActive('bulletList'),
      ordered: ctx.editor.isActive('orderedList'),
    }),
  })

  const btn =
    'px-2 py-1 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition'

  return (
    <div className="flex gap-1 mb-2 opacity-80 hover:opacity-100">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${state.bold && 'bg-gray-300 dark:bg-gray-700'}`}>
        B
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${state.italic && 'bg-gray-300 dark:bg-gray-700'}`}>
        I
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${state.bullet && 'bg-gray-300 dark:bg-gray-700'}`}>
        •
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${state.ordered && 'bg-gray-300 dark:bg-gray-700'}`}>
        1.
      </button>
    </div>
  )
}

/* ======================================================
   Helper: Check if content is markdown vs HTML
====================================================== */
function isMarkdown(text: string): boolean {
  // Simple heuristic: if it doesn't start with HTML tags, treat as markdown
  const trimmed = text.trim()
  return !trimmed.startsWith('<') || trimmed.includes('**') || trimmed.includes('##')
}

/* ======================================================
   TipTap Section
====================================================== */
function TipTapSection({
  content,
  isEditMode,
  onChange,
}: {
  content: string
  isEditMode: boolean
  onChange: (html: string) => void
}) {
  const [htmlContent, setHtmlContent] = useState('')

  // Convert markdown to HTML on mount if needed
  useEffect(() => {
    if (isMarkdown(content)) {
      const html = marked.parse(content) as string
      setHtmlContent(html)
    } else {
      setHtmlContent(content)
    }
  }, [content])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: htmlContent,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none ' +
          'prose-headings:font-semibold prose-p:leading-relaxed ' +
          'prose-p:my-2 prose-li:my-1',

      },
    },
    immediatelyRender: false,
  })

  // Update editor content when htmlContent changes
  useEffect(() => {
    if (editor && htmlContent && editor.getHTML() !== htmlContent) {
      editor.commands.setContent(htmlContent)
    }
  }, [editor, htmlContent])

  if (typeof window === 'undefined' || !editor) return null

  if (!isEditMode) {
    // If content is markdown, render with ReactMarkdown
    if (isMarkdown(content)) {
      return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )
    }
    // Otherwise render HTML directly
    return (
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className="group-hover:bg-gray-50 dark:group-hover:bg-gray-800 rounded px-2 transition">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="px-1 py-2 min-h-[120px]" />
    </div>
  )
}

/* ======================================================
   Main Component
====================================================== */
export default function VideoNotes({ notes }: { notes: VideoNotes }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [sections, setSections] = useState<NoteSection[]>(Array.isArray(notes.sections) ? notes.sections : [])
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await notesApi.updateNotes(notes.notes_id, { title: notes.title, sections })
    setIsEditMode(false)
    setSaving(false)
  }

  return (
    <div className={theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}>
      {/* Controls */}
      <div className="flex justify-end gap-3 p-4">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-sm opacity-70 hover:opacity-100">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        {!isEditMode ? (
          <button onClick={() => setIsEditMode(true)} className="flex gap-1 items-center text-sm">
            <Edit2 size={14} /> Edit
          </button>
        ) : (
          <>
            <button onClick={() => setIsEditMode(false)} className="flex gap-1 items-center text-sm">
              <X size={14} /> Cancel
            </button>
            <button onClick={save} disabled={saving} className="flex gap-1 items-center text-sm">
              <Save size={14} /> Save
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">{notes.title}</h1>

        {notes.review_questions?.length > 0 && (
          <div className="mb-8 flex justify-center">
            <div className={`max-w-2xl w-full p-6 rounded-lg border-2 ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/30'
                : 'border-blue-400 bg-blue-50'
            }`}>
              <h3 className="text-lg font-bold mb-4 text-center">Review Questions</h3>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes.review_questions.map((q, i) => `**Q${i + 1}:** ${q}`).join('\n\n')}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {sections.map((section, i) => (
          <div key={i} className="mb-12 group">
            {section.heading && <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>}

            <TipTapSection
              content={section.content}
              isEditMode={isEditMode}
              onChange={html => {
                const next = [...sections]
                next[i].content = html
                setSections(next)
              }}
            />

            {section.visualizations?.map(
              (viz, j) => viz.type === 'mermaid' && <MermaidDiagram key={j} code={viz.code} theme={theme} />,
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

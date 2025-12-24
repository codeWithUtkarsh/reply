'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Edit2, Save, X } from 'lucide-react';
import { VideoNotes, NoteSection, notesApi } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


/* ======================================================
   Mermaid Diagram Component (CORRECT v10+ way)
====================================================== */

function MermaidDiagram({
  code,
  theme,
}: {
  code: string;
  theme: 'light' | 'dark';
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const mermaid = (await import('mermaid')).default;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: theme === 'dark' ? 'dark' : 'default',
      });

      if (!containerRef.current || cancelled) return;

      // Clear previous render
      containerRef.current.innerHTML = '';

      // Mermaid expects <pre class="mermaid">...</pre>
      const pre = document.createElement('pre');
      pre.className = 'mermaid';
      pre.textContent = code;

      containerRef.current.appendChild(pre);

      // Let Mermaid scan & render
      await mermaid.run({
        nodes: [pre],
      });
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center overflow-x-auto"
    />
  );
}

/* ======================================================
   Main Component
====================================================== */

interface VideoNotesProps {
  notes: VideoNotes;
}

export default function VideoNotes({ notes }: VideoNotesProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableSections, setEditableSections] = useState<NoteSection[]>(notes.sections);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  /* ======================================================
     Save
  ====================================================== */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notesApi.updateNotes(notes.notes_id, {
        title: notes.title,
        sections: editableSections,
      });
      setIsEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  const sectionsWithReview = [
  {
    heading: "",
    content: notes.review_questions
      .map((q, idx) => `**Q${idx + 1}:** ${q}`)
      .join('\n\r'), // single line break for tighter spacing
    visualizations: [],
    key_concepts: [],
  },
  ...editableSections,
];

  return (
    <div
      className={`w-full ${
        theme === 'dark'
          ? 'bg-gray-900 text-white'
          : 'bg-white text-black'
      }`}
    >
      {/* Controls */}
      <div className="flex justify-end gap-3 mb-6 p-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="px-3 py-1 rounded border"
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {!isEditMode ? (
          <>
            <button
              onClick={() => setIsEditMode(true)}
              className="flex gap-2 items-center"
            >
              <Edit2 size={16} /> Edit
            </button>
            <button className="flex gap-2 items-center">
              <Download size={16} /> Download
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditMode(false)}
              className="flex gap-2 items-center"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex gap-2 items-center"
            >
              <Save size={16} /> Save
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {notes.title}
        </h1>

        {sectionsWithReview.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-12">
            <h2 className="text-xl font-semibold mb-3">
              {section.heading}
            </h2>

            {sectionIdx === 0 && !section.heading ? (
              <div className="mx-auto border border-gray-400 dark:border-gray-600 rounded-lg p-4 max-w-xl text-center bg-gray-50 dark:bg-gray-800 italic mt-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            )}

            {section.visualizations?.map((viz, vizIdx) =>
              viz.type === 'mermaid' ? (
                <div key={vizIdx} className="my-6">
                  <MermaidDiagram
                    code={viz.code}
                    theme={theme}
                  />
                  {viz.title && (
                    <p className="text-sm text-center opacity-70 italic mt-2">
                      {viz.title}
                    </p>
                  )}
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

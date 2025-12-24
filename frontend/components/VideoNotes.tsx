'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Edit2, Save, X } from 'lucide-react';
import { VideoNotes, NoteSection, notesApi } from '@/lib/api';

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

        {editableSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-12">
            <h2 className="text-xl font-semibold mb-3">
              {section.heading}
            </h2>

            <div className="whitespace-pre-wrap mb-4">
              {section.content}
            </div>

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

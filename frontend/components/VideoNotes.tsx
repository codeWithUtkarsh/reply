'use client';

import { VideoNotes } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

interface VideoNotesProps {
  notes: VideoNotes;
}

export default function VideoNotesComponent({ notes }: VideoNotesProps) {
  const diagramRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import mermaid to avoid SSR issues
    const loadMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')).default;

        // Initialize Mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Comic Neue, cursive',
        });

        setMermaidLoaded(true);

        // Render all diagrams
        const renderDiagrams = async () => {
          let diagramIndex = 0;
          for (const section of notes.sections) {
            for (const diagram of section.diagrams || []) {
              const id = `mermaid-${diagramIndex}`;
              const element = diagramRefs.current[id];
              if (element && diagram.code) {
                try {
                  // Mermaid 11.x render returns a Promise with { svg }
                  const { svg } = await mermaid.render(id, diagram.code);
                  element.innerHTML = svg;
                } catch (error) {
                  console.error('Failed to render diagram:', error);
                  element.innerHTML = `<div class="text-red-500 text-sm p-4 bg-red-50 rounded border border-red-200">Failed to render diagram</div>`;
                }
              }
              diagramIndex++;
            }
          }
        };

        renderDiagrams();
      } catch (error) {
        console.error('Failed to load mermaid:', error);
      }
    };

    loadMermaid();
  }, [notes]);

  let globalDiagramIndex = 0;

  return (
    <div className="w-full flex justify-center">
      {/* Single A4-style Notebook Page */}
      <div
        className="bg-white dark:bg-gray-800 shadow-2xl border border-gray-400 dark:border-gray-600 relative overflow-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '100%',
          backgroundImage: `
            linear-gradient(90deg, #e74c3c 1px, transparent 1px),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 27px,
              #d1e3f3 27px,
              #d1e3f3 28px
            )
          `,
          backgroundSize: '100% 100%, 100% 28px',
          backgroundPosition: '60px 0, 0 0'
        }}
      >
        {/* Content with proper padding */}
        <div className="p-8 pl-20">
          {/* Notes Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-3">
              <FileText className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
              {notes.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generated Video Notes
            </p>
          </div>

          {/* All Sections - Continuous Flow */}
          <div className="space-y-6">
            {notes.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Heading */}
                <h2
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-blue-400 dark:border-blue-600 inline-block"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  {section.heading}
                </h2>

                {/* Section Content */}
                <div
                  className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mb-4"
                  style={{ fontFamily: 'Indie Flower, cursive', fontSize: '1rem', lineHeight: '28px' }}
                >
                  {section.content}
                </div>

                {/* Diagrams */}
                {section.diagrams && section.diagrams.length > 0 && (
                  <div className="my-4 space-y-4">
                    {section.diagrams.map((diagram, diagIndex) => {
                      const currentDiagramId = `mermaid-${globalDiagramIndex++}`;
                      return (
                        <div key={diagIndex} className="bg-blue-50 dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-800">
                          {/* Diagram */}
                          <div
                            ref={(el) => {
                              diagramRefs.current[currentDiagramId] = el;
                            }}
                            className="flex justify-center items-center overflow-x-auto py-2"
                          />

                          {/* Caption */}
                          {diagram.caption && (
                            <p
                              className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2 italic"
                              style={{ fontFamily: 'Indie Flower, cursive' }}
                            >
                              {diagram.caption}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center border-t-2 border-gray-300 dark:border-gray-600 pt-4">
            <p
              className="text-lg text-gray-500 dark:text-gray-400"
              style={{ fontFamily: 'Caveat, cursive' }}
            >
              ~ End of Notes ~
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
                  // Mermaid 9.x render returns string directly
                  const svg = mermaid.render(id, diagram.code);
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
    <div className="w-full">
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

      {/* Notes Content */}
      <div className="space-y-8">
        {notes.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-lg shadow-md border-2 border-amber-200 dark:border-gray-600"
            style={{ 
              backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
              backgroundSize: '100% 24px'
            }}
          >
            {/* Section Heading */}
            <h2 
              className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-4 border-amber-300 dark:border-amber-600 inline-block"
              style={{ fontFamily: 'Caveat, cursive' }}
            >
              {section.heading}
            </h2>

            {/* Section Content */}
            <div 
              className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mb-4"
              style={{ fontFamily: 'Indie Flower, cursive', fontSize: '1.1rem' }}
            >
              {section.content}
            </div>

            {/* Diagrams */}
            {section.diagrams && section.diagrams.length > 0 && (
              <div className="mt-6 space-y-6">
                {section.diagrams.map((diagram, diagIndex) => {
                  const currentDiagramId = `mermaid-${globalDiagramIndex++}`;
                  return (
                    <div key={diagIndex} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-inner border-2 border-indigo-200 dark:border-indigo-800">
                      {/* Diagram */}
                      <div 
                        ref={(el) => {
                          diagramRefs.current[currentDiagramId] = el;
                        }}
                        className="flex justify-center items-center overflow-x-auto py-4"
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

      {/* Doodle-style footer */}
      <div className="mt-8 text-center">
        <p 
          className="text-lg text-gray-500 dark:text-gray-400"
          style={{ fontFamily: 'Caveat, cursive' }}
        >
          ~ End of Notes ~
        </p>
      </div>
    </div>
  );
}

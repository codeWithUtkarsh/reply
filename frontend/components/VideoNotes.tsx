'use client';

import { VideoNotes, NoteSection, notesApi } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { FileText, Download, Edit2, Save, X } from 'lucide-react';

interface VideoNotesProps {
  notes: VideoNotes;
}

export default function VideoNotesComponent({ notes }: VideoNotesProps) {
  const diagramRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableSections, setEditableSections] = useState<NoteSection[]>(notes.sections);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDownload = async () => {
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      if (notesRef.current) {
        const canvas = await html2canvas(notesRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${notes.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        });
      }
    } catch (error) {
      console.error('Failed to download notes:', error);
      alert('Failed to download notes. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notesApi.updateNotes(notes.notes_id, {
        title: notes.title,
        sections: editableSections,
      });
      setIsEditMode(false);
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableSections(notes.sections);
    setIsEditMode(false);
  };

  const handleSectionChange = (index: number, field: 'heading' | 'content', value: string) => {
    const updatedSections = [...editableSections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value,
    };
    setEditableSections(updatedSections);
  };

  const handlePaste = async (e: React.ClipboardEvent, sectionIndex: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste behavior for images

        const blob = item.getAsFile();
        if (!blob) continue;

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target?.result as string;

          // Add image to the section
          const updatedSections = [...editableSections];
          const currentImages = updatedSections[sectionIndex].images || [];
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            images: [...currentImages, base64Image],
          };
          setEditableSections(updatedSections);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleRemoveImage = (sectionIndex: number, imageIndex: number) => {
    const updatedSections = [...editableSections];
    const currentImages = updatedSections[sectionIndex].images || [];
    updatedSections[sectionIndex] = {
      ...updatedSections[sectionIndex],
      images: currentImages.filter((_, idx) => idx !== imageIndex),
    };
    setEditableSections(updatedSections);
  };

  let globalDiagramIndex = 0;

  return (
    <div className="w-full">
      {/* Single Continuous Notebook Page */}
      <div className="flex justify-center">
        <div
          ref={notesRef}
          className="bg-white dark:bg-gray-800 shadow-2xl border border-gray-400 dark:border-gray-600 relative overflow-auto w-full"
          style={{
            minHeight: '297mm',
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
          {/* Buttons - Top Right */}
          <div className="flex justify-end gap-2 mb-6">
            {!isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-md text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-md text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-md text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-3 rounded-lg transition-colors shadow-md text-sm"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>

          {/* Notes Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Comic Neue, cursive' }}>
              {notes.title}
            </h1>
          </div>

          {/* All Sections - Continuous Flow */}
          <div className="space-y-6">
            {editableSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Heading */}
                {isEditMode ? (
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => handleSectionChange(sectionIndex, 'heading', e.target.value)}
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-blue-400 dark:border-blue-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 w-full"
                    style={{ fontFamily: 'Caveat, cursive' }}
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b-2 border-blue-400 dark:border-blue-600 inline-block"
                    style={{ fontFamily: 'Caveat, cursive' }}
                  >
                    {section.heading}
                  </h2>
                )}

                {/* Section Content */}
                {isEditMode ? (
                  <>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(sectionIndex, 'content', e.target.value)}
                      onPaste={(e) => handlePaste(e, sectionIndex)}
                      className="text-gray-800 dark:text-gray-200 w-full leading-relaxed mb-4 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 min-h-[100px]"
                      style={{ fontFamily: 'Indie Flower, cursive', fontSize: '1rem', lineHeight: '28px' }}
                      rows={6}
                      placeholder="Type or paste images here..."
                    />
                  </>
                ) : (
                  <div
                    className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mb-4"
                    style={{ fontFamily: 'Indie Flower, cursive', fontSize: '1rem', lineHeight: '28px' }}
                  >
                    {section.content}
                  </div>
                )}

                {/* Pasted Images */}
                {section.images && section.images.length > 0 && (
                  <div className="my-4 space-y-3">
                    {section.images.map((imageData, imgIndex) => (
                      <div key={imgIndex} className="relative inline-block mr-3 mb-3">
                        <img
                          src={imageData}
                          alt={`Pasted image ${imgIndex + 1}`}
                          className="max-w-full h-auto rounded border-2 border-gray-300 dark:border-gray-600 shadow-md"
                          style={{ maxHeight: '400px' }}
                        />
                        {isEditMode && (
                          <button
                            onClick={() => handleRemoveImage(sectionIndex, imgIndex)}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
          <div className="mt-8 text-center border-t-2 border-gray-300 dark:border-gray-600 pt-4 pb-4">
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
    </div>
  );
}

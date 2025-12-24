'use client';

import { VideoNotes, NoteSection, notesApi } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { FileText, Download, Edit2, Save, X } from 'lucide-react';

interface VideoNotesProps {
  notes: VideoNotes;
}

// Helper function to sanitize Mermaid diagram code
const sanitizeMermaidCode = (code: string): string => {
  let cleaned = code.trim();

  // Remove any special characters that might cause issues
  // Keep only: alphanumeric, spaces, newlines, [], (), {}, ->, |, :, ;, commas, dots
  cleaned = cleaned.replace(/[^\w\s\[\]\(\)\{\}\-\>\|\:\;\,\.\n]/g, '');

  // Ensure proper spacing around arrows
  cleaned = cleaned.replace(/-->/g, ' --> ');
  cleaned = cleaned.replace(/\s+/g, ' '); // Normalize spaces
  cleaned = cleaned.replace(/ \n/g, '\n'); // Clean up line endings

  return cleaned;
};

// Simple custom diagram renderer as fallback
const renderSimpleDiagram = (code: string, caption: string): string => {
  const lines = code.split('\n').filter(line => line.trim());
  const type = lines[0]?.toLowerCase() || '';

  if (type.includes('graph') || type.includes('flowchart')) {
    // Parse simple flowchart
    const nodes: { [key: string]: string } = {};
    const edges: { from: string; to: string; label?: string }[] = [];

    lines.slice(1).forEach(line => {
      const arrowMatch = line.match(/(\w+)\[([^\]]+)\]\s*-->\s*(\w+)\[([^\]]+)\]/);
      if (arrowMatch) {
        const [, from, fromLabel, to, toLabel] = arrowMatch;
        nodes[from] = fromLabel;
        nodes[to] = toLabel;
        edges.push({ from, to });
      }
    });

    // Generate simple HTML diagram
    let html = '<div class="simple-diagram" style="display: flex; flex-direction: column; gap: 20px; align-items: center; padding: 20px;">';

    Object.entries(nodes).forEach(([id, label]) => {
      html += `
        <div class="node" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${label}
        </div>
      `;

      const outgoingEdges = edges.filter(e => e.from === id);
      if (outgoingEdges.length > 0) {
        html += '<div style="font-size: 24px; color: #667eea;">↓</div>';
      }
    });

    html += '</div>';
    if (caption) {
      html += `<p class="text-sm text-center text-gray-700 mt-3 italic font-medium">${caption}</p>`;
    }
    return html;
  }

  // Default: just show the caption
  return `<div class="simple-note" style="background: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea;">
    <p class="font-medium text-gray-700">${caption || 'Diagram'}</p>
  </div>`;
};

export default function VideoNotesComponent({ notes }: VideoNotesProps) {
  const diagramRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableSections, setEditableSections] = useState<NoteSection[]>(notes.sections);
  const [isSaving, setIsSaving] = useState(false);
  const [diagramsRendered, setDiagramsRendered] = useState(false);

  useEffect(() => {
    // Reset diagram refs when notes change
    diagramRefs.current = {};
    setDiagramsRendered(false);

    // Dynamically import mermaid to avoid SSR issues
    const loadMermaid = async () => {
      try {
        console.log('🔄 Loading Mermaid library...');
        const mermaid = (await import('mermaid')).default;

        // Initialize Mermaid - using forest theme for best built-in colors
        mermaid.initialize({
          startOnLoad: false,
          theme: 'forest',
          securityLevel: 'loose',
          fontFamily: 'Arial, sans-serif',
          logLevel: 'debug', // Add logging to help diagnose issues
        });

        setMermaidLoaded(true);
        console.log('✅ Mermaid loaded successfully');

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Render all diagrams
        const renderDiagrams = async () => {
          console.log('📊 Starting diagram rendering...');
          let diagramIndex = 0;
          let totalDiagrams = 0;

          // Count total diagrams
          notes.sections.forEach(section => {
            totalDiagrams += (section.diagrams || []).length;
          });

          console.log(`Found ${totalDiagrams} diagrams to render`);

          for (const section of notes.sections) {
            for (const diagram of section.diagrams || []) {
              const id = `mermaid-${diagramIndex}`;
              const element = diagramRefs.current[id];

              console.log(`\n--- Diagram ${diagramIndex} ---`);
              console.log('Element exists:', !!element);
              console.log('Diagram code:', diagram.code);

              if (element && diagram.code) {
                try {
                  // Sanitize the diagram code
                  let cleanCode = sanitizeMermaidCode(diagram.code);

                  console.log(`\n📝 Attempting to render diagram ${diagramIndex}:`);
                  console.log('Original code:', diagram.code);
                  console.log('Sanitized code:', cleanCode);

                  // Try Mermaid first
                  try {
                    const { svg } = await mermaid.render(id, cleanCode);
                    element.innerHTML = svg;
                    console.log(`✅ Diagram ${diagramIndex} rendered with Mermaid successfully`);
                  } catch (mermaidError) {
                    console.warn(`⚠️ Mermaid failed for diagram ${diagramIndex}, using custom renderer`);
                    console.warn('Mermaid error:', mermaidError);

                    // Fallback to custom simple renderer
                    const fallbackHTML = renderSimpleDiagram(diagram.code, diagram.caption);
                    element.innerHTML = fallbackHTML;
                    console.log(`✅ Diagram ${diagramIndex} rendered with custom fallback`);
                  }
                } catch (error) {
                  console.error(`❌ Both renderers failed for diagram ${diagramIndex}:`, error);

                  // Last resort: show a styled message
                  element.innerHTML = `
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                      <p class="font-semibold mb-2">📊 ${diagram.caption || 'Visual Concept'}</p>
                      <p class="text-sm opacity-90">Diagram visualization</p>
                    </div>
                  `;
                }
              } else {
                console.warn(`⚠️ Missing element or code for diagram ${diagramIndex}`);
              }
              diagramIndex++;
            }
          }

          console.log(`\n🎉 Diagram rendering complete! Rendered ${diagramIndex}/${totalDiagrams}`);
          setDiagramsRendered(true);
        };

        renderDiagrams();
      } catch (error) {
        console.error('❌ Failed to load mermaid:', error);
      }
    };

    loadMermaid();
  }, [notes.notes_id]); // Use notes_id as dependency to ensure re-render

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
      {/* Action Buttons - Fixed Outside Notebook */}
      <div className="flex justify-end gap-3 mb-6 px-4">
        {!isEditMode ? (
          <>
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors font-light"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-600 text-white font-medium rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>

      {/* Single Continuous Notebook Page */}
      <div className="flex justify-center">
        <div
          ref={notesRef}
          className="bg-white shadow-2xl border border-gray-300 relative overflow-auto w-full max-w-[210mm]"
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

          {/* Notes Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Caveat, cursive', fontSize: '2.5rem' }}>
              {notes.title}
            </h1>
          </div>

          {/* All Sections - Continuous Flow */}
          <div className="space-y-8">
            {editableSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Section Heading */}
                {isEditMode ? (
                  <input
                    type="text"
                    value={section.heading}
                    onChange={(e) => handleSectionChange(sectionIndex, 'heading', e.target.value)}
                    className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-400 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 w-full"
                    style={{ fontFamily: 'Caveat, cursive', fontSize: '1.75rem' }}
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500 inline-block"
                    style={{ fontFamily: 'Caveat, cursive', fontSize: '1.75rem' }}
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
                      className="text-gray-800 w-full leading-relaxed mb-4 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 min-h-[100px] font-sans"
                      style={{ fontSize: '1.05rem', lineHeight: '1.8' }}
                      rows={8}
                      placeholder="Type or paste images here..."
                    />
                  </>
                ) : (
                  <div
                    className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-4 font-sans"
                    style={{ fontSize: '1.05rem', lineHeight: '1.8' }}
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
                  <div className="my-6 space-y-6">
                    {section.diagrams.map((diagram, diagIndex) => {
                      const currentDiagramId = `mermaid-${globalDiagramIndex++}`;
                      return (
                        <div key={diagIndex} className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                          {/* Diagram */}
                          <div
                            ref={(el) => {
                              diagramRefs.current[currentDiagramId] = el;
                            }}
                            className="flex justify-center items-center overflow-x-auto py-3"
                          />

                          {/* Caption */}
                          {diagram.caption && (
                            <p
                              className="text-sm text-center text-gray-700 mt-3 italic font-medium"
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
          <div className="mt-12 text-center border-t-2 border-gray-400 pt-6 pb-4">
            <p
              className="text-xl text-gray-500"
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

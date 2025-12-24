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

// Robust custom diagram renderer - ALWAYS works
const renderCustomDiagram = (code: string, caption: string): string => {
  // Parse diagram code - handle both \n and actual newlines
  const normalizedCode = code.replace(/\\n/g, '\n');
  const lines = normalizedCode.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const nodes: Array<{ id: string; label: string }> = [];
  const edges: Array<{ from: string; to: string }> = [];
  const nodeMap = new Map<string, string>();

  console.log('Parsing diagram lines:', lines);

  // Parse nodes and edges
  lines.forEach((line, idx) => {
    if (idx === 0) return; // Skip "graph TD" line

    // Match node definition: A[Label]
    const nodeMatch = line.match(/^(\w+)\[([^\]]+)\]$/);
    if (nodeMatch) {
      const [, id, label] = nodeMatch;
      nodeMap.set(id, label);
      nodes.push({ id, label });
      console.log('Found node:', id, label);
      return;
    }

    // Match edge: A --> B
    const edgeMatch = line.match(/^(\w+)\s*-->\s*(\w+)$/);
    if (edgeMatch) {
      const [, from, to] = edgeMatch;
      edges.push({ from, to });
      console.log('Found edge:', from, '->', to);
      return;
    }

    // Match combined: A[Label] --> B[Label2]
    const combinedMatch = line.match(/(\w+)\[([^\]]+)\]\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (combinedMatch) {
      const [, fromId, fromLabel, toId, toLabel] = combinedMatch;
      if (!nodeMap.has(fromId)) {
        nodeMap.set(fromId, fromLabel);
        nodes.push({ id: fromId, label: fromLabel });
      }
      if (toLabel && !nodeMap.has(toId)) {
        nodeMap.set(toId, toLabel);
        nodes.push({ id: toId, label: toLabel });
      }
      edges.push({ from: fromId, to: toId });
      console.log('Found combined:', fromId, '->', toId);
    }
  });

  console.log('Parsed nodes:', nodes);
  console.log('Parsed edges:', edges);

  // Build ordered list based on edges
  const orderedNodes: Array<{ id: string; label: string }> = [];
  const visited = new Set<string>();

  // Start with nodes that have no incoming edges
  const startNodes = nodes.filter(n => !edges.some(e => e.to === n.id));

  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      orderedNodes.push(node);
    }

    // Add connected nodes
    edges.filter(e => e.from === nodeId).forEach(e => traverse(e.to));
  };

  if (startNodes.length > 0) {
    startNodes.forEach(n => traverse(n.id));
  }

  // Add any remaining nodes
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      orderedNodes.push(n);
    }
  });

  // Generate beautiful HTML
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];

  let html = '<div style="display: flex; flex-direction: column; gap: 16px; align-items: center; padding: 24px; background: #f9fafb; border-radius: 12px;">';

  orderedNodes.forEach((node, idx) => {
    const color = colors[idx % colors.length];
    html += `
      <div style="
        background: ${color};
        color: white;
        padding: 16px 32px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
        min-width: 200px;
        transition: transform 0.2s;
      ">
        ${node.label}
      </div>
    `;

    // Add arrow if there's a connection
    if (idx < orderedNodes.length - 1) {
      html += '<div style="font-size: 28px; color: #667eea; font-weight: bold;">↓</div>';
    }
  });

  html += '</div>';

  if (caption) {
    html += `<p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 12px; font-style: italic; font-weight: 500;">${caption}</p>`;
  }

  return html;
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

    console.log('🎯 VideoNotes useEffect triggered');
    console.log('📋 Notes sections:', notes.sections.length);

    // Render diagrams directly with custom renderer (skip Mermaid)
    const renderDiagrams = () => {
      console.log('📊 Starting custom diagram rendering...');
      let diagramIndex = 0;
      let totalDiagrams = 0;

      // Count total diagrams
      notes.sections.forEach(section => {
        const count = (section.diagrams || []).length;
        console.log(`Section "${section.heading}": ${count} diagrams`);
        totalDiagrams += count;
      });

      console.log(`✨ Found ${totalDiagrams} diagrams total to render with custom renderer`);

      if (totalDiagrams === 0) {
        console.log('⚠️ No diagrams to render');
        setDiagramsRendered(true);
        return;
      }

      // Query DOM directly instead of using refs
      for (const section of notes.sections) {
        for (const diagram of section.diagrams || []) {
          const id = `diagram-${diagramIndex}`;
          // Get element directly from DOM using getElementById
          const element = document.getElementById(id);

          console.log(`\n--- Diagram ${diagramIndex} ---`);
          console.log('ID:', id);
          console.log('Element found in DOM:', !!element);
          console.log('Diagram code:', diagram.code);
          console.log('Diagram caption:', diagram.caption);

          if (element && diagram.code) {
            try {
              // Use custom renderer directly - ALWAYS works
              const html = renderCustomDiagram(diagram.code, diagram.caption);
              console.log('Generated HTML length:', html.length);
              element.innerHTML = html;
              console.log(`✅ Diagram ${diagramIndex} rendered successfully!`);
            } catch (error) {
              console.error(`❌ Error rendering diagram ${diagramIndex}:`, error);
              // Last resort fallback
              element.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                  <p style="font-weight: 600; margin-bottom: 8px;">📊 ${diagram.caption || 'Visual Concept'}</p>
                  <p style="font-size: 14px; opacity: 0.9;">Diagram visualization</p>
                </div>
              `;
            }
          } else {
            console.warn(`⚠️ Cannot render diagram ${diagramIndex}:`);
            console.warn('  - Element found in DOM?', !!element);
            console.warn('  - Code exists?', !!diagram.code);
            if (!element) {
              console.warn('  - Trying to find element with querySelectorAll...');
              const allDivs = document.querySelectorAll('[id^="diagram-"]');
              console.warn(`  - Found ${allDivs.length} diagram elements in DOM`);
            }
          }
          diagramIndex++;
        }
      }

      console.log(`\n🎉 Custom diagram rendering complete! Rendered ${diagramIndex}/${totalDiagrams}`);
      setDiagramsRendered(true);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderDiagrams();
      });
    });
  }, [notes.notes_id]);

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
                      const currentDiagramId = `diagram-${globalDiagramIndex++}`;
                      return (
                        <div key={diagIndex} className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                          {/* Diagram */}
                          <div
                            id={currentDiagramId}
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

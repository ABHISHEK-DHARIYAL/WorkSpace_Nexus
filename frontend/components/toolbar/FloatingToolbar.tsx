import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough, Code, Highlighter, 
  Palette, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Heading1, Heading2, Heading3,
  Quote, Minus, Undo, Redo, Eraser, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, Smile, MessageSquare, ChevronDown, 
  Superscript as SuperIcon, Subscript as SubIcon,
  MousePointer2, Square, PenTool as UnderlineIcon, Pipette, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { annotationService } from '../../services/annotationService';

interface FloatingToolbarProps {
  editor: Editor | null;
  listingId?: string;
  pageId?: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor, listingId, pageId }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showUnderlinePicker, setShowUnderlinePicker] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>(JSON.parse(localStorage.getItem('recent_colors') || '[]'));

  const [activeTools, setActiveTools] = useState<{ highlight?: string; underline?: { color: string; style: string }; eraser?: boolean }>({
    highlight: '#FFFF00'
  });

  useEffect(() => {
    if (!editor || (!activeTools.highlight && !activeTools.underline && !activeTools.eraser)) return;

    const handleUpdate = () => {
      const { empty, from, to } = editor.state.selection;
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (!text) return;

        if (activeTools.eraser) {
          editor.chain().focus().unsetMark('highlightAnnotation').unsetMark('underlineAnnotation').run();
        } else {
          const chain = editor.chain().focus();
          if (activeTools.highlight) {
            const color = activeTools.highlight;
            if ((chain as any).setHighlightAnnotation) {
              (chain as any).setHighlightAnnotation({ color });
            } else {
              chain.setMark('highlightAnnotation', { color });
            }
          } 
          if (activeTools.underline) {
            const { color, style } = activeTools.underline;
            const thickness = style === 'thick' ? '3px' : 'auto';
            if ((chain as any).setUnderlineAnnotation) {
              (chain as any).setUnderlineAnnotation({ color, style, thickness });
            } else {
              chain.setMark('underlineAnnotation', { color, style, thickness });
            }
          }
          chain.run();
        }
      }
    };

    editor.on('selectionUpdate', handleUpdate);
    return () => { editor.off('selectionUpdate', handleUpdate); };
  }, [editor, activeTools]);

  const saveRecentColor = (color: string) => {
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8);
    setRecentColors(updated);
    localStorage.setItem('recent_colors', JSON.stringify(updated));
  };

  if (!editor) return null;

  const handleApplyAnnotation = async (type: 'highlight' | 'underline', color?: string, style?: string) => {
    if (!editor) {
      console.warn('Annotation Debug: Editor instance is null');
      return;
    }

    const { from, to, empty } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (empty || !text) {
      return;
    }

    // Always focus the editor first to ensure selection is active
    const chain = editor.chain().focus();
    let applied = false;

    // Apply to editor first (synchronous UI feedback)
    if (type === 'highlight') {
      const finalColor = color || editor.getAttributes('highlightAnnotation').color || '#FFFF00';
      
      // Use custom command if available, otherwise fallback to setMark
      if ((chain as any).toggleHighlightAnnotation) {
        (chain as any).toggleHighlightAnnotation({ color: finalColor });
      } else {
        chain.setMark('highlightAnnotation', { color: finalColor });
      }
      
      if (finalColor) saveRecentColor(finalColor);
      applied = chain.run();
    } else {
      const finalColor = color || editor.getAttributes('underlineAnnotation').color || '#000000';
      const finalStyle = style || editor.getAttributes('underlineAnnotation').style || 'solid';
      const finalThickness = style === 'thick' ? '3px' : 'auto';
      
      if ((chain as any).toggleUnderlineAnnotation) {
        (chain as any).toggleUnderlineAnnotation({ 
          color: finalColor, 
          style: finalStyle, 
          thickness: finalThickness
        });
      } else {
        chain.setMark('underlineAnnotation', { 
          color: finalColor, 
          style: finalStyle, 
          thickness: finalThickness
        });
      }
      
      if (finalColor) saveRecentColor(finalColor);
      applied = chain.run();
    }

    // Persist to backend if IDs are present (asynchronous)
    if (listingId && pageId) {
      try {
        await annotationService.create({
          listingId,
          pageId,
          annotationType: type,
          color: color || (type === 'highlight' ? '#FFFF00' : '#000000'),
          style: style || 'solid',
          text,
          startOffset: from,
          endOffset: to,
          selectedRange: `${from}-${to}`
        });
        console.log('Annotation Debug: Successfully persisted to backend');
      } catch (err) {
        console.error('Annotation Debug: Failed to persist annotation', err);
      }
    }
  };

  const colors = [
    '#000000', '#424242', '#636363', '#919191', '#D1D1D1', '#FFFFFF',
    '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
    '#9900FF', '#FF00FF', '#E06666', '#F6B26B', '#FFD966', '#93C47D',
    '#76A5AF', '#6D9EEB', '#8E7CC3', '#C27BA0'
  ];

  const highlights = [
    '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#FF9900',
    '#D9EAD3', '#CFE2F3', '#D9D2E9', '#F4CCCC', '#FFF2CC', '#EAD1DC',
    '#E97451', '#85BB65', '#4682B4', '#9370DB', '#808080'
  ];

  const underlineStyles = [
    { name: 'Normal', value: 'solid', icon: Minus },
    { name: 'Thick', value: 'thick', icon: Square },
    { name: 'Dotted', value: 'dotted', icon: MoreVertical },
    { name: 'Dashed', value: 'dashed', icon: Minus },
    { name: 'Wavy', value: 'wavy', icon: MessageSquare },
  ];

  const fonts = [
    { name: 'Default', value: 'Inter' },
    { name: 'Serif', value: 'Playfair Display' },
    { name: 'Mono', value: 'JetBrains Mono' },
    { name: 'Sans', value: 'Outfit' },
  ];

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-2 bg-white/95 dark:bg-[#15181e]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-[95vw] overflow-x-auto md:max-w-none md:overflow-visible custom-scrollbar"
    >
      {/* Advanced Annotation Group (Highlighter + Underline + Eraser) */}
      <div className="flex items-center gap-1 p-1 bg-[#eee1ba]/50 rounded-xl border border-[#eee1ba]/15">
        <div className="relative group/highlight">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (activeTools.highlight && editor.state.selection.empty) {
                setActiveTools(prev => {
                  const { highlight, ...rest } = prev;
                  return rest;
                });
              } else if (editor.state.selection.empty) {
                setActiveTools(prev => ({ ...prev, highlight: prev.highlight || '#FFFF00', eraser: false }));
                setShowHighlightPicker(true);
              } else {
                handleApplyAnnotation('highlight');
              }
              setShowUnderlinePicker(false);
              setShowColorPicker(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowHighlightPicker(!showHighlightPicker);
            }}
            className={`p-2 rounded-lg transition-all flex flex-col items-center ${activeTools.highlight ? 'bg-yellow-400 text-slate-900 shadow-sm' : showHighlightPicker ? 'bg-white shadow-sm text-black' : 'hover:bg-white/50 text-slate-600'}`}
            title="Highlight Tool (Sticky if no selection)"
          >
            <Highlighter size={16} />
            <div className="w-4 h-0.5 mt-0.5 rounded-full" style={{ backgroundColor: activeTools.highlight || editor.getAttributes('highlightAnnotation').color || '#FFFF00' }} />
          </button>
          
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/highlight:opacity-100 transition-opacity p-0.5 bg-white border border-slate-200 rounded-full shadow-sm z-10"
          >
            <ChevronDown size={8} className="text-slate-400" />
          </button>

          <AnimatePresence>
            {showHighlightPicker && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52 overflow-hidden z-[60]"
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-[#eee1ba] mb-3 flex items-center justify-between">
                  <span>Highlight Colors</span>
                  <Square size={10} className="fill-[#eee1ba] opacity-20" />
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-4">
                  {highlights.map(color => (
                    <button 
                      key={color} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { 
                        if (editor.state.selection.empty) {
                          setActiveTools(prev => ({ ...prev, highlight: color, eraser: false }));
                        } else {
                          handleApplyAnnotation('highlight', color); 
                        }
                        setShowHighlightPicker(false); 
                      }}
                      className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <label 
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm relative"
                  >
                    <Pipette size={12} className="text-slate-400" />
                    <input 
                      type="color" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => { 
                        if (editor.state.selection.empty) {
                          setActiveTools(prev => ({ ...prev, highlight: e.target.value, eraser: false }));
                        } else {
                          handleApplyAnnotation('highlight', e.target.value); 
                        }
                        setShowHighlightPicker(false); 
                      }}
                    />
                  </label>
                </div>
                {recentColors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Recently Used</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentColors.map(color => (
                        <button 
                          key={color} 
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { 
                            if (editor.state.selection.empty) {
                              setActiveTools(prev => ({ ...prev, highlight: color, eraser: false }));
                            } else {
                              handleApplyAnnotation('highlight', color); 
                            }
                            setShowHighlightPicker(false); 
                          }}
                          className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative group/underline">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (activeTools.underline && editor.state.selection.empty) {
                setActiveTools(prev => {
                  const { underline, ...rest } = prev;
                  return rest;
                });
              } else if (editor.state.selection.empty) {
                setActiveTools(prev => ({ 
                  ...prev, 
                  underline: prev.underline || { color: '#000000', style: 'solid' },
                  eraser: false 
                }));
                setShowUnderlinePicker(true);
              } else {
                handleApplyAnnotation('underline');
              }
              setShowHighlightPicker(false);
              setShowColorPicker(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowUnderlinePicker(!showUnderlinePicker);
            }}
            className={`p-2 rounded-lg transition-all flex flex-col items-center ${activeTools.underline ? 'bg-black text-white shadow-sm' : showUnderlinePicker ? 'bg-white shadow-sm text-black' : 'hover:bg-white/50 text-slate-600'}`}
            title="Underline Tool (Sticky if no selection)"
          >
            <UnderlineIcon size={16} />
            <div className="w-4 h-0.5 mt-0.5 rounded-full" style={{ backgroundColor: activeTools.underline?.color || editor.getAttributes('underlineAnnotation').color || '#000000' }} />
          </button>

          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowUnderlinePicker(!showUnderlinePicker)}
            className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/underline:opacity-100 transition-opacity p-0.5 bg-white border border-slate-200 rounded-full shadow-sm z-10"
          >
            <ChevronDown size={8} className="text-slate-400" />
          </button>

          <AnimatePresence>
            {showUnderlinePicker && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52 z-[60]"
              >
                <div className="text-[9px] font-black uppercase tracking-widest text-[#eee1ba] mb-3">Underline Styles</div>
                <div className="grid grid-cols-5 gap-1.5 mb-4">
                  {underlineStyles.map(style => (
                    <button 
                      key={style.name} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { handleApplyAnnotation('underline', editor.getAttributes('underlineAnnotation').color, style.value); setShowUnderlinePicker(false); }}
                      className={`p-2 rounded-lg border transition-all ${editor.getAttributes('underlineAnnotation').style === style.value ? 'bg-[#eee1ba]/10 border-[#eee1ba]/25 text-black' : 'border-slate-100 hover:bg-slate-50 text-slate-500'}`}
                      title={style.name}
                    >
                      <style.icon size={14} />
                    </button>
                  ))}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-[#eee1ba] mb-3">Line Color</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {highlights.map(color => (
                    <button 
                      key={color} 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { 
                        if (editor.state.selection.empty) {
                          setActiveTools(prev => ({ 
                            ...prev, 
                            underline: { color, style: prev.underline?.style || 'solid' },
                            eraser: false 
                          }));
                        } else {
                          handleApplyAnnotation('underline', color, editor.getAttributes('underlineAnnotation').style); 
                        }
                        setShowUnderlinePicker(false); 
                      }}
                      className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <label 
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer shadow-sm relative"
                  >
                    <Pipette size={12} className="text-slate-400" />
                    <input 
                      type="color" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => { 
                        if (editor.state.selection.empty) {
                          setActiveTools(prev => ({ 
                            ...prev, 
                            underline: { color: e.target.value, style: prev.underline?.style || 'solid' },
                            eraser: false 
                          }));
                        } else {
                          handleApplyAnnotation('underline', e.target.value, editor.getAttributes('underlineAnnotation').style); 
                        }
                        setShowUnderlinePicker(false); 
                      }}
                    />
                  </label>
                </div>
                {recentColors.length > 0 && (
                  <div className="mt-4 pt-2 border-t border-slate-100">
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2">Recently Used</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentColors.map(color => (
                        <button 
                          key={color} 
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { 
                            if (editor.state.selection.empty) {
                              setActiveTools(prev => ({ 
                                ...prev, 
                                underline: { color, style: prev.underline?.style || 'solid' },
                                eraser: false 
                              }));
                            } else {
                              handleApplyAnnotation('underline', color, editor.getAttributes('underlineAnnotation').style); 
                            }
                            setShowUnderlinePicker(false); 
                          }}
                          className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (activeTools.eraser) {
                setActiveTools({});
              } else if (editor.state.selection.empty) {
                setActiveTools({ eraser: true });
              } else {
                editor.chain().focus().unsetMark('highlightAnnotation').unsetMark('underlineAnnotation').run();
              }
            }}
            className={`p-2 rounded-lg transition-colors ${activeTools.eraser ? 'bg-red-500 text-white shadow-sm' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
            title="Eraser Tool (Sticky if no selection)"
          >
            <Eraser size={16} />
          </button>
        </div>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 px-1 border-r border-slate-200">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20"><Undo size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-20"><Redo size={16} /></button>
      </div>

      {/* Font Family */}
      <div className="relative group">
        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowFontFamily(!showFontFamily)}
          className="flex items-center gap-1 p-2 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-bold"
        >
          <Type size={16} />
          <ChevronDown size={12} />
        </button>
        <AnimatePresence>
          {showFontFamily && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 min-w-[120px]"
            >
              {fonts.map(font => (
                <button 
                  key={font.value} 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { editor.chain().focus().setFontFamily(font.value).run(); setShowFontFamily(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-lg font-medium"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Basic Formatting */}
      <div className="flex items-center gap-1">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Bold size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Italic size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Underline size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Strikethrough size={16} /></button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Alignments */}
      <div className="flex items-center gap-1">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded-lg ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><AlignLeft size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded-lg ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><AlignCenter size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded-lg ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><AlignRight size={16} /></button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg ${editor.isActive('bulletList') ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><List size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg ${editor.isActive('orderedList') ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><ListOrdered size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-2 rounded-lg ${editor.isActive('taskList') ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><CheckSquare size={16} /></button>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Insertables */}
      <div className="flex items-center gap-1">
        <button onMouseDown={(e) => e.preventDefault()} onClick={addLink} className={`p-2 rounded-lg ${editor.isActive('link') ? 'bg-[#eee1ba]/10 text-black' : 'hover:bg-slate-100 text-slate-500'}`}><LinkIcon size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={addTable} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><TableIcon size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Minus size={16} /></button>
      </div>

      {/* Colors & Formatting */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 flex flex-col items-center"
            title="Text Color"
          >
            <Palette size={16} />
            <div className="w-4 h-0.5 mt-0.5" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }} />
          </button>
          <AnimatePresence>
            {showColorPicker && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 grid grid-cols-6 gap-1"
              >
                {colors.map(color => (
                  <button 
                    key={color} 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                    className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
          className="p-2 hover:bg-red-50 text-red-500 rounded-lg" 
          title="Clear All Formatting"
        >
          <Eraser size={16} />
        </button>
      </div>

      {editor.isActive('table') && (
        <>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <div className="flex items-center gap-1 bg-amber-50 rounded-xl px-1.5 py-0.5 border border-amber-200">
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().toggleHeaderRow().run()} 
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${editor.isActive('tableHeader') ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-amber-100 text-amber-700'}`}
              title="Toggle Header Row"
            >
              H-Row
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().addColumnAfter().run()} 
              className="p-1 px-2 text-[10px] font-black uppercase tracking-wide hover:bg-amber-100 text-amber-700 rounded-lg" 
              title="Add Column After"
            >
              +Col
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().deleteColumn().run()} 
              className="p-1 px-2 text-[10px] font-black uppercase tracking-wide hover:bg-red-100 text-red-600 rounded-lg" 
              title="Delete Column"
            >
              -Col
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().addRowAfter().run()} 
              className="p-1 px-2 text-[10px] font-black uppercase tracking-wide hover:bg-amber-100 text-amber-700 rounded-lg" 
              title="Add Row After"
            >
              +Row
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().deleteRow().run()} 
              className="p-1 px-2 text-[10px] font-black uppercase tracking-wide hover:bg-red-100 text-red-600 rounded-lg" 
              title="Delete Row"
            >
              -Row
            </button>
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={() => editor.chain().focus().deleteTable().run()} 
              className="p-1 px-2 text-[10px] font-black uppercase tracking-wide hover:bg-red-200 text-red-750 bg-red-50 rounded-lg" 
              title="Delete Table"
            >
              Table
            </button>
          </div>
        </>
      )}

    </motion.div>
  );
};

export default FloatingToolbar;

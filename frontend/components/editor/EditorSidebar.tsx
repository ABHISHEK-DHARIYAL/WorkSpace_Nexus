import React, { useState } from 'react';
import { List as ListIcon, Plus, Search, GripVertical, FileText, Edit2, Trash2, PanelLeftClose } from 'lucide-react';
import { Reorder } from 'motion/react';

interface EditorSidebarProps {
  pages: any[];
  currentPageId: string | null;
  onPageSelect: (id: string) => void;
  onPageAdd: () => void;
  onPageDelete: (id: string) => void;
  onPageRename: (id: string, newTitle: string) => void;
  onReorder: (newOrder: any[]) => void;
  onToggleSidebar?: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onPageAdd,
  onPageDelete,
  onPageRename,
  onReorder,
  onToggleSidebar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const filteredPages = (pages || []).filter((p: any) => 
    p && (p.title || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden border-r bg-slate-50 dark:bg-[#11141a] dark:border-slate-800 border-slate-200">
      <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-[#11141a] dark:border-slate-800 text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2 font-semibold">
          <ListIcon size={18} className="text-black" />
          <span>Table of Contents</span>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button 
              id="editor-collapse-sidebar-btn"
              onClick={onToggleSidebar} 
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-550 dark:text-slate-400 transition-colors flex items-center justify-center"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
          <button 
            id="editor-add-page-btn"
            onClick={onPageAdd} 
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-black dark:text-[#eee1ba] transition-colors flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
      <div className="p-2 border-b bg-slate-50/50 dark:bg-slate-900/30 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            id="editor-toc-search-input"
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-[#1a1f29] outline-none text-slate-800 dark:text-white"
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        <Reorder.Group axis="y" values={pages || []} onReorder={onReorder} className="space-y-1">
          {filteredPages.map((page: any) => (
            <Reorder.Item 
              id={`reorder-item-page-${page.id}`}
              key={page.id} 
              value={page}
              onClick={() => onPageSelect(page.id)}
              className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                currentPageId === page.id 
                  ? 'bg-[#eee1ba]/10 dark:bg-black/20 text-black dark:text-[#eee1ba] border-l-4 border-[#eee1ba]' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <GripVertical size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 cursor-grab" />
              <FileText size={16} className={currentPageId === page.id ? 'text-black dark:text-[#eee1ba]' : 'text-slate-400'} />
              <div className="flex-grow min-w-0">
                {editingId === page.id ? (
                  <input 
                    id={`editor-page-rename-input-${page.id}`}
                    autoFocus 
                    className="w-full text-sm outline-none bg-white dark:bg-slate-900 border border-[#eee1ba]/25 px-1 py-0.5 rounded text-slate-800 dark:text-white" 
                    value={tempTitle} 
                    onChange={(e) => setTempTitle(e.target.value)} 
                    onBlur={() => { 
                      onPageRename(page.id, tempTitle); 
                      setEditingId(null); 
                    }} 
                  />
                ) : (
                  <span className="truncate text-sm font-medium block">{page.title}</span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  id={`editor-rename-btn-${page.id}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEditingId(page.id); 
                    setTempTitle(page.title); 
                  }}
                  className="p-1 hover:text-black dark:hover:text-[#eee1ba] text-slate-450"
                  title="Rename page"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  id={`editor-delete-btn-${page.id}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onPageDelete(page.id); 
                  }}
                  className="p-1 hover:text-red-600 dark:hover:text-red-400 text-slate-450"
                  title="Delete page"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
};
export default EditorSidebar;
export { EditorSidebar };

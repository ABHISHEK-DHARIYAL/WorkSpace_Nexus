import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ChevronRight, Trash2 } from 'lucide-react';

interface ContentCardProps {
  content: any;
  onDelete?: () => void;
}

const ContentCard = ({ content, onDelete }: ContentCardProps) => (
  <div className="bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 group relative">
    {content.image && (
      <div className="aspect-[16/9] overflow-hidden">
        <img src={content.image} alt={content.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
    )}
    <div className="p-6">
      <div className="flex items-center gap-4 text-[10px] font-black text-black dark:text-[#eee1ba] uppercase tracking-widest mb-3">
        <span className="px-2.5 py-1 bg-[#eee1ba]/30 dark:bg-[#eee1ba]/10 rounded-lg">{content.category || 'General'}</span>
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-black dark:group-hover:text-[#eee1ba] transition-colors line-clamp-2">
        {content.title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 font-medium">
        {content.excerpt}
      </p>
      <div className="pt-6 border-t border-slate-50 dark:border-[#2d323f] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <Calendar size={14} />
          <span>{new Date(content.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-3">
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors border border-red-200/40 dark:border-red-900/40 cursor-pointer"
              title="Permanently delete this public story/article"
            >
              <Trash2 size={14} />
            </button>
          )}
          <Link to={`/content/${content.slug}`} className="text-black dark:text-[#eee1ba] font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
            Read Story <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ContentCard;

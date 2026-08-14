import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import ContentCard from '../content/ContentCard';
import Loader from '../ui/Loader';
import Reveal from './Reveal';

interface PublicKnowledgeSectionProps {
  content: any[];
  loading: boolean;
  isAdmin: boolean;
  onDelete: (id: string, title: string) => void;
}

const FEATURED_COUNT = 3;

const PublicKnowledgeSection: React.FC<PublicKnowledgeSectionProps> = ({ content, loading, isAdmin, onDelete }) => {
  const featured = content.slice(0, FEATURED_COUNT);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-[#eee1ba]">Public Hub</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
            Discover knowledge from the repository
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-xl">
            Explore technical documentation, guides, architecture notes, and stories published through WorkSpace Nexus.
          </p>
        </div>
        <Link
          to="/public-content"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-black dark:text-[#eee1ba] hover:gap-2.5 transition-all shrink-0"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Reveal>

      {loading ? (
        <Loader />
      ) : featured.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.08}>
              <ContentCard
                content={item}
                onDelete={isAdmin ? () => onDelete(item.id, item.title) : undefined}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 dark:bg-[#15181e] rounded-3xl border border-dashed border-slate-200 dark:border-[#2d323f]">
          <div className="w-16 h-16 bg-white dark:bg-[#1f242e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="text-slate-400 dark:text-slate-300 w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">No Documents Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Published stories from the community will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicKnowledgeSection;

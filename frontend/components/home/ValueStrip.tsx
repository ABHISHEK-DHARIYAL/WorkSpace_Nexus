import React from 'react';
import { PenSquare, FolderKanban, Search, UploadCloud, Share2, BarChart3 } from 'lucide-react';
import Reveal from './Reveal';

const ITEMS = [
  { label: 'Write', icon: PenSquare },
  { label: 'Organize', icon: FolderKanban },
  { label: 'Search', icon: Search },
  { label: 'Publish', icon: UploadCloud },
  { label: 'Share', icon: Share2 },
  { label: 'Analyze', icon: BarChart3 },
];

const ValueStrip: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-[#12141a] border-b border-slate-100 dark:border-[#2d323f] py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm sm:text-base font-black text-slate-700 dark:text-slate-200 mb-8">
            One workspace for your entire knowledge workflow.
          </p>
        </Reveal>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-6 sm:gap-x-0">
          {ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <Reveal delay={i * 0.05} from="none">
                <div className="flex items-center gap-2 px-4 sm:px-6">
                  <item.icon className="w-4 h-4 text-black dark:text-[#eee1ba]" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
              </Reveal>
              {i < ITEMS.length - 1 && (
                <span className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-[#2d323f]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValueStrip;

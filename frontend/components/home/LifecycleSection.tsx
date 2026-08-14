import React from 'react';
import { FilePlus2, FolderKanban, PenSquare, UploadCloud, Share2 } from 'lucide-react';
import Reveal from './Reveal';

const STEPS = [
  { icon: FilePlus2, title: 'Draft', description: 'Start a new document inside any workspace.' },
  { icon: FolderKanban, title: 'Organize', description: 'Structure pages and sections however makes sense.' },
  { icon: PenSquare, title: 'Edit', description: 'Write in a rich-text editor with autosave, always in sync.' },
  { icon: UploadCloud, title: 'Publish', description: 'Turn a draft into polished public documentation.' },
  { icon: Share2, title: 'Share', description: 'Send it to your team or the public knowledge hub.' },
];

const LifecycleSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal className="max-w-2xl mb-16 mx-auto text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-[#eee1ba]">Workflow</span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
          From idea to published knowledge.
        </h2>
      </Reveal>

      {/* Desktop: connected horizontal flow */}
      <div className="hidden md:grid grid-cols-5 gap-4 relative">
        <div className="absolute top-6 left-[10%] right-[10%] h-px bg-slate-200 dark:bg-[#2d323f]" />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08} className="relative flex flex-col items-center text-center px-2">
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-white dark:bg-[#15181e] border-2 border-black dark:border-[#eee1ba] flex items-center justify-center mb-4 shadow-sm">
              <step.icon className="w-5 h-5 text-black dark:text-[#eee1ba]" />
            </div>
            <span className="text-[10px] font-black text-[#eee1ba] dark:text-[#eee1ba] bg-black dark:bg-black/40 px-2 py-0.5 rounded-full mb-2">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1.5">{step.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.description}</p>
          </Reveal>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden flex flex-col gap-6 relative">
        <div className="absolute top-2 bottom-2 left-6 w-px bg-slate-200 dark:bg-[#2d323f]" />
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.06} from="left" className="relative flex items-start gap-4 pl-0">
            <div className="relative z-10 w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-[#15181e] border-2 border-black dark:border-[#eee1ba] flex items-center justify-center shadow-sm">
              <step.icon className="w-5 h-5 text-black dark:text-[#eee1ba]" />
            </div>
            <div className="pt-1">
              <span className="text-[10px] font-black text-[#eee1ba] bg-black px-2 py-0.5 rounded-full mb-1.5 inline-block">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{step.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default LifecycleSection;

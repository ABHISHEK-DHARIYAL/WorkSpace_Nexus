import React from 'react';
import {
  Layers, PenSquare, UploadCloud, Search, Share2, BarChart3, Bookmark, Globe2,
} from 'lucide-react';
import Reveal from './Reveal';

const FEATURES = [
  {
    icon: Layers,
    title: 'Structured Workspaces',
    description: 'Organize documents into focused workspaces designed for high-quality writing and knowledge management.',
  },
  {
    icon: PenSquare,
    title: 'Rich Document Editor',
    description: 'Write in a full rich-text editor with formatting, tables, links, images, and autosave built in.',
  },
  {
    icon: UploadCloud,
    title: 'Document Publishing',
    description: 'Turn your work into polished public documentation and share knowledge with others.',
  },
  {
    icon: Search,
    title: 'Real-Time Search',
    description: 'Find documents and knowledge quickly across your workspace.',
  },
  {
    icon: Share2,
    title: 'Public Sharing & Discovery',
    description: 'Publish a document publicly so others can find it, follow you, and bring it into their own workspace.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Understand document activity and content performance through a dedicated analytics dashboard.',
  },
  {
    icon: Bookmark,
    title: 'Bookmarks',
    description: 'Save documents and pages you care about and get back to them in one click, anytime.',
  },
  {
    icon: Globe2,
    title: 'Public Knowledge Hub',
    description: 'Discover technical documentation, guides, architecture notes, and stories published by the community.',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal className="max-w-2xl mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-[#eee1ba]">Features</span>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
          Everything you need to manage knowledge
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((feature, i) => {
          // Subtle variation: every 5th card (index 0, 5, ...) gets an inverted
          // dark accent block instead of the light one, so the grid doesn't
          // feel like eight identical stamped-out tiles.
          const inverted = i % 5 === 0;
          return (
            <Reveal key={feature.title} delay={(i % 4) * 0.06}>
              <div
                className={`h-full p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  inverted
                    ? 'bg-black dark:bg-[#eee1ba] border-black dark:border-[#eee1ba]'
                    : 'bg-slate-50 dark:bg-[#15181e] border-slate-100 dark:border-[#2d323f]'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 shadow-sm ${
                    inverted ? 'bg-[#eee1ba] text-black dark:bg-black dark:text-[#eee1ba]' : 'bg-black text-[#eee1ba]'
                  }`}
                >
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className={`text-base font-black tracking-tight mb-2 ${inverted ? 'text-white dark:text-black' : 'text-slate-900 dark:text-white'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed font-medium ${inverted ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>
                  {feature.description}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesSection;

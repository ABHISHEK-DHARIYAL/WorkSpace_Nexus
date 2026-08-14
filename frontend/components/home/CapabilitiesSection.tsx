import React from 'react';
import {
  FolderTree, PenSquare, Zap, Globe2, FolderKanban, BarChart3, Smartphone, ShieldCheck,
} from 'lucide-react';
import Reveal from './Reveal';

const CAPABILITIES = [
  { icon: FolderTree, label: 'Structured documentation' },
  { icon: PenSquare, label: 'Rich-text writing' },
  { icon: Zap, label: 'Fast search' },
  { icon: Globe2, label: 'Public publishing' },
  { icon: FolderKanban, label: 'Workspace organization' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Smartphone, label: 'Responsive access' },
  { icon: ShieldCheck, label: 'Secure authentication' },
];

const CapabilitiesSection: React.FC = () => {
  return (
    <div className="bg-black dark:bg-[#0c0e12] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eee1ba]">Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
            Built for the way developers work.
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-3xl overflow-hidden">
          {CAPABILITIES.map((cap, i) => (
            <Reveal key={cap.label} delay={(i % 4) * 0.05} from="none">
              <div className="h-full bg-black dark:bg-[#0c0e12] p-6 flex flex-col gap-4 hover:bg-white/[0.03] transition-colors">
                <cap.icon className="w-5 h-5 text-[#eee1ba]" />
                <span className="text-sm font-bold text-slate-200 leading-snug">{cap.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CapabilitiesSection;

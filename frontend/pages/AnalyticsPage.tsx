import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart3, FileText, Briefcase, Layers, TrendingUp, Clock, ArrowRight,
} from 'lucide-react';
import api from '../services/api/client';
import Loader from '../components/ui/Loader';

interface Workspace {
  id: string;
  name: string;
  projectCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Listing {
  id: string;
  title?: string;
  workspaceId?: string;
  pages?: any[];
  createdAt?: string;
  updatedAt?: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; delay?: number }> = ({ label, value, icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{ perspective: 800 }}
  >
    <motion.div
      whileHover={{ rotateX: -4, rotateY: 4, translateY: -2 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      className="p-6 bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] shadow-sm hover:shadow-xl dark:hover:shadow-none transition-shadow"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="w-11 h-11 bg-black text-[#eee1ba] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">{label}</p>
    </motion.div>
  </motion.div>
);

// Lightweight hand-rolled bar chart -- no extra chart dependency required
const MiniBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2.5 h-40 pt-4">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
            className="w-full rounded-t-lg bg-gradient-to-t from-black to-[#5b4636] dark:from-[#eee1ba] dark:to-[#c9b77f] relative group min-h-[4px]"
            title={`${d.label}: ${d.value}`}
          >
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 dark:text-slate-400">
              {d.value > 0 ? d.value : ''}
            </span>
          </motion.div>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [wsRes, listRes] = await Promise.all([
          api.get('/workspace'),
          api.get('/listing'),
        ]);
        setWorkspaces(Array.isArray(wsRes.data) ? wsRes.data : (wsRes.data?.data || []));
        setListings(Array.isArray(listRes.data) ? listRes.data : (listRes.data?.data || []));
      } catch (err) {
        console.error('Failed to load analytics data', err);
        setError('Could not load activity data right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = useMemo(
    () => listings.reduce((sum, l) => sum + (Array.isArray(l.pages) ? l.pages.length : 0), 0),
    [listings]
  );

  const last7Days = useMemo(() => {
    const days: { label: string; value: number; key: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: 0, key });
    }
    listings.forEach(l => {
      const created = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : null;
      const match = days.find(d => d.key === created);
      if (match) match.value += 1;
    });
    return days;
  }, [listings]);

  const topWorkspaces = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach(l => {
      const key = l.workspaceId || 'main';
      counts[key] = (counts[key] || 0) + 1;
    });
    return workspaces
      .map(ws => ({ name: ws.name, count: counts[ws.id] ?? ws.projectCount ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [workspaces, listings]);

  const recentActivity = useMemo(() => {
    return [...listings]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [listings]);

  if (loading) return <Loader message="Crunching your activity..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 bg-black text-[#eee1ba] rounded-xl shadow-sm">
          <BarChart3 className="w-5 h-5" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Activity Dashboard</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-10 ml-[52px]">
        A quick look at your workspaces, documents, and recent activity.
      </p>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-sm font-semibold text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <StatCard label="Workspaces" value={workspaces.length} icon={<Briefcase className="w-5 h-5" />} delay={0} />
        <StatCard label="Documents" value={listings.length} icon={<FileText className="w-5 h-5" />} delay={0.05} />
        <StatCard label="Total Pages" value={totalPages} icon={<Layers className="w-5 h-5" />} delay={0.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity chart */}
        <div className="lg:col-span-3 p-6 bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-black dark:text-[#eee1ba]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Documents created (last 7 days)</h2>
          </div>
          {listings.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium py-10 text-center">No documents yet — create one to see activity here.</p>
          ) : (
            <MiniBarChart data={last7Days} />
          )}
        </div>

        {/* Top workspaces */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-black dark:text-[#eee1ba]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Most active workspaces</h2>
          </div>
          {topWorkspaces.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium py-6 text-center">No workspaces yet.</p>
          ) : (
            <div className="space-y-3">
              {topWorkspaces.map((ws, i) => {
                const max = Math.max(1, ...topWorkspaces.map(w => w.count));
                return (
                  <div key={ws.name + i}>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      <span className="truncate max-w-[70%]">{ws.name}</span>
                      <span className="text-slate-400">{ws.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-[#1f242e] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(ws.count / max) * 100}%` }}
                        transition={{ delay: i * 0.05 }}
                        className="h-full bg-black dark:bg-[#eee1ba] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity feed */}
      <div className="mt-6 p-6 bg-white dark:bg-[#15181e] rounded-3xl border border-slate-100 dark:border-[#2d323f] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-black dark:text-[#eee1ba]" />
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Recent activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 font-medium py-6 text-center">Nothing here yet — your recent documents will show up once you start writing.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-[#2d323f]">
            {recentActivity.map((item) => (
              <Link
                key={item.id}
                to={`/document`}
                className="flex items-center justify-between py-3.5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-[#eee1ba]/20 dark:bg-[#eee1ba]/10 rounded-lg text-black dark:text-[#eee1ba] shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-black dark:group-hover:text-[#eee1ba] transition-colors">
                      {item.title || 'Untitled Document'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-black dark:group-hover:text-[#eee1ba] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

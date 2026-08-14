import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentService } from '../services/api/content';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/ui/Loader';
import { Trash2, ArrowLeft } from 'lucide-react';

const ContentPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await contentService.getBySlug(slug!);
        setContent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  const handleDelete = async () => {
    if (!content) return;
    if (window.confirm(`Are you sure you want to permanently delete "${content.title}"? This action cannot be undone.`)) {
      try {
        await contentService.delete(content.id);
        navigate('/');
      } catch (err: any) {
        console.error(err);
        alert(err?.response?.data?.message || err?.message || 'Failed to delete content.');
      }
    }
  };

  if (loading) return <Loader />;
  if (!content) return <div className="p-12 text-center">Content not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      {/* Back navigation list and status bars */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Library</span>
        </button>

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Moderator Action: Purge Page Content"
          >
            <Trash2 size={14} />
            <span>Moderate: Delete Content</span>
          </button>
        )}
      </div>

      <span className="text-xs font-black uppercase tracking-widest text-black dark:text-[#eee1ba]">
        Category: {content.category || 'General'}
      </span>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mt-2 mb-8 uppercase tracking-tight">
        {content.title}
      </h1>
      
      {content.image && (
        <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-12 border border-slate-100 dark:border-[#2d323f]">
          <img src={content.image} alt={content.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none font-sans font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: content.body }} />
    </div>
  );
};

export default ContentPage;

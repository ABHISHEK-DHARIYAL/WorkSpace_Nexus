import React, { useEffect, useState } from 'react';
import { contentService } from '../services/api/content';
import { useAuth } from '../context/AuthContext';

import HeroSection from '../components/home/HeroSection';
import ValueStrip from '../components/home/ValueStrip';
import FeaturesSection from '../components/home/FeaturesSection';
import EditorShowcase from '../components/home/EditorShowcase';
import LifecycleSection from '../components/home/LifecycleSection';
import PublicKnowledgeSection from '../components/home/PublicKnowledgeSection';
import CapabilitiesSection from '../components/home/CapabilitiesSection';
import FinalCTASection from '../components/home/FinalCTASection';
import Footer from '../components/home/Footer';

/**
 * The homepage is a composition of focused section components
 * (components/home/*) rather than one large file — each section owns its
 * own layout/animation concerns, while this page only owns the one piece of
 * shared state every section might need: the published content list.
 */
const Home: React.FC = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await contentService.getAll();
        setContent(data);
      } catch (err) {
        console.error('Failed to fetch content', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleDeleteContent = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) {
      try {
        await contentService.delete(id);
        setContent(prev => prev.filter(item => item.id !== id));
      } catch (err: any) {
        console.error('Failed to delete content', err);
        alert(err?.response?.data?.message || err?.message || 'Failed to delete content.');
      }
    }
  };

  return (
    <div>
      <HeroSection />
      <ValueStrip />
      <FeaturesSection />
      <EditorShowcase />
      <LifecycleSection />
      <PublicKnowledgeSection
        content={content}
        loading={loading}
        isAdmin={isAdmin}
        onDelete={handleDeleteContent}
      />
      <CapabilitiesSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default Home;

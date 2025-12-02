'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from '@/components/Image';
import { submitCustomDesignRequest } from '@/app/actions/customDesign';
import { useTranslation } from '@/contexts/LanguageContext';
import { getSiteImageUrl, getProjectImageUrl } from '@/lib/storage-client';
import { Package, Gift, ImageIcon } from 'lucide-react';

type ProjectListing = {
  id: number;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  special_id: number | null;
  product_count: number;
};

export default function CustomDesignPage() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);

  // Projects state
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Fetch cover image and projects in parallel
    Promise.all([
      fetch('/api/upload/site-image?settingKey=custom_design_cover_image')
        .then(res => res.json())
        .then(data => setCoverImagePath(data.path))
        .catch(err => console.error('Error fetching cover image:', err)),
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error('Error fetching projects:', err))
        .finally(() => setLoadingProjects(false))
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      setSubmitError(t('checkout.phone-required'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitCustomDesignRequest({
        phone: phone.trim(),
        description: description.trim() || undefined,
      });

      if (result.success) {
        setSubmitSuccess(true);
        setPhone('');
        setDescription('');

        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        setSubmitError(result.error || t('custom.error'));
      }
    } catch (error) {
      console.error('Error submitting custom design request:', error);
      setSubmitError(t('custom.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div
        className="relative text-white py-16 bg-cover bg-center"
        style={coverImagePath ? { backgroundImage: `url(${getSiteImageUrl(coverImagePath)})` } : undefined}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-blue-700/80" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30">
            {t('home.custom.badge')}
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg">
            {t('custom.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto drop-shadow">
            {t('custom.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Information */}
          <div className="space-y-8">
            {/* Process Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('custom.process-title')}</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('custom.process-step1-title')}</h3>
                    <p className="text-gray-600">
                      {t('custom.process-step1-description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('custom.process-step2-title')}</h3>
                    <p className="text-gray-600">
                      {t('custom.process-step2-description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('custom.process-step3-title')}</h3>
                    <p className="text-gray-600">
                      {t('custom.process-step3-description')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('custom.process-step4-title')}</h3>
                    <p className="text-gray-600">
                      {t('custom.process-step4-description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Contact Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('custom.form-title')}</h2>
              <p className="text-gray-600 mb-6">
                {t('custom.form-description')}
              </p>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    {t('custom.success')}
                  </p>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('custom.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('custom.phone-placeholder')}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('checkout.phone-help')}
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('custom.description')} <span className="text-gray-400">{t('common.optional')}</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('custom.description-placeholder')}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('home.custom.feature1')}
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('custom.submitting') : t('custom.submit')}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  {t('custom.consent')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Gallery Section - At Bottom */}
      {projects.length > 0 && (
        <div className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('custom.projects-title')}</h2>
              <p className="text-gray-600">{t('custom.projects-description')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/custom/projects/${project.id}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform transition hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="aspect-video bg-gray-100">
                    {project.cover_image_path ? (
                      <Image
                        src={getProjectImageUrl(project.cover_image_path)}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{project.title}</h3>
                    {project.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {project.special_id && (
                        <Badge variant="secondary" className="text-xs">
                          <Gift className="w-3 h-3 mr-1" />
                          {t('home.specials.title')}
                        </Badge>
                      )}
                      {project.product_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          {project.product_count} {project.product_count === 1 ? 'product' : 'products'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

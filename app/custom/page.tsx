'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from '@/components/Image';
import { submitCustomDesignRequest } from '@/app/actions/customDesign';
import { useTranslation } from '@/contexts/LanguageContext';

export default function CustomDesignPage() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
      <div className="bg-gradient-to-r from-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <Badge className="mb-2 bg-white/20 text-white hover:bg-white/30">
              {t('home.custom.badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('custom.title')}
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto">
              {t('custom.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Information */}
          <div className="space-y-8">
            {/* Process Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Design Process</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Initial Consultation</h3>
                    <p className="text-gray-600">
                      We discuss your vision, requirements, and budget to understand your needs perfectly.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">3D Design & Planning</h3>
                    <p className="text-gray-600">
                      Our designers create detailed 3D visualizations of your custom kitchen.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Material Selection</h3>
                    <p className="text-gray-600">
                      Choose from our premium selection of materials, colors, and finishes.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Expert Installation</h3>
                    <p className="text-gray-600">
                      Professional installation by our certified team with quality guarantee.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('custom.why-choose')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('custom.benefit1-description')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('custom.benefit2-description')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('custom.benefit3-description')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('home.custom.feature2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('home.custom.feature3')}</p>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Projects</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400&q=80"
                    alt="Custom Kitchen Example 1"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&q=80"
                    alt="Custom Kitchen Example 2"
                    className="w-full h-48 object-cover"
                  />
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
                    {t('custom.description')} <span className="text-gray-400">(Optional)</span>
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
                  By submitting this form, you agree to be contacted by our design team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

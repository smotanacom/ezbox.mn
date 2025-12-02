'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from '@/components/Image';
import { useTranslation } from '@/contexts/LanguageContext';
import { getProjectImageUrl } from '@/lib/storage-client';
import { useCart } from '@/contexts/CartContext';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Package,
  Gift,
  Loader2,
  ImageIcon,
  Check,
} from 'lucide-react';
import type { CustomProjectWithDetails } from '@/types/database';

export default function ProjectDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const { addToCart, addSpecialToCart } = useCart();
  const projectId = parseInt(params?.id as string);

  const [project, setProject] = useState<CustomProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    available: boolean;
    unavailableProducts: number[];
    specialValid: boolean;
  } | null>(null);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();

      if (!res.ok || !data.project) {
        setError('Project not found');
        return;
      }

      setProject(data.project);
      setAvailability(data.availability);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = async () => {
    if (!project || !availability) return;

    setAddingToCart(true);
    try {
      if (project.special_id && project.special && availability.specialValid) {
        await addSpecialToCart(project.special_id);
      } else if (project.products && project.products.length > 0) {
        for (const pp of project.products) {
          if (!availability.unavailableProducts.includes(pp.product_id)) {
            await addToCart(pp.product_id, pp.quantity, pp.selected_parameters || {});
          }
        }
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setAddingToCart(false);
    }
  };

  // Get all images for gallery (cover + gallery images)
  const getGalleryImages = () => {
    if (!project) return [];
    const images: { path: string; alt: string }[] = [];
    if (project.cover_image_path) {
      images.push({ path: project.cover_image_path, alt: project.title });
    }
    if (project.images) {
      project.images.forEach((img) => {
        images.push({ path: img.medium_path, alt: img.alt_text || project.title });
      });
    }
    return images;
  };

  const galleryImages = getGalleryImages();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Project not found'}</h1>
          <Link
            href="/custom"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.project.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/custom"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('custom.back-to-custom')}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Gallery */}
          <div>
            {galleryImages.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                  <Image
                    src={getProjectImageUrl(galleryImages[galleryIndex].path)}
                    alt={galleryImages[galleryIndex].alt}
                    className="w-full h-full object-cover"
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setGalleryIndex((prev) =>
                            prev === 0 ? galleryImages.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setGalleryIndex((prev) =>
                            prev === galleryImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          idx === galleryIndex
                            ? 'border-primary'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={getProjectImageUrl(img.path)}
                          alt={img.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>

          {/* Right: Project Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-gray-600 text-lg">{project.description}</p>
              )}
            </div>

            {/* Products List */}
            {project.products && project.products.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('admin.project.link-products')}
                </h2>
                <div className="space-y-3">
                  {project.products.map((pp) => {
                    const isUnavailable = availability?.unavailableProducts.includes(
                      pp.product_id
                    );
                    return (
                      <div
                        key={pp.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isUnavailable ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{pp.product.name}</span>
                          {isUnavailable && (
                            <span className="ml-2 text-xs text-red-600">
                              ({t('products.unavailable')})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          x{pp.quantity} - ₮{(pp.product.base_price * pp.quantity).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium text-gray-900">{t('cart.total')}</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₮
                    {project.products
                      .filter(
                        (pp) => !availability?.unavailableProducts.includes(pp.product_id)
                      )
                      .reduce((sum, pp) => sum + pp.product.base_price * pp.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Special Link */}
            {project.special && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  {t('admin.project.link-special')}
                </h2>
                <div
                  className={`p-4 rounded-lg ${
                    availability?.specialValid ? 'bg-green-50' : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div className="font-medium text-gray-900">{project.special.name}</div>
                  {project.special.description && (
                    <p className="text-sm text-gray-600 mt-1">{project.special.description}</p>
                  )}
                  <div className="text-xl font-bold text-gray-900 mt-2">
                    ₮{project.special.discounted_price.toLocaleString()}
                  </div>
                  {!availability?.specialValid && (
                    <div className="text-sm text-red-600 mt-2">{t('products.unavailable')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {(availability?.available || availability?.specialValid) && (
              <Button
                onClick={handleAddAllToCart}
                disabled={addingToCart || addedToCart}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-medium shadow-lg"
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {t('custom.adding-to-cart')}
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {t('custom.added-to-cart')}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {project.special_id ? t('specials.add-bundle') : t('custom.add-all-to-cart')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

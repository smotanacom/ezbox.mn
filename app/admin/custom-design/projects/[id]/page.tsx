'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import Image from '@/components/Image';
import { getProjectImageUrl } from '@/lib/storage-client';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Plus,
  Trash2,
  GripVertical,
  Package,
  Gift,
} from 'lucide-react';
import { productAPI, specialAPI } from '@/lib/api-client';
import type {
  CustomProjectWithDetails,
  ProductWithDetails,
  SpecialWithItems,
  ParameterSelection,
} from '@/types/database';

type LinkType = 'none' | 'products' | 'special';

export default function AdminProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const projectId = parseInt(params?.id as string);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<LinkType>('none');
  const [selectedSpecialId, setSelectedSpecialId] = useState<number | null>(null);

  // Data state
  const [project, setProject] = useState<CustomProjectWithDetails | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
  const [projectProducts, setProjectProducts] = useState<
    Array<{
      id: number;
      product_id: number;
      product: ProductWithDetails;
      quantity: number;
      selected_parameters: ParameterSelection;
    }>
  >([]);
  const [galleryImages, setGalleryImages] = useState<
    Array<{
      id: string;
      storage_path: string;
      thumbnail_path: string;
      medium_path: string;
      alt_text: string | null;
      display_order: number;
    }>
  >([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // New product selection
  const [newProductId, setNewProductId] = useState<number | null>(null);
  const [newProductQuantity, setNewProductQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projectRes, productsData, specialsData] = await Promise.all([
        fetch(`/api/admin/projects/${projectId}`),
        productAPI.getAll(true),
        specialAPI.getAll(),
      ]);

      const projectData = await projectRes.json();

      if (!projectData.project) {
        setError('Project not found');
        return;
      }

      const proj = projectData.project as CustomProjectWithDetails;
      setProject(proj);
      setTitle(proj.title);
      setDescription(proj.description || '');
      setStatus(proj.status);
      setCoverImagePath(proj.cover_image_path);
      setGalleryImages(proj.images || []);
      setProjectProducts(proj.products || []);

      // Determine link type
      if (proj.special_id) {
        setLinkType('special');
        setSelectedSpecialId(proj.special_id);
      } else if (proj.products && proj.products.length > 0) {
        setLinkType('products');
      } else {
        setLinkType('none');
      }

      setProducts(productsData.products || []);
      setSpecials(specialsData.specials || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          cover_image_path: coverImagePath,
          special_id: linkType === 'special' ? selectedSpecialId : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      setSuccess(t('admin.custom-design.project-saved'));
      setTimeout(() => setSuccess(null), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isCover', 'true');

      const response = await fetch(`/api/admin/projects/${projectId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setCoverImagePath(data.path);
      setSuccess(t('admin.custom-design.image-uploaded'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Cover upload error:', err);
      setError(t('admin.custom-design.upload-failed'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('isCover', 'false');
        formData.append('displayOrder', String(galleryImages.length + i));

        const response = await fetch(`/api/admin/projects/${projectId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }

      await fetchData();
      setSuccess('Images uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Gallery upload error:', err);
      setError('Failed to upload images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const response = await fetch(
        `/api/admin/projects/${projectId}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setGalleryImages(galleryImages.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image');
    }
  };

  const handleAddProduct = async () => {
    if (!newProductId) return;

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: newProductId,
          quantity: newProductQuantity,
          selected_parameters: {},
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add product');
      }

      setNewProductId(null);
      setNewProductQuantity(1);
      await fetchData();
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Failed to add product');
    }
  };

  const handleUpdateProductQuantity = async (projectProductId: number, quantity: number) => {
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectProductId,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      await fetchData();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    }
  };

  const handleRemoveProduct = async (projectProductId: number) => {
    try {
      const response = await fetch(
        `/api/admin/projects/${projectId}/products?projectProductId=${projectProductId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove product');
      }

      await fetchData();
    } catch (err) {
      console.error('Error removing product:', err);
      setError('Failed to remove product');
    }
  };

  const handleLinkTypeChange = async (newLinkType: LinkType) => {
    setLinkType(newLinkType);

    // If switching away from products, clear products
    if (newLinkType !== 'products' && projectProducts.length > 0) {
      // Remove all products
      for (const pp of projectProducts) {
        await handleRemoveProduct(pp.id);
      }
    }

    // If switching away from special, clear special
    if (newLinkType !== 'special' && selectedSpecialId) {
      setSelectedSpecialId(null);
      // Save without special
      await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          cover_image_path: coverImagePath,
          special_id: null,
        }),
      });
    }
  };

  // Get available products (not already added)
  const availableProducts = products.filter(
    (p) => !projectProducts.some((pp) => pp.product_id === p.id)
  );

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!project) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600">{error || 'Project not found'}</p>
              <Link
                href="/admin/custom-design"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('admin.project.back')}
              </Link>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/custom-design"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.project.back')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('admin.custom-design.edit-project')}
            </h1>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.project.title')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.project.title')} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('admin.project.title-placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.project.description')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('admin.project.description-placeholder')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.project.status')}
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'draft' | 'published' | 'archived')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">{t('admin.project.status-draft')}</option>
                    <option value="published">{t('admin.project.status-published')}</option>
                    <option value="archived">{t('admin.project.status-archived')}</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('admin.project.saving') : t('admin.project.save')}
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.project.cover-image')}
              </h2>

              <div className="flex flex-col sm:flex-row gap-6">
                {coverImagePath && (
                  <div className="relative flex-shrink-0">
                    <div className="w-64 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={getProjectImageUrl(coverImagePath)}
                        alt="Cover"
                        className="w-full h-40 object-cover"
                      />
                    </div>
                    <button
                      onClick={() => setCoverImagePath(null)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex-1">
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] && handleCoverUpload(e.target.files[0])
                      }
                      className="hidden"
                    />
                    {uploadingCover ? (
                      <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {coverImagePath
                            ? t('admin.custom-design.replace-image')
                            : t('admin.custom-design.upload-image')}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Images */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {t('admin.project.gallery-images')}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t('admin.project.gallery-description')}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={getProjectImageUrl(img.thumbnail_path)}
                        alt={img.alt_text || 'Gallery image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition"
                >
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      e.target.files && handleGalleryUpload(e.target.files)
                    }
                    className="hidden"
                  />
                  {uploadingGallery ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Link Type */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('admin.project.link-type')}
              </h2>

              <div className="flex flex-wrap gap-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkType"
                    value="none"
                    checked={linkType === 'none'}
                    onChange={() => handleLinkTypeChange('none')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{t('admin.project.link-none')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkType"
                    value="products"
                    checked={linkType === 'products'}
                    onChange={() => handleLinkTypeChange('products')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {t('admin.project.link-products')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkType"
                    value="special"
                    checked={linkType === 'special'}
                    onChange={() => handleLinkTypeChange('special')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Gift className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {t('admin.project.link-special')}
                  </span>
                </label>
              </div>

              {/* Products Section */}
              {linkType === 'products' && (
                <div className="border-t border-gray-200 pt-4">
                  {/* Add Product */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <select
                      value={newProductId || ''}
                      onChange={(e) => setNewProductId(parseInt(e.target.value) || null)}
                      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('admin.project.select-product')}</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ₮{product.base_price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={newProductQuantity}
                      onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={handleAddProduct}
                      disabled={!newProductId}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t('admin.project.add-product')}
                    </button>
                  </div>

                  {/* Product List */}
                  {projectProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">
                      {t('admin.project.no-products-linked')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {projectProducts.map((pp) => (
                        <div
                          key={pp.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{pp.product.name}</p>
                            <p className="text-sm text-gray-500">
                              ₮{pp.product.base_price.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateProductQuantity(pp.id, Math.max(1, pp.quantity - 1))
                              }
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{pp.quantity}</span>
                            <button
                              onClick={() =>
                                handleUpdateProductQuantity(pp.id, pp.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveProduct(pp.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Special Section */}
              {linkType === 'special' && (
                <div className="border-t border-gray-200 pt-4">
                  <select
                    value={selectedSpecialId || ''}
                    onChange={(e) =>
                      setSelectedSpecialId(parseInt(e.target.value) || null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('admin.project.select-special')}</option>
                    {specials.map((special) => (
                      <option key={special.id} value={special.id}>
                        {special.name} - ₮{special.discounted_price.toLocaleString()} (
                        {special.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/admin/custom-design"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t('common.cancel')}
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? t('admin.project.saving') : t('admin.project.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

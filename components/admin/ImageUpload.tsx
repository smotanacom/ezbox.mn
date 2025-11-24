'use client';

/**
 * Admin Image Upload Component
 *
 * Handles multiple image uploads with drag-drop, preview, reordering, and deletion.
 * For use in admin product forms.
 */

import { useState, useRef, useEffect } from 'react';
import { Upload, X, GripVertical, Loader2 } from 'lucide-react';
import Image from '@/components/Image';
import { getImageUrl } from '@/lib/storage-client';
import { ProductImage } from '@/types/database';
import { useTranslation } from '@/contexts/LanguageContext';

interface ImageUploadProps {
  productId: number | null;
  existingImages: ProductImage[];
  onImagesChange: () => void;
}

export default function ImageUpload({
  productId,
  existingImages,
  onImagesChange
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [images, setImages] = useState<ProductImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with prop changes (e.g., when model preview image is added)
  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  // Handle file selection
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!productId) {
      setError(t('admin.save-product-first'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload each file
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', productId.toString());
        formData.append('displayOrder', (images.length + index).toString());

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        return await response.json();
      });

      const newImages = await Promise.all(uploadPromises);
      setImages([...images, ...newImages]);
      onImagesChange();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('admin.image-upload-failed'));
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    if (!confirm(t('admin.confirm-delete-image'))) return;

    try {
      const response = await fetch(`/api/upload/image?imageId=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      setImages(images.filter(img => img.id !== imageId));
      onImagesChange();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : t('admin.image-delete-failed'));
    }
  };

  // Reorder images (simple move up/down for now)
  const moveImage = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Update display_order
    setImages(newImages);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          imageIds: newImages.map(img => img.id),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder images');
      }

      onImagesChange();
    } catch (err) {
      console.error('Reorder error:', err);
      setError(t('admin.image-reorder-failed'));
      // Revert on error
      setImages(images);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('admin.product-images')}
      </label>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${!productId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => productId && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleChange}
          disabled={!productId || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">{t('admin.uploading-images')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              {productId
                ? t('admin.drag-drop-images')
                : t('admin.save-product-first')}
            </p>
            {productId && (
              <p className="text-xs text-gray-500">
                {t('admin.supported-formats')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Image Preview */}
              <div className="aspect-square">
                <Image
                  src={getImageUrl(image.thumbnail_path)}
                  alt={image.alt_text || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Move Up */}
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                    title={t('admin.move-left')}
                  >
                    <GripVertical className="w-4 h-4 rotate-90" />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                  title={t('admin.delete-image')}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Move Down */}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                    title={t('admin.move-right')}
                  >
                    <GripVertical className="w-4 h-4 -rotate-90" />
                  </button>
                )}
              </div>

              {/* Order Badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          {t('admin.image-order-hint').replace('{count}', images.length.toString())}
        </p>
      )}
    </div>
  );
}

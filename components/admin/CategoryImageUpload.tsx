'use client';

/**
 * Admin Category Image Upload Component
 *
 * Handles single image upload with drag-drop, preview, and deletion.
 * For use in admin category forms.
 */

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from '@/components/Image';
import { getCategoryImageUrl } from '@/lib/storage-client';
import { useTranslation } from '@/contexts/LanguageContext';

interface CategoryImageUploadProps {
  categoryId: number | null;
  existingImagePath: string | null;
  onImageChange: () => void;
}

export default function CategoryImageUpload({
  categoryId,
  existingImagePath,
  onImageChange
}: CategoryImageUploadProps) {
  const { t } = useTranslation();
  const [imagePath, setImagePath] = useState<string | null>(existingImagePath);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!categoryId) {
      setError(t('admin.category.save-first'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', categoryId.toString());
      if (imagePath) {
        formData.append('oldImagePath', imagePath);
      }

      const response = await fetch('/api/upload/category-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setImagePath(data.path);
      onImageChange();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('admin.category.image-upload-failed'));
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
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Delete image
  const handleDelete = async () => {
    if (!imagePath || !categoryId) return;
    if (!confirm(t('admin.confirm-delete-image'))) return;

    try {
      const response = await fetch(
        `/api/upload/category-image?categoryId=${categoryId}&imagePath=${encodeURIComponent(imagePath)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setImagePath(null);
      onImageChange();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : t('admin.category.image-delete-failed'));
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('admin.category.image')}
      </label>

      {/* Current Image Preview */}
      {imagePath && (
        <div className="relative inline-block">
          <div className="w-48 h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <Image
              src={getCategoryImageUrl(imagePath)}
              alt={t('admin.category.current-image')}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition shadow-md"
            title={t('admin.delete-image')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${!categoryId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => categoryId && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleChange}
          disabled={!categoryId || uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-600">{t('admin.uploading-images')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {categoryId
                ? (imagePath ? t('admin.category.replace-image') : t('admin.category.upload-image'))
                : t('admin.category.save-first')}
            </p>
            {categoryId && (
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
    </div>
  );
}

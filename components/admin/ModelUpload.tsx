'use client';

/**
 * Admin 3D Model Upload Component
 *
 * Handles single 3D model upload with preview and deletion.
 * For use in admin product forms.
 */

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Box } from 'lucide-react';
import ModelViewer from '@/components/ModelViewer';
import { ProductModel } from '@/types/database';
import { useTranslation } from '@/contexts/LanguageContext';

interface ModelUploadProps {
  productId: number | null;
  existingModel: ProductModel | null;
  productName: string;
  onModelChange: () => void;
}

export default function ModelUpload({
  productId,
  existingModel,
  productName,
  onModelChange
}: ModelUploadProps) {
  const { t } = useTranslation();
  const [model, setModel] = useState<ProductModel | null>(existingModel);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!productId) {
      setError(t('admin.save-product-first'));
      return;
    }

    // Validate file extension
    const validExtensions = ['.glb', '.gltf', '.usdz'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    // Special handling for SKP files
    if (ext === '.skp') {
      setError(
        'SKP files are not directly supported. Please export from SketchUp as COLLADA (.dae) or GLB/GLTF format. ' +
        'Alternatively, use an online converter: https://products.aspose.app/3d/conversion/skp-to-glb'
      );
      return;
    }

    if (!validExtensions.includes(ext)) {
      setError(t('admin.invalid-model-format').replace('{formats}', validExtensions.join(', ')));
      return;
    }

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t('admin.model-too-large').replace('{size}', '50MB'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId.toString());

      const response = await fetch('/api/upload/model', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const newModel = await response.json();
      setModel(newModel);
      onModelChange();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('admin.model-upload-failed'));
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

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file || null);
  };

  // Capture screenshot of model viewer
  const handleScreenshot = async () => {
    if (!viewerContainerRef.current || !productId) return;

    setUploading(true);
    setError(null);

    try {
      // Find the model-viewer element
      const modelViewer = viewerContainerRef.current.querySelector('model-viewer') as any;

      if (!modelViewer) {
        throw new Error('Model viewer not found');
      }

      // Wait for model to be loaded if not already
      await modelViewer.updateComplete;

      // Use model-viewer's built-in toBlob method to capture screenshot
      const blob = await modelViewer.toBlob({
        idealAspect: true,
        mimeType: 'image/png',
        qualityArgument: 0.92
      });

      if (!blob) {
        throw new Error('Failed to capture screenshot');
      }

      // Composite the screenshot with the correct background color (#f3f4f6)
      const img = new window.Image();
      const imgUrl = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });

      // Create canvas with the same dimensions as the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Fill with background color (#f3f4f6 = gray-100)
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the model screenshot on top
      ctx.drawImage(img, 0, 0);

      // Clean up
      URL.revokeObjectURL(imgUrl);

      // Convert canvas to blob
      const compositedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob from canvas'));
        }, 'image/png', 0.92);
      });

      // Create a File object from the composited blob
      const file = new File([compositedBlob], 'model-screenshot.png', { type: 'image/png' });

      // Upload as product image
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId.toString());
      formData.append('displayOrder', '0'); // Put it first

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      // Success! Notify parent to refresh
      onModelChange();
      alert('Screenshot captured and saved successfully!');
    } catch (err) {
      console.error('Screenshot error:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture screenshot');
    } finally {
      setUploading(false);
    }
  };

  // Delete model
  const handleDelete = async () => {
    if (!confirm(t('admin.confirm-delete-model'))) return;

    try {
      const response = await fetch(`/api/upload/model?productId=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      setModel(null);
      onModelChange();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : t('admin.model-delete-failed'));
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('admin.product-3d-model')}
        <span className="text-gray-500 font-normal ml-2">({t('admin.optional')})</span>
      </label>

      {/* 3D Model Preview - Always Visible When Model Exists */}
      {model && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Box className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {model.file_format.toUpperCase()} Model
                </p>
                <p className="text-sm text-gray-600">
                  {(model.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
          <div className="w-full aspect-square rounded-lg overflow-hidden" ref={viewerContainerRef}>
            <ModelViewer model={model} productName={productName} className="aspect-square" />
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={handleScreenshot}
              disabled={uploading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {uploading ? 'Capturing...' : 'Take Screenshot'}
            </button>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800"
            >
              {t('admin.delete-model')}
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone (show if no model) */}
      {!model && (
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
            accept=".glb,.gltf,.usdz"
            onChange={handleChange}
            disabled={!productId || uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600">{t('admin.uploading-model')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Box className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {productId
                  ? t('admin.drag-drop-model')
                  : t('admin.save-product-first')}
              </p>
              {productId && (
                <>
                  <p className="text-xs text-gray-500">
                    {t('admin.model-formats')}: GLB, GLTF, USDZ (max 50MB)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    For SketchUp files: Export as COLLADA (.dae) or GLB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        {t('admin.model-hint')}
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import Image from '@/components/Image';
import { getSiteImageUrl, getProjectImageUrl } from '@/lib/storage-client';
import { useTranslation } from '@/contexts/LanguageContext';
import { Upload, X, Loader2, ArrowLeft, ImageIcon, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { CustomProject } from '@/types/database';

export default function AdminCustomDesignPage() {
  const { t } = useTranslation();

  // Cover image state
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [loadingCover, setLoadingCover] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Projects state
  const [projects, setProjects] = useState<CustomProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCoverImage();
    fetchProjects();
  }, []);

  const fetchCoverImage = async () => {
    try {
      const response = await fetch('/api/upload/site-image?settingKey=custom_design_cover_image');
      if (response.ok) {
        const data = await response.json();
        setCoverImagePath(data.path);
      }
    } catch (err) {
      console.error('Error fetching cover image:', err);
    } finally {
      setLoadingCover(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingCover(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('settingKey', 'custom_design_cover_image');
      if (coverImagePath) {
        formData.append('oldImagePath', coverImagePath);
      }

      const response = await fetch('/api/upload/site-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setCoverImagePath(data.path);
      setSuccess(t('admin.custom-design.image-uploaded'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t('admin.custom-design.upload-failed'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverDelete = async () => {
    if (!coverImagePath) return;
    if (!confirm(t('admin.confirm-delete-image'))) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/upload/site-image?settingKey=custom_design_cover_image&imagePath=${encodeURIComponent(coverImagePath)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setCoverImagePath(null);
      setSuccess(t('admin.custom-design.image-deleted'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('admin.custom-design.delete-failed'));
    }
  };

  const handleDeleteProject = async (project: CustomProject) => {
    if (!confirm(t('admin.custom-design.delete-project-confirm').replace('{title}', project.title))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setProjects(projects.filter(p => p.id !== project.id));
      setSuccess(t('admin.custom-design.project-deleted'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

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
      handleCoverUpload(files[0]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Eye className="w-3 h-3 mr-1" />{t('admin.project.status-published')}</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><EyeOff className="w-3 h-3 mr-1" />{t('admin.project.status-draft')}</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{t('admin.project.status-archived')}</span>;
      default:
        return null;
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.custom-design.back-dashboard')}
            </Link>
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-gray-700" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t('admin.custom-design.title')}
                </h1>
                <p className="text-gray-600 mt-1">{t('admin.custom-design.description')}</p>
              </div>
            </div>
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
            {/* Cover Image Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('admin.custom-design.cover-section')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('admin.custom-design.cover-description')}
              </p>

              {loadingCover ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Current Image */}
                  {coverImagePath && (
                    <div className="relative flex-shrink-0">
                      <div className="w-80 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <Image
                          src={getSiteImageUrl(coverImagePath)}
                          alt={t('admin.custom-design.cover-section')}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <button
                        onClick={handleCoverDelete}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition shadow-lg"
                        title={t('admin.delete-image')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Upload Zone */}
                  <div className="flex-1">
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                        disabled={uploadingCover}
                        className="hidden"
                      />

                      {uploadingCover ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
                          <p className="text-sm text-gray-600">{t('admin.uploading-images')}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            {coverImagePath ? t('admin.custom-design.replace-image') : t('admin.custom-design.upload-image')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('admin.custom-design.recommended-size')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('admin.custom-design.projects-section')}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {t('admin.custom-design.projects-description')}
                  </p>
                </div>
                <Link
                  href="/admin/custom-design/projects/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  {t('admin.custom-design.add-project')}
                </Link>
              </div>

              {loadingProjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin.custom-design.no-projects')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      {/* Cover Image */}
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

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {project.title}
                          </h3>
                          {getStatusBadge(project.status)}
                        </div>

                        {project.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                            {project.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/custom-design/projects/${project.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                            prefetch={false}
                          >
                            <Edit className="w-4 h-4" />
                            {t('admin.custom-design.edit-project')}
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title={t('admin.custom-design.delete-project')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

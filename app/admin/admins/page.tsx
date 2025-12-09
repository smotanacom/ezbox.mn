'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { listAdmins, createAdmin, deleteAdmin, setAdminPassword } from '@/lib/adminAuth';
import { useTranslation } from '@/contexts/LanguageContext';
import type { Admin } from '@/types/database';

type SortField = 'id' | 'username' | 'email' | 'created_at' | 'updated_at';

export default function AdminManagementPage() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password reset modal state
  const [passwordModalAdmin, setPasswordModalAdmin] = useState<Admin | null>(null);
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      alert(t('admin.admins.load-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(formData.username)) {
      setFormError(t('admin.admins.username-error'));
      return;
    }

    if (formData.password.length < 6) {
      setFormError(t('admin.admins.password-error'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError(t('admin.admins.passwords-no-match'));
      return;
    }

    setSubmitting(true);

    try {
      await createAdmin(formData.username, formData.password, formData.email || undefined);
      setFormData({ username: '', password: '', confirmPassword: '', email: '' });
      setShowAddForm(false);
      fetchAdmins();
      alert(t('admin.admins.create-success'));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(t('admin.admins.delete-confirm').replace('{name}', admin.username))) {
      return;
    }

    try {
      await deleteAdmin(admin.id);
      fetchAdmins();
      alert(t('admin.admins.delete-success'));
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert(t('admin.admins.delete-failed'));
    }
  };

  const openPasswordModal = (admin: Admin) => {
    setPasswordModalAdmin(admin);
    setPasswordFormData({ password: '', confirmPassword: '' });
    setPasswordError('');
  };

  const closePasswordModal = () => {
    setPasswordModalAdmin(null);
    setPasswordFormData({ password: '', confirmPassword: '' });
    setPasswordError('');
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordModalAdmin) return;

    if (passwordFormData.password.length < 6) {
      setPasswordError(t('admin.admins.password-error'));
      return;
    }

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      setPasswordError(t('admin.admins.passwords-no-match'));
      return;
    }

    setSettingPassword(true);

    try {
      await setAdminPassword(passwordModalAdmin.id, passwordFormData.password);
      closePasswordModal();
      alert(t('admin.admins.password-set-success'));
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t('admin.admins.password-set-failed'));
    } finally {
      setSettingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAndSortedAdmins = useMemo(() => {
    let result = [...admins];

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(a =>
        a.username.toLowerCase().includes(term) ||
        a.email?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [admins, debouncedSearchTerm, sortBy, sortOrder]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-gray-400">
          {sortBy === field ? (
            sortOrder === 'asc' ? '↑' : '↓'
          ) : null}
        </span>
      </div>
    </th>
  );

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.admins.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.admins.subtitle')}</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {showAddForm ? t('admin.admins.cancel') : t('admin.admins.add-new')}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.admins.create-title')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.admins.username')}
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('admin.admins.username-placeholder')}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.admins.email')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('admin.admins.email-placeholder')}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.admins.password')}
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('admin.admins.password-placeholder')}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.admins.confirm-password')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('admin.admins.confirm-password-placeholder')}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? t('admin.admins.creating') : t('admin.admins.create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ username: '', password: '', confirmPassword: '', email: '' });
                      setFormError('');
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
                  >
                    {t('admin.admins.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Search row */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('admin.admins.search-placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.admins.loading')}</p>
              </div>
            ) : filteredAndSortedAdmins.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600 text-lg">{t('admin.admins.no-admins')}</p>
                <p className="text-gray-500 mt-2">{t('admin.admins.no-admins-hint')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">{t('admin.admins.id')}</SortableHeader>
                        <SortableHeader field="username">{t('admin.admins.username')}</SortableHeader>
                        <SortableHeader field="email">{t('admin.admins.email').replace(' (optional)', '')}</SortableHeader>
                        <SortableHeader field="created_at">{t('admin.admins.created-at')}</SortableHeader>
                        <SortableHeader field="updated_at">{t('admin.admins.last-updated')}</SortableHeader>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.admins.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedAdmins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{admin.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {admin.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {admin.email || (
                              <span className="text-gray-400 italic">{t('admin.admins.no-email')}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(admin.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(admin.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => openPasswordModal(admin)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {t('admin.admins.set-password')}
                            </button>
                            <button
                              onClick={() => handleDelete(admin)}
                              className="text-red-600 hover:text-red-800"
                            >
                              {t('admin.admins.delete')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedAdmins.length === 1
                      ? t('admin.admins.showing-count').replace('{count}', filteredAndSortedAdmins.length.toString())
                      : t('admin.admins.showing-count-plural').replace('{count}', filteredAndSortedAdmins.length.toString())}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Password Reset Modal */}
        {passwordModalAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('admin.admins.set-password-title').replace('{name}', passwordModalAdmin.username)}
              </h2>
              <form onSubmit={handleSetPassword} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.admins.new-password')}
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordFormData.password}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.admins.password-placeholder')}
                    disabled={settingPassword}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.admins.confirm-password')}
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.admins.confirm-password-placeholder')}
                    disabled={settingPassword}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={settingPassword}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {settingPassword ? t('admin.admins.setting-password') : t('admin.admins.set-password')}
                  </button>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    disabled={settingPassword}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition disabled:opacity-50"
                  >
                    {t('admin.admins.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminRouteGuard>
  );
}

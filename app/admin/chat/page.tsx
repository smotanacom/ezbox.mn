'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  ArrowLeft,
  MessageCircle,
  Loader2,
  Save,
  ExternalLink,
  Info,
  CheckCircle,
} from 'lucide-react';

interface ChatSettings {
  chat_type: string | null;
  chat_personal_username: string | null;
  chat_plugin_page_id: string | null;
  chat_plugin_theme_color: string | null;
  chat_plugin_greeting: string | null;
  chat_enabled: string | null;
}

export default function AdminChatPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state
  const [enabled, setEnabled] = useState(true);
  const [chatType, setChatType] = useState<'personal' | 'plugin'>('personal');
  const [personalUsername, setPersonalUsername] = useState('');
  const [pluginPageId, setPluginPageId] = useState('');
  const [pluginThemeColor, setPluginThemeColor] = useState('#0084ff');
  const [pluginGreeting, setPluginGreeting] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/chat-settings');
      if (response.ok) {
        const data = await response.json();
        const settings: ChatSettings = data.settings;

        setEnabled(settings.chat_enabled !== 'false');
        setChatType((settings.chat_type as 'personal' | 'plugin') || 'personal');
        setPersonalUsername(settings.chat_personal_username || '');
        setPluginPageId(settings.chat_plugin_page_id || '');
        setPluginThemeColor(settings.chat_plugin_theme_color || '#0084ff');
        setPluginGreeting(settings.chat_plugin_greeting || '');
      }
    } catch (err) {
      console.error('Error fetching chat settings:', err);
      setError(t('admin.chat.load-error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/chat-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            chat_enabled: enabled ? 'true' : 'false',
            chat_type: chatType,
            chat_personal_username: personalUsername || null,
            chat_plugin_page_id: pluginPageId || null,
            chat_plugin_theme_color: pluginThemeColor,
            chat_plugin_greeting: pluginGreeting || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setSuccess(t('admin.chat.save-success'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving chat settings:', err);
      setError(t('admin.chat.save-error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.chat.back-dashboard')}
            </Link>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-gray-700" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {t('admin.chat.title')}
                </h1>
                <p className="text-gray-600 mt-1">{t('admin.chat.description')}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('admin.chat.enable-chat')}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {t('admin.chat.enable-description')}
                    </p>
                  </div>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Chat Type Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.chat.type-title')}
                </h2>

                <div className="space-y-4">
                  {/* Personal Option */}
                  <label
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      chatType === 'personal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="chatType"
                        value="personal"
                        checked={chatType === 'personal'}
                        onChange={() => setChatType('personal')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {t('admin.chat.type-personal')}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('admin.chat.type-personal-description')}
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Plugin Option */}
                  <label
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      chatType === 'plugin'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="chatType"
                        value="plugin"
                        checked={chatType === 'plugin'}
                        onChange={() => setChatType('plugin')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {t('admin.chat.type-plugin')}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('admin.chat.type-plugin-description')}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Personal Settings */}
              {chatType === 'personal' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('admin.chat.personal-settings')}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.chat.facebook-username')}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">m.me/</span>
                        <input
                          type="text"
                          value={personalUsername}
                          onChange={(e) => setPersonalUsername(e.target.value)}
                          placeholder={t('admin.chat.username-placeholder')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('admin.chat.username-help')}
                      </p>
                    </div>

                    {/* How to find username */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900 mb-2">
                            {t('admin.chat.how-to-find-username')}
                          </h3>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>{t('admin.chat.username-step1')}</li>
                            <li>{t('admin.chat.username-step2')}</li>
                            <li>{t('admin.chat.username-step3')}</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plugin Settings */}
              {chatType === 'plugin' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('admin.chat.plugin-settings')}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.chat.page-id')}
                      </label>
                      <input
                        type="text"
                        value={pluginPageId}
                        onChange={(e) => setPluginPageId(e.target.value)}
                        placeholder={t('admin.chat.page-id-placeholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.chat.theme-color')}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={pluginThemeColor}
                          onChange={(e) => setPluginThemeColor(e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pluginThemeColor}
                          onChange={(e) => setPluginThemeColor(e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.chat.greeting-message')}
                      </label>
                      <textarea
                        value={pluginGreeting}
                        onChange={(e) => setPluginGreeting(e.target.value)}
                        placeholder={t('admin.chat.greeting-placeholder')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Setup Instructions */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-900 mb-2">
                            {t('admin.chat.plugin-setup-title')}
                          </h3>
                          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                            <li>{t('admin.chat.plugin-step1')}</li>
                            <li>{t('admin.chat.plugin-step2')}</li>
                            <li>{t('admin.chat.plugin-step3')}</li>
                            <li>{t('admin.chat.plugin-step4')}</li>
                            <li>{t('admin.chat.plugin-step5')}</li>
                          </ol>
                          <a
                            href="https://www.facebook.com/pages/create"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-amber-700 hover:text-amber-800 font-medium"
                          >
                            {t('admin.chat.create-page-link')}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* How to find Page ID */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900 mb-2">
                            {t('admin.chat.how-to-find-page-id')}
                          </h3>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>{t('admin.chat.page-id-step1')}</li>
                            <li>{t('admin.chat.page-id-step2')}</li>
                            <li>{t('admin.chat.page-id-step3')}</li>
                            <li>{t('admin.chat.page-id-step4')}</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('admin.chat.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t('admin.chat.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}

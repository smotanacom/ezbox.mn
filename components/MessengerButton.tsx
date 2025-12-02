'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useTranslation } from '@/contexts/LanguageContext';

interface ChatSettings {
  chat_type: string | null;
  chat_personal_username: string | null;
  chat_plugin_page_id: string | null;
  chat_plugin_theme_color: string | null;
  chat_plugin_greeting: string | null;
  chat_enabled: string | null;
}

export default function MessengerButton() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/chat-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching chat settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while loading or if disabled
  if (loading) return null;
  if (!settings || settings.chat_enabled === 'false') return null;

  const chatType = settings.chat_type || 'personal';
  const personalUsername = settings.chat_personal_username;
  const pageId = settings.chat_plugin_page_id;
  const themeColor = settings.chat_plugin_theme_color || '#0084ff';

  // For personal type, show simple button linking to m.me
  if (chatType === 'personal' && personalUsername) {
    return (
      <a
        href={`https://m.me/${personalUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('messenger.chat-with-us')}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0084ff] shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        {/* Messenger Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          className="h-8 w-8"
          fill="white"
        >
          <path d="M400 0C174.7 0 0 165.1 0 388c0 116.6 47.8 217.4 125.6 287.7 6.5 5.9 10.5 14.2 10.8 23.1l2.2 72.2c.7 23.4 24.7 38.7 46.1 29.4l80.5-35.5c6.8-3 14.5-3.5 21.6-1.4 35.7 9.6 73.8 14.7 113.2 14.7 225.3 0 400-165.1 400-388S625.3 0 400 0zm39.8 513.9l-101.8-108.5-198.6 108.5 218.4-231.9 104.3 108.5 196.1-108.5-218.4 231.9z" />
        </svg>
      </a>
    );
  }

  // For plugin type, embed Facebook Chat Plugin
  if (chatType === 'plugin' && pageId) {
    return (
      <>
        {/* Facebook SDK */}
        <div id="fb-root"></div>
        <Script
          id="facebook-sdk"
          strategy="lazyOnload"
          crossOrigin="anonymous"
          src="https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js"
          onLoad={() => {
            // Initialize Facebook SDK
            if (typeof window !== 'undefined' && (window as any).FB) {
              (window as any).FB.init({
                xfbml: true,
                version: 'v18.0',
              });
            }
          }}
        />
        <Script id="fb-init" strategy="lazyOnload">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                xfbml: true,
                version: 'v18.0'
              });
            };
          `}
        </Script>

        {/* Chat Plugin */}
        <div
          className="fb-customerchat"
          // @ts-ignore - Facebook SDK attributes
          attribution="setup_tool"
          page_id={pageId}
          theme_color={themeColor}
          logged_in_greeting={settings.chat_plugin_greeting || t('messenger.chat-with-us')}
          logged_out_greeting={settings.chat_plugin_greeting || t('messenger.chat-with-us')}
        />
      </>
    );
  }

  // No valid configuration, don't render anything
  return null;
}

-- Migration: Add chat settings for Messenger integration
-- Supports both personal Messenger link and Facebook Chat Plugin

-- Insert chat settings
INSERT INTO site_settings (key, value, value_type, description)
VALUES
    ('chat_type', 'personal', 'string', 'Type of chat: personal (m.me link) or plugin (Facebook Chat Plugin)'),
    ('chat_personal_username', NULL, 'string', 'Facebook username for personal Messenger link (e.g., Amarhuuu)'),
    ('chat_plugin_page_id', NULL, 'string', 'Facebook Page ID for Chat Plugin'),
    ('chat_plugin_theme_color', '#0084ff', 'string', 'Theme color for Chat Plugin'),
    ('chat_plugin_greeting', NULL, 'string', 'Greeting message for Chat Plugin'),
    ('chat_enabled', 'true', 'boolean', 'Whether chat button is enabled')
ON CONFLICT (key) DO NOTHING;

-- Track migration
INSERT INTO schema_migrations (version) VALUES ('0019_chat_settings');

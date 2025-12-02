import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key for public read access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CHAT_SETTING_KEYS = [
  'chat_type',
  'chat_personal_username',
  'chat_plugin_page_id',
  'chat_plugin_theme_color',
  'chat_plugin_greeting',
  'chat_enabled',
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', CHAT_SETTING_KEYS);

    if (error) throw error;

    // Convert array to object for easier use
    const settings: Record<string, string | null> = {};
    for (const key of CHAT_SETTING_KEYS) {
      const found = data?.find((s) => s.key === key);
      settings[key] = found?.value ?? null;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat settings' },
      { status: 500 }
    );
  }
}

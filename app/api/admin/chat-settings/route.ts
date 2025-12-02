import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { data, error } = await supabaseAdmin
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Update each setting
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      if (CHAT_SETTING_KEYS.includes(key)) {
        updates.push(
          supabaseAdmin
            .from('site_settings')
            .upsert(
              {
                key,
                value: value as string | null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'key' }
            )
        );
      }
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}

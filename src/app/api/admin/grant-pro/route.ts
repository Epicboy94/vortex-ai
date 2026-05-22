import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, adminSecret } = await req.json();

    if (adminSecret !== 'vortex_admin_2026_secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return NextResponse.json({
        error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local'
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Look up user by email via admin API
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json({ error: 'Failed to query users: ' + listError.message }, { status: 500 });
    }

    const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      return NextResponse.json({
        error: 'No account found with this email. The user must sign up first.'
      }, { status: 404 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_pro, name')
      .eq('user_id', targetUser.id)
      .single();

    if (profile?.is_pro) {
      return NextResponse.json({
        error: `${profile.name || email} already has Pro access!`
      }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_pro: true })
      .eq('user_id', targetUser.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Pro access granted to ${profile?.name || targetUser.email}`
    });
  } catch (error) {
    console.error('Grant Pro error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

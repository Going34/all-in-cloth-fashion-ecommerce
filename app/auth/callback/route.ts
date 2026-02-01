import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;
  const from = requestUrl.searchParams.get('from') || '/';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const errorUrl = new URL(`${origin}/login`);
    errorUrl.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(errorUrl.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const errorUrl = new URL(`${origin}/login`);
      errorUrl.searchParams.set('error', 'Failed to confirm email. The link may have expired. Please try signing up again.');
      return NextResponse.redirect(errorUrl.toString());
    }

    // After successful exchange, redirect to home or original destination
    // The auth state change will be handled by AuthContext
    return NextResponse.redirect(`${origin}${from}`);
  }

  // No code provided, redirect to home
  return NextResponse.redirect(`${origin}/`);
}


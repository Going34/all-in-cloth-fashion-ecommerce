import { NextResponse } from 'next/server';
import { testDatabaseConnectionServer, checkSupabaseConfig } from '@/utils/dbConnection';

/**
 * API Route to test database connection
 * GET /api/test-connection
 */
export async function GET() {
  try {
    // Check configuration first
    const config = checkSupabaseConfig();
    
    if (!config.configured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase configuration missing',
          missing: config.missing,
          message: 'Please configure Supabase environment variables in .env.local',
        },
        { status: 500 }
      );
    }

    // Test connection
    const connectionStatus = await testDatabaseConnectionServer();

    if (connectionStatus.connected) {
      return NextResponse.json(
        {
          success: true,
          ...connectionStatus,
          config: {
            url: config.url,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                    !!process.env.NEXT_PUBLIC_SUPABASE_API_KEY,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          ...connectionStatus,
          config: {
            url: config.url,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                    !!process.env.NEXT_PUBLIC_SUPABASE_API_KEY,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to test database connection',
      },
      { status: 500 }
    );
  }
}


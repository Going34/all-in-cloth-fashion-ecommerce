import { errorResponse, successResponse } from '@/lib/response';
import { clearSessionCookie } from '@/lib/session';

export async function POST() {
  try {
    await clearSessionCookie();
    return successResponse({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}





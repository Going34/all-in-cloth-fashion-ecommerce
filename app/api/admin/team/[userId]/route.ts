import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { removeTeamMember } from '@/modules/team/team.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    await removeTeamMember(userId);
    return successResponse({ message: 'Team member removed successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}


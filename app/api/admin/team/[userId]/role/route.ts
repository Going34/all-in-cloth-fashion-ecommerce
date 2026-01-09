import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { updateTeamMemberRole } from '@/modules/team/team.service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return errorResponse(new Error('Role is required'), 400);
    }

    const validRoles = ['Admin', 'Ops', 'Support'];
    if (!validRoles.includes(role)) {
      return errorResponse(new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`), 400);
    }

    const member = await updateTeamMemberRole(userId, { role });
    return successResponse(member);
  } catch (error) {
    return errorResponse(error);
  }
}


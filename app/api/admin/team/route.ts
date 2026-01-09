import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { requireAdmin } from '@/lib/auth';
import { listTeamMembers, inviteTeamMember } from '@/modules/team/team.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const result = await listTeamMembers();
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return errorResponse(new Error('Name, email, and role are required'), 400);
    }

    const validRoles = ['Admin', 'Ops', 'Support'];
    if (!validRoles.includes(role)) {
      return errorResponse(new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`), 400);
    }

    const member = await inviteTeamMember({ name, email, role });
    return successResponse(member, 201);
  } catch (error) {
    return errorResponse(error);
  }
}


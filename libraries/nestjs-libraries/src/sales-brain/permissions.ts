import { ForbiddenException } from '@nestjs/common';
import { Organization } from '@prisma/client';

/**
 * Sensitive Sales Brain actions (changing AI autonomy, editing what the AI is
 * allowed to say, creating outbound webhook automations, etc.) are restricted
 * to org admins, reusing Postiz's existing UserOrganization role (attached to
 * req.org as org.users[0] by AuthMiddleware) rather than a separate
 * permission system.
 */
export function assertSalesBrainAdmin(org: Organization) {
  // @ts-ignore
  const role = org.users?.[0]?.role;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    throw new ForbiddenException(
      'Only an organization admin can perform this action'
    );
  }
}

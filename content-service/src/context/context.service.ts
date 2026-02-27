import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UserRole } from 'src/enums/user_role.type';

@Injectable({ scope: Scope.REQUEST })
export class ContextService {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  getUserId() {
    return this.req.headers['x-user-id'];
  }

  getSessionId() {
    return this.req.headers['x-session-id'];
  }

  getAvatarUrl() {
    return this.req.headers['x-user-avatar'];
  }

  getUsername() {
    return this.req.headers['x-user-username'];
  }

  getRoles(): UserRole[] {
    const rolesHeader = this.req.headers['x-user-roles'];

    if (!rolesHeader) return [];

    if (Array.isArray(rolesHeader)) {
      return rolesHeader.flatMap((r) => r.split(','));
    }

    return rolesHeader.split(',');
  }
}

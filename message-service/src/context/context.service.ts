import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UserRole } from '../enums/user_role';

@Injectable({ scope: Scope.REQUEST })
export class ContextService {
  constructor(@Inject(REQUEST) private readonly req: Request) {}

  getUserId() {
    return this.req.headers['X-User-Id'];
  }

  getSessionId() {
    return this.req.headers['X-Session-Id'];
  }

  getAvatarUrl() {
    return this.req.headers['X-User-Avatar'];
  }

  getUsername() {
    return this.req.headers['X-User-Username'];
  }

  getRoles(): UserRole[] {
    const rolesHeader = this.req.headers['X-User-Roles'];

    if (!rolesHeader) return [];

    if (Array.isArray(rolesHeader)) {
      return rolesHeader.flatMap((r) => r.split(','));
    }

    return rolesHeader.split(',');
  }
}

import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { UserRole } from '../enums/user_role';

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

  getRole(): UserRole {
    return this.req.headers['x-user-role'];
  }
}

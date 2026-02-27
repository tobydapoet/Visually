import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

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
}

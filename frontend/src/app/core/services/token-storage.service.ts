import { Injectable } from '@angular/core';

import { UserResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly tokenKey = 'ums.jwt';
  private readonly userKey = 'ums.user';

  getToken(): string | null {
    return this.storage?.getItem(this.tokenKey) ?? null;
  }

  setToken(token: string): void {
    this.storage?.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    this.storage?.removeItem(this.tokenKey);
  }

  getUser(): UserResponse | null {
    const rawUser = this.storage?.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as UserResponse;
    } catch {
      this.clearUser();
      return null;
    }
  }

  setUser(user: UserResponse): void {
    this.storage?.setItem(this.userKey, JSON.stringify(user));
  }

  clearUser(): void {
    this.storage?.removeItem(this.userKey);
  }

  clear(): void {
    this.clearToken();
    this.clearUser();
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}


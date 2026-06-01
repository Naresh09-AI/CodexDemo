import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { UserResponse, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly currentUserSubject = new BehaviorSubject<UserResponse | null>(
    this.tokenStorage.getUser(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  get currentUserSnapshot(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.setCurrentUser(response.user);
      }),
    );
  }

  register(request: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, request);
  }

  loadCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.currentUserSubject.next(null);
  }

  syncCurrentUser(user: UserResponse): void {
    this.setCurrentUser(user);
  }

  isAuthenticated(): boolean {
    return Boolean(this.tokenStorage.getToken());
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserSnapshot?.role === role;
  }

  private setCurrentUser(user: UserResponse): void {
    this.tokenStorage.setUser(user);
    this.currentUserSubject.next(user);
  }
}

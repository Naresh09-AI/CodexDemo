import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { UserResponse } from '../models/user.model';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorageService;

  const user: UserResponse = {
    id: 1,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '5550000000',
    status: 'ACTIVE',
    role: 'ADMIN',
    createdAt: '2026-05-29T10:00:00',
    updatedAt: '2026-05-29T10:00:00',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should login and store the JWT and current user', () => {
    const request: LoginRequest = {
      email: 'admin@example.com',
      password: 'AdminPass123!',
    };
    const response: AuthResponse = {
      token: 'jwt-token',
      tokenType: 'Bearer',
      user,
    };

    service.login(request).subscribe((actual) => {
      expect(actual).toEqual(response);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(response);

    expect(tokenStorage.getToken()).toBe('jwt-token');
    expect(service.currentUserSnapshot).toEqual(user);
    expect(service.hasRole('ADMIN')).toBeTrue();
  });

  it('should register without storing a JWT because the backend returns only a user response', () => {
    const request: RegisterRequest = {
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      phone: '5551112222',
      password: 'UserPass123!',
    };

    service.register(request).subscribe((actual) => {
      expect(actual).toEqual({ ...user, role: 'USER' });
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ ...user, role: 'USER' });

    expect(tokenStorage.getToken()).toBeNull();
    expect(service.currentUserSnapshot).toBeNull();
  });

  it('should load and store the current user', () => {
    service.loadCurrentUser().subscribe((actual) => {
      expect(actual).toEqual(user);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(user);

    expect(tokenStorage.getUser()).toEqual(user);
  });

  it('should clear auth state on logout', () => {
    tokenStorage.setToken('jwt-token');
    tokenStorage.setUser(user);
    service.syncCurrentUser(user);

    service.logout();

    expect(tokenStorage.getToken()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(service.currentUserSnapshot).toBeNull();
  });
});


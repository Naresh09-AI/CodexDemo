import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PageResponse, UserCreateRequest, UserResponse, UserUpdateRequest } from '../models/user.model';
import { UserApiService } from './user-api.service';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  const user: UserResponse = {
    id: 2,
    firstName: 'Jane',
    lastName: 'User',
    email: 'jane@example.com',
    phone: '5552223333',
    status: 'ACTIVE',
    role: 'USER',
    createdAt: '2026-05-29T10:00:00',
    updatedAt: '2026-05-29T10:00:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request paginated and sorted users', () => {
    const response: PageResponse<UserResponse> = {
      content: [user],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getUsers(0, 10, 'email', 'desc').subscribe((actual) => {
      expect(actual).toEqual(response);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/api/v1/users?page=0&size=10&sort=email,desc`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('should create a user', () => {
    const request: UserCreateRequest = {
      firstName: 'Jane',
      lastName: 'User',
      email: 'jane@example.com',
      password: 'UserPass123!',
      phone: '5552223333',
      status: 'ACTIVE',
      role: 'USER',
    };

    service.createUser(request).subscribe((actual) => {
      expect(actual).toEqual(user);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(user);
  });

  it('should update a user', () => {
    const request: UserUpdateRequest = {
      firstName: 'Jane',
      lastName: 'Updated',
      email: 'jane.updated@example.com',
      phone: '5552223333',
      status: 'ACTIVE',
      role: 'USER',
    };

    service.updateUser(2, request).subscribe((actual) => {
      expect(actual.lastName).toBe('Updated');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/2`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ ...user, lastName: 'Updated' });
  });

  it('should delete a user', () => {
    service.deleteUser(2).subscribe((actual) => {
      expect(actual).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/v1/users/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});


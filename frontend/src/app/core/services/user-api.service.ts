import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PageResponse, UserCreateRequest, UserResponse, UserUpdateRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/users`;

  getUsers(page: number, size: number, sortBy: string, direction: 'asc' | 'desc'): Observable<PageResponse<UserResponse>> {
    return this.http.get<PageResponse<UserResponse>>(this.apiUrl, {
      params: {
        page,
        size,
        sort: `${sortBy},${direction}`,
      },
    });
  }

  createUser(request: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, request);
  }

  updateUser(id: number, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

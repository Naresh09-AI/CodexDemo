import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);

  const authenticatedRequest =
    token && isApiRequest
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          authService.logout();
          void router.navigate(['/login']);
        }

        if (error.status === 403) {
          void router.navigate(['/dashboard']);
        }
      }

      return throwError(() => error);
    }),
  );
};


import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

describe('Auth and role guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'hasRole']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow authenticated users through the auth guard', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeTrue();
  });

  it('should redirect anonymous users to login', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login');
  });

  it('should allow an authenticated user with the required role', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasRole.and.returnValue(true);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot));

    expect(result).toBeTrue();
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN');
  });

  it('should redirect authenticated users without the required role to dashboard', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.hasRole.and.returnValue(false);

    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot)) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/dashboard');
  });
});


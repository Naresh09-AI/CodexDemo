import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthResponse } from '../../core/models/auth.model';
import { UserResponse } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

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

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should login and redirect admins to the admin dashboard', () => {
    const response: AuthResponse = {
      token: 'jwt-token',
      tokenType: 'Bearer',
      user,
    };
    authService.login.and.returnValue(of(response));
    component.loginForm.setValue({
      email: 'admin@example.com',
      password: 'AdminPass123!',
    });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'AdminPass123!',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    expect(component.loading).toBeFalse();
  });

  it('should show an invalid credentials message on 401', () => {
    authService.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
    component.loginForm.setValue({
      email: 'admin@example.com',
      password: 'bad-password',
    });

    component.submit();

    expect(component.errorMessage).toBe('Invalid email or password.');
    expect(component.loading).toBeFalse();
  });
});

import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserResponse } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const user: UserResponse = {
    id: 3,
    firstName: 'Regular',
    lastName: 'User',
    email: 'regular@example.com',
    phone: '5551112222',
    status: 'ACTIVE',
    role: 'USER',
    createdAt: '2026-05-29T10:00:00',
    updatedAt: '2026-05-29T10:00:00',
  };

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
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
    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate 10-digit phone and strong password', () => {
    component.registerForm.patchValue({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      phone: '5551112222',
      password: 'UserPass123!',
    });

    expect(component.registerForm.valid).toBeTrue();

    component.registerForm.controls.phone.setValue('555');
    component.registerForm.controls.password.setValue('weakpass');

    expect(component.registerForm.valid).toBeFalse();
    expect(component.registerForm.controls.phone.hasError('pattern')).toBeTrue();
    expect(component.registerForm.controls.password.hasError('pattern')).toBeTrue();
  });

  it('should register and redirect to login with a success marker', () => {
    authService.register.and.returnValue(of(user));
    component.registerForm.setValue({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      phone: '5551112222',
      password: 'UserPass123!',
    });

    component.submit();

    expect(authService.register).toHaveBeenCalledWith({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      phone: '5551112222',
      password: 'UserPass123!',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        registered: 'true',
      },
    });
  });

  it('should display backend registration errors', () => {
    authService.register.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: {
          message: 'Email already exists',
        },
      })),
    );
    component.registerForm.setValue({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      phone: '5551112222',
      password: 'UserPass123!',
    });

    component.submit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.loading).toBeFalse();
  });
});


import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-panel">
        <div class="auth-copy">
          <p class="eyebrow">User Management</p>
          <h1>Sign in</h1>
          <p>Access your profile or manage users with an administrator account.</p>
        </div>

        <form class="auth-form" [formGroup]="loginForm" (ngSubmit)="submit()" novalidate>
          <label>
            <span>Email</span>
            <input type="email" formControlName="email" autocomplete="email" [class.invalid]="hasError('email')" />
          </label>
          @if (hasError('email')) {
            <p class="field-error">{{ emailError }}</p>
          }

          <label>
            <span>Password</span>
            <input type="password" formControlName="password" autocomplete="current-password" [class.invalid]="hasError('password')" />
          </label>
          @if (hasError('password')) {
            <p class="field-error">Password is required.</p>
          }

          @if (errorMessage) {
            <p class="form-error" role="alert">{{ errorMessage }}</p>
          }

          @if (successMessage) {
            <p class="form-success" role="status">{{ successMessage }}</p>
          }

          <button type="submit" [disabled]="loginForm.invalid || loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>

          <p class="switch-link">
            Need an account?
            <a routerLink="/register">Create one</a>
          </p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .auth-page {
      display: grid;
      min-height: calc(100vh - 140px);
      place-items: center;
    }

    .auth-panel {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1fr);
      width: min(880px, 100%);
      overflow: hidden;
      border: 1px solid #d8dee8;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 18px 48px rgba(29, 39, 51, 0.08);
    }

    .auth-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
      background: #19324a;
      color: #ffffff;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #9fd0ff;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.05;
    }

    .auth-copy p:last-child {
      max-width: 28rem;
      margin: 16px 0 0;
      color: #d7e8f8;
      line-height: 1.6;
    }

    .auth-form {
      display: grid;
      gap: 14px;
      padding: 40px;
    }

    label {
      display: grid;
      gap: 8px;
      color: #314154;
      font-weight: 700;
    }

    input {
      width: 100%;
      border: 1px solid #bac5d4;
      border-radius: 6px;
      padding: 12px 14px;
      color: #17202a;
      background: #ffffff;
    }

    input:focus {
      border-color: #1b72b8;
      outline: 3px solid rgba(27, 114, 184, 0.18);
    }

    input.invalid {
      border-color: #b42318;
    }

    button {
      min-height: 44px;
      border: 0;
      border-radius: 6px;
      padding: 12px 16px;
      color: #ffffff;
      background: #1b72b8;
      cursor: pointer;
      font-weight: 700;
    }

    button:disabled {
      background: #9aa8b7;
      cursor: not-allowed;
    }

    .field-error,
    .form-error,
    .form-success,
    .switch-link {
      margin: 0;
      line-height: 1.45;
    }

    .field-error {
      color: #b42318;
      font-size: 0.9rem;
    }

    .form-error,
    .form-success {
      border-radius: 6px;
      padding: 10px 12px;
    }

    .form-error {
      border: 1px solid #f5c2c7;
      color: #842029;
      background: #f8d7da;
    }

    .form-success {
      border: 1px solid #badbcc;
      color: #0f5132;
      background: #d1e7dd;
    }

    .switch-link {
      color: #536579;
      text-align: center;
    }

    .switch-link a {
      color: #1b72b8;
      font-weight: 700;
    }

    @media (max-width: 760px) {
      .auth-page {
        place-items: stretch;
      }

      .auth-panel {
        grid-template-columns: 1fr;
      }

      .auth-copy,
      .auth-form {
        padding: 28px;
      }
    }
  `],
})
export class LoginPage {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  errorMessage = '';
  successMessage =
    this.activatedRoute.snapshot.queryParamMap.get('registered') === 'true'
      ? 'Account created. Sign in to continue.'
      : '';

  get emailError(): string {
    const email = this.loginForm.controls.email;

    if (email.hasError('required')) {
      return 'Email is required.';
    }

    return 'Enter a valid email address.';
  }

  hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: ({ user }) => {
        const targetRoute = user.role === 'ADMIN' ? '/admin' : '/dashboard';
        void this.router.navigate([targetRoute]);
      },
      error: (error: unknown) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Invalid email or password.';
    }

    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return 'Unable to sign in. Please try again.';
  }
}


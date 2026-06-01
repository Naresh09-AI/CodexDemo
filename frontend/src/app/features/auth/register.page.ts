import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="auth-panel">
        <div class="auth-copy">
          <p class="eyebrow">New account</p>
          <h1>Create your profile</h1>
          <p>Register as a standard user. Administrator access is assigned only by seeded backend accounts.</p>
        </div>

        <form class="auth-form" [formGroup]="registerForm" (ngSubmit)="submit()" novalidate>
          <div class="name-grid">
            <div>
              <label>
                <span>First name</span>
                <input
                  type="text"
                  formControlName="firstName"
                  autocomplete="given-name"
                  [class.invalid]="hasError('firstName')"
                />
              </label>
              @if (hasError('firstName')) {
                <p class="field-error">First name is required and must be 2-50 characters.</p>
              }
            </div>

            <div>
              <label>
                <span>Last name</span>
                <input
                  type="text"
                  formControlName="lastName"
                  autocomplete="family-name"
                  [class.invalid]="hasError('lastName')"
                />
              </label>
              @if (hasError('lastName')) {
                <p class="field-error">Last name is required and must be 2-50 characters.</p>
              }
            </div>
          </div>

          <label>
            <span>Email</span>
            <input
              type="email"
              formControlName="email"
              autocomplete="email"
              [class.invalid]="hasError('email')"
            />
          </label>
          @if (hasError('email')) {
            <p class="field-error">{{ emailError }}</p>
          }

          <label>
            <span>Phone</span>
            <input
              type="tel"
              formControlName="phone"
              autocomplete="tel"
              inputmode="numeric"
              maxlength="10"
              [class.invalid]="hasError('phone')"
            />
          </label>
          @if (hasError('phone')) {
            <p class="field-error">Phone must contain exactly 10 digits.</p>
          }

          <label>
            <span>Password</span>
            <input
              type="password"
              formControlName="password"
              autocomplete="new-password"
              [class.invalid]="hasError('password')"
            />
          </label>
          @if (hasError('password')) {
            <p class="field-error">
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </p>
          }

          @if (errorMessage) {
            <p class="form-error" role="alert">{{ errorMessage }}</p>
          }

          <button type="submit" [disabled]="registerForm.invalid || loading">
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>

          <p class="switch-link">
            Already registered?
            <a routerLink="/login">Sign in</a>
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
      grid-template-columns: minmax(0, 0.85fr) minmax(340px, 1.1fr);
      width: min(960px, 100%);
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
      background: #1f4f46;
      color: #ffffff;
    }

    .eyebrow {
      margin: 0 0 12px;
      color: #aee8d7;
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
      max-width: 29rem;
      margin: 16px 0 0;
      color: #d9f1ea;
      line-height: 1.6;
    }

    .auth-form {
      display: grid;
      gap: 14px;
      padding: 40px;
    }

    .name-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
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
      border-color: #217a63;
      outline: 3px solid rgba(33, 122, 99, 0.18);
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
      background: #217a63;
      cursor: pointer;
      font-weight: 700;
    }

    button:disabled {
      background: #9aa8b7;
      cursor: not-allowed;
    }

    .field-error,
    .form-error,
    .switch-link {
      margin: 0;
      line-height: 1.45;
    }

    .field-error {
      color: #b42318;
      font-size: 0.9rem;
    }

    .form-error {
      border: 1px solid #f5c2c7;
      border-radius: 6px;
      padding: 10px 12px;
      color: #842029;
      background: #f8d7da;
    }

    .switch-link {
      color: #536579;
      text-align: center;
    }

    .switch-link a {
      color: #217a63;
      font-weight: 700;
    }

    @media (max-width: 800px) {
      .auth-page {
        place-items: stretch;
      }

      .auth-panel,
      .name-grid {
        grid-template-columns: 1fr;
      }

      .auth-copy,
      .auth-form {
        padding: 28px;
      }
    }
  `],
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly registerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
      ],
    ],
  });

  loading = false;
  errorMessage = '';

  get emailError(): string {
    const email = this.registerForm.controls.email;

    if (email.hasError('required')) {
      return 'Email is required.';
    }

    return 'Enter a valid email address.';
  }

  hasError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          queryParams: {
            registered: 'true',
          },
        });
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
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return 'Unable to create your account. Please try again.';
  }
}

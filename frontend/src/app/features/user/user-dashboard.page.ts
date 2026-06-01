import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { UserResponse, UserUpdateRequest } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UserApiService } from '../../core/services/user-api.service';

@Component({
  selector: 'app-user-dashboard-page',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section class="dashboard">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">User dashboard</p>
          <h1>My profile</h1>
        </div>
        <button class="secondary-button" type="button" (click)="logout()">Logout</button>
      </header>

      @if (loadingProfile) {
        <div class="state-panel" role="status">Loading your profile...</div>
      } @else if (loadError) {
        <div class="state-panel error" role="alert">
          <p>{{ loadError }}</p>
          <button type="button" (click)="loadProfile()">Retry</button>
        </div>
      } @else if (currentUser) {
        <div class="profile-layout">
          <aside class="summary-panel" aria-label="Profile summary">
            <div class="avatar">{{ initials }}</div>
            <h2>{{ currentUser.firstName }} {{ currentUser.lastName }}</h2>
            <dl>
              <div><dt>Role</dt><dd>{{ currentUser.role }}</dd></div>
              <div><dt>Status</dt><dd>{{ currentUser.status }}</dd></div>
              <div><dt>Created</dt><dd>{{ currentUser.createdAt | date: 'medium' }}</dd></div>
              <div><dt>Updated</dt><dd>{{ currentUser.updatedAt | date: 'medium' }}</dd></div>
            </dl>
          </aside>

          <form class="profile-form" [formGroup]="profileForm" (ngSubmit)="save()" novalidate>
            <h2>Edit profile</h2>

            <div class="field-grid">
              <div>
                <label>
                  <span>First name</span>
                  <input type="text" formControlName="firstName" autocomplete="given-name" [class.invalid]="hasError('firstName')" />
                </label>
                @if (hasError('firstName')) {
                  <p class="field-error">First name is required and must be 2-100 characters.</p>
                }
              </div>

              <div>
                <label>
                  <span>Last name</span>
                  <input type="text" formControlName="lastName" autocomplete="family-name" [class.invalid]="hasError('lastName')" />
                </label>
                @if (hasError('lastName')) {
                  <p class="field-error">Last name is required and must be 2-100 characters.</p>
                }
              </div>
            </div>

            <label>
              <span>Email</span>
              <input type="email" formControlName="email" autocomplete="email" [class.invalid]="hasError('email')" />
            </label>
            @if (hasError('email')) {
              <p class="field-error">{{ emailError }}</p>
            }

            <label>
              <span>Phone</span>
              <input type="tel" formControlName="phone" autocomplete="tel" inputmode="numeric" maxlength="10" [class.invalid]="hasError('phone')" />
            </label>
            @if (hasError('phone')) {
              <p class="field-error">Phone must contain exactly 10 digits.</p>
            }

            @if (saveError) {
              <p class="form-error" role="alert">{{ saveError }}</p>
            }

            @if (saveSuccess) {
              <p class="form-success" role="status">{{ saveSuccess }}</p>
            }

            <div class="actions">
              <button class="secondary-button" type="button" (click)="resetForm()" [disabled]="saving">Reset</button>
              <button type="submit" [disabled]="profileForm.invalid || saving">
                {{ saving ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>
      }
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 24px;
    }

    .dashboard-header,
    .actions,
    .state-panel {
      display: flex;
      gap: 16px;
    }

    .dashboard-header {
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #d8dee8;
      padding-bottom: 18px;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: #1b72b8;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1,
    h2 {
      margin: 0;
      color: #17202a;
      line-height: 1.15;
    }

    h1 {
      font-size: clamp(2rem, 5vw, 3rem);
    }

    h2 {
      font-size: 1.25rem;
    }

    .profile-layout {
      display: grid;
      grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.25fr);
      gap: 24px;
      align-items: start;
    }

    .summary-panel,
    .profile-form,
    .state-panel {
      border: 1px solid #d8dee8;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 12px 32px rgba(29, 39, 51, 0.06);
    }

    .summary-panel,
    .profile-form {
      display: grid;
      gap: 18px;
      padding: 24px;
    }

    .avatar {
      display: grid;
      width: 72px;
      height: 72px;
      place-items: center;
      border-radius: 50%;
      color: #ffffff;
      background: #19324a;
      font-size: 1.4rem;
      font-weight: 800;
    }

    dl {
      display: grid;
      gap: 12px;
      margin: 0;
    }

    dl div {
      display: grid;
      gap: 4px;
      border-top: 1px solid #edf1f6;
      padding-top: 12px;
    }

    dt {
      color: #607083;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      color: #17202a;
      overflow-wrap: anywhere;
    }

    .field-grid {
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
      border-color: #1b72b8;
      outline: 3px solid rgba(27, 114, 184, 0.18);
    }

    input.invalid {
      border-color: #b42318;
    }

    button {
      min-height: 42px;
      border: 0;
      border-radius: 6px;
      padding: 10px 16px;
      color: #ffffff;
      background: #1b72b8;
      cursor: pointer;
      font-weight: 700;
    }

    button:disabled {
      background: #9aa8b7;
      cursor: not-allowed;
    }

    .secondary-button {
      border: 1px solid #bac5d4;
      color: #314154;
      background: #ffffff;
    }

    .field-error,
    .form-error,
    .form-success,
    .state-panel p {
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

    .actions {
      justify-content: flex-end;
    }

    .state-panel {
      align-items: center;
      justify-content: space-between;
      padding: 24px;
    }

    .state-panel.error {
      border-color: #f5c2c7;
      color: #842029;
      background: #fff7f7;
    }

    @media (max-width: 800px) {
      .dashboard-header,
      .actions,
      .state-panel {
        align-items: stretch;
        flex-direction: column;
      }

      .profile-layout,
      .field-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class UserDashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userApiService = inject(UserApiService);

  readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  currentUser: UserResponse | null = null;
  loadingProfile = true;
  saving = false;
  loadError = '';
  saveError = '';
  saveSuccess = '';

  get initials(): string {
    if (!this.currentUser) {
      return '';
    }

    return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`.toUpperCase();
  }

  get emailError(): string {
    const email = this.profileForm.controls.email;

    if (email.hasError('required')) {
      return 'Email is required.';
    }

    if (email.hasError('maxlength')) {
      return 'Email must not exceed 150 characters.';
    }

    return 'Enter a valid email address.';
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loadingProfile = true;
    this.loadError = '';

    this.authService.loadCurrentUser().pipe(
      finalize(() => {
        this.loadingProfile = false;
      }),
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.patchForm(user);
      },
      error: () => {
        this.loadError = 'Unable to load your profile.';
      },
    });
  }

  hasError(controlName: keyof typeof this.profileForm.controls): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  resetForm(): void {
    if (this.currentUser) {
      this.patchForm(this.currentUser);
      this.saveError = '';
      this.saveSuccess = '';
    }
  }

  save(): void {
    this.saveError = '';
    this.saveSuccess = '';

    if (!this.currentUser) {
      this.saveError = 'Profile is not loaded yet.';
      return;
    }

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.userApiService.updateUser(this.currentUser.id, this.toUpdateRequest(this.currentUser)).pipe(
      finalize(() => {
        this.saving = false;
      }),
    ).subscribe({
      next: (updatedUser) => {
        this.currentUser = updatedUser;
        this.authService.syncCurrentUser(updatedUser);
        this.patchForm(updatedUser);
        this.saveSuccess = 'Profile updated successfully.';
      },
      error: (error: unknown) => {
        this.saveError = this.resolveErrorMessage(error);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private patchForm(user: UserResponse): void {
    this.profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });
  }

  private toUpdateRequest(user: UserResponse): UserUpdateRequest {
    return {
      ...this.profileForm.getRawValue(),
      status: user.status,
      role: user.role,
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'You are not allowed to update this profile.';
    }

    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return 'Unable to save your profile. Please try again.';
  }
}

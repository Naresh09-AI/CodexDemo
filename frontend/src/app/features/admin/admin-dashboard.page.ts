import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  PageResponse,
  UserCreateRequest,
  UserResponse,
  UserRole,
  UserStatus,
  UserUpdateRequest,
} from '../../core/models/user.model';
import { UserApiService } from '../../core/services/user-api.service';

type FormMode = 'create' | 'edit';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section class="admin-dashboard">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admin dashboard</p>
          <h1>User management</h1>
        </div>
        <button type="button" (click)="startCreate()">New user</button>
      </header>

      @if (pageError) {
        <p class="form-error" role="alert">{{ pageError }}</p>
      }

      <div class="admin-layout">
        <section class="list-panel" aria-label="Users">
          <div class="toolbar">
            <label>
              <span>Sort by</span>
              <select [value]="sortBy" (change)="changeSortBy($event)">
                <option value="id">ID</option>
                <option value="firstName">First name</option>
                <option value="lastName">Last name</option>
                <option value="email">Email</option>
                <option value="status">Status</option>
                <option value="role">Role</option>
              </select>
            </label>

            <label>
              <span>Direction</span>
              <select [value]="sortDirection" (change)="changeSortDirection($event)">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>

            <label>
              <span>Page size</span>
              <select [value]="pageSize" (change)="changePageSize($event)">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </label>
          </div>

          @if (loadingUsers) {
            <div class="state-panel" role="status">Loading users...</div>
          } @else if (users.length === 0) {
            <div class="state-panel">No users found.</div>
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users; track user.id) {
                    <tr [class.selected]="selectedUser?.id === user.id">
                      <td>{{ user.id }}</td>
                      <td>{{ user.firstName }} {{ user.lastName }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.phone }}</td>
                      <td>{{ user.status }}</td>
                      <td>{{ user.role }}</td>
                      <td>{{ user.updatedAt | date: 'short' }}</td>
                      <td>
                        <div class="row-actions">
                          <button class="small secondary-button" type="button" (click)="startEdit(user)">Edit</button>
                          <button class="small danger-button" type="button" (click)="deleteUser(user)">Delete</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <footer class="pagination">
            <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
            <div>
              <button class="secondary-button" type="button" (click)="previousPage()" [disabled]="currentPage === 0 || loadingUsers">
                Previous
              </button>
              <button class="secondary-button" type="button" (click)="nextPage()" [disabled]="currentPage >= totalPages - 1 || loadingUsers">
                Next
              </button>
            </div>
          </footer>
        </section>

        <form class="editor-panel" [formGroup]="userForm" (ngSubmit)="saveUser()" novalidate>
          <div>
            <p class="eyebrow">{{ formMode === 'create' ? 'Create' : 'Edit' }}</p>
            <h2>{{ formMode === 'create' ? 'New user' : 'Update user' }}</h2>
          </div>

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

          @if (formMode === 'create') {
            <label>
              <span>Password</span>
              <input type="password" formControlName="password" autocomplete="new-password" [class.invalid]="hasError('password')" />
            </label>
            @if (hasError('password')) {
              <p class="field-error">Password must be 8-100 characters.</p>
            }
          }

          <label>
            <span>Phone</span>
            <input type="tel" formControlName="phone" autocomplete="tel" inputmode="numeric" maxlength="10" [class.invalid]="hasError('phone')" />
          </label>
          @if (hasError('phone')) {
            <p class="field-error">Phone must contain exactly 10 digits.</p>
          }

          <div class="field-grid">
            <label>
              <span>Status</span>
              <select formControlName="status">
                @for (status of statuses; track status) {
                  <option [value]="status">{{ status }}</option>
                }
              </select>
            </label>

            <label>
              <span>Role</span>
              <select formControlName="role">
                @for (role of roles; track role) {
                  <option [value]="role">{{ role }}</option>
                }
              </select>
            </label>
          </div>

          @if (formError) {
            <p class="form-error" role="alert">{{ formError }}</p>
          }

          @if (formSuccess) {
            <p class="form-success" role="status">{{ formSuccess }}</p>
          }

          <div class="actions">
            <button class="secondary-button" type="button" (click)="startCreate()" [disabled]="savingUser">Clear</button>
            <button type="submit" [disabled]="userForm.invalid || savingUser">
              {{ savingUser ? 'Saving...' : formMode === 'create' ? 'Create user' : 'Save user' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .admin-dashboard {
      display: grid;
      gap: 24px;
    }

    .page-header,
    .toolbar,
    .pagination,
    .actions,
    .row-actions {
      display: flex;
      gap: 12px;
    }

    .page-header,
    .pagination {
      align-items: center;
      justify-content: space-between;
    }

    .page-header {
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

    .admin-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
      gap: 24px;
      align-items: start;
    }

    .list-panel,
    .editor-panel,
    .state-panel {
      border: 1px solid #d8dee8;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 12px 32px rgba(29, 39, 51, 0.06);
    }

    .list-panel,
    .editor-panel {
      display: grid;
      gap: 18px;
      padding: 20px;
    }

    .toolbar {
      align-items: end;
      flex-wrap: wrap;
    }

    label {
      display: grid;
      gap: 8px;
      color: #314154;
      font-weight: 700;
    }

    input,
    select {
      width: 100%;
      border: 1px solid #bac5d4;
      border-radius: 6px;
      padding: 10px 12px;
      color: #17202a;
      background: #ffffff;
    }

    input:focus,
    select:focus {
      border-color: #1b72b8;
      outline: 3px solid rgba(27, 114, 184, 0.18);
    }

    input.invalid {
      border-color: #b42318;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 920px;
    }

    th,
    td {
      border-bottom: 1px solid #edf1f6;
      padding: 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      color: #607083;
      font-size: 0.78rem;
      text-transform: uppercase;
    }

    td {
      color: #17202a;
      overflow-wrap: anywhere;
    }

    tr.selected {
      background: #eef6ff;
    }

    button {
      min-height: 40px;
      border: 0;
      border-radius: 6px;
      padding: 9px 14px;
      color: #ffffff;
      background: #1b72b8;
      cursor: pointer;
      font-weight: 700;
      white-space: nowrap;
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

    .danger-button {
      background: #b42318;
    }

    .small {
      min-height: 34px;
      padding: 7px 10px;
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .field-error,
    .form-error,
    .form-success {
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

    .state-panel {
      padding: 24px;
    }

    .actions {
      justify-content: flex-end;
    }

    @media (max-width: 1040px) {
      .admin-layout,
      .field-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .page-header,
      .pagination,
      .actions {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `],
})
export class AdminDashboardPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userApiService = inject(UserApiService);

  readonly statuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  readonly roles: UserRole[] = ['USER', 'ADMIN'];
  readonly userForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    status: ['ACTIVE' as UserStatus, [Validators.required]],
    role: ['USER' as UserRole, [Validators.required]],
  });

  users: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  formMode: FormMode = 'create';
  currentPage = 0;
  pageSize = 10;
  totalPages = 1;
  sortBy = 'id';
  sortDirection: SortDirection = 'asc';
  loadingUsers = false;
  savingUser = false;
  pageError = '';
  formError = '';
  formSuccess = '';

  get emailError(): string {
    const email = this.userForm.controls.email;

    if (email.hasError('required')) {
      return 'Email is required.';
    }

    if (email.hasError('maxlength')) {
      return 'Email must not exceed 150 characters.';
    }

    return 'Enter a valid email address.';
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.pageError = '';

    this.userApiService.getUsers(this.currentPage, this.pageSize, this.sortBy, this.sortDirection).pipe(
      finalize(() => {
        this.loadingUsers = false;
      }),
    ).subscribe({
      next: (page) => {
        this.applyPage(page);
      },
      error: (error: unknown) => {
        this.pageError = this.resolveErrorMessage(error, 'Unable to load users.');
      },
    });
  }

  startCreate(): void {
    this.formMode = 'create';
    this.selectedUser = null;
    this.formError = '';
    this.formSuccess = '';
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      status: 'ACTIVE',
      role: 'USER',
    });
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(100)]);
    this.userForm.controls.password.updateValueAndValidity();
  }

  startEdit(user: UserResponse): void {
    this.formMode = 'edit';
    this.selectedUser = user;
    this.formError = '';
    this.formSuccess = '';
    this.userForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      phone: user.phone,
      status: user.status,
      role: user.role,
    });
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
  }

  saveUser(): void {
    this.formError = '';
    this.formSuccess = '';

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.savingUser = true;
    const request$ = this.formMode === 'create'
      ? this.userApiService.createUser(this.toCreateRequest())
      : this.userApiService.updateUser(this.selectedUser?.id ?? 0, this.toUpdateRequest());

    request$.pipe(
      finalize(() => {
        this.savingUser = false;
      }),
    ).subscribe({
      next: (user) => {
        this.formSuccess = this.formMode === 'create' ? 'User created successfully.' : 'User updated successfully.';
        this.startEdit(user);
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.formError = this.resolveErrorMessage(error, 'Unable to save user.');
      },
    });
  }

  deleteUser(user: UserResponse): void {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    this.pageError = '';
    this.userApiService.deleteUser(user.id).subscribe({
      next: () => {
        if (this.selectedUser?.id === user.id) {
          this.startCreate();
        }
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.pageError = this.resolveErrorMessage(error, 'Unable to delete user.');
      },
    });
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage -= 1;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage += 1;
      this.loadUsers();
    }
  }

  changeSortBy(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value;
    this.currentPage = 0;
    this.loadUsers();
  }

  changeSortDirection(event: Event): void {
    this.sortDirection = (event.target as HTMLSelectElement).value as SortDirection;
    this.currentPage = 0;
    this.loadUsers();
  }

  changePageSize(event: Event): void {
    this.pageSize = Number((event.target as HTMLSelectElement).value);
    this.currentPage = 0;
    this.loadUsers();
  }

  hasError(controlName: keyof typeof this.userForm.controls): boolean {
    const control = this.userForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private applyPage(page: PageResponse<UserResponse>): void {
    this.users = page.content;
    this.currentPage = page.number;
    this.pageSize = page.size;
    this.totalPages = Math.max(page.totalPages, 1);
  }

  private toCreateRequest(): UserCreateRequest {
    return this.userForm.getRawValue();
  }

  private toUpdateRequest(): UserUpdateRequest {
    const { password, ...request } = this.userForm.getRawValue();
    return request;
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return 'Administrator access is required.';
    }

    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return fallback;
  }
}

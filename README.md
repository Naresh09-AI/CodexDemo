# User Management System

A production-style full-stack User Management System built with Spring Boot and Angular.

The application provides secure user registration, JWT login, role-based authorization, user profile management, and an ADMIN-only user management dashboard with pagination, sorting, create, edit, and delete workflows.

## Tech Stack

### Backend

- Java 21
- Spring Boot 3.3+
- Maven
- Spring Web
- Spring Data JPA
- Spring Security
- JWT authentication
- Bean Validation
- Lombok
- H2 in-memory database
- JUnit 5
- Mockito
- MockMvc
- Maven Surefire

### Frontend

- Angular 21
- TypeScript
- Angular Router
- Reactive Forms
- HttpClient interceptors
- Route guards
- Karma
- Jasmine
- Plain CSS with standalone Angular components

## Features

### Authentication and Authorization

- Public user registration
- Login with JWT token response
- Current user endpoint
- BCrypt password hashing
- Role-based access with `USER` and `ADMIN`
- Public registration always creates `USER` accounts
- ADMIN user is seeded on startup
- JWT interceptor on the Angular frontend
- Auth guard and role guard

### User Management

- Create user
- Get user by ID
- Get all users
- Update user
- Delete user
- Pagination
- Sorting
- Validation handling
- Global exception handling
- DTO mapping
- Passwords are never returned in API responses

### Frontend Screens

- Login page
- Registration page
- User dashboard
- Admin dashboard
- Loading, success, and error states
- Logout
- Client-side validation

## Project Structure

```text
.
├── src/
│   ├── main/
│   │   ├── java/com/example/usermanagement/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── mapper/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   └── service/
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/com/example/usermanagement/
├── frontend/
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── user/
│   │   └── shared/
│   ├── angular.json
│   └── package.json
├── postman/
│   └── User Management System.postman_collection.json
├── pom.xml
├── .gitignore
└── README.md
```

## Backend Configuration

The backend runs on:

```text
http://localhost:8080
```

H2 console:

```text
http://localhost:8080/h2-console
```

H2 JDBC URL:

```text
jdbc:h2:mem:user_management_db
```

Default seeded admin:

```text
Email: admin@example.com
Password: AdminPass123!
```

The admin seed is idempotent, so restarting the backend will not create duplicate admin users.

## Prerequisites

- JDK 21
- Maven
- Node.js compatible with Angular 21
- npm
- Angular CLI 21+
- Git
- Postman, optional

Check versions:

```powershell
java -version
mvn -version
node -v
npm -v
ng version
```

## Run The Backend

From the repository root:

```powershell
cd E:\Learning\codexExp
mvn spring-boot:run
```

Expected startup:

```text
Started UserManagementSystemApplication
```

## Run The Frontend

From the frontend folder:

```powershell
cd E:\Learning\codexExp\frontend
npm install
npm.cmd run start
```

Open:

```text
http://localhost:4200
```

## API Endpoints

### Auth APIs

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a USER account |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Authenticated | Get current logged-in user |

### User APIs

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/users` | ADMIN | Create user |
| GET | `/api/v1/users` | ADMIN | Get paginated users |
| GET | `/api/v1/users/{id}` | ADMIN or same user | Get user by ID |
| PUT | `/api/v1/users/{id}` | ADMIN or same user | Update user |
| DELETE | `/api/v1/users/{id}` | ADMIN | Delete user |

## Example API Usage

### Login

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/api/auth/login `
  -ContentType application/json `
  -Body '{"email":"admin@example.com","password":"AdminPass123!"}'

$token = $login.token
```

### Get Current User

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri http://localhost:8080/api/auth/me `
  -Headers @{ Authorization = "Bearer $token" }
```

### Create User

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8080/api/v1/users `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType application/json `
  -Body '{
    "firstName":"Ava",
    "lastName":"Patel",
    "email":"ava.patel@example.com",
    "password":"SecurePass123!",
    "phone":"5551234567",
    "status":"ACTIVE",
    "role":"USER"
  }'
```

### Get Users With Pagination And Sorting

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:8080/api/v1/users?page=0&size=5&sort=email,asc" `
  -Headers @{ Authorization = "Bearer $token" }
```

## Postman Collection

Import this collection into Postman:

```text
postman/User Management System.postman_collection.json
```

Recommended order:

1. Run `Auth > Admin Login`.
2. Confirm `jwtToken` is saved in collection variables.
3. Run requests under `Admin User Management`.

The login request automatically stores:

```text
jwtToken
currentUserId
```

The create-user request automatically stores:

```text
userId
```

## Run Tests

### Backend Tests

From the repository root:

```powershell
mvn test
```

Expected result:

```text
Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### Frontend Tests

From the frontend folder:

```powershell
cd frontend
npm.cmd test -- --watch=false
```

Expected result:

```text
TOTAL: 18 SUCCESS
```

### Frontend Production Build

```powershell
cd frontend
npm.cmd run build -- --progress=false
```

Expected result:

```text
Application bundle generation complete.
```

## Frontend Routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/dashboard` | Authenticated | User profile dashboard |
| `/admin` | ADMIN | Admin user management dashboard |

## Validation Rules

### User

- `firstName`: required, max 100 characters
- `lastName`: required, max 100 characters
- `email`: required, valid email, max 150 characters
- `phone`: required, exactly 10 digits
- `password`: required for create/register, minimum 8 characters
- `status`: `ACTIVE`, `INACTIVE`, or `SUSPENDED`
- `role`: `USER` or `ADMIN`

## Security Notes

- Passwords are stored using BCrypt.
- Passwords are never returned in API responses.
- JWT is required for protected endpoints.
- Public registration cannot create ADMIN accounts.
- ADMIN accounts are seeded from backend configuration.
- Angular stores the JWT in local storage for development simplicity.

For production, consider:

- Use HTTPS only.
- Move JWT secret to a secure external secret manager.
- Use persistent database such as PostgreSQL.
- Consider HttpOnly secure cookies instead of local storage.
- Disable H2 console.
- Set stricter CORS origins.
- Add refresh tokens or short-lived access token rotation.

## Troubleshooting

### 401 Authentication Is Required

Run login first and pass the JWT:

```text
Authorization: Bearer <token>
```

In Postman, run:

```text
Auth > Admin Login
```

Then check that `jwtToken` has a value in collection variables.

### 403 Forbidden

The authenticated user does not have the required role. Use the seeded admin account for ADMIN endpoints.

### Phone Validation Fails

Use exactly 10 digits:

```text
5551234567
```

Do not include spaces, dashes, or country code.

### Angular ChromeHeadless Test Error

This project includes `frontend/karma.conf.js` with a no-sandbox headless Chrome launcher for Windows compatibility.

Run:

```powershell
cd frontend
npm.cmd test -- --watch=false
```

### Angular Build Exits Silently

Clear generated Angular cache:

```powershell
Remove-Item frontend\.angular\cache -Recurse -Force
Remove-Item frontend\dist -Recurse -Force
```

Then rebuild:

```powershell
cd frontend
npm.cmd run build -- --progress=false
```

### Git Shows node_modules Or target

Remove already staged generated files:

```powershell
git rm -r --cached frontend/node_modules
git rm -r --cached frontend/dist
git rm -r --cached frontend/.angular
git rm -r --cached target
git add .
git status
```

## Git Ignore

The repository includes:

- Root `.gitignore` for Maven, Java, logs, local env, and editor files
- `frontend/.gitignore` for Angular dependencies, build output, cache, and coverage

Generated folders should not be committed:

```text
target/
frontend/node_modules/
frontend/dist/
frontend/.angular/
```

## Current Verification Status

The project was verified with:

```powershell
mvn test
npm.cmd test -- --watch=false
npm.cmd run build -- --progress=false
```

Verified results:

```text
Backend: 38 tests passing
Frontend: 18 tests passing
Angular production build: success
```

## License

This project is currently provided without a license. Add a license file before using it for public or commercial distribution.


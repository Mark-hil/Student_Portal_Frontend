# UniPortal — Frontend Web Application

The frontend client for the UniPortal University Management & Student Information System, built with **React 18**, **TypeScript**, and **Vite**.

---

## 🌟 Key Features

- **Multi-Role Tailored Experiences** — Dedicated views and navigation for all institutional roles:
  - **Super Admin Console**: Comprehensive user directory, role assignment modal, user search & filtering, immutable security audit logs.
  - **Academic Officer Hub**: Academic calendar management, registration windows, grade batch verification and publishing, transcript generation.
  - **Head of Department Dashboard**: Departmental course tracking, lecturer grade batch approvals, roster analytics.
  - **Finance / Bursar Desk**: Student tuition and fee invoices, payment processing, fee structure administration, printable receipts.
  - **Lecturer Workspace**: Class rosters, assignment creator, in-browser CSV and Excel (.xlsx) parsing for batch score uploads.
  - **Student Portal**: Step-by-step registration onboarding, interactive schedule, prerequisite checks, real-time GPA and grade breakdowns, tuition balance ledger.
- **Enterprise State & Data Layer**:
  - **Zustand Store**: Type-safe, persisted authentication, user profile, and active role context.
  - **TanStack React Query**: Efficient caching, optimistic updates, and background refetching.
  - **Axios HTTP Client**: Seamless JWT access token rotation with automatic token refresh on `401 Unauthorized`.
- **Responsive & Modern Design**:
  - Custom institutional theme with glassmorphism, responsive navigation drawers, dynamic status pills, and accessible form controls.
  - Client-side CSV/Excel parsing powered by PapaParse and SheetJS (`xlsx`).

---

## 🏗️ Project Architecture

```text
frontend/
├── src/
│   ├── api/                 # Axios HTTP client, token refresh interceptors, typed services
│   ├── components/          # Reusable UI widgets, inputs, buttons, tables, badges
│   ├── features/            # Role-specific modules & views:
│   │   ├── admin/           # User management, Edit/Create modals, Audit log viewer
│   │   ├── lecturer/        # Assignment creator, Grade uploads, Submissions reviewer
│   │   ├── student/         # Course registration, GPA calculator, Fees & payments
│   │   └── shared/          # Profile view, Password reset OTP modal, GradeBatch tables
│   ├── hooks/               # Custom React Query hooks (useAuth, useCourses, useGrades)
│   ├── store/               # Zustand persisted state (auth, tokens, user profile)
│   ├── types/               # Domain TypeScript interfaces (User, Course, Grade, Invoice)
│   ├── App.tsx              # Root component & role-based routing
│   └── main.tsx             # Application bootstrap
├── Dockerfile               # Multi-stage production Nginx container
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file:
   ```bash
   echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 📦 Production Build & Type Checking

To verify TypeScript types and build the production bundle:

```bash
# Type check without emitting files
npm run type-check

# Compile production bundle to dist/
npm run build
```

---

## 🐳 Docker Deployment

The frontend includes a lightweight production `Dockerfile` that serves the built SPA using Nginx with automatic client-side routing fallback:

```bash
# Build the Docker image
docker build -t student-portal-frontend .

# Run the container on port 3000
docker run -d -p 3000:80 student-portal-frontend
```

When deployed via the root `docker-compose.yml`, the frontend container is automatically networked behind the main reverse proxy alongside the backend API.

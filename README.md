# UniPortal — Student Portal (Frontend)

The frontend application for the UniPortal student portal, built with **React 18 + TypeScript** and **Vite**.

## Features
- **Course Registration** — single and bulk enroll, prerequisite checks, credit-limit guard, waitlist
- **Lecturer Grading Workflow** — create assignments, batch grade uploads via CSV/XLSX with browser-based parsing
- **Officer Publishing Workflow** — review, approve, and publish grade batches to students
- **Grades & Transcript** — per-assignment grades, official transcript grouped by semester
- **Notifications** — real-time WebSockets, in-app bell
- **JWT auth** — seamless token refresh

## Project structure
```
src/
├── api/            # Axios client (JWT auto-refresh) + typed services
├── features/       # App features
│   ├── admin/      # Admin dashboard, Course & User management
│   ├── lecturer/   # Lecturer dashboard, Assignments, Grade uploads
│   ├── student/    # Student dashboard, Registration, Transcripts
│   └── shared/     # Shared components (e.g., GradeBatchList)
├── hooks/          # React Query hooks (useAuth, useCourses, useGrades)
├── store/          # Zustand auth store (persisted)
└── types/          # TypeScript interfaces
```

## Quick start

```bash
npm install
# Set your API URL in the .env.local file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
```

## Deployment
This repository only contains the frontend code. Build the project using `npm run build` and deploy the `dist/` directory to a static host (like Vercel, Netlify, or Nginx).

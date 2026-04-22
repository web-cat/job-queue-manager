# Job Queue Manager  
## Frontend Deployment + Full Stack Live Update  

**Last updated:** April 14, 2026  

---

## What Was Completed

- ✅ Nuxt 4 frontend built with full auth flow, dashboard, assignments, submissions, courses  
- ✅ Frontend Docker image built and pushed to VT container registry via CI/CD  
- ✅ Frontend deployed to Discovery cluster as a Kubernetes pod  
- ✅ Ingress updated — `/` routes to frontend, `/api` routes to backend  
- ✅ CAS authentication testable end-to-end on cluster  
- ✅ Session persistence fixed via pinia-plugin-persistedstate  
- ✅ Local login working with correct password hashing  

---

## Frontend — Nuxt 4 Application

A full Nuxt 4 frontend has been built and deployed. Students and instructors can now access the system through a browser without needing direct API access.

---

## Pages Built

| Route | Status | Notes |
|------|--------|------|
| `/` | ✅ Done | Redirects to `/dashboard` or `/login` |
| `/login` | ✅ Done | CAS login + local auth |
| `/auth/callback` | ✅ Done | Stores token, redirects |
| `/lti/launch` | ✅ Done | Handles LTI token |
| `/dashboard` | ✅ Done | Stats + submissions |
| `/assignments` | ✅ Done | Assignment list |
| `/assignments/:id` | ✅ Done | Detail + submission |
| `/submissions` | ✅ Done | Submission history |
| `/submissions/:id` | ✅ Done | Submission detail |
| `/courses` | ✅ Done | Course list |
| `/courses/:id` | ✅ Done | Course detail |

---

## Tech Stack

| Item | Value |
|------|------|
| Framework | Nuxt 4.4.2 |
| UI | Nuxt UI 4.6.1 |
| CSS | Tailwind v4 |
| State | Pinia |
| Persistence | pinia-plugin-persistedstate |
| Fonts | DM Sans / DM Mono |
| Accent | VT Maroon (#861F41) |

---

## Auth Flow

1. User visits site  
2. Middleware checks auth  
3. If not authenticated → `/login`  
4. User clicks CAS login  
5. Redirect to VT CAS  
6. CAS returns ticket  
7. Backend validates + creates user  
8. Redirect → `/auth/callback`  
9. Token stored  
10. Redirect → `/dashboard`  

---

## Session Persistence Fix

- Token now stored in `localStorage`
- Automatically restored on page load
- No manual init required

---

## Deployment — Frontend

### Ingress Routing

| Path | Service |
|------|--------|
| `/api/*` | Backend |
| `/` | Frontend |
| `/db` | Adminer |

---

## CI/CD

- Frontend build job enabled
- Runs on every merge to `main`
- Builds + pushes Docker images automatically

---

## Deployment Commands

```bash
kubectl apply -f docs/frontend-deployment.yaml
kubectl get pods
kubectl logs deployment/frontend --follow
kubectl rollout restart deployment/frontend
Live URLs
Frontend: https://webcatmaxxers.discovery.cs.vt.edu/login
Dashboard: https://webcatmaxxers.discovery.cs.vt.edu/dashboard
API: https://webcatmaxxers.discovery.cs.vt.edu/api
Adminer: https://webcatmaxxers.discovery.cs.vt.edu/db
Remaining Work
🔄 Bug fixes
⬜ MinIO upload
⬜ OAuth signing
⚠️ LTI credentials (blocked)
⚠️ API contract (blocked)
⬜ Admin page
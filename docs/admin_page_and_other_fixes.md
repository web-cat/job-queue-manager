# Infrastructure & Admin Dashboard Finalization Walkthrough

This document outlines the complete spectrum of work completed over this development phase, starting from resolving core networking connection issues across the entire stack, engineering the comprehensive administrative architecture, and finally fine-tuning component lifecycles uniquely for Nuxt v3 defaults and Adonis security settings.

## Phase 1: Resolving Local Traversal & Authentication Lockouts
Before any interface work could begin, we had to systematically unblock a critical traffic blockage bridging `localhost` to the internal API Docker environments. 

### Resolving the IPv6 Black Hole
**Files Modified**: `backend/.env`, `frontend/nuxt.config.ts`, `backend/app/middleware/log_request_middleware.ts`
When running `npm run dev` and trying to log into the frontend, the network completely blackholed the traffic, freezing the tab indefinitely instead of instantly erroring out.
- **Node.js Resolution Fallback**: Mapped `NUXT_PUBLIC_API_BASE` directly to `127.0.0.1:3333` in the frontend setup to purposefully sidestep local NodeJS runtimes resolving `localhost` blindly to the inaccessible IPv6 `[::1]` interface.
- **Binding Container Hooks**: Set the backend configuration's `HOST` variable to `0.0.0.0`. By default, Adonis bound strictly to the container's isolated local network. Forcing `0.0.0.0` successfully permitted host-rendered bridge traffic to hit the actual application framework over Docker tunnels.
- **Immediate Interceptors**: Shifted the `log_request_middleware.ts` to `console.log()` data absolutely instantly before passing execution payload down the stack. Moving this tracking outside the callback ensured we could safely track inbound hanging connections regardless of Node crashes.

## Phase 2: Architecting the Admin Interface & Core APIs
With the HTTP data bridge secured, we architected an expansive, multi-tiered administrator control panel to manage every core functionality of the grading platform.

### Backend Infrastructure
**Files Created/Modified**: `backend/start/routes.ts`, `backend/start/kernel.ts`, controllers (`UsersController`, `TermsController`, `SubmissionPoliciesController`)
We wired up a comprehensive catalog of administrative APIs to populate and manage the control panel, fully shielding endpoints to ensure strict execution privileges.
- Wrote completely new routing clusters in `routes.ts` connecting GET and POST methods bridging into endpoints for `/users`, `/terms`, and `/submission-policies`.
- **Security Checkpoints**: Built and registered the `AdminMiddleware` into the application pipeline, blocking data access strictly to authenticated profiles inherently verified with `canManageAllCourses` privileges. 

### Designing the Nuxt Administrative Control Panel
**Files Created**: `frontend/app/pages/admin/index.vue`
We generated a massive, robust Control Panel interface segmented distinctly into 5 core administrative hubs that map identically to the LMS domain logic:
1. **System Users**: Built arrays projecting student vs structurer identities seamlessly while allowing instantaneous global role overrides dynamically via backend REST. 
2. **Terms**: Engineered forms driving explicit seasonal timing configurations (`spring-2026`) translating frontend dates to absolute ISO strings for lucid processing.
3. **Courses & Sections**: Structured foundational catalogs allowing super-users to quickly instantiate Course Abstracts (e.g. `CS101`) and directly mount term-dependent sections/offerings to them instantly.
4. **Enrollment Overrides**: Bound heavily responsive data-linking allowing administration to look up any specific sectional offering across the application and directly graft student profiles into them via cascading list dropdowns.
5. **Cross-Service Assignments**: Fully wired assignment offerings where teachers/admins can structure `private` deployments tightly constrained to respective LMS sections while dynamically toggling `public` visibility flags directly impacting routing.

## Phase 3: Optimizing, Polishing & Debugging

As we pushed the system live, multiple nuances regarding upgraded library environments and explicit permission setups began to fracture component states. I tracked these down and completely stabilized the stack. 

### Nuxt UI V3 Upgrades
Nuxt UI v3 fundamentally broke standard component definitions when migrating from v2 originally. I restored full visual form functionalities system-wide:
- Replaced 17 legacy `<UFormGroup>` tags with `<UFormField>` to re-enable component visual labeling. 
- Converted all legacy `<USelectMenu>` mapping loops (`:options`, `value-attribute`, `option-attribute`) back onto their proper V3 array schemas (`:items`, `value-key`, `label-key`) instantly bringing back visual names for user mappings. 
- Stripped arbitrary "Action" columns from Data Tables, rendering direct dropdown manipulation directly onto UI status badges.

### Overcoming the Adonis Double-Hash Security Conflict
Test accounts provisioned manually through the `/register` endpoint were locking themselves out right after creation despite matching plaintext variables.
- Tracked the inner machinations of `@adonis/auth` where `withAuthFinder` permanently implants a `beforeSave` hook to monitor and seamlessly hash the `encryptedPassword` column.
- Removed arbitrary `await hash.make()` commands inside our `AuthController.register`; leaving it entirely isolated allowed Adonis to correctly accept raw payloads and perform single secure hashes reliably, ending lockout bugs completely.

### Resolving HMR & CORS Pipeline Blockades
- **Live Updating**: Docker systems drop Hypervisor `inotify` changes. Bound `usePolling: true` alongside strict socket allocations to directly monitor modification timestamps safely without breaking networking.
- **Preflighting PATCH**: Fixed browser `Fetch()` rejections on Administrative overrides. Because role alterations required robust data updates (`PATCH`), and `PATCH` wasn't whitelisted by the `backend/config/cors.ts` mapping list, browsers defensively killed the transaction completely. Adding it explicitly to allowed origins instantly healed the control flow.

### Relational Hierarchy Overrides & Top-Level Access Navigation
- Rebuilt `frontend/app/layouts/default.vue` from a static array into a dynamic `computed` Vue hook instantly projecting administrative portal links dynamically for Global Role `1` users, allowing 1-click jumps universally across platforms without requiring manual endpoint typing. 
- **LMS Scoping Validation**: Rewrote `backend/app/controllers/assignments_controller.ts` where Administration profiles were getting inherently spammed by assignments they weren't enrolled in universally appearing in their `/assignments` student portals just because they built them! Altered the root endpoint query to explicitly query down a recursive Subquery `whereExists` checking directly across the `course_enrollment` relationships map. Private assignment deployments are explicitly invisible to index calls permanently unless you are perfectly enrolled in parallel LMS instances.

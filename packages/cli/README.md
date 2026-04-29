# JQM CLI

Interactive command-line interface for the Job Queue Manager. Authenticates via OAuth client credentials (HMAC-SHA256 request signing) against the `/api/v1` programmatic API.

## Who can use this

Anyone with a JQM account — students, instructors, admins, and external tools.

## Installation

```bash
cd packages/cli
npm install
npm run build
npm link   # makes 'jqm' available globally
```

## First-time setup

```bash
jqm
```

On first run you'll be prompted to enter:
- **Server URL** — defaults to the VT cluster
- **Client ID** — UUID from your API credentials
- **Client Secret** — shown once when you generate credentials

To generate credentials:
1. Log into the JQM frontend
2. Go to Settings → API Credentials  
3. Click "Generate new credentials"
4. Copy the `client_id` and `client_secret` — the secret is shown **once only**

Credentials are stored at `~/.config/jqm/config.json`.

## Usage

```bash
jqm
```

Navigate the interactive menu with arrow keys. Press Enter to select.

## Menu structure

```
Main Menu
├── Assignments
│   ├── List my assignments
│   ├── View assignment details
│   ├── Create assignment         (instructor/admin)
│   └── Update assignment         (instructor/admin)
├── Submissions
│   ├── Submit a zip file
│   ├── List my submissions
│   ├── Check submission status
│   └── View grading result
├── Courses & Enrollment
│   ├── List courses
│   ├── View course sections
│   ├── View section enrollments
│   ├── Enroll a student          (instructor/admin)
│   ├── Remove a student          (instructor/admin)
│   └── Create a course           (instructor/admin)
├── Queue & Scheduler Status
│   ├── View queue health
│   └── View active jobs
└── Setup / Change credentials
```

## Development

```bash
cd packages/cli
npm run dev   # runs with tsx (no build step needed)
```

## How signing works

Every request to `/api/v1` is signed with HMAC-SHA256:

```
canonical = METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
signature = HMAC-SHA256(clientSecret, canonical)
```

Headers sent: `x-api-key`, `x-timestamp`, `x-nonce`, `x-signature`

See `src/api.ts` for implementation details.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `JOB_QUEUE_API_URL` | Partner team's scheduler API URL | `http://localhost:9999` |

# DevSphere Frontend

This frontend is a Next.js app with Clerk authentication and an in-progress real-time collaboration feature.

## What Was Done

### 1. App Stabilization
- Auth redirects were implemented:
	- `/` redirects to `/dashboard` when logged in.
	- `/` redirects to `/sign-in` when logged out.
- Dashboard and collab routes are protected in middleware.
- Shared app shell was added for consistent page layout and spacing.
- Old duplicated login UI code was removed.

### 2. Auth Routes
- Sign-in route: `/sign-in/[[...sign-in]]`
- Sign-up route: `/sign-up/[[...sign-up]]`
- Dashboard route: `/dashboard`

### 3. Real-Time Collaboration MVP
- New protected route: `/collab/[roomId]`
- Added shared text editor powered by Yjs + y-webrtc.
- Added participant awareness list and connection state badge.
- Added dashboard CTA button to open a default collaboration room.
- Added language selector (JavaScript, Python, C, Java), Run button, and output panel.
- Added backend execution API at `/api/execute` for real runtime execution.

## Is Live Collaboration Fully Done?

No. The first MVP is working, but production-ready collaboration is not complete yet.

### Done
- Shared room URL model (`/collab/[roomId]`)
- Auth-protected collaboration page
- Peer-to-peer real-time text sync
- Basic participant presence display
- Real execution for JavaScript, Python, C, and Java via backend API

### Not Done Yet
- Conflict-safe rich code editor integration (Monaco/CodeMirror with CRDT bindings)
- Cursor/selection presence rendering in-editor
- Persistence (save room content to database)
- Permissions/roles (owner, editor, viewer)
- Reliable signaling/infra for scale (self-hosted instead of public signaling fallback)
- Collaboration tests and production monitoring

## Code Execution Notes

- `/api/execute` requires an authenticated Clerk session.
- API tests from terminal without auth cookies will return `Unauthorized`.
- Execution uses an external runtime backend, so internet access is required.

## How To Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment in `.env.local` (Clerk keys).

3. Start development server:

```bash
npm run dev
```

4. Open:
- http://localhost:3000

## How To Test Collaboration

1. Open this URL in Browser A and Browser B (different users):
	 - http://localhost:3000/collab/devsphere-room
2. Type in one browser.
3. Verify the other browser receives updates in near real time.
4. Verify unauthenticated users get redirected to sign-in.

## Recent Feature Branch

- Branch: `feature/realtime-code-collaboration`
- Latest collaboration commit: `9313b4e`

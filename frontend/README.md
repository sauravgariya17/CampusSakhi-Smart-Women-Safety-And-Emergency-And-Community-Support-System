# GEHU Women Safety - Frontend (Community Module)

This session delivers the **Community feature's** React components only
(not the full app shell - that will come with the Auth/Profile frontend
in a later session). To run these standalone, wire them into a Vite +
React Router + Tailwind project:

1. `npm create vite@latest . -- --template react`
2. `npm install` then `npm install react-router-dom axios lucide-react`
3. `npm install -D tailwindcss postcss autoprefixer` and run `npx tailwindcss init -p`
4. Set `VITE_API_BASE_URL=http://localhost:8080/api` in a `.env` file
5. Add a route: `<Route path="/community" element={<CommunityFeed />} />`
   and `<Route path="/community/posts/:postId" element={<PostDetailPage />} />`
6. Ensure `accessToken`/`refreshToken` are already in `localStorage` from
   your Auth flow (built in Stage 1) before visiting `/community`.

## Files in this module
- `src/api/axiosInstance.js` - shared JWT-aware HTTP client
- `src/api/communityApi.js` - community endpoint wrappers + category list
- `src/pages/community/CommunityFeed.jsx` - main feed: search/filter/sort/paginate/create
- `src/pages/community/PostDetailPage.jsx` - full post + comments
- `src/pages/community/components/PostCard.jsx`
- `src/pages/community/components/CommentList.jsx`
- `src/pages/community/components/VoteButtons.jsx`
- `src/pages/community/components/CreatePostForm.jsx`
- `src/pages/community/components/ReportModal.jsx`
- `src/pages/community/components/CategoryBadge.jsx`

## Privacy note baked into the UI
Every place a post/comment author would normally show a name instead shows
`u/{anonymousHandle}` — the components don't even receive a user ID or name
in their props, because the backend DTOs never send one.

---

## Map + Journey Mode module (added this session)

Add these routes to your router (in addition to the community routes above):
```jsx
<Route path="/journey" element={<JourneyModePage />} />
<Route path="/journey/track/:token" element={<TrackJourneyPage />} />  {/* public, no auth guard */}
```
`/journey/track/:token` must NOT be wrapped in your ProtectedRoute — it's
meant to be opened by a trusted contact who has no account.

### New files
- `src/pages/map/CampusMap.jsx` - Leaflet + OpenStreetMap, bounded to the GEHU campus radius returned by `/api/map/config`
- `src/pages/map/useGeolocation.js` - geolocation hook with explicit granted/denied/unavailable states
- `src/pages/journey/JourneyModePage.jsx` - pick destination, choose trusted contacts, start
- `src/pages/journey/ActiveJourneyView.jsx` - periodic location ping (every 30s, only while ACTIVE), check-in, cancel, share link
- `src/pages/journey/TrackJourneyPage.jsx` - public read-only view for a trusted contact's link
- `src/api/mapApi.js`, `src/api/journeyApi.js`

### New dependencies
`npm install leaflet react-leaflet`

### What "no continuous surveillance" means in this code
`ActiveJourneyView` only calls the ping API while `current.status === "ACTIVE"`
and throttles to one ping per 30 seconds; there's no background timer running
outside that component's lifecycle, so leaving the page / ending the journey
stops all location transmission immediately.

---

## SOS & Emergency Response module (added this session)

Add `<SosButton />` once, near the root of your authenticated layout (it
renders a fixed-position floating button, so it doesn't need its own route):
```jsx
// e.g. in your main authenticated layout component
import SosButton from "./pages/sos/SosButton";
...
<SosButton />
```
Add these routes:
```jsx
<Route path="/sos/history" element={<SosHistoryPage />} />
<Route path="/admin/security-dashboard" element={<SecurityDashboardPage />} />
{/* Guard the dashboard route to SECURITY_STAFF/ADMIN only in your route guard */}
```

### New files
- `src/api/sosApi.js` - SOS + management API wrappers, category list
- `src/pages/sos/SosButton.jsx` - the full trigger -> confirm -> active state machine, resumes on page refresh
- `src/pages/sos/components/{CategoryModal,ConfirmationCountdown}.jsx`
- `src/pages/sos/SosHistoryPage.jsx`
- `src/pages/admin/SecurityDashboardPage.jsx`

### Why the countdown is not the "real" security
`ConfirmationCountdown` is a UX affordance - the actual enforcement is
server-side (`SosServiceImpl.confirm` rejects a confirm call once
`confirmationExpiresAt` has passed, regardless of what the browser's timer
shows). A modified frontend cannot skip the confirmation state.

---

## AI-Assisted Features module (added this session)

New routes to add:
```jsx
<Route path="/incidents/report" element={<ReportIncidentPage />} />
<Route path="/incidents/mine" element={<MyIncidentsPage />} />
<Route path="/admin/incidents" element={<IncidentAdminPage />} />       {/* MODERATOR/ADMIN only */}
<Route path="/admin/analytics" element={<SafetyAnalyticsPage />} />     {/* MODERATOR/ADMIN only */}
```

### New files
- `src/api/incidentApi.js` - incident + admin + analytics API wrappers, category/visibility lists
- `src/pages/incidents/ReportIncidentPage.jsx` - two-step flow: AI preview (nothing saved) -> reporter reviews/edits -> submit
- `src/pages/incidents/MyIncidentsPage.jsx` - reporter's own submission history
- `src/pages/incidents/IncidentAdminPage.jsx` - review queue, shows AI's original suggestion next to the current value, one-click override
- `src/pages/analytics/SafetyAnalyticsPage.jsx` - aggregated charts; the privacy disclaimer is rendered unconditionally, never hidden behind a tooltip

### Where "AI is a recommendation, not a decision" actually lives in the UI
`ReportIncidentPage` calls `/incidents/analyze` (preview-only, nothing persisted) before the reporter
ever commits to a category — they see the AI's confidence and reasoning and can pick a different
category before submitting. `IncidentAdminPage` shows the AI's original suggestion alongside
whatever the current value is, so overriding it is a visible, one-click action, not a hidden edit.

---

## Admin/Moderator Dashboard module (added this session)

New routes to add (all should sit behind a role-aware route guard):
```jsx
<Route path="/admin/dashboard" element={<AdminDashboardHome />} />        {/* MODERATOR/ADMIN */}
<Route path="/admin/users" element={<UserManagementPage />} />            {/* ADMIN only */}
<Route path="/admin/audit-logs" element={<AuditLogPage />} />             {/* ADMIN only */}
```
(`IncidentAdminPage`, `SafetyAnalyticsPage`, `SecurityDashboardPage`, and the Community `ModerationController`-backed queue from earlier sessions are the other tabs of this same dashboard - link them all from one admin layout/sidebar.)

### New files
- `src/api/adminApi.js` - dashboard summary, user management, audit log API wrappers
- `src/pages/admin/AdminDashboardHome.jsx` - summary cards + category/trend/area charts, the dashboard "home page"
- `src/pages/admin/UserManagementPage.jsx` - search/filter/paginate users, change role, suspend/activate (ADMIN only)
- `src/pages/admin/AuditLogPage.jsx` - paginated, filterable view of the immutable audit trail (ADMIN only)

### Updated
- `IncidentAdminPage.jsx` - status buttons now match the full pipeline (Submitted → Under Review → Assigned → In Progress → Resolved → Closed), shows the assignee when set

### Role-aware navigation
The dashboard has three tiers of visibility a sidebar/nav component should respect:
- **MODERATOR + ADMIN**: dashboard home, incident review, community moderation queue, safety analytics
- **ADMIN only**: user management, audit logs
- **SECURITY_STAFF**: the separate `SecurityDashboardPage` (SOS queue), not this general dashboard

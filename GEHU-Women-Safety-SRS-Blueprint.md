# Smart Women Safety, Emergency & Community Support System
## Software Requirements Specification & Technical Blueprint
### For GEHU Clement Town, Dehradun — MCA PBL Project

---

## 0. Scope Sanity Check (Read This First)

A few requested ideas need trimming for realism in a 4–6 member, one/two-semester MCA project. Flagged below, with simpler alternatives baked into the design that follows:

- **"AI-assisted classification/moderation"** — realistic scope: a text-classification model (unsafe-content flagging + incident category tagging + basic sentiment/urgency scoring) trained on a small labeled dataset or using a pre-trained model (e.g., a HuggingFace transformer or even a fine-tuned scikit-learn model) exposed via a small Python microservice OR a rule-based + ML-hybrid approach if time is short. **Do not attempt real-time danger prediction with live crime data** — there is no real dataset for GEHU, and building one would consume the whole project. Instead, AI predicts on **historical reported incidents you seed yourself** (a "hotspot heatmap" derived from your own incident reports table) — this is honest, demonstrable, and still counts as AI/ML.
- **"Real map"** — use Google Maps / Leaflet + OpenStreetMap restricted to a bounding box around GEHU Clement Town campus. Do not build custom mapping/geofencing engines from scratch — use existing SDK geofencing utilities.
- **Journey Mode "live tracking"** — realistic scope: periodic location ping (every 10–15s) shared with trusted contacts via a shareable link + WebSocket/polling, auto-SOS trigger if journey not marked "reached" by ETA. Do not attempt continuous background tracking robustness like a commercial app (battery optimization, OS-level background service issues) — acceptable to note this as a known limitation in viva.
- **SOS** — trigger via app button + optionally a hardware-free "shake gesture" (device motion API) is a nice-to-have, not core. Core SOS = one-tap alert with location to trusted contacts + nearest campus security/admin.
- **Notifications** — use Firebase Cloud Messaging (free tier) for push notifications + email (SMTP/SendGrid free tier) + optionally Twilio trial SMS. Don't build a custom SMS gateway.
- **Anonymity** — implement via a separate `anonymous_display_name`/hashed handle per user for community posts, never expose the linkage to any non-admin role, and give admins access to real identity only through an audited "reveal" action for moderation/legal reasons — this is realistic and is a good viva talking point on privacy architecture.

Everything else in your requirement list is realistically buildable and appropriately scoped. The plan below keeps to that.

---

## 1. Final List of Modules

1. Authentication & Authorization
2. User Profile Management
3. Trusted Contacts
4. Journey Mode (Safe Travel Tracking)
5. Campus Map & Location Services
6. SOS / Emergency Alert
7. Incident Reporting
8. Anonymous Women Safety Community (Reddit-style)
9. AI/ML Assistance Service (classification, moderation support, hotspot analytics)
10. Admin & Moderator Dashboard
11. Analytics & Reporting
12. Security, Privacy & Audit Layer (cross-cutting, not a "screen" module but an architectural layer)

---

## 2–3. Module Purpose & Key Features

### 2.1 Authentication & Authorization
**Purpose:** Secure identity management with role-based access.
**Features:**
- Register/login with GEHU email domain validation (optional restriction to `@gehu.ac.in` style, or open registration with manual verification for a demo-friendly build)
- JWT-based stateless auth (access + refresh token)
- Password hashing (BCrypt), forgot/reset password via email OTP
- Role assignment: STUDENT/FACULTY (default "User"), MODERATOR, ADMIN, SECURITY_STAFF
- Account verification via email OTP

### 2.2 User Profile Management
**Purpose:** Store personal + safety-relevant data.
**Features:**
- Basic profile (name, photo, course, hostel/day-scholar status, contact number)
- Emergency medical info (blood group, allergies — optional, shown only to responders during an active SOS)
- Privacy settings (what's visible to whom)
- Anonymous handle generation for community use

### 2.3 Trusted Contacts
**Purpose:** People notified during SOS/Journey Mode.
**Features:**
- Add/edit/remove up to N trusted contacts (name, phone, email, relation)
- Contact verification (confirmation link/OTP sent to contact)
- Priority ordering (who gets notified first)

### 2.4 Journey Mode
**Purpose:** Let a user share a tracked "safe walk" from Point A to B within campus/nearby area.
**Features:**
- Select start & destination on campus map, expected arrival time
- Periodic location ping shared with trusted contacts (shareable tracking link, expires after journey ends)
- "I've reached safely" manual check-in
- Auto-alert to trusted contacts + admin if not checked in by ETA + grace period
- Journey history log

### 2.5 Campus Map & Location Services
**Purpose:** Ground every safety feature in real GEHU geography.
**Features:**
- Interactive map restricted to a bounding box (GEHU campus + defined nearby radius, e.g., 2 km around Clement Town gate)
- Marked safe zones (security posts, wardens' offices, well-lit main routes, helpdesks)
- Marked reported-incident hotspots (aggregated, anonymized, heatmap layer)
- Reverse geocoding for SOS/incident location tagging

### 2.6 SOS / Emergency Alert
**Purpose:** Immediate one-tap emergency alerting.
**Features:**
- One-tap SOS with auto-captured GPS location
- Simultaneous alert to: trusted contacts, campus security/admin dashboard
- Live location shown to responders until SOS is resolved/cancelled
- SOS status lifecycle: TRIGGERED → ACKNOWLEDGED → RESOLVED / FALSE_ALARM
- Optional: fake-call / decoy screen (a well-known, simple, high-value safety UX feature; low backend complexity)

### 2.7 Incident Reporting
**Purpose:** Formal, trackable reporting of safety incidents (distinct from casual community posts).
**Features:**
- Structured form: category (harassment, stalking, unsafe lighting, suspicious activity, etc.), description, location pin, optional photo evidence, date/time
- Report visibility choice: Anonymous to public / Named to admin only / Fully anonymous even to admin (with limitations explained to user)
- Status tracking (Submitted → Under Review → Action Taken → Closed)
- Feeds into AI hotspot analytics (aggregated + anonymized only)

### 2.8 Anonymous Women Safety Community
**Purpose:** Reddit-style peer support & shared awareness space.
**Features:**
- Create posts/threads under an anonymous handle (never real name)
- Upvote/downvote, comment, tag posts (safety tip, warning, question, support)
- Report-a-post (community moderation signal)
- AI-assisted auto-flagging of harmful/abusive/spam content before/after publish
- Moderator review queue for flagged content

### 2.9 AI/ML Assistance Service
**Purpose:** Supporting intelligence layer — not the core product.
**Features:**
- **Text classification model**: categorize incident reports & community posts (harassment/stalking/eve-teasing/other) and flag toxic/abusive language
- **Moderation assist**: score each post/comment for a moderation queue priority (not fully automated takedown — human-in-the-loop)
- **Hotspot analytics**: cluster historical incident coordinates (e.g., simple density clustering) into a heatmap layer shown on the campus map
- **Model exposed as a small internal microservice** (Python/Flask/FastAPI) called by Spring Boot backend via REST — Spring Boot remains the primary backend; the ML service is a support component, matching requirement #7

### 2.10 Admin & Moderator Dashboard
**Purpose:** Operational control room.
**Features:**
- Real-time SOS monitoring board
- Incident report queue with status update
- Community moderation queue (AI-flagged + user-reported content)
- User management (verify, suspend, role change)
- Reveal-identity action for serious cases (fully audit-logged)
- Analytics charts

### 2.11 Analytics & Reporting
**Purpose:** Turn data into actionable insight for campus administration.
**Features:**
- Incident trends by category/time/location
- Community engagement stats
- SOS response time metrics
- Exportable reports (PDF/CSV) for university safety committee — good viva/placement talking point

### 2.12 Security, Privacy & Audit Layer (cross-cutting)
**Purpose:** Enforce the "proper privacy and access control" requirement everywhere.
**Features:**
- RBAC on every endpoint
- Anonymization boundary enforced at the DB/service layer, not just UI
- Full audit log for sensitive actions (identity reveal, role changes, SOS access)
- Data encryption at rest for sensitive fields (phone numbers, medical info)
- Rate limiting on SOS/report endpoints to prevent abuse

---

## 4. User Roles

| Role | Description |
|---|---|
| **STUDENT/USER** | Default role — full access to profile, SOS, journey mode, community, reporting |
| **MODERATOR** | Reviews flagged community content, cannot see real identities behind anonymous posts unless escalated |
| **SECURITY_STAFF** | Receives SOS alerts, updates SOS status, views live location during active SOS only |
| **ADMIN** | Full platform control — user management, analytics, identity-reveal authority, system config |

---

## 5. Complete User Workflow

1. Register → verify email (OTP) → login (JWT issued)
2. Complete profile → add trusted contacts (each contact confirms via link)
3. Explore campus map → see safe zones/hotspots
4. Normal day use: browse/post in community anonymously, submit incident reports when needed
5. Before walking alone: start **Journey Mode**, share tracking link, check in on arrival
6. In danger: trigger **SOS** → contacts + security notified instantly → status updates until resolved
7. View own report/SOS history in profile

## 6. Admin Workflow

1. Login → dashboard shows live SOS queue, pending reports, moderation queue
2. Acknowledge active SOS → coordinate response → mark resolved with notes
3. Review incident reports → update status → escalate if pattern detected (linked to hotspot analytics)
4. Review AI-flagged community content → approve/remove/warn user
5. For serious/legal cases → invoke identity-reveal (audit-logged, reason mandatory)
6. Review analytics → export reports for university safety committee

## 7. Community Workflow

1. User creates post under auto-generated anonymous handle
2. AI service scores post for toxicity/category before publish
3. If flagged high-risk → sent to moderation queue (held or published-with-flag depending on severity threshold)
4. Other users comment/upvote/downvote using their own anonymous handles
5. Any user can "report" a post/comment → adds to moderation queue regardless of AI score
6. Moderator resolves queue items

## 8. Emergency/SOS Workflow

1. User taps SOS (with optional pre-filled reason)
2. Backend captures GPS + timestamp, creates SOS record (status=TRIGGERED)
3. Notification service pushes alert to: trusted contacts (SMS/push/email) + security dashboard (WebSocket real-time push)
4. Security/admin acknowledges (status=ACKNOWLEDGED) — live location visible to them only during active window
5. Responder resolves case (status=RESOLVED or FALSE_ALARM) with closing notes
6. Record archived; feeds anonymized data into analytics (never public)

## 9. Journey Mode Workflow

1. User selects start/destination + expected duration
2. System creates Journey record (status=ACTIVE), generates a time-limited shareable tracking link
3. App periodically pushes location (poll or WebSocket) → stored as latest position (not full history, to limit DB load — configurable)
4. Trusted contacts can open the link and see live position on map until journey ends
5. On arrival, user taps "Reached Safely" (status=COMPLETED)
6. If ETA + grace period passes with no check-in → system auto-escalates to SOS flow

## 10. AI/ML Workflow

1. Incident report / community post text sent to ML microservice via internal REST call
2. ML service returns: category label, toxicity/urgency score, confidence
3. Spring Boot backend uses this score to route content (auto-publish / moderation queue / auto-flag)
4. Separately, a scheduled batch job aggregates resolved incident coordinates → simple clustering (e.g., grid-based density or k-means) → produces hotspot dataset consumed by the map heatmap layer
5. All AI decisions are **advisory** — a human (moderator/admin) always makes the final call on content removal, satisfying academic rigor and avoiding "black box" criticism in viva

---

## 11. Database Entities & Relationships (Core ER Design)

**Users** (user_id PK, name, email, password_hash, phone_encrypted, role, anonymous_handle, is_verified, created_at)

**TrustedContacts** (contact_id PK, user_id FK, name, phone, email, relation, is_verified, priority)

**Journeys** (journey_id PK, user_id FK, start_lat/lng, dest_lat/lng, start_time, expected_arrival, status, last_known_lat/lng, last_ping_at)

**SOSAlerts** (sos_id PK, user_id FK, lat, lng, status, triggered_at, acknowledged_by FK→Users, resolved_at, notes)

**IncidentReports** (report_id PK, user_id FK nullable-for-anonymous, category, description, lat, lng, evidence_url, visibility_type, status, ai_category, ai_score, created_at)

**CommunityPosts** (post_id PK, author_user_id FK [hidden field], anonymous_handle_snapshot, title, body, tag, ai_toxicity_score, moderation_status, created_at)

**Comments** (comment_id PK, post_id FK, author_user_id FK [hidden], anonymous_handle_snapshot, body, created_at)

**Votes** (vote_id PK, user_id FK, target_type[POST/COMMENT], target_id, vote_value)

**ModerationQueue** (queue_id PK, target_type, target_id, reason, flagged_by[AI/USER], status, reviewed_by FK→Users)

**AuditLogs** (log_id PK, actor_user_id FK, action_type, target_type, target_id, reason, timestamp)

**Hotspots** (hotspot_id PK, lat, lng, radius, incident_count, last_computed_at) — derived/materialized table from IncidentReports

**Relationships:**
- Users 1—M TrustedContacts, Journeys, SOSAlerts, IncidentReports, CommunityPosts, Comments, Votes
- CommunityPosts 1—M Comments
- CommunityPosts/Comments 1—M via ModerationQueue (polymorphic target)
- IncidentReports M—1 aggregated into Hotspots (batch job, not FK relation)

**Key privacy design:** `anonymous_handle_snapshot` is stored redundantly on posts/comments at creation time so that even if a user later changes their handle, past posts remain consistently anonymous and unlinkable without the `author_user_id` column — which is never exposed via any public API/DTO, only used internally for moderation/audit joins.

---

## 12. REST API Categories

- `/api/auth/**` — register, login, refresh, verify-otp, forgot-password
- `/api/users/**` — profile CRUD, privacy settings
- `/api/contacts/**` — trusted contact CRUD, verify
- `/api/journeys/**` — start, ping, checkin, get-live/{token}
- `/api/sos/**` — trigger, acknowledge, resolve, list-active (role-restricted)
- `/api/reports/**` — create, list (own), admin-list, update-status
- `/api/community/posts/**`, `/api/community/comments/**`, `/api/community/votes/**`
- `/api/moderation/**` — queue list, review action (MODERATOR/ADMIN only)
- `/api/admin/**` — user management, identity-reveal, audit-log view
- `/api/analytics/**` — dashboards, export
- `/api/map/**` — safe-zones, hotspots geojson
- Internal only: `/internal/ai/classify`, `/internal/ai/hotspots` (called by backend, not exposed publicly)

---

## 13. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 17+, Spring Boot 3.x, Spring Security, Spring Data JPA, Spring WebSocket |
| Database | MySQL 8 |
| AI/ML Service | Python (FastAPI/Flask) + scikit-learn or a lightweight HuggingFace model, called internally by Spring Boot |
| Frontend | React.js (Vite) + Tailwind CSS |
| Map | Leaflet.js + OpenStreetMap (free, no billing risk) or Google Maps JS SDK if budget/API key available |
| Auth | JWT (jjwt library) + BCrypt |
| Real-time | WebSocket (STOMP over SockJS) for SOS/live tracking |
| Notifications | Firebase Cloud Messaging (push), JavaMail/SMTP or SendGrid (email), Twilio trial (SMS, optional) |
| Build/Deploy | Maven, Docker (optional, good for viva points), GitHub for version control |
| Testing | JUnit 5, Mockito, Postman for API testing |

---

## 14. Frontend Architecture

```
- React app, role-based routing (ProtectedRoute wrapper per role)
- State management: Context API or Redux Toolkit (Redux Toolkit recommended given multiple real-time slices: SOS, journey, notifications)
- Pages: Auth, Dashboard, Profile, TrustedContacts, JourneyMode, Map, SOS, Community (Feed/PostDetail), IncidentReport, Admin/* , Moderator/*
- Shared components: MapView, SOSButton, PostCard, StatusBadge, NotificationBell
- API layer: Axios instance with JWT interceptor + refresh-token handling
- WebSocket client: for live SOS + journey tracking updates
```

## 15. Backend Spring Boot Architecture

```
com.gehu.safety
 ├── config          (SecurityConfig, WebSocketConfig, CorsConfig)
 ├── controller       (REST controllers per module)
 ├── service          (business logic interfaces + impl)
 ├── repository       (Spring Data JPA repositories)
 ├── entity           (JPA entities)
 ├── dto              (request/response DTOs — never expose entities directly)
 ├── security         (JWT filter, UserDetailsService, role annotations)
 ├── ai               (client to call the Python ML microservice)
 ├── exception        (GlobalExceptionHandler, custom exceptions)
 ├── audit            (AOP-based audit logging aspect for sensitive actions)
 └── util
```
Layered pattern: Controller → Service → Repository, DTO mapping via MapStruct (optional) to keep entity/anonymity boundaries clean.

## 16. Security Architecture

- Stateless JWT auth, short-lived access token + refresh token rotation
- Method-level RBAC via `@PreAuthorize`
- Anonymity enforced at the **DTO mapping layer** — API responses for community content never include `author_user_id`; only internal service code can join it, and only for MODERATOR/ADMIN audit-logged actions
- Sensitive fields (phone, medical info) encrypted at rest (JPA AttributeConverter + AES)
- All identity-reveal/audit-sensitive actions logged in `AuditLogs`, immutable (no update/delete allowed on this table)
- Rate limiting on SOS and report submission endpoints to prevent spam/abuse
- Input validation + sanitization to prevent XSS in community posts
- HTTPS enforced in deployment

## 17. Map Integration Approach for GEHU

- Use Leaflet.js with a fixed bounding box (`maxBounds`) around GEHU Clement Town campus coordinates + a defined nearby radius (e.g., main gate to nearby market/bus stop area)
- Pre-seed a `SafeZones` table with real campus points (security office, hostel wardens, main gate, library, key blocks) — this is manual data entry, realistic for a small team
- Hotspot heatmap layer uses `Leaflet.heat` plugin fed by the `Hotspots` table
- Geocoding limited to reverse-geocoding (coordinates → readable label) using a free Nominatim (OSM) API, cached to avoid rate limits

## 18. Notification Approach

- **Push:** Firebase Cloud Messaging — free, well-documented, good for both web and future mobile
- **Email:** SMTP via JavaMailSender for OTPs, journey/SOS summaries, trusted-contact verification
- **SMS (optional/stretch):** Twilio trial account for actual SOS text alerts — clearly mark as optional in your report if the free trial credits are a concern
- **Real-time in-app:** WebSocket for SOS dashboard updates and live journey tracking (no need for full push infra there)

---

## 19. Development Milestones for a 4–6 Member Team

**Suggested role split (5-member example, adjust for your team size):**

| Member | Owns |
|---|---|
| A — Backend Lead | Auth, Security architecture, User/Profile/TrustedContacts APIs |
| B — Backend Dev | SOS, Journey Mode, WebSocket real-time layer |
| C — Backend Dev | Community, Moderation, Incident Reporting APIs |
| D — AI/ML + Integration | Python ML microservice, hotspot batch job, Spring↔ML integration |
| E — Frontend Lead | React app shell, Auth/Profile/Map/SOS UI |
| (F if 6th member) — Frontend Dev | Community UI, Admin/Moderator dashboards, Analytics charts |

**Milestone Timeline (assuming ~14–16 week project):**

1. **Weeks 1–2:** Requirements freeze, ER diagram finalization, API contract draft, project skeleton (Spring Boot + React + MySQL wired up), Git repo/branching strategy
2. **Weeks 3–5:** Auth + Profile + Trusted Contacts (full stack), campus map base integration with seeded safe zones
3. **Weeks 6–8:** SOS module + Journey Mode + WebSocket real-time pipeline
4. **Weeks 9–10:** Incident Reporting + Community module (posts/comments/votes) with anonymity layer
5. **Weeks 11–12:** AI/ML microservice (classification + hotspot clustering) + integration into moderation & map
6. **Week 13:** Admin/Moderator dashboard + Analytics + audit logging
7. **Week 14:** Security hardening pass, rate limiting, encryption, penetration-style manual testing
8. **Weeks 15–16:** Integration testing, bug fixing, documentation (SRS, ER diagrams, report), demo rehearsal, viva prep

## 20. MVP vs Future/Optional Features

**MVP (must-have for evaluation):**
- Auth + roles, Profile, Trusted Contacts
- SOS trigger + dashboard acknowledgment
- Journey Mode with check-in + auto-escalation
- Campus map with safe zones
- Incident Reporting with status tracking
- Anonymous Community (posts, comments, votes) with real moderation queue
- Basic AI classification (category + toxicity score) — even a decently-tuned scikit-learn model is fully acceptable
- Admin dashboard with core controls
- Basic analytics (counts/charts)

**Optional / Future scope (mention in report as "future enhancements", don't build now unless ahead of schedule):**
- SMS-based SOS (Twilio) if push/email suffice for demo
- Fake-call/decoy screen
- Mobile app (React Native) version — mention as future work, since a responsive web app is sufficient for PBL evaluation
- Wearable/IoT panic button integration
- Advanced ML (deep learning-based NLP) beyond classical classifiers
- Multi-language support
- Full location-history tracking (vs. latest-position-only) for Journey Mode

---

# PROJECT CONTEXT FOR FUTURE SESSIONS

```
PROJECT: Smart Women Safety, Emergency & Community Support System (GEHU Clement Town, Dehradun)
TYPE: MCA PBL, 4–6 members

FIXED STACK:
- Backend: Java 17+, Spring Boot 3.x, Spring Security, Spring Data JPA, WebSocket (STOMP)
- DB: MySQL 8
- Frontend: React (Vite) + Tailwind CSS, Redux Toolkit
- AI/ML: Python (FastAPI/Flask) microservice, called internally by Spring Boot (NOT the core backend)
- Map: Leaflet.js + OpenStreetMap, bounding box = GEHU campus + limited nearby area
- Auth: JWT + BCrypt, refresh token rotation
- Notifications: FCM (push), SMTP (email), Twilio (optional SMS)

SCOPE BOUNDARY: Campus + limited nearby area only. NOT city/country-wide.

FINAL MODULES (12):
1. Auth & Authorization
2. User Profile
3. Trusted Contacts
4. Journey Mode
5. Campus Map & Location Services
6. SOS/Emergency
7. Incident Reporting
8. Anonymous Community (Reddit-style)
9. AI/ML Assistance (classification + moderation-assist + hotspot clustering — advisory only, human makes final call)
10. Admin/Moderator Dashboard
11. Analytics & Reporting
12. Security/Privacy/Audit (cross-cutting layer, not a UI module)

ROLES: STUDENT/USER, MODERATOR, SECURITY_STAFF, ADMIN

CORE DB ENTITIES: Users, TrustedContacts, Journeys, SOSAlerts, IncidentReports, CommunityPosts, Comments, Votes, ModerationQueue, AuditLogs, Hotspots

KEY ARCHITECTURAL DECISIONS:
- Anonymity enforced at DTO layer, never expose author_user_id in public API responses; anonymous_handle_snapshot stored on each post/comment at creation time
- Identity-reveal is an audited ADMIN-only action, reason mandatory, logged immutably in AuditLogs
- AI/ML is advisory-only (feeds moderation queue + hotspot heatmap); humans make final moderation decisions
- SOS and Journey Mode use WebSocket for real-time updates; Journey Mode stores only latest position (not full trail) to limit DB load
- Journey Mode auto-escalates to SOS flow if no check-in by ETA + grace period
- Backend layering: Controller → Service → Repository → Entity, with DTOs mapping to hide sensitive/internal fields
- Rate limiting on SOS/report endpoints; sensitive fields (phone, medical info) encrypted at rest

TEAM SPLIT (5-person default): Backend Lead (Auth/Security/Profile), Backend Dev 1 (SOS/Journey/WebSocket), Backend Dev 2 (Community/Moderation/Reports), AI/ML+Integration Dev, Frontend Lead + optional Frontend Dev 2

MVP LOCKED: Auth, Profile, Trusted Contacts, SOS, Journey Mode, Campus Map w/ safe zones, Incident Reporting, Anonymous Community, basic AI classification, Admin dashboard, basic analytics.
DEFERRED TO FUTURE WORK: SMS SOS, decoy call, mobile app, IoT panic button, advanced NLP, multi-language, full location-history tracking.
```

---

# Recommended Project Folder Structure

```
gehu-women-safety/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/gehu/safety/
│   │   ├── SafetyApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   ├── WebSocketConfig.java
│   │   │   └── CorsConfig.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── UserController.java
│   │   │   ├── TrustedContactController.java
│   │   │   ├── JourneyController.java
│   │   │   ├── SosController.java
│   │   │   ├── IncidentReportController.java
│   │   │   ├── CommunityController.java
│   │   │   ├── ModerationController.java
│   │   │   ├── AdminController.java
│   │   │   ├── AnalyticsController.java
│   │   │   └── MapController.java
│   │   ├── service/
│   │   │   ├── impl/
│   │   │   └── ...(interfaces per module)
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   └── response/
│   │   ├── security/
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── CustomUserDetailsService.java
│   │   ├── ai/
│   │   │   └── AiClassificationClient.java
│   │   ├── audit/
│   │   │   └── AuditAspect.java
│   │   ├── exception/
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── custom exceptions...
│   │   └── util/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/            # Flyway scripts (recommended for schema versioning)
│   └── src/test/java/...
│
├── ai-service/                       # Python microservice (support component)
│   ├── app.py
│   ├── models/
│   │   ├── classifier.pkl
│   │   └── hotspot_cluster.py
│   ├── routes/
│   │   ├── classify.py
│   │   └── hotspots.py
│   ├── requirements.txt
│   └── train/
│       └── train_classifier.ipynb
│
├── frontend/                         # React application
│   ├── src/
│   │   ├── api/                     # Axios instances, interceptors
│   │   ├── app/                     # Redux store setup
│   │   ├── features/                # Redux slices per module
│   │   │   ├── auth/
│   │   │   ├── sos/
│   │   │   ├── journey/
│   │   │   ├── community/
│   │   │   └── admin/
│   │   ├── components/              # Shared UI components
│   │   │   ├── MapView/
│   │   │   ├── SOSButton/
│   │   │   ├── PostCard/
│   │   │   └── NotificationBell/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── journey/
│   │   │   ├── community/
│   │   │   ├── reports/
│   │   │   ├── admin/
│   │   │   └── moderator/
│   │   ├── routes/                  # ProtectedRoute, role-based routing
│   │   ├── websocket/               # STOMP client setup
│   │   └── App.jsx
│   └── package.json
│
├── docs/
│   ├── SRS.md                       # This document (finalized/expanded)
│   ├── ER-diagram.png
│   ├── API-contract.md
│   ├── architecture-diagram.png
│   └── viva-prep-notes.md
│
├── docker-compose.yml               # optional: mysql + backend + ai-service + frontend
└── README.md
```

---

## Closing Notes

This blueprint is intentionally scoped to be **demonstrable, defensible in viva, and realistically buildable by 4–6 people** — it avoids scope creep (no city-wide platform, no unproven live-tracking robustness claims, no over-promised AI). The anonymity architecture, journey-mode auto-escalation, and advisory-AI-with-human-moderation design are strong, honest talking points for both academic evaluation and placement interviews, since they demonstrate real system-design thinking rather than feature-stuffing.

Next session, we can proceed to: detailed ER diagram + SQL schema, or Spring Boot project skeleton with the first module (Auth) fully coded — your call.

-- ============================================================
-- GEHU Smart Women Safety, Emergency & Community Support System
-- Full MySQL Schema (all modules)
-- Stage 1 implements Java entities for: users, trusted_contacts
-- Remaining tables are included now so the schema is complete
-- and future stages plug in without redesign.
-- ============================================================

CREATE DATABASE IF NOT EXISTS gehu_safety_db;
USE gehu_safety_db;

-- ------------------------------------------------------------
-- 1. USERS  (core identity table)
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(120)        NOT NULL,
    email               VARCHAR(150)        NOT NULL UNIQUE,
    password_hash       VARCHAR(255)        NOT NULL,
    phone_encrypted     VARCHAR(255)        NULL,          -- AES-encrypted at application layer
    role                ENUM('USER','MODERATOR','SECURITY_STAFF','ADMIN') NOT NULL DEFAULT 'USER',
    anonymous_handle    VARCHAR(50)         NOT NULL UNIQUE, -- shown publicly instead of `name`
    is_verified         BOOLEAN             NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. REFRESH TOKENS (server-side revocable refresh tokens)
-- ------------------------------------------------------------
CREATE TABLE refresh_tokens (
    token_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token           VARCHAR(512) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. TRUSTED CONTACTS
-- ------------------------------------------------------------
CREATE TABLE trusted_contacts (
    contact_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(120) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    email           VARCHAR(150) NULL,
    relation        VARCHAR(50)  NULL,
    priority        INT NOT NULL DEFAULT 1,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. JOURNEYS
-- ------------------------------------------------------------
CREATE TABLE journeys (
    journey_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    start_lat           DECIMAL(10,7) NOT NULL,
    start_lng           DECIMAL(10,7) NOT NULL,
    dest_lat            DECIMAL(10,7) NOT NULL,
    dest_lng            DECIMAL(10,7) NOT NULL,
    start_time          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_arrival    TIMESTAMP NOT NULL,
    status              ENUM('ACTIVE','COMPLETED','ESCALATED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    last_known_lat      DECIMAL(10,7) NULL,
    last_known_lng      DECIMAL(10,7) NULL,
    last_ping_at        TIMESTAMP NULL,
    tracking_token      VARCHAR(100) NOT NULL UNIQUE, -- shared with trusted contacts, time-limited
    CONSTRAINT fk_journey_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Which of the user's trusted contacts were selected for THIS specific
-- journey. Not every trusted contact needs to see every journey.
CREATE TABLE journey_trusted_contacts (
    journey_id      BIGINT NOT NULL,
    contact_id      BIGINT NOT NULL,
    PRIMARY KEY (journey_id, contact_id),
    CONSTRAINT fk_jtc_journey FOREIGN KEY (journey_id) REFERENCES journeys(journey_id) ON DELETE CASCADE,
    CONSTRAINT fk_jtc_contact FOREIGN KEY (contact_id) REFERENCES trusted_contacts(contact_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. SOS ALERTS
-- ------------------------------------------------------------
CREATE TABLE sos_alerts (
    sos_id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    category            ENUM('PERSONAL_SAFETY','MEDICAL_EMERGENCY','ACCIDENT','OTHER') NOT NULL DEFAULT 'PERSONAL_SAFETY',
    lat                 DECIMAL(10,7) NOT NULL,
    lng                 DECIMAL(10,7) NOT NULL,
    status              ENUM('PENDING_CONFIRMATION','TRIGGERED','ACKNOWLEDGED','RESOLVED','FALSE_ALARM','CANCELLED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    confirmation_expires_at TIMESTAMP NULL,   -- PENDING_CONFIRMATION auto-cancels after this, if not confirmed
    triggered_at        TIMESTAMP NULL,        -- set only once status becomes TRIGGERED (i.e. confirmed)
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by     BIGINT NULL,
    acknowledged_at     TIMESTAMP NULL,
    resolved_at         TIMESTAMP NULL,
    notes               VARCHAR(1000) NULL,
    CONSTRAINT fk_sos_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_sos_ack_by FOREIGN KEY (acknowledged_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Records every notification attempt made to a trusted contact for an SOS
-- event - this IS the "notification architecture" in concrete, auditable
-- form. channel=EMAIL is a real send attempt (SMTP); CONSOLE_SIMULATION is
-- the honest fallback used whenever real email isn't configured/reachable -
-- there is deliberately no SMS/police channel claimed here.
CREATE TABLE notification_logs (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    sos_id          BIGINT NOT NULL,
    contact_id      BIGINT NULL,              -- NULL if the recipient was campus security, not a trusted contact
    channel         ENUM('EMAIL','CONSOLE_SIMULATION') NOT NULL,
    recipient       VARCHAR(150) NOT NULL,
    status          ENUM('SENT','FAILED','SIMULATED') NOT NULL,
    sent_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notiflog_sos FOREIGN KEY (sos_id) REFERENCES sos_alerts(sos_id) ON DELETE CASCADE,
    CONSTRAINT fk_notiflog_contact FOREIGN KEY (contact_id) REFERENCES trusted_contacts(contact_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. INCIDENT REPORTS (formal, trackable reports, AI-assisted triage)
-- ------------------------------------------------------------
-- DESIGN NOTE (refined from the original SRS draft): user_id is ALWAYS
-- populated internally, even for FULL_ANON reports - mirrors the
-- Community module's anonymity-boundary pattern (author known internally,
-- hidden externally via DTO mapping) so a reporter can always see their
-- own submission history. visibility_type controls what ADMINS see.
CREATE TABLE incident_reports (
    report_id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT NOT NULL,
    description             VARCHAR(3000) NOT NULL,

    category                VARCHAR(30) NOT NULL,   -- final/effective, defaults to AI suggestion, reporter may accept/edit
    priority                VARCHAR(20) NOT NULL,   -- final/effective, defaults to AI suggestion, ADMIN/MODERATOR may override

    ai_suggested_category   VARCHAR(30) NULL,       -- AI's ORIGINAL suggestion, kept immutable for audit
    ai_suggested_priority   VARCHAR(20) NULL,
    ai_confidence           DECIMAL(4,3) NULL,
    ai_reasoning            VARCHAR(500) NULL,
    ai_summary              VARCHAR(800) NULL,      -- admin-only condensed view of a long description

    lat                     DECIMAL(10,7) NULL,
    lng                     DECIMAL(10,7) NULL,
    area_label              VARCHAR(120) NULL,

    evidence_url            VARCHAR(500) NULL,
    visibility_type         ENUM('ANON_PUBLIC','NAMED_ADMIN_ONLY','FULL_ANON') NOT NULL DEFAULT 'ANON_PUBLIC',
    status                  ENUM('SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'SUBMITTED',

    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_to             BIGINT NULL,     -- staff member handling this report (ASSIGNED stage)
    reviewed_by             BIGINT NULL,
    reviewed_at             TIMESTAMP NULL,

    CONSTRAINT fk_report_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_assigned FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_report_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. COMMUNITY POSTS  (anonymity handled here — see notes below)
-- ------------------------------------------------------------
CREATE TABLE community_posts (
    post_id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_user_id              BIGINT NOT NULL,      -- INTERNAL ONLY. Never returned by public API/DTO.
    anonymous_handle_snapshot   VARCHAR(50) NOT NULL,  -- what the public actually sees
    title                       VARCHAR(200) NOT NULL,
    body                        VARCHAR(5000) NOT NULL,
    tag                         VARCHAR(40) NULL,               -- category/flair, e.g. HARASSMENT, SAFETY_TIP
    area_label                  VARCHAR(120) NULL,               -- coarse area only, e.g. "Near Main Gate" - never exact GPS
    ai_toxicity_score           DECIMAL(4,3) NULL,
    moderation_status           ENUM('PUBLISHED','PENDING_REVIEW','REMOVED') NOT NULL DEFAULT 'PUBLISHED',
    upvote_count                INT NOT NULL DEFAULT 0,
    downvote_count              INT NOT NULL DEFAULT 0,
    comment_count               INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_author FOREIGN KEY (author_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. COMMENTS
-- ------------------------------------------------------------
CREATE TABLE comments (
    comment_id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id                     BIGINT NOT NULL,
    author_user_id              BIGINT NOT NULL,      -- INTERNAL ONLY, same rule as posts
    anonymous_handle_snapshot   VARCHAR(50) NOT NULL,
    body                        VARCHAR(2000) NOT NULL,
    moderation_status           ENUM('PUBLISHED','PENDING_REVIEW','REMOVED') NOT NULL DEFAULT 'PUBLISHED',
    upvote_count                INT NOT NULL DEFAULT 0,
    downvote_count              INT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES community_posts(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_author FOREIGN KEY (author_user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. VOTES (polymorphic: applies to posts or comments)
-- ------------------------------------------------------------
CREATE TABLE votes (
    vote_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    target_type     ENUM('POST','COMMENT') NOT NULL,
    target_id       BIGINT NOT NULL,
    vote_value      TINYINT NOT NULL,   -- +1 or -1
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_vote_once UNIQUE (user_id, target_type, target_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. MODERATION QUEUE (polymorphic: posts or comments)
-- ------------------------------------------------------------
CREATE TABLE moderation_queue (
    queue_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_type     ENUM('POST','COMMENT') NOT NULL,
    target_id       BIGINT NOT NULL,
    reason          VARCHAR(500) NULL,
    flagged_by      ENUM('AI','USER') NOT NULL,
    reporter_user_id BIGINT NULL,             -- internal only; NEVER exposed via any API, anti-abuse tracking
    status          ENUM('PENDING','APPROVED','REMOVED') NOT NULL DEFAULT 'PENDING',
    reviewed_by     BIGINT NULL,
    reviewed_at     TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queue_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_queue_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. AUDIT LOGS (immutable — no UPDATE/DELETE from application code)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id   BIGINT NOT NULL,
    action_type     VARCHAR(80) NOT NULL,     -- e.g. IDENTITY_REVEAL, ROLE_CHANGE, SOS_ACCESS
    target_type     VARCHAR(40) NULL,
    target_id       BIGINT NULL,
    reason          VARCHAR(500) NULL,
    timestamp       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 12. HOTSPOTS (derived/materialized from incident_reports by a batch job)
-- ------------------------------------------------------------
CREATE TABLE hotspots (
    hotspot_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    lat              DECIMAL(10,7) NOT NULL,
    lng              DECIMAL(10,7) NOT NULL,
    radius_meters    INT NOT NULL DEFAULT 100,
    incident_count   INT NOT NULL DEFAULT 0,
    last_computed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 13. SAFE ZONES (manually seeded reference data for the map)
-- ------------------------------------------------------------
CREATE TABLE safe_zones (
    zone_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    type            VARCHAR(60) NOT NULL,     -- SECURITY_POST, WARDEN_OFFICE, HELPDESK, MAIN_ROUTE
    lat             DECIMAL(10,7) NOT NULL,
    lng             DECIMAL(10,7) NOT NULL,
    description     VARCHAR(300) NULL
) ENGINE=InnoDB;

-- Seed data: approximate GEHU Clement Town campus reference points.
-- Coordinates are centered on the publicly listed campus location
-- (30.2675 N, 77.9959 E per OSM/Wikipedia). Adjust to exact on-ground
-- coordinates using Google Maps before a real deployment - these are
-- realistic placeholders for demo/viva purposes.
INSERT INTO safe_zones (name, type, lat, lng, description) VALUES
('GEHU Main Gate Security Post', 'SECURITY_POST', 30.2675000, 77.9959000, 'Primary campus entrance, security staffed 24x7'),
('Hostel Warden Office - Girls Hostel', 'WARDEN_OFFICE', 30.2680000, 77.9965000, 'Warden on duty, first point of contact for hostel residents'),
('Campus Help Desk - Admin Block', 'HELPDESK', 30.2672000, 77.9955000, 'General enquiries and emergency assistance desk'),
('Library Block', 'SAFE_LANDMARK', 30.2678000, 77.9962000, 'Well-lit, staffed until 9 PM'),
('Main Internal Road (Gate to Academic Block)', 'MAIN_ROUTE', 30.2676000, 77.9960000, 'Well-lit primary walking route, preferred after dark');


-- ------------------------------------------------------------
-- Helpful indexes
-- ------------------------------------------------------------
CREATE INDEX idx_reports_location ON incident_reports (lat, lng);
CREATE INDEX idx_hotspots_location ON hotspots (lat, lng);
CREATE INDEX idx_posts_status ON community_posts (moderation_status);
CREATE INDEX idx_sos_status ON sos_alerts (status);
CREATE INDEX idx_journey_status ON journeys (status);

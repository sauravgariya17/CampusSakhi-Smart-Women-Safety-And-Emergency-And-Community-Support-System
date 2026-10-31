"""Comprehensive automated backend test suite for the CampusSakhi FastAPI backend."""

import os
from contextlib import asynccontextmanager

os.environ.setdefault("JWT_SECRET", "test-only-secret-with-at-least-32-characters")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.entities import CommunityPost, NotificationLog, NotificationLogStatusEnum, RoleEnum, User
from app.core.security import hash_password
from app.services.map_service import MapService

# Ensure no real emails are ever sent during testing
settings.NOTIFICATION_EMAIL_ENABLED = False

# Set up isolated in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@asynccontextmanager
async def isolated_test_lifespan(_app):
    """Prevent tests from initializing or mutating the configured application database."""
    yield


app.router.lifespan_context = isolated_test_lifespan


@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    """Create tables and seed isolated test accounts once for this module."""
    settings.NOTIFICATION_EMAIL_ENABLED = False
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        MapService.seed_defaults_if_empty(db)
        for role in RoleEnum:
            email = f"{role.value.lower()}@test.example.com"
            db.add(User(
                name=f"Test {role.value}",
                email=email,
                password_hash=hash_password("TestOnly@123"),
                role=role.value,
                anonymous_handle=f"test_{role.value.lower()}",
                is_verified=True,
                is_active=True,
            ))
        db.commit()

        test_user = db.query(User).filter(User.email == "user@test.example.com").one()
        db.add_all([
            CommunityPost(
                author_user_id=test_user.id,
                anonymous_handle_snapshot=test_user.anonymous_handle,
                title="Test safety update",
                body="A test-only community post for dashboard counts.",
                category="SAFETY_TIP",
                area_label="Test Area",
                moderation_status="PUBLISHED",
            ),
            CommunityPost(
                author_user_id=test_user.id,
                anonymous_handle_snapshot=test_user.anonymous_handle,
                title="Test support note",
                body="A second test-only community post for dashboard counts.",
                category="SUPPORT",
                area_label="Test Area",
                moderation_status="PUBLISHED",
            ),
        ])
        db.commit()
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login_demo_role(client: TestClient, email: str, password: str = "TestOnly@123") -> str:
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["data"]["accessToken"]


# ============================================================================
# 1. Health Check (`/api/health`)
# ============================================================================
def test_health_check(client: TestClient):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "CampusSakhi" in body["service"]
    assert body["version"] == "2.0.0"


# ============================================================================
# 2. Auth & Profile (`/api/auth/*`, `/api/users/me`)
# ============================================================================
def test_auth_and_profile_workflow(client: TestClient):
    # 2.1 Register new user -> 201, returns tokens and anonymousHandle
    reg_payload = {
        "name": "Riya Verma",
        "email": "riya.verma@gehu.ac.in",
        "password": "StrongPass@123",
        "phone": "+91-9811122233",
    }
    resp = client.post("/api/auth/register", json=reg_payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "accessToken" in data and data["accessToken"]
    assert "refreshToken" in data and data["refreshToken"]
    assert data["user"]["email"] == "riya.verma@gehu.ac.in"
    assert data["user"]["role"] == "USER"
    handle = data["user"]["anonymousHandle"]
    assert handle and "_" in handle and "Riya" not in handle

    # 2.2 Duplicate email registration -> 409
    dup_resp = client.post("/api/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409
    assert dup_resp.json()["success"] is False

    # 2.3 Weak password validation -> 400
    weak_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Weak User",
            "email": "weak@gehu.ac.in",
            "password": "weakpassword",
        },
    )
    assert weak_resp.status_code == 400
    assert weak_resp.json()["success"] is False

    # 2.4 Login -> 200
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "riya.verma@gehu.ac.in", "password": "StrongPass@123"},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()["data"]
    access_token = login_data["accessToken"]
    refresh_token = login_data["refreshToken"]

    # 2.5 Invalid login -> 401
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "riya.verma@gehu.ac.in", "password": "WrongPassword@1"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["success"] is False

    # 2.6 Get own profile (`GET /api/users/me`) -> 200
    me_resp = client.get("/api/users/me", headers=auth_headers(access_token))
    assert me_resp.status_code == 200
    me_data = me_resp.json()["data"]
    assert me_data["email"] == "riya.verma@gehu.ac.in"
    assert me_data["anonymousHandle"] == handle

    # 2.7 Refresh token (`POST /api/auth/refresh`) -> 200
    ref_resp = client.post("/api/auth/refresh", json={"refreshToken": refresh_token})
    assert ref_resp.status_code == 200
    assert ref_resp.json()["data"]["accessToken"]

    # 2.8 Logout (`POST /api/auth/logout`) -> 200, subsequent refresh with revoked token -> 400
    logout_resp = client.post("/api/auth/logout", json={"refreshToken": refresh_token})
    assert logout_resp.status_code == 200
    revoked_ref = client.post("/api/auth/refresh", json={"refreshToken": refresh_token})
    assert revoked_ref.status_code == 400
    assert revoked_ref.json()["success"] is False


# ============================================================================
# 3. Trusted Contacts (`/api/contacts`)
# ============================================================================
def test_trusted_contacts_crud_and_max_limit(client: TestClient):
    token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    headers = auth_headers(token)

    created_ids = []
    # Add 5 contacts (max allowed)
    for i in range(1, 6):
        resp = client.post(
            "/api/contacts",
            headers=headers,
            json={
                "name": f"Contact Person {i}",
                "phone": f"+91-987650000{i}",
                "email": f"contact{i}@example.com",
                "relation": "Family",
                "priority": i,
            },
        )
        assert resp.status_code == 201, resp.text
        created_ids.append(resp.json()["data"]["id"])

    # 6th contact must be rejected with 400
    sixth_resp = client.post(
        "/api/contacts",
        headers=headers,
        json={
            "name": "Contact Person 6",
            "phone": "+91-9876500006",
            "email": "contact6@example.com",
            "relation": "Friend",
            "priority": 6,
        },
    )
    assert sixth_resp.status_code == 400
    assert "up to 5" in sixth_resp.json()["message"]

    # List contacts -> 5 items
    list_resp = client.get("/api/contacts", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) == 5

    # Update contact
    first_id = created_ids[0]
    upd_resp = client.put(
        f"/api/contacts/{first_id}",
        headers=headers,
        json={
            "name": "Updated Primary Contact",
            "phone": "+91-9999988888",
            "email": "updated1@example.com",
            "relation": "Mother",
            "priority": 1,
        },
    )
    assert upd_resp.status_code == 200
    assert upd_resp.json()["data"]["name"] == "Updated Primary Contact"
    assert upd_resp.json()["data"]["relation"] == "Mother"

    # Delete 5th contact
    del_resp = client.delete(f"/api/contacts/{created_ids[-1]}", headers=headers)
    assert del_resp.status_code == 200

    list_after = client.get("/api/contacts", headers=headers)
    assert len(list_after.json()["data"]) == 4


# ============================================================================
# 4. Map Config & Safe Zones (`/api/map/config`, `/api/map/safe-zones`)
# ============================================================================
def test_map_config_and_safe_zones(client: TestClient):
    cfg_resp = client.get("/api/map/config")
    assert cfg_resp.status_code == 200
    cfg = cfg_resp.json()["data"]
    assert cfg["centerLat"] == pytest.approx(settings.MAP_CENTER_LAT)
    assert cfg["centerLng"] == pytest.approx(settings.MAP_CENTER_LNG)
    assert cfg["boundsRadiusKm"] == pytest.approx(settings.MAP_BOUNDS_RADIUS_KM)

    zones_resp = client.get("/api/map/safe-zones")
    assert zones_resp.status_code == 200
    zones = zones_resp.json()["data"]
    assert len(zones) >= 4
    zone_names = [z["name"] for z in zones]
    assert any("GEHU Main Gate" in name for name in zone_names)


# ============================================================================
# 5. Emergency SOS Workflow (`/api/sos/*`)
# ============================================================================
def test_emergency_sos_workflow(client: TestClient):
    user_token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    security_token = login_demo_role(client, "security_staff@test.example.com")

    user_headers = auth_headers(user_token)
    sec_headers = auth_headers(security_token)

    # 5.1 Trigger SOS -> 201 (`PENDING_CONFIRMATION`)
    trig_resp = client.post(
        "/api/sos/trigger",
        headers=user_headers,
        json={"category": "PERSONAL_SAFETY", "lat": 30.2675, "lng": 77.9959},
    )
    assert trig_resp.status_code == 201, trig_resp.text
    sos_data = trig_resp.json()["data"]
    sos_id = sos_data["id"]
    assert sos_data["status"] == "PENDING_CONFIRMATION"

    # 5.2 Prevent duplicate active SOS -> 400
    dup_trig = client.post(
        "/api/sos/trigger",
        headers=user_headers,
        json={"category": "PERSONAL_SAFETY", "lat": 30.2675, "lng": 77.9959},
    )
    assert dup_trig.status_code == 400

    # 5.3 Confirm SOS -> 200 (`TRIGGERED`), records simulated notification logs
    conf_resp = client.post(f"/api/sos/{sos_id}/confirm", headers=user_headers)
    assert conf_resp.status_code == 200, conf_resp.text
    conf_data = conf_resp.json()["data"]
    assert conf_data["status"] == "TRIGGERED"
    assert conf_data["triggeredAt"] is not None
    assert "Simulated notification logged" in (conf_data["notes"] or "")

    # Verify NotificationLog entries in DB are SIMULATED (never real emails)
    db = TestingSessionLocal()
    try:
        logs = db.query(NotificationLog).filter(NotificationLog.sos_id == sos_id).all()
        assert len(logs) == 4  # 4 trusted contacts remaining from previous test
        assert all(log.status == NotificationLogStatusEnum.SIMULATED.value for log in logs)
    finally:
        db.close()

    # 5.4 Security staff queue -> forbidden (403) for regular USER, allowed (200) for SECURITY_STAFF
    forbid_resp = client.get("/api/sos/manage/active", headers=user_headers)
    assert forbid_resp.status_code == 403

    queue_resp = client.get("/api/sos/manage/active", headers=sec_headers)
    assert queue_resp.status_code == 200
    queue_items = queue_resp.json()["data"]
    assert any(item["id"] == sos_id and item["status"] == "TRIGGERED" for item in queue_items)

    # 5.5 Acknowledge SOS -> `ACKNOWLEDGED`
    ack_resp = client.post(f"/api/sos/manage/{sos_id}/acknowledge", headers=sec_headers)
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()["data"]
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["acknowledgedByName"] is not None

    # 5.6 Resolve SOS -> `RESOLVED`
    res_resp = client.post(
        f"/api/sos/manage/{sos_id}/resolve",
        headers=sec_headers,
        json={"outcome": "RESOLVED", "notes": "Patrol team escorted student safely."},
    )
    assert res_resp.status_code == 200
    res_data = res_resp.json()["data"]
    assert res_data["status"] == "RESOLVED"
    assert "Patrol team escorted student safely." in res_data["notes"]

    # 5.7 Cancel SOS by user (trigger a new one and cancel it)
    trig2 = client.post(
        "/api/sos/trigger",
        headers=user_headers,
        json={"category": "MEDICAL_EMERGENCY", "lat": 30.2678, "lng": 77.9960},
    )
    assert trig2.status_code == 201
    sos2_id = trig2.json()["data"]["id"]

    cancel_resp = client.post(f"/api/sos/{sos2_id}/cancel", headers=user_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["data"]["status"] == "CANCELLED"

    # 5.8 SOS History (`GET /api/sos/history`)
    hist_resp = client.get("/api/sos/history", headers=user_headers)
    assert hist_resp.status_code == 200
    hist_list = hist_resp.json()["data"]
    assert len(hist_list) >= 2
    statuses = {item["id"]: item["status"] for item in hist_list}
    assert statuses[sos_id] == "RESOLVED"
    assert statuses[sos2_id] == "CANCELLED"


# ============================================================================
# 6. Safety Journeys (`/api/journeys/*`)
# ============================================================================
def test_safety_journeys_workflow(client: TestClient):
    user_token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    headers = auth_headers(user_token)

    # 6.1 Out-of-campus-scope coordinates rejected with 400
    out_resp = client.post(
        "/api/journeys",
        headers=headers,
        json={
            "startLat": 28.6139,  # New Delhi (far outside GEHU campus radius)
            "startLng": 77.2090,
            "destLat": 30.2675,
            "destLng": 77.9959,
            "expectedDurationMinutes": 20,
        },
    )
    assert out_resp.status_code == 400
    assert "outside the supported" in out_resp.json()["message"].lower() or out_resp.json()["success"] is False

    # 6.2 Start valid campus journey -> 201 (`ACTIVE`), returns route & trackingToken
    start_resp = client.post(
        "/api/journeys",
        headers=headers,
        json={
            "startLat": 30.2682,
            "startLng": 77.9964,
            "destLat": 30.2665,
            "destLng": 77.9948,
            "expectedDurationMinutes": 15,
        },
    )
    assert start_resp.status_code == 201, start_resp.text
    j_data = start_resp.json()["data"]
    journey_id = j_data["id"]
    tracking_token = j_data["trackingToken"]
    assert j_data["status"] == "ACTIVE"
    assert tracking_token
    assert j_data["route"] is not None
    assert len(j_data["route"]["waypoints"]) >= 2

    # 6.3 Ping location (`POST /api/journeys/{id}/ping`) -> 200
    ping_resp = client.post(
        f"/api/journeys/{journey_id}/ping",
        headers=headers,
        json={"lat": 30.2674, "lng": 77.9956},
    )
    assert ping_resp.status_code == 200
    assert ping_resp.json()["data"]["lastKnownLat"] == pytest.approx(30.2674)
    assert ping_resp.json()["data"]["lastKnownLng"] == pytest.approx(77.9956)

    # 6.4 Public share tracking (`GET /api/journeys/track/{token}`) without auth -> 200
    track_resp = client.get(f"/api/journeys/track/{tracking_token}")
    assert track_resp.status_code == 200
    track_data = track_resp.json()["data"]
    assert track_data["status"] == "ACTIVE"
    assert track_data["lastKnownLat"] == pytest.approx(30.2674)

    # 6.5 Check-in (`POST /api/journeys/{id}/checkin`) -> `COMPLETED`, subsequent tracking link -> 404
    checkin_resp = client.post(f"/api/journeys/{journey_id}/checkin", headers=headers)
    assert checkin_resp.status_code == 200
    assert checkin_resp.json()["data"]["status"] == "COMPLETED"

    expired_track = client.get(f"/api/journeys/track/{tracking_token}")
    assert expired_track.status_code == 404


# ============================================================================
# 7. Incident Reporting & AI Analysis (`/api/incidents/*`, `/api/admin/incidents/*`)
# ============================================================================
def test_incident_reporting_and_anonymity_boundaries(client: TestClient):
    user_token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    admin_token = login_demo_role(client, "admin@test.example.com")

    user_headers = auth_headers(user_token)
    admin_headers = auth_headers(admin_token)

    # 7.1 AI preview analyze (`POST /api/incidents/analyze`)
    analyze_resp = client.post(
        "/api/incidents/analyze",
        headers=user_headers,
        json={
            "description": "Someone has been following me and stalking me outside my hostel every day."
        },
    )
    assert analyze_resp.status_code == 200, analyze_resp.text
    ai_data = analyze_resp.json()["data"]
    assert ai_data["suggestedCategory"] == "STALKING"
    assert ai_data["suggestedPriority"] in ("HIGH", "CRITICAL")
    assert ai_data["confidence"] > 0.2
    assert ai_data["categoryReasoning"]

    # 7.2 Create incidents with all 3 visibility modes (`ANON_PUBLIC`, `FULL_ANON`, `NAMED_ADMIN_ONLY`)
    inc_anon_pub = client.post(
        "/api/incidents",
        headers=user_headers,
        json={
            "description": "Someone followed me near Hostel Block A entrance in the evening.",
            "category": "STALKING",
            "visibilityType": "ANON_PUBLIC",
            "lat": 30.2665,
            "lng": 77.9948,
            "areaLabel": "Hostel Block A",
        },
    )
    assert inc_anon_pub.status_code == 201
    id_anon_pub = inc_anon_pub.json()["data"]["id"]

    inc_full_anon = client.post(
        "/api/incidents",
        headers=user_headers,
        json={
            "description": "Dark pathway and no lighting behind the mechanical workshop block.",
            "category": "UNSAFE_AREA",
            "visibilityType": "FULL_ANON",
            "areaLabel": "Workshop Lane",
        },
    )
    assert inc_full_anon.status_code == 201
    id_full_anon = inc_full_anon.json()["data"]["id"]

    inc_named = client.post(
        "/api/incidents",
        headers=user_headers,
        json={
            "description": "Verbal abuse and inappropriate comments near Hostel Block A gate.",
            "category": "HARASSMENT",
            "visibilityType": "NAMED_ADMIN_ONLY",
            "areaLabel": "Hostel Block A",
        },
    )
    assert inc_named.status_code == 201
    id_named = inc_named.json()["data"]["id"]

    # 7.3 List my incidents (`GET /api/incidents/mine`) -> 200
    mine_resp = client.get("/api/incidents/mine", headers=user_headers)
    assert mine_resp.status_code == 200
    my_ids = {item["id"] for item in mine_resp.json()["data"]}
    assert {id_anon_pub, id_full_anon, id_named}.issubset(my_ids)

    # 7.4 Admin list incidents & verify anonymity boundary
    admin_list_resp = client.get("/api/admin/incidents", headers=admin_headers)
    assert admin_list_resp.status_code == 200
    by_id = {item["id"]: item for item in admin_list_resp.json()["data"]["content"]}

    assert by_id[id_anon_pub]["reporterName"] is None
    assert by_id[id_full_anon]["reporterName"] is None
    assert by_id[id_named]["reporterName"] == "Riya Verma"

    # 7.5 Admin review/override incident (`PATCH /api/admin/incidents/{id}/review`)
    review_resp = client.patch(
        f"/api/admin/incidents/{id_anon_pub}/review",
        headers=admin_headers,
        json={
            "category": "HARASSMENT",
            "priority": "CRITICAL",
            "status": "UNDER_REVIEW",
        },
    )
    assert review_resp.status_code == 200
    rev_data = review_resp.json()["data"]
    assert rev_data["category"] == "HARASSMENT"
    assert rev_data["priority"] == "CRITICAL"
    assert rev_data["status"] == "UNDER_REVIEW"
    assert rev_data["reporterName"] is None  # Still respects ANON_PUBLIC


# ============================================================================
# 8. Anonymous Community & Moderation (`/api/community/*`, `/api/moderation/*`)
# ============================================================================
def test_community_and_moderation_workflow(client: TestClient):
    user_token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    student2_token = login_demo_role(client, "user@test.example.com")
    mod_token = login_demo_role(client, "moderator@test.example.com")

    user_headers = auth_headers(user_token)
    student2_headers = auth_headers(student2_token)
    mod_headers = auth_headers(mod_token)

    # 8.1 Create clean post -> `PUBLISHED`, appears in feed, never exposes real name
    clean_post_resp = client.post(
        "/api/community/posts",
        headers=user_headers,
        json={
            "title": "Walking group from Central Library at 8 PM",
            "body": "Anyone heading to Girls Hostel Block B from the library around 8 PM tonight? Let us walk together.",
            "category": "SUPPORT",
            "areaLabel": "Central Library",
        },
    )
    assert clean_post_resp.status_code == 201, clean_post_resp.text
    clean_post = clean_post_resp.json()["data"]
    clean_post_id = clean_post["id"]
    assert "Riya Verma" not in str(clean_post)
    assert "_" in clean_post["anonymousHandle"]

    feed_resp = client.get("/api/community/posts", headers=user_headers)
    assert feed_resp.status_code == 200
    feed_items = feed_resp.json()["data"]["content"]
    assert any(p["id"] == clean_post_id for p in feed_items)
    assert "Riya Verma" not in str(feed_items)

    # 8.2 Create post with toxic/spam signals -> auto-queued (`PENDING_REVIEW`) in moderation queue
    flagged_post_resp = client.post(
        "/api/community/posts",
        headers=user_headers,
        json={
            "title": "Check out this promotional link right now",
            "body": "Click here https://spam-example.com to buy now and earn money with this limited offer!",
            "category": "QUESTION",
            "areaLabel": "Main Gate",
        },
    )
    assert flagged_post_resp.status_code == 201
    flagged_post_id = flagged_post_resp.json()["data"]["id"]

    # Should NOT appear in public feed while PENDING_REVIEW
    feed_after = client.get("/api/community/posts", headers=student2_headers).json()["data"]["content"]
    assert all(p["id"] != flagged_post_id for p in feed_after)

    # 8.3 Add comment, upvote/downvote toggle on post and comment, report content, duplicate report rejected
    comment_resp = client.post(
        f"/api/community/posts/{clean_post_id}/comments",
        headers=student2_headers,
        json={"body": "Count me in! I will meet you near the library reading hall entrance."},
    )
    assert comment_resp.status_code == 201
    comment_id = comment_resp.json()["data"]["id"]
    assert "Ananya Sharma" not in str(comment_resp.json())

    # Upvote post (+1), then toggle same upvote (0), then downvote (-1)
    v1 = client.post(
        f"/api/community/posts/{clean_post_id}/vote",
        headers=student2_headers,
        json={"voteValue": 1},
    )
    assert v1.status_code == 200 and v1.json()["data"] == 1

    v2 = client.post(
        f"/api/community/posts/{clean_post_id}/vote",
        headers=student2_headers,
        json={"voteValue": 1},
    )
    assert v2.status_code == 200 and v2.json()["data"] == 0

    v3 = client.post(
        f"/api/community/posts/{clean_post_id}/vote",
        headers=student2_headers,
        json={"voteValue": -1},
    )
    assert v3.status_code == 200 and v3.json()["data"] == -1

    # Upvote comment
    vc = client.post(
        f"/api/community/comments/{comment_id}/vote",
        headers=user_headers,
        json={"voteValue": 1},
    )
    assert vc.status_code == 200 and vc.json()["data"] == 1

    # Report content (`POST /api/community/report`) and verify duplicate report is rejected (400)
    rep1 = client.post(
        "/api/community/report",
        headers=student2_headers,
        json={"targetType": "COMMENT", "targetId": comment_id, "reason": "Testing user report workflow"},
    )
    assert rep1.status_code == 200

    rep_dup = client.post(
        "/api/community/report",
        headers=student2_headers,
        json={"targetType": "COMMENT", "targetId": comment_id, "reason": "Duplicate report"},
    )
    assert rep_dup.status_code == 400

    # 8.4 Moderator reviews queue (`GET /api/moderation/queue`, `POST /api/moderation/queue/{id}/review`)
    mod_queue_resp = client.get("/api/moderation/queue", headers=mod_headers)
    assert mod_queue_resp.status_code == 200
    queue_content = mod_queue_resp.json()["data"]["content"]

    ai_flagged_item = next(
        (item for item in queue_content if item["targetType"] == "POST" and item["targetId"] == flagged_post_id),
        None,
    )
    assert ai_flagged_item is not None
    assert ai_flagged_item["flaggedBy"] == "AI"

    # Moderator removes the spam post
    rev_mod_resp = client.post(
        f"/api/moderation/queue/{ai_flagged_item['queueId']}/review",
        headers=mod_headers,
        json={"decision": "REMOVED"},
    )
    assert rev_mod_resp.status_code == 200

    # Moderator approves the reported comment
    user_flagged_item = next(
        (item for item in queue_content if item["targetType"] == "COMMENT" and item["targetId"] == comment_id),
        None,
    )
    assert user_flagged_item is not None
    rev_comment_resp = client.post(
        f"/api/moderation/queue/{user_flagged_item['queueId']}/review",
        headers=mod_headers,
        json={"decision": "APPROVED"},
    )
    assert rev_comment_resp.status_code == 200


# ============================================================================
# 9. Analytics, Admin Dashboard, User Management & Audit Logs
# ============================================================================
def test_analytics_dashboard_users_and_audit_logs(client: TestClient):
    user_token = login_demo_role(client, "riya.verma@gehu.ac.in", "StrongPass@123")
    admin_token = login_demo_role(client, "admin@test.example.com")

    user_headers = auth_headers(user_token)
    admin_headers = auth_headers(admin_token)

    # Add one more incident in "Hostel Block A" so "Hostel Block A" has >= 3 reports
    # while "Workshop Lane" has only 1 report (below MIN_GROUP_SIZE = 3)
    extra_inc = client.post(
        "/api/incidents",
        headers=user_headers,
        json={
            "description": "Another suspicious person loitering near Hostel Block A entrance.",
            "category": "STALKING",
            "visibilityType": "ANON_PUBLIC",
            "areaLabel": "Hostel Block A",
        },
    )
    assert extra_inc.status_code == 201

    # 9.1 Safety analytics (`GET /api/analytics/safety`) enforces k-anonymity area suppression (`MIN_GROUP_SIZE = 3`)
    analytics_resp = client.get("/api/analytics/safety?windowDays=30", headers=admin_headers)
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()["data"]
    assert analytics_data["reportsByArea"].get("Hostel Block A", 0) >= 3
    assert "Workshop Lane" not in analytics_data["reportsByArea"]  # Suppressed by k-anonymity (< 3 reports)
    assert "fewer than 3 reports are omitted" in analytics_data["disclaimer"]

    # 9.2 Dashboard summary (`GET /api/admin/dashboard/summary`)
    dash_resp = client.get("/api/admin/dashboard/summary?windowDays=30", headers=admin_headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()["data"]
    assert dash_data["totalIncidents"] >= 4
    assert dash_data["totalEmergencyEvents"] >= 2
    assert dash_data["totalCommunityPosts"] >= 3

    # 9.3 User management (`GET /api/admin/users`, `PATCH .../role`, `PATCH .../status`)
    users_resp = client.get("/api/admin/users", headers=admin_headers)
    assert users_resp.status_code == 200
    users_list = users_resp.json()["data"]["content"]
    admin_user = next(u for u in users_list if u["email"] == "admin@test.example.com")
    riya_user = next(u for u in users_list if u["email"] == "riya.verma@gehu.ac.in")

    # Admin cannot demote self -> 400
    self_demote = client.patch(
        f"/api/admin/users/{admin_user['id']}/role",
        headers=admin_headers,
        json={"role": "USER"},
    )
    assert self_demote.status_code == 400

    # Admin cannot suspend self -> 400
    self_suspend = client.patch(
        f"/api/admin/users/{admin_user['id']}/status",
        headers=admin_headers,
        json={"active": False},
    )
    assert self_suspend.status_code == 400

    # Admin can update another user's role and status
    role_upd = client.patch(
        f"/api/admin/users/{riya_user['id']}/role",
        headers=admin_headers,
        json={"role": "MODERATOR"},
    )
    assert role_upd.status_code == 200
    assert role_upd.json()["data"]["role"] == "MODERATOR"

    status_upd = client.patch(
        f"/api/admin/users/{riya_user['id']}/status",
        headers=admin_headers,
        json={"active": False},
    )
    assert status_upd.status_code == 200
    assert status_upd.json()["data"]["active"] is False

    # Re-activate user and restore role
    client.patch(
        f"/api/admin/users/{riya_user['id']}/status",
        headers=admin_headers,
        json={"active": True},
    )
    client.patch(
        f"/api/admin/users/{riya_user['id']}/role",
        headers=admin_headers,
        json={"role": "USER"},
    )

    # 9.4 Audit logs (`GET /api/admin/audit-logs`)
    audit_resp = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    audit_items = audit_resp.json()["data"]["content"]
    assert len(audit_items) > 0
    action_types = {a["actionType"] for a in audit_items}
    assert "SOS_TRIGGER_INITIATED" in action_types
    assert "INCIDENT_CREATED" in action_types
    assert "USER_ROLE_CHANGED" in action_types

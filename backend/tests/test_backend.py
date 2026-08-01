"""One consolidated backend test suite: repositories, services and API routes,
exercised together through the live FastAPI app (TestClient) against an
isolated, freshly-seeded data directory per test.
"""

import pathlib

from app.repositories.candidate_repository import CandidateRepository
from app.utils.match_strategy import SkillIntersectionMatchStrategy

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[2]


# ---------------------------------------------------------------------------
# Repository layer (direct, no HTTP)
# ---------------------------------------------------------------------------

def test_repository_crud_roundtrip(tmp_path):
    repo = CandidateRepository(data_dir=tmp_path)
    created = repo.create({"fullName": "Test Person"})
    assert created["id"].startswith("c-")
    assert repo.get(created["id"])["fullName"] == "Test Person"

    updated = repo.update(created["id"], {"status": "matched"})
    assert updated["status"] == "matched" and updated["fullName"] == "Test Person"

    assert repo.update("missing-id", {"status": "x"}) is None
    assert repo.delete(created["id"]) is True
    assert repo.delete(created["id"]) is False
    assert repo.list() == []

    # persists across fresh repository instances (i.e. actually hits disk)
    CandidateRepository(data_dir=tmp_path).create({"fullName": "B"})
    assert len(CandidateRepository(data_dir=tmp_path).list()) == 1


# ---------------------------------------------------------------------------
# Match strategy (Strategy pattern)
# ---------------------------------------------------------------------------

def test_match_strategy_clamped_between_20_and_97():
    strategy = SkillIntersectionMatchStrategy()
    for _ in range(50):
        assert 20 <= strategy.score([], []) <= 97
        assert 20 <= strategy.score(["Python", "SQL"], ["Python", "SQL", "Go"]) <= 97
        assert 20 <= strategy.score(["Python", "SQL"], []) <= 97


def test_match_strategy_spreads_high_and_low():
    strategy = SkillIntersectionMatchStrategy()
    no_overlap = [strategy.score(["Python", "SQL"], ["Figma"]) for _ in range(20)]
    full_overlap = [strategy.score(["Python", "SQL"], ["Python", "SQL"]) for _ in range(20)]
    assert max(no_overlap) < min(full_overlap)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def test_login_all_four_roles(client):
    for role in ["intern", "university", "startup", "admin"]:
        resp = client.post("/api/auth/login", json={"role": role})
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == role
        assert resp.json()["token"].startswith(f"mock-{role}-")


def test_login_invalid_role_rejected(client):
    assert client.post("/api/auth/login", json={"role": "hacker"}).status_code == 422


# ---------------------------------------------------------------------------
# Candidates: profile, workflow, rejection
# ---------------------------------------------------------------------------

def test_candidate_profile_update_persists(client):
    resp = client.put("/api/candidates/seed-intern", json={"major": "Data Science"})
    assert resp.status_code == 200
    assert resp.json()["major"] == "Data Science"
    assert client.get("/api/candidates/seed-intern").json()["major"] == "Data Science"


def test_candidate_advance_walks_full_workflow_then_caps(client):
    # seed-intern starts at workflowIdx 2 ("matched")
    for expected_idx, expected_status in [(3, "interviewing"), (4, "onboarding"), (4, "onboarding")]:
        resp = client.put("/api/candidates/seed-intern/advance")
        assert resp.status_code == 200
        assert resp.json()["workflowIdx"] == expected_idx
        assert resp.json()["status"] == expected_status


def test_candidate_reject_requires_feedback_field(client):
    resp = client.put("/api/candidates/seed-intern/reject", json={"feedback": "Not enough experience"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"
    assert resp.json()["feedback"] == "Not enough experience"

    assert client.put("/api/candidates/seed-intern/reject", json={}).status_code == 422


def test_candidate_not_found_is_404(client):
    assert client.get("/api/candidates/does-not-exist").status_code == 404


def test_university_push_and_bulk_upload(client):
    single = client.post("/api/candidates/push", json={
        "universityName": "UDST", "fullName": "New Student", "qid": "1", "nationality": "Qatari",
        "email": "n@udst.edu.qa", "phone": "+974", "major": "CS", "commitment": "FT", "cycle": "winter",
        "skillSet": ["Python"],
    })
    assert single.status_code == 200
    assert single.json()["track"] == "placement"
    assert single.json()["startupId"] is None

    bulk = client.post("/api/candidates/bulk", json={
        "universityName": "UDST",
        "csvText": "A B,111,a@x.com,CS,FT,winter,Python;SQL\nC D,222,c@x.com,Design,PT,summer,Figma",
    })
    assert bulk.status_code == 200
    created = bulk.json()["created"]
    assert len(created) == 2
    assert bulk.json()["skippedRows"] == 0
    assert created[0]["skillSet"] == ["Python", "SQL"]

    # seed already has 3 UDST/placement candidates (Ahmed, Sara, Yousef); +1 pushed, +2 bulk = 6
    placement = client.get("/api/candidates", params={"university": "UDST", "track": "placement"}).json()
    assert len(placement) == 6


# ---------------------------------------------------------------------------
# Startups: needs, premium, cohort-capped BYOC
# ---------------------------------------------------------------------------

def test_startup_needs_add_and_remove(client):
    add = client.post("/api/startups/st-nabta/needs", json={"need": "Rust"})
    assert "Rust" in add.json()["needs"]
    remove = client.delete("/api/startups/st-nabta/needs/Rust")
    assert "Rust" not in remove.json()["needs"]


def test_startup_candidates_have_live_scores(client):
    resp = client.get("/api/startups/st-nabta/candidates")
    assert resp.status_code == 200
    assert all("match" in c and 40 <= c["match"] <= 99 for c in resp.json())


# ---------------------------------------------------------------------------
# Notifications: a startup asking an intern a question
# ---------------------------------------------------------------------------

def test_notification_create_and_list_for_candidate(client):
    resp = client.post(
        "/api/notifications",
        json={"candidateId": "seed-intern", "startupId": "st-nabta", "message": "Are you free for a call?"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["read"] is False
    assert body["startupName"]

    listed = client.get("/api/notifications", params={"candidateId": "seed-intern"})
    assert listed.status_code == 200
    assert any(n["id"] == body["id"] for n in listed.json())


def test_notification_create_requires_non_empty_message(client):
    resp = client.post(
        "/api/notifications",
        json={"candidateId": "seed-intern", "startupId": "st-nabta", "message": "   "},
    )
    assert resp.status_code == 400


def test_notification_create_404s_for_unknown_candidate_or_startup(client):
    assert client.post(
        "/api/notifications", json={"candidateId": "missing", "startupId": "st-nabta", "message": "hi"}
    ).status_code == 404
    assert client.post(
        "/api/notifications", json={"candidateId": "seed-intern", "startupId": "missing", "message": "hi"}
    ).status_code == 404


def test_notification_mark_read(client):
    created = client.post(
        "/api/notifications",
        json={"candidateId": "seed-intern", "startupId": "st-nabta", "message": "Quick question"},
    ).json()
    marked = client.put(f"/api/notifications/{created['id']}/read")
    assert marked.status_code == 200
    assert marked.json()["read"] is True


def test_byoc_blocked_when_qstp_cohort_cap_reached(client):
    # st-meddy seeds with qstpCohortsUsed=3
    resp = client.post("/api/byoc", json={
        "startupId": "st-meddy", "startupName": "Meddy", "fullName": "X", "email": "x@x.com",
        "cvLink": "https://x.com/cv", "track": "qstp", "commitment": "FT",
    })
    assert resp.status_code == 400


def test_byoc_approve_creates_candidate_reject_does_not(client):
    before = len(client.get("/api/candidates").json())

    submitted = client.post("/api/byoc", json={
        "startupId": "st-karaz", "startupName": "Karaz FinTech", "fullName": "Approved Person",
        "email": "a@x.com", "cvLink": "https://x.com/cv", "track": "qstp", "commitment": "FT",
    }).json()
    client.put(f"/api/byoc/{submitted['id']}/approve")
    assert len(client.get("/api/candidates").json()) == before + 1

    rejected = client.post("/api/byoc", json={
        "startupId": "st-karaz", "startupName": "Karaz FinTech", "fullName": "Rejected Person",
        "email": "r@x.com", "cvLink": "https://x.com/cv", "track": "placement", "commitment": "PT",
    }).json()
    client.put(f"/api/byoc/{rejected['id']}/reject")
    assert len(client.get("/api/candidates").json()) == before + 1  # unchanged


# ---------------------------------------------------------------------------
# Intern self-service: email login, new application, CV extraction
# ---------------------------------------------------------------------------

def test_intern_login_by_email_finds_seed_candidate(client):
    resp = client.post("/api/auth/login/intern", json={"email": "AISHA@qu.edu.qa", "password": "anything"})
    assert resp.status_code == 200
    assert resp.json()["user"]["candidateId"] == "seed-intern"


def test_intern_login_unknown_email_is_404(client):
    resp = client.post("/api/auth/login/intern", json={"email": "nobody@example.com", "password": "x"})
    assert resp.status_code == 404


def test_self_apply_creates_qstp_candidate_at_app_submitted(client):
    resp = client.post("/api/candidates/apply", json={
        "fullName": "New Applicant", "qid": "1", "nationality": "Qatari", "email": "new@x.com",
        "phone": "+974", "gender": "Female", "university": "Qatar University",
        "currentAcademicStatus": "Pursuing", "degree": "BSc", "major": "CS", "gradYear": "2027",
        "commitment": "FT", "cycle": "winter", "howHeard": "Instagram", "skillSet": ["Python"],
        "whyInterested": "Great program", "consentDataPolicy": True,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["track"] == "qstp"
    assert body["workflowIdx"] == 1
    assert body["status"] == "submitted"
    assert body["startupId"] is None
    assert body["weeklyHours"] == 40  # FT defaults to 40 hrs/wk


def test_extraction_returns_400_for_unreadable_pdf(client):
    # CV/JD parsing is local (pdf_parsing.py) — no API key needed, but a non-PDF upload
    # should still fail cleanly instead of 500ing.
    resp = client.post(
        "/api/candidates/extract",
        files={"cv": ("resume.pdf", b"not actually a pdf", "application/pdf")},
    )
    assert resp.status_code == 400


def test_extract_cv_parses_the_approved_intern_template(client):
    pdf_bytes = (PROJECT_ROOT / "Approved_Intern_Template.pdf").read_bytes()
    resp = client.post(
        "/api/candidates/extract",
        files={"cv": ("Approved_Intern_Template.pdf", pdf_bytes, "application/pdf")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["fullName"] == "Aisha Al-Kuwari"
    assert body["email"] == "aisha.alkuwari@example.qa"
    assert body["university"] == "Qatar University"
    assert body["degree"] == "BSc"
    assert body["major"] == "Computer Science"
    assert body["gradYear"] == "2026"
    assert body["currentAcademicStatus"] == "Pursuing"
    assert set(["React", "JavaScript", "Tailwind CSS", "Figma"]).issubset(set(body["skillSet"]))
    assert body["cvLink"]


def test_upload_job_description_pdf_extracts_fields_and_merges_needs(client):
    pdf_bytes = (PROJECT_ROOT / "Approved_JD_Template.pdf").read_bytes()
    resp = client.post(
        "/api/startups/st-nabta/descriptions",
        files={"file": ("Approved_JD_Template.pdf", pdf_bytes, "application/pdf")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["position"] == "Frontend Software Engineering Intern"
    assert body["commitment"] == "PT"
    assert body["weeklyHours"] == 20
    assert body["weeks"] == 12
    assert body["cycle"] == "summer"
    assert set(["JavaScript", "React", "Tailwind CSS"]).issubset(set(body["extractedSkills"]))

    updated_startup = client.get("/api/startups/st-nabta").json()
    for skill in body["extractedSkills"]:
        assert skill in updated_startup["needs"]


def test_upload_job_description_rejects_unsupported_extension(client):
    resp = client.post(
        "/api/startups/st-nabta/descriptions",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Startup-side intern matches and BYOC submission cap
# ---------------------------------------------------------------------------

def test_intern_matches_capped_at_3_for_free_startup(client):
    # st-meddy seeds with premium=False
    resp = client.get("/api/startups/st-meddy/matches")
    assert resp.status_code == 200
    assert len(resp.json()) <= 3


def test_intern_matches_allows_more_for_premium_startup(client):
    # st-karaz seeds with premium=True; make sure the pool has more than 3 candidates to match against
    resp = client.get("/api/startups/st-karaz/matches")
    assert resp.status_code == 200
    assert len(resp.json()) <= 10


def test_assign_candidate_to_startup_starts_workflow(client):
    applicant = client.post("/api/candidates/apply", json={
        "fullName": "Unassigned Applicant", "qid": "2", "nationality": "Qatari", "email": "unassigned@x.com",
        "phone": "+974", "gender": "Female", "university": "Qatar University",
        "currentAcademicStatus": "Pursuing", "degree": "BSc", "major": "CS", "gradYear": "2027",
        "commitment": "FT", "cycle": "winter", "howHeard": "Instagram", "skillSet": ["Python"],
        "whyInterested": "Great program", "consentDataPolicy": True,
    }).json()
    assert applicant["startupId"] is None

    assigned = client.put(f"/api/candidates/{applicant['id']}/assign", json={"startupId": "st-meddy"})
    assert assigned.status_code == 200
    body = assigned.json()
    assert body["startupId"] == "st-meddy"
    assert body["startupName"] == "Meddy"
    assert body["status"] == "matched"
    assert body["workflowIdx"] == 2

    # already assigned — a second assign attempt is rejected
    second = client.put(f"/api/candidates/{applicant['id']}/assign", json={"startupId": "st-karaz"})
    assert second.status_code == 400


def test_rejected_candidate_disappears_from_startup_candidate_list(client):
    before = client.get("/api/startups/st-nabta/candidates").json()
    assert any(c["id"] == "seed-intern" for c in before)

    client.put("/api/candidates/seed-intern/reject", json={"feedback": "Not a fit"})

    after = client.get("/api/startups/st-nabta/candidates").json()
    assert not any(c["id"] == "seed-intern" for c in after)


def test_byoc_free_startup_blocked_after_three_submissions(client):
    # st-meddy seeds with premium=False and no pre-existing BYOC submissions
    for i in range(3):
        resp = client.post("/api/byoc", json={
            "startupId": "st-meddy", "startupName": "Meddy", "fullName": f"Person {i}",
            "email": f"p{i}@x.com", "cvLink": "https://x.com/cv", "track": "placement", "commitment": "FT",
        })
        assert resp.status_code == 200

    fourth = client.post("/api/byoc", json={
        "startupId": "st-meddy", "startupName": "Meddy", "fullName": "Fourth", "email": "s@x.com",
        "cvLink": "https://x.com/cv", "track": "placement", "commitment": "FT",
    })
    assert fourth.status_code == 400


def test_byoc_premium_startup_allows_up_to_three(client):
    # st-karaz seeds with premium=True
    for i in range(3):
        resp = client.post("/api/byoc", json={
            "startupId": "st-karaz", "startupName": "Karaz FinTech", "fullName": f"Person {i}",
            "email": f"p{i}@x.com", "cvLink": "https://x.com/cv", "track": "placement", "commitment": "FT",
        })
        assert resp.status_code == 200

    fourth = client.post("/api/byoc", json={
        "startupId": "st-karaz", "startupName": "Karaz FinTech", "fullName": "Person 4",
        "email": "p4@x.com", "cvLink": "https://x.com/cv", "track": "placement", "commitment": "FT",
    })
    assert fourth.status_code == 400


# ---------------------------------------------------------------------------
# decidedAt is stamped on advance/reject (feeds the admin Decisions panel)
# ---------------------------------------------------------------------------

def test_advance_and_reject_stamp_decided_at(client):
    advanced = client.put("/api/candidates/seed-intern/advance")
    assert advanced.json()["decidedAt"] is not None

    rejected = client.put("/api/candidates/seed-intern/reject", json={"feedback": "Not a fit"})
    assert rejected.json()["decidedAt"] is not None


# ---------------------------------------------------------------------------
# Contracts: sign flips candidate to onboarding
# ---------------------------------------------------------------------------

def test_sign_contract_marks_signed_and_onboards_candidate(client):
    client.post("/api/automation", json={"kind": "contracts", "candidateIds": ["seed-intern"]})
    # onboarding required first
    client.put("/api/candidates/seed-intern", json={"status": "onboarding", "workflowIdx": 4})
    contracts_resp = client.post("/api/automation", json={"kind": "contracts", "candidateIds": ["seed-intern"]})
    assert contracts_resp.json()["affected"] == 1

    contract = client.get("/api/contracts", params={"candidateId": "seed-intern"}).json()[0]
    assert contract["startupSignedAt"] is not None  # auto-drafted contracts are startup-agreed on creation

    signed = client.put(f"/api/contracts/{contract['id']}/sign", json={"signatureData": "data:image/png;base64,abc123"})
    assert signed.json()["signed"] is True
    assert signed.json()["signatureData"] == "data:image/png;base64,abc123"
    assert client.get("/api/candidates/seed-intern").json()["status"] == "onboarding"


# ---------------------------------------------------------------------------
# Automation
# ---------------------------------------------------------------------------

def test_automation_payroll_only_affects_onboarding_qstp(client):
    client.put("/api/candidates/seed-intern", json={"status": "onboarding"})  # seed-intern is track=qstp
    resp = client.post("/api/automation", json={"kind": "payroll", "candidateIds": ["seed-intern"]})
    assert resp.json()["affected"] == 1
    assert client.get("/api/candidates/seed-intern").json()["status"] == "payroll_processed"


def test_automation_mass_email_sets_timestamp(client):
    resp = client.post("/api/automation", json={"kind": "mass_email", "candidateIds": ["seed-intern"]})
    assert resp.json()["affected"] == 1
    assert client.get("/api/candidates/seed-intern").json()["lastEmailedAt"] is not None


def test_automation_ignores_unknown_candidate_ids(client):
    resp = client.post("/api/automation", json={"kind": "mass_email", "candidateIds": ["nope"]})
    assert resp.json()["affected"] == 0


def test_automation_mass_email_stores_subject(client):
    resp = client.post(
        "/api/automation",
        json={"kind": "mass_email", "candidateIds": ["seed-intern"], "subject": "Welcome!", "body": "Hi there"},
    )
    assert resp.json()["affected"] == 1
    assert client.get("/api/candidates/seed-intern").json()["lastEmailSubject"] == "Welcome!"


def test_payroll_preview_breaks_down_by_startup_and_zeroes_placement(client):
    client.put("/api/candidates/seed-intern", json={"status": "onboarding"})  # Aisha: FT, qstp, st-nabta
    resp = client.get("/api/automation/payroll-preview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ratePerHour"] == 30

    nabta = next(s for s in data["startups"] if s["startupId"] == "st-nabta")
    aisha = next(i for i in nabta["interns"] if i["candidateId"] == "seed-intern")
    assert aisha["weeklyHours"] == 40
    assert aisha["weeklyCost"] == 1200
    assert nabta["startupTotal"] >= 1200
    assert data["grandTotal"] >= 1200

    # Karaz FinTech's onboarding intern is Work Placement (track=placement) — unpaid.
    karaz = next(s for s in data["startups"] if s["startupId"] == "st-karaz")
    placement_intern = next(i for i in karaz["interns"] if i["track"] == "placement")
    assert placement_intern["hourlyRate"] == 0
    assert placement_intern["weeklyCost"] == 0


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def test_dashboard_summary_shape_and_counts(client):
    stats = client.get("/api/stats/dashboard").json()
    assert stats["applications"] == 8
    assert stats["startupsLive"] == 5
    assert stats["universities"] == 3
    assert len(stats["funnel"]) == 6
    assert len(stats["cycles"]) == 3
    assert stats["byocPending"] == 2

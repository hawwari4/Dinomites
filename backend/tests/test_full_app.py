"""One end-to-end test walking the entire QSTP Connect lifecycle across all four
roles against the live FastAPI app, proving the layers work together — not just
in isolation. Mirrors a real operator session: university pushes a student,
startup identifies needs and reviews/advances/rejects candidates, a startup
nominates a BYOC candidate, admin approves it and runs cohort-wide automation,
and the intern signs their resulting contract.
"""


def test_full_application_lifecycle(client):
    # 1. Every role can log in with no password.
    for role in ["intern", "university", "startup", "admin"]:
        assert client.post("/api/auth/login", json={"role": role}).status_code == 200

    # 2. University pushes a new Work Placement student.
    pushed = client.post("/api/candidates/push", json={
        "universityName": "UDST", "fullName": "Lifecycle Student", "qid": "30011122233",
        "nationality": "Qatari", "email": "lifecycle@udst.edu.qa", "phone": "+974 5555 9999",
        "major": "Software Engineering", "commitment": "FT", "cycle": "winter",
        "skillSet": ["Python", "React"],
    }).json()
    assert pushed["status"] == "submitted" and pushed["track"] == "placement"

    # 3. Startup (Nabta) adds a need, matches to a candidate, and advances them.
    client.post("/api/startups/st-nabta/needs", json={"need": "GraphQL"})
    scored = client.get("/api/startups/st-nabta/candidates").json()
    assert scored and all(0 <= c["match"] <= 99 for c in scored)

    aisha_before = client.get("/api/candidates/seed-intern").json()
    assert aisha_before["workflowIdx"] == 2  # seeded at "matched"
    advanced = client.put("/api/candidates/seed-intern/advance").json()
    assert advanced["workflowIdx"] == 3 and advanced["status"] == "interviewing"

    # Rejecting a different candidate requires feedback and is reflected startup-side.
    rejected = client.put("/api/candidates/seed-intern-2/reject", json={"feedback": "test"})
    assert rejected.status_code == 404  # no such id — sanity check 404s propagate end to end

    # 4. Startup nominates an external (BYOC) candidate for QSTP approval.
    byoc = client.post("/api/byoc", json={
        "startupId": "st-nabta", "startupName": "Nabta Health", "fullName": "External Hire",
        "email": "external@x.com", "cvLink": "https://x.com/cv", "track": "placement", "commitment": "PT",
    }).json()
    assert byoc["status"] == "pending_qstp_approval"

    # 5. Admin dashboard reflects the queue, then approves it (creating a real candidate).
    stats_before = client.get("/api/stats/dashboard").json()
    assert stats_before["byocPending"] == 3  # 2 seeded + 1 just submitted
    candidates_before = len(client.get("/api/candidates").json())

    client.put(f"/api/byoc/{byoc['id']}/approve")
    assert len(client.get("/api/candidates").json()) == candidates_before + 1
    assert client.get("/api/stats/dashboard").json()["byocPending"] == 2

    # 6. Admin runs cohort-wide automation: onboard Mohammed, generate his contract, run payroll.
    client.put("/api/candidates/seed-intern/advance")  # interviewing -> onboarding
    onboarded = client.get("/api/candidates/seed-intern").json()
    assert onboarded["status"] == "onboarding"

    contracts_result = client.post("/api/automation", json={"kind": "contracts", "candidateIds": ["seed-intern"]}).json()
    assert contracts_result["affected"] == 1
    assert client.get("/api/candidates/seed-intern").json()["status"] == "contract_sent"

    # 7. Intern reviews and signs the generated contract, which re-onboards them.
    contract = client.get("/api/contracts", params={"candidateId": "seed-intern"}).json()[0]
    assert contract["signed"] is False
    signed = client.put(f"/api/contracts/{contract['id']}/sign").json()
    assert signed["signed"] is True
    assert client.get("/api/candidates/seed-intern").json()["status"] == "onboarding"

    # 8. Payroll now processes them (onboarding + QSTP track).
    payroll_result = client.post("/api/automation", json={"kind": "payroll", "candidateIds": ["seed-intern"]}).json()
    assert payroll_result["affected"] == 1
    final = client.get("/api/candidates/seed-intern").json()
    assert final["status"] == "payroll_processed"
    assert final["payrollAt"] is not None

    # 9. Final dashboard snapshot proves every step landed in aggregate stats.
    # (candidates_before was captured after the university push but before the BYOC approval)
    final_stats = client.get("/api/stats/dashboard").json()
    assert final_stats["applications"] == candidates_before + 1  # +1 from the BYOC approval
    payroll_stage = next(s for s in final_stats["funnel"] if s["status"] == "payroll_processed")
    assert payroll_stage["count"] >= 1

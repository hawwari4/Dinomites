"""Seeds backend/data/*.json with the same demo data the original single-page
app generated via ensureSeed()/buildCandidate() — so the migrated app opens
into an identical demo state. Runs once: skipped if candidates.json already exists.
"""

from datetime import datetime, timedelta, timezone

from app.core import config
from app.repositories.byoc_repository import ByocRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.startup_repository import StartupRepository
from app.repositories.university_repository import UniversityRepository
from app.utils.factories import CandidateFactory


def _days_ago(n: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=n)).isoformat()


UNIVERSITIES = [
    {"id": "uni-udst", "name": "UDST", "focus": "Applied Sciences", "pushed": 12},
    {"id": "uni-hbku", "name": "HBKU", "focus": "AI & Research", "pushed": 9},
    {"id": "uni-qu", "name": "Qatar University", "focus": "General", "pushed": 21},
]

STARTUPS = [
    {"id": "st-nabta", "name": "Nabta Health", "sector": "HealthTech", "location": "Tech 2", "qstpCohortsUsed": 1, "premium": True, "needs": ["React", "TypeScript", "Figma", "A/B testing", "Python"]},
    {"id": "st-meddy", "name": "Meddy", "sector": "HealthTech", "location": "Tech 1", "qstpCohortsUsed": 3, "premium": False, "needs": ["Python", "PyTorch", "SQL", "MLOps"]},
    {"id": "st-baladna", "name": "Baladna Ventures", "sector": "AgriTech", "location": "Tech 3", "qstpCohortsUsed": 3, "premium": True, "needs": ["Aspen", "Process Design", "Sustainability", "MATLAB"]},
    {"id": "st-snoonu", "name": "Snoonu Labs", "sector": "Logistics", "location": "Innovation Hub", "qstpCohortsUsed": 2, "premium": False, "needs": ["Node.js", "Kubernetes", "Go", "GIS"]},
    {"id": "st-karaz", "name": "Karaz FinTech", "sector": "FinTech", "location": "Tech 2", "qstpCohortsUsed": 0, "premium": True, "needs": ["React", "Python", "Compliance", "SQL", "Data Viz"]},
]


def _seed_candidates() -> list[dict]:
    return [
        CandidateFactory.build(
            id="seed-intern", fullName="Aisha Al-Kuwari", qid="29812345678", nationality="Qatari",
            email="aisha@qu.edu.qa", phone="+974 5555 1201", gender="Female",
            university="Qatar University", currentAcademicStatus="Pursuing", degree="BSc",
            major="Computer Science", gradYear="2027", commitment="FT", cycle="winter", track="qstp",
            startupId="st-nabta", startupName="Nabta Health",
            skillSet=["React", "TypeScript", "Figma", "JavaScript", "A/B testing"],
            cvLink="https://drive.qstp.qa/cv/aisha.pdf", linkedin="https://linkedin.com/in/aisha",
            portfolio="https://github.com/aisha", status="matched", workflowIdx=2, match=92,
            appliedAt=_days_ago(6),
        ),
        CandidateFactory.build(
            fullName="Fatima Al-Sulaiti", qid="29901234567", nationality="Qatari", email="fatima@qu.edu.qa",
            phone="+974 5555 1202", gender="Female", university="Qatar University",
            currentAcademicStatus="Pursuing", degree="BSc", major="Design", gradYear="2027",
            commitment="PT", cycle="winter", track="qstp", startupId="st-nabta", startupName="Nabta Health",
            skillSet=["Figma", "UX Research", "React"], status="interviewing", workflowIdx=3, match=87,
            appliedAt=_days_ago(10),
        ),
        CandidateFactory.build(
            fullName="Mohammed Al-Thani", qid="29612345678", nationality="Qatari", email="m.thani@hbku.edu.qa",
            phone="+974 5555 1203", gender="Male", university="HBKU", currentAcademicStatus="Pursuing",
            degree="MSc", major="AI Engineering", gradYear="2026", commitment="FT", cycle="summer",
            track="qstp", startupId="st-meddy", startupName="Meddy",
            skillSet=["Python", "PyTorch", "MLOps", "SQL"], status="onboarding", workflowIdx=4, match=96,
            appliedAt=_days_ago(22),
        ),
        CandidateFactory.build(
            fullName="Ahmed Al-Meer", qid="28912345678", nationality="Qatari", email="ahmed.meer@udst.edu.qa",
            phone="+974 5555 1204", gender="Male", university="UDST", currentAcademicStatus="Pursuing",
            degree="BSc", major="Mechanical Engineering", gradYear="2027", commitment="PT", cycle="winter",
            track="placement", startupId="st-baladna", startupName="Baladna Ventures",
            skillSet=["MATLAB", "SolidWorks", "CAD", "Sustainability"], status="matched", workflowIdx=2,
            match=81, appliedAt=_days_ago(4),
        ),
        CandidateFactory.build(
            fullName="Sara Ibrahim", qid="29012345678", nationality="Egyptian", email="sara.i@udst.edu.qa",
            phone="+974 5555 1205", gender="Female", university="UDST", currentAcademicStatus="Pursuing",
            degree="BSc", major="Interaction Design", gradYear="2027", commitment="PT", cycle="summer",
            track="placement", startupId="st-snoonu", startupName="Snoonu Labs",
            skillSet=["Figma", "UX Research", "Prototyping"], status="submitted", workflowIdx=1, match=74,
            appliedAt=_days_ago(2),
        ),
        CandidateFactory.build(
            fullName="Yousef Al-Kubaisi", qid="28812345678", nationality="Qatari", email="yousef.k@udst.edu.qa",
            phone="+974 5555 1206", gender="Male", university="UDST",
            currentAcademicStatus="Graduated within 2 years", degree="BSc", major="Business Analytics",
            gradYear="2025", commitment="FT", cycle="fall", track="placement", startupId="st-karaz",
            startupName="Karaz FinTech", skillSet=["Excel", "SQL", "PowerBI", "Data Viz"], status="onboarding",
            workflowIdx=4, match=89, appliedAt=_days_ago(15),
        ),
        CandidateFactory.build(
            fullName="Noora Al-Marri", qid="29112345678", nationality="Qatari", email="noora@tamu.qa",
            phone="+974 5555 1207", gender="Female", university="Texas A&M Qatar",
            currentAcademicStatus="Pursuing", degree="BSc", major="Chemical Engineering", gradYear="2026",
            commitment="FT", cycle="summer", track="qstp", startupId="st-baladna",
            startupName="Baladna Ventures", skillSet=["Aspen", "Process Design", "Sustainability"],
            status="matched", workflowIdx=2, match=91, appliedAt=_days_ago(8),
        ),
        CandidateFactory.build(
            fullName="Hassan Al-Mannai", qid="29212345678", nationality="Qatari", email="hassan@karaz.co",
            phone="+974 5555 1208", gender="Male", university="Carnegie Mellon Qatar",
            currentAcademicStatus="Pursuing", degree="BSc", major="Computer Science", gradYear="2027",
            commitment="FT", cycle="winter", track="qstp", startupId="st-karaz", startupName="Karaz FinTech",
            skillSet=["React", "Python", "SQL"], status="submitted", workflowIdx=1, match=79,
            appliedAt=_days_ago(3),
        ),
    ]


def _seed_byoc() -> list[dict]:
    return [
        {
            "id": "byoc-001", "startupId": "st-nabta", "startupName": "Nabta Health",
            "fullName": "Reem Al-Attiyah", "email": "reem@external.com",
            "cvLink": "https://drive.example.com/cv/reem.pdf", "track": "qstp", "commitment": "FT",
            "status": "pending_qstp_approval", "submittedAt": _days_ago(2),
        },
        {
            "id": "byoc-002", "startupId": "st-snoonu", "startupName": "Snoonu Labs",
            "fullName": "Ali Farooq", "email": "ali.farooq@external.com",
            "cvLink": "https://drive.example.com/cv/ali.pdf", "track": "placement", "commitment": "PT",
            "status": "pending_qstp_approval", "submittedAt": _days_ago(1),
        },
    ]


def seed_if_empty() -> None:
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    marker = config.DATA_DIR / "candidates.json"
    if marker.exists():
        return
    UniversityRepository().replace_all(UNIVERSITIES)
    StartupRepository().replace_all(STARTUPS)
    CandidateRepository().replace_all(_seed_candidates())
    ByocRepository().replace_all(_seed_byoc())
    ContractRepository().replace_all([])

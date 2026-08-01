from __future__ import annotations

from app.models.enums import CYCLES, CandidateStatus, Track
from app.repositories.byoc_repository import ByocRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.startup_repository import StartupRepository
from app.repositories.university_repository import UniversityRepository

FUNNEL_STAGES = [
    CandidateStatus.SUBMITTED,
    CandidateStatus.MATCHED,
    CandidateStatus.INTERVIEWING,
    CandidateStatus.ONBOARDING,
    CandidateStatus.CONTRACT_SENT,
    CandidateStatus.PAYROLL_PROCESSED,
]

CONVERTED_STATUSES = {
    CandidateStatus.ONBOARDING.value,
    CandidateStatus.CONTRACT_SENT.value,
    CandidateStatus.PAYROLL_PROCESSED.value,
}

QSTP_COHORT_CAP = 3


class DashboardService:
    def __init__(
        self,
        candidates: CandidateRepository,
        startups: StartupRepository,
        universities: UniversityRepository,
        byoc: ByocRepository,
    ):
        self._candidates = candidates
        self._startups = startups
        self._universities = universities
        self._byoc = byoc

    def summary(self) -> dict:
        candidates = self._candidates.list()
        startups = self._startups.list()
        universities = self._universities.list()
        byoc = self._byoc.list()

        qstp_count = sum(1 for c in candidates if c.get("track") == Track.QSTP.value)
        placement_count = sum(1 for c in candidates if c.get("track") == Track.PLACEMENT.value)
        converted = sum(1 for c in candidates if c.get("status") in CONVERTED_STATUSES)
        conversion_pct = round((converted / len(candidates)) * 100) if candidates else 0

        funnel = [
            {"label": stage.name.replace("_", " ").title(), "status": stage.value, "count": sum(1 for c in candidates if c.get("status") == stage.value)}
            for stage in FUNNEL_STAGES
        ]

        startup_load = [
            {
                "id": s["id"],
                "name": s["name"],
                "premium": s.get("premium", False),
                "qstpCohortsUsed": s.get("qstpCohortsUsed", 0),
                "cohortCap": QSTP_COHORT_CAP,
                "pct": round((s.get("qstpCohortsUsed", 0) / QSTP_COHORT_CAP) * 100),
            }
            for s in startups
        ]

        cycle_breakdown = [
            {
                "id": c["id"],
                "label": c["label"],
                "start": c["start"],
                "end": c["end"],
                "qstp": sum(1 for x in candidates if x.get("cycle") == c["id"] and x.get("track") == Track.QSTP.value),
                "placement": sum(1 for x in candidates if x.get("cycle") == c["id"] and x.get("track") == Track.PLACEMENT.value),
            }
            for c in CYCLES
        ]

        automation_eligibility = {
            "mass_email": sum(1 for c in candidates if c.get("status") in {"matched", "interviewing", "onboarding"}),
            "contracts": sum(1 for c in candidates if c.get("status") == "onboarding"),
            "payroll": sum(1 for c in candidates if c.get("status") == "onboarding" and c.get("track") == Track.QSTP.value),
        }

        return {
            "applications": len(candidates),
            "startupsLive": len(startups),
            "universities": len(universities),
            "qstpFundedSlots": qstp_count,
            "workPlacementSlots": placement_count,
            "conversionPct": conversion_pct,
            "funnel": funnel,
            "startupLoad": startup_load,
            "cycles": cycle_breakdown,
            "byocPending": sum(1 for b in byoc if b.get("status") == "pending_qstp_approval"),
            "automationEligibility": automation_eligibility,
        }

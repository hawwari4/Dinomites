from datetime import datetime, timezone

from app.models.enums import AutomationKind, CandidateStatus, Track
from app.repositories.candidate_repository import CandidateRepository
from app.services.contract_service import ContractService
from app.services.notification_service import NotificationService

PAYROLL_RATE_QR_PER_HOUR = 30
DEFAULT_WEEKLY_HOURS = {"FT": 40, "PT": 20}

# Statuses that mean an intern is actively engaged with their startup (past onboarding),
# used to decide who shows up in the payroll breakdown.
ACTIVE_PAYROLL_STATUSES = {
    CandidateStatus.ONBOARDING.value,
    CandidateStatus.CONTRACT_SENT.value,
    CandidateStatus.PAYROLL_PROCESSED.value,
}


class AutomationService:
    def __init__(self, candidates: CandidateRepository, contracts: ContractService, notifications: NotificationService):
        self._candidates = candidates
        self._contracts = contracts
        self._notifications = notifications

    def run(
        self,
        kind: AutomationKind,
        candidate_ids: list[str],
        subject: str | None = None,
        body: str | None = None,
        signature_data: str | None = None,
    ) -> int:
        affected = 0
        now = datetime.now(timezone.utc).isoformat()
        for candidate_id in candidate_ids:
            candidate = self._candidates.get(candidate_id)
            if not candidate:
                continue
            if kind == AutomationKind.MASS_EMAIL:
                patch = {"lastEmailedAt": now}
                if subject:
                    patch["lastEmailSubject"] = subject
                self._candidates.update(candidate_id, patch)
                affected += 1
            elif kind == AutomationKind.CONTRACTS:
                # Only send a contract to candidates who are actually at Onboarding and don't
                # already have one in flight — otherwise re-running this automation on the same
                # selection duplicates contracts and "your contract is ready" notifications.
                if candidate.get("status") != CandidateStatus.ONBOARDING.value:
                    continue
                updated = self._candidates.update(
                    candidate_id, {"status": CandidateStatus.CONTRACT_SENT.value, "contractSentAt": now}
                )
                self._contracts.create_for_candidate(updated, signature_data)
                self._notifications.create_system(
                    candidate_id, "Your internship contract is ready — sign it in the Contract Hub below."
                )
                affected += 1
            elif kind == AutomationKind.PAYROLL:
                if candidate.get("track") == Track.QSTP.value and candidate.get("status") == CandidateStatus.ONBOARDING.value:
                    self._candidates.update(
                        candidate_id, {"status": CandidateStatus.PAYROLL_PROCESSED.value, "payrollAt": now}
                    )
                    affected += 1
        return affected

    def payroll_preview(self) -> dict:
        """Breakdown of every startup's active interns, their weekly hours, and QR cost
        (30 QR/hr for QSTP-funded interns; Work Placement interns are unpaid)."""
        candidates = [
            c
            for c in self._candidates.list()
            if c.get("startupId") and c.get("status") in ACTIVE_PAYROLL_STATUSES
        ]
        by_startup: dict[str, dict] = {}
        grand_total = 0.0
        for c in candidates:
            hours = c.get("weeklyHours") or DEFAULT_WEEKLY_HOURS.get(c.get("commitment"), 20)
            is_placement = c.get("track") == Track.PLACEMENT.value
            rate = 0 if is_placement else PAYROLL_RATE_QR_PER_HOUR
            weekly_cost = 0 if is_placement else round(hours * PAYROLL_RATE_QR_PER_HOUR, 2)
            sid = c["startupId"]
            entry = by_startup.setdefault(
                sid, {"startupId": sid, "startupName": c.get("startupName"), "interns": [], "startupTotal": 0.0}
            )
            entry["interns"].append(
                {
                    "candidateId": c["id"],
                    "name": c.get("fullName"),
                    "track": c.get("track"),
                    "weeklyHours": hours,
                    "hourlyRate": rate,
                    "weeklyCost": weekly_cost,
                }
            )
            entry["startupTotal"] += weekly_cost
            grand_total += weekly_cost

        startups = sorted(by_startup.values(), key=lambda s: s["startupName"] or "")
        for s in startups:
            s["startupTotal"] = round(s["startupTotal"], 2)
        return {"startups": startups, "grandTotal": round(grand_total, 2), "ratePerHour": PAYROLL_RATE_QR_PER_HOUR}

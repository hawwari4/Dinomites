from datetime import datetime, timezone
from uuid import uuid4

from app.models.enums import CandidateStatus, Commitment, Cycle, Track


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slug(name: str) -> str:
    return (name or "user").lower().replace(" ", "-")


class CandidateFactory:
    """Builds candidate dicts for the three intake paths: direct seed/admin creation,
    a university's Work Placement push, and an approved BYOC submission."""

    @staticmethod
    def build(**o) -> dict:
        full_name = o.get("fullName", "")
        commitment = o.get("commitment")
        default_hours = 40 if commitment == Commitment.FULL_TIME.value else 20
        return {
            "id": o.get("id") or f"c-{uuid4().hex[:8]}",
            "fullName": full_name,
            "qid": o.get("qid"),
            "nationality": o.get("nationality"),
            "email": o.get("email"),
            "phone": o.get("phone"),
            "gender": o.get("gender"),
            "university": o.get("university"),
            "currentAcademicStatus": o.get("currentAcademicStatus"),
            "degree": o.get("degree"),
            "major": o.get("major"),
            "gradYear": o.get("gradYear"),
            "commitment": o.get("commitment"),
            "cycle": o.get("cycle"),
            "track": o.get("track"),
            "startupId": o.get("startupId"),
            "startupName": o.get("startupName"),
            "skillSet": o.get("skillSet", []),
            "cvLink": o.get("cvLink") or f"https://drive.qstp.qa/cv/{_slug(full_name)}.pdf",
            "linkedin": o.get("linkedin") or f"https://linkedin.com/in/{_slug(full_name)}",
            "portfolio": o.get("portfolio") or f"https://github.com/{_slug(full_name)}",
            "status": o.get("status", CandidateStatus.SUBMITTED.value),
            "workflowIdx": o.get("workflowIdx", 1),
            "match": o.get("match"),
            "appliedAt": o.get("appliedAt") or _now_iso(),
            "interviewStart": o.get("interviewStart") or o.get("appliedAt") or _now_iso(),
            "howHeard": o.get("howHeard"),
            "referralOrg": o.get("referralOrg"),
            "whyInterested": o.get("whyInterested"),
            "additionalComments": o.get("additionalComments"),
            "consentDataPolicy": o.get("consentDataPolicy", False),
            "consentMediaRelease": o.get("consentMediaRelease", False),
            "decidedAt": o.get("decidedAt"),
            "weeklyHours": o.get("weeklyHours") or default_hours,
            "lastEmailSubject": o.get("lastEmailSubject"),
        }

    @staticmethod
    def build_placement(university_name: str, **o) -> dict:
        return CandidateFactory.build(
            **o,
            track=Track.PLACEMENT.value,
            startupId=None,
            startupName="Unassigned",
            university=university_name,
            currentAcademicStatus=o.get("currentAcademicStatus", "Pursuing"),
            degree=o.get("degree", "BSc"),
            gradYear=o.get("gradYear", "2027"),
            gender=o.get("gender", "Prefer not to say"),
            status=CandidateStatus.SUBMITTED.value,
            workflowIdx=1,
        )

    @staticmethod
    def from_byoc(b: dict) -> dict:
        return CandidateFactory.build(
            fullName=b["fullName"],
            qid="000000000",
            nationality="External",
            email=b["email"],
            phone="+974 0000 0000",
            gender="Prefer not to say",
            university="External Candidate",
            currentAcademicStatus="Pursuing",
            degree="BSc",
            major="General",
            gradYear="2026",
            commitment=b["commitment"],
            cycle=Cycle.SUMMER.value,
            track=b["track"],
            startupId=b["startupId"],
            startupName=b["startupName"],
            skillSet=["External Skills"],
            cvLink=b["cvLink"],
            status=CandidateStatus.MATCHED.value,
            workflowIdx=2,
            match=70,
        )


class ContractFactory:
    @staticmethod
    def build(candidate: dict, qstp_signature_data: str | None = None) -> dict:
        sent_at = _now_iso()
        return {
            "id": "K-" + uuid4().hex[:6].upper(),
            "candidateId": candidate["id"],
            "candidateName": candidate["fullName"],
            "track": candidate["track"],
            "startup": candidate.get("startupName"),
            "cycle": candidate["cycle"],
            "commitment": candidate["commitment"],
            "weeks": 12,
            "signed": False,
            "sentAt": sent_at,
            "signedAt": None,
            # Auto-generated + sent already reflects startup/QSTP agreement (Feature 3
            # DevNotes: Draft -> Startup Signed -> Intern Signed -> Executed).
            "startupSignedAt": sent_at,
            "signatureData": None,
            "qstpSignatureData": qstp_signature_data,
        }

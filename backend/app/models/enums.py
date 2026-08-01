from enum import Enum


class Role(str, Enum):
    INTERN = "intern"
    UNIVERSITY = "university"
    STARTUP = "startup"
    ADMIN = "admin"


class Track(str, Enum):
    QSTP = "qstp"
    PLACEMENT = "placement"


class Commitment(str, Enum):
    FULL_TIME = "FT"
    PART_TIME = "PT"


class Cycle(str, Enum):
    WINTER = "winter"
    SUMMER = "summer"
    FALL = "fall"


class CandidateStatus(str, Enum):
    SUBMITTED = "submitted"
    MATCHED = "matched"
    INTERVIEWING = "interviewing"
    ONBOARDING = "onboarding"
    CONTRACT_SENT = "contract_sent"
    PAYROLL_PROCESSED = "payroll_processed"
    REJECTED = "rejected"


class WorkflowStep(int, Enum):
    APP_SUBMITTED = 1
    MATCHED = 2
    INTERVIEWING = 3
    ONBOARDING = 4

    @classmethod
    def label(cls, idx: int) -> str:
        labels = {
            0: "Identify Needs",
            1: "App Submitted",
            2: "Matched",
            3: "Interviewing",
            4: "Onboarding",
        }
        return labels.get(idx, "Unknown")


# Status a candidate lands on when advanced to a given workflow index.
WORKFLOW_STATUS_MAP = {
    1: CandidateStatus.SUBMITTED,
    2: CandidateStatus.MATCHED,
    3: CandidateStatus.INTERVIEWING,
    4: CandidateStatus.ONBOARDING,
}


CYCLES = [
    {"id": "winter", "label": "Winter", "start": "2026-01-29", "end": "2026-04-21"},
    {"id": "summer", "label": "Summer", "start": "2026-06-14", "end": "2026-09-03"},
    {"id": "fall", "label": "Fall", "start": "2026-10-01", "end": "2026-12-20"},
]


class ByocStatus(str, Enum):
    PENDING = "pending_qstp_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class AutomationKind(str, Enum):
    MASS_EMAIL = "mass_email"
    CONTRACTS = "contracts"
    PAYROLL = "payroll"

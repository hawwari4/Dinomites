from pydantic import BaseModel

from app.models.enums import CandidateStatus, Commitment, Cycle, Track


class Candidate(BaseModel):
    id: str
    fullName: str
    qid: str
    nationality: str
    email: str
    phone: str
    gender: str
    university: str
    currentAcademicStatus: str
    degree: str
    major: str
    gradYear: str
    commitment: Commitment
    cycle: Cycle
    track: Track
    startupId: str | None = None
    startupName: str | None = None
    skillSet: list[str] = []
    cvLink: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None
    status: CandidateStatus = CandidateStatus.SUBMITTED
    workflowIdx: int = 1
    match: int | None = None
    appliedAt: str
    interviewStart: str | None = None
    lastEmailedAt: str | None = None
    contractSentAt: str | None = None
    contractSignedAt: str | None = None
    payrollAt: str | None = None
    feedback: str | None = None
    howHeard: str | None = None
    referralOrg: str | None = None
    whyInterested: str | None = None
    additionalComments: str | None = None
    consentDataPolicy: bool = False
    consentMediaRelease: bool = False
    decidedAt: str | None = None
    weeklyHours: int | None = None
    lastEmailSubject: str | None = None


class CandidateUpdate(BaseModel):
    """Partial update — any subset of Candidate fields (profile edits, workflow/status changes)."""

    fullName: str | None = None
    qid: str | None = None
    nationality: str | None = None
    email: str | None = None
    phone: str | None = None
    gender: str | None = None
    university: str | None = None
    currentAcademicStatus: str | None = None
    degree: str | None = None
    major: str | None = None
    gradYear: str | None = None
    commitment: Commitment | None = None
    cycle: Cycle | None = None
    skillSet: list[str] | None = None
    cvLink: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None
    status: CandidateStatus | None = None
    workflowIdx: int | None = None
    match: int | None = None
    startupId: str | None = None
    startupName: str | None = None
    feedback: str | None = None
    howHeard: str | None = None
    referralOrg: str | None = None
    whyInterested: str | None = None
    additionalComments: str | None = None
    consentDataPolicy: bool | None = None
    consentMediaRelease: bool | None = None
    decidedAt: str | None = None
    weeklyHours: int | None = None
    lastEmailSubject: str | None = None


class SelfApplyRequest(BaseModel):
    """Full official application form, submitted by the intern themself (New Application flow)."""

    fullName: str
    qid: str
    nationality: str
    email: str
    phone: str
    gender: str
    university: str
    currentAcademicStatus: str
    degree: str
    major: str
    gradYear: str
    commitment: Commitment
    cycle: Cycle
    howHeard: str
    referralOrg: str | None = None
    cvLink: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None
    skillSet: list[str]
    whyInterested: str
    additionalComments: str | None = None
    consentDataPolicy: bool
    consentMediaRelease: bool = False


class RejectRequest(BaseModel):
    feedback: str


class AssignRequest(BaseModel):
    startupId: str


class PushStudentRequest(BaseModel):
    universityName: str
    fullName: str
    qid: str
    nationality: str = "Qatari"
    email: str
    phone: str
    major: str
    commitment: Commitment
    cycle: Cycle
    skillSet: list[str]


class BulkCsvRequest(BaseModel):
    universityName: str
    csvText: str

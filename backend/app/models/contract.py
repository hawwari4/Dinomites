from pydantic import BaseModel

from app.models.enums import Commitment, Cycle, Track


class Contract(BaseModel):
    id: str
    candidateId: str
    candidateName: str
    track: Track
    startup: str | None = None
    cycle: Cycle
    commitment: Commitment
    weeks: int = 12
    signed: bool = False
    sentAt: str
    signedAt: str | None = None
    # Digital signature workflow (Feature 3: QSTP Automation Hub) — a contract is
    # auto-drafted and sent already agreed by the startup/QSTP (startupSignedAt is
    # stamped at creation), so the only remaining step is the intern's e-signature,
    # which both signs and executes the contract in one action.
    startupSignedAt: str | None = None
    signatureData: str | None = None
    # QSTP admin's signature, captured when the contract batch is generated in the
    # Automation Hub (distinct from the intern's e-signature above).
    qstpSignatureData: str | None = None


class ContractUpdate(BaseModel):
    signed: bool | None = None


class SignContractRequest(BaseModel):
    signatureData: str | None = None

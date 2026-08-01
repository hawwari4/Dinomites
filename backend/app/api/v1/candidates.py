from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.dependencies import get_candidate_service, get_extraction_service
from app.models.candidate import (
    AssignRequest,
    BulkCsvRequest,
    CandidateUpdate,
    PushStudentRequest,
    RejectRequest,
    SelfApplyRequest,
)
from app.models.enums import Commitment, Cycle
from app.services.candidate_service import CandidateService
from app.services.extraction_service import ExtractionService

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

_VALID_COMMITMENTS = {c.value for c in Commitment}
_VALID_CYCLES = {c.value for c in Cycle}


def _parse_csv(text: str) -> tuple[list[dict], int]:
    """Returns (valid rows, count of rows skipped for being short or having an
    unrecognized commitment/cycle value)."""
    rows = [r.split(",") for r in text.strip().splitlines() if r.strip()]
    valid: list[dict] = []
    skipped = 0
    for r in rows:
        if len(r) < 7:
            skipped += 1
            continue
        commitment = r[4].strip().upper()
        cycle = r[5].strip().lower()
        if commitment not in _VALID_COMMITMENTS or cycle not in _VALID_CYCLES:
            skipped += 1
            continue
        valid.append(
            {
                "fullName": r[0].strip(),
                "qid": r[1].strip(),
                "email": r[2].strip(),
                "major": r[3].strip(),
                "commitment": commitment,
                "cycle": cycle,
                "skillSet": [s.strip() for s in r[6].split(";") if s.strip()],
                "nationality": "Qatari",
                "phone": "+974 5555 0000",
            }
        )
    return valid, skipped


@router.get("")
def list_candidates(
    startupId: str | None = None,
    university: str | None = None,
    track: str | None = None,
    service: CandidateService = Depends(get_candidate_service),
):
    return service.list(startup_id=startupId, university=university, track=track)


@router.get("/{candidate_id}")
def get_candidate(candidate_id: str, service: CandidateService = Depends(get_candidate_service)):
    return service.get(candidate_id)


@router.get("/{candidate_id}/matches")
def candidate_matches(candidate_id: str, service: CandidateService = Depends(get_candidate_service)):
    return service.startup_matches(candidate_id)


@router.post("/push")
def push_student(body: PushStudentRequest, service: CandidateService = Depends(get_candidate_service)):
    data = body.model_dump(exclude={"universityName"})
    return service.create_placement(body.universityName, data)


@router.post("/bulk")
def bulk_push_students(body: BulkCsvRequest, service: CandidateService = Depends(get_candidate_service)):
    rows, skipped = _parse_csv(body.csvText)
    if not rows:
        raise HTTPException(
            status_code=400,
            detail="No valid rows found — each row needs name,qid,email,major,commitment(FT/PT),cycle(winter/summer/fall),skills",
        )
    created = service.bulk_create_placement(body.universityName, rows)
    return {"created": created, "skippedRows": skipped}


@router.post("/apply")
def self_apply(body: SelfApplyRequest, service: CandidateService = Depends(get_candidate_service)):
    return service.create_self_apply(body.model_dump())


@router.post("/extract")
async def extract_application(
    cv: UploadFile = File(...), service: ExtractionService = Depends(get_extraction_service)
):
    return service.extract(await cv.read())


@router.put("/{candidate_id}")
def update_candidate(
    candidate_id: str, body: CandidateUpdate, service: CandidateService = Depends(get_candidate_service)
):
    return service.update(candidate_id, body.model_dump(exclude_unset=True))


@router.put("/{candidate_id}/assign")
def assign_candidate(
    candidate_id: str, body: AssignRequest, service: CandidateService = Depends(get_candidate_service)
):
    return service.assign_to_startup(candidate_id, body.startupId)


@router.put("/{candidate_id}/advance")
def advance_candidate(candidate_id: str, service: CandidateService = Depends(get_candidate_service)):
    return service.advance_workflow(candidate_id)


@router.put("/{candidate_id}/reject")
def reject_candidate(
    candidate_id: str, body: RejectRequest, service: CandidateService = Depends(get_candidate_service)
):
    return service.reject(candidate_id, body.feedback)


@router.put("/{candidate_id}/rescore")
def rescore_candidate(candidate_id: str, service: CandidateService = Depends(get_candidate_service)):
    return service.recompute_match(candidate_id)


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: str, service: CandidateService = Depends(get_candidate_service)):
    service.delete(candidate_id)
    return {"ok": True}

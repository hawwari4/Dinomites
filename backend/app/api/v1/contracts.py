from fastapi import APIRouter, Depends

from app.core.dependencies import get_candidate_service, get_contract_service
from app.models.contract import SignContractRequest
from app.services.candidate_service import CandidateService
from app.services.contract_service import ContractService

router = APIRouter(prefix="/api/contracts", tags=["contracts"])


@router.get("")
def list_contracts(candidateId: str | None = None, service: ContractService = Depends(get_contract_service)):
    return service.list(candidate_id=candidateId)


@router.put("/{contract_id}/sign")
def sign_contract(
    contract_id: str,
    body: SignContractRequest = SignContractRequest(),
    contracts: ContractService = Depends(get_contract_service),
    candidates: CandidateService = Depends(get_candidate_service),
):
    contract = contracts.sign(contract_id, body.signatureData)
    candidates.sign_contract_onboarding(contract["candidateId"])
    return contract

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.repositories.contract_repository import ContractRepository
from app.utils.factories import ContractFactory


class ContractService:
    def __init__(self, contracts: ContractRepository):
        self._contracts = contracts

    def list(self, candidate_id: str | None = None) -> list[dict]:
        items = self._contracts.list()
        if candidate_id:
            items = [c for c in items if c["candidateId"] == candidate_id]
        return items

    def create_for_candidate(self, candidate: dict, qstp_signature_data: str | None = None) -> dict:
        return self._contracts.create(ContractFactory.build(candidate, qstp_signature_data))

    def sign(self, contract_id: str, signature_data: str | None = None) -> dict:
        contract = self._contracts.get(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        if contract.get("signed"):
            raise HTTPException(status_code=400, detail="Contract already signed")
        patch = {"signed": True, "signedAt": datetime.now(timezone.utc).isoformat()}
        if signature_data:
            patch["signatureData"] = signature_data
        return self._contracts.update(contract_id, patch)

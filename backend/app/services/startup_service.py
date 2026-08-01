from __future__ import annotations

from fastapi import HTTPException

from app.repositories.candidate_repository import CandidateRepository
from app.repositories.startup_repository import StartupRepository
from app.utils.match_strategy import MatchStrategy


FREE_INTERN_MATCH_LIMIT = 3
PREMIUM_INTERN_MATCH_LIMIT = 10


class StartupService:
    def __init__(
        self,
        startups: StartupRepository,
        candidates: CandidateRepository,
        match_strategy: MatchStrategy,
    ):
        self._startups = startups
        self._candidates = candidates
        self._match_strategy = match_strategy

    def list(self) -> list[dict]:
        return self._startups.list()

    def get(self, startup_id: str) -> dict:
        startup = self._startups.get(startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")
        return startup

    def update(self, startup_id: str, patch: dict) -> dict:
        # `patch` reflects only explicitly-sent fields — see CandidateService.update for why
        # we must not drop explicit nulls here.
        updated = self._startups.update(startup_id, patch)
        if not updated:
            raise HTTPException(status_code=404, detail="Startup not found")
        return updated

    def add_need(self, startup_id: str, need: str) -> dict:
        startup = self.get(startup_id)
        needs = startup.get("needs", [])
        if need not in needs:
            needs = [*needs, need]
        return self.update(startup_id, {"needs": needs})

    def remove_need(self, startup_id: str, need: str) -> dict:
        startup = self.get(startup_id)
        needs = [n for n in startup.get("needs", []) if n != need]
        return self.update(startup_id, {"needs": needs})

    def candidate_scores(self, startup_id: str) -> list[dict]:
        """Candidates matched to this startup, each annotated with a freshly computed score.
        Rejected candidates are excluded — once rejected they drop off the startup's own
        tracker (they still show up admin-side via each candidate's decidedAt/feedback)."""
        startup = self.get(startup_id)
        candidates = [
            c for c in self._candidates.list()
            if c.get("startupId") == startup_id and c.get("status") != "rejected"
        ]
        for c in candidates:
            c["match"] = self._match_strategy.score(startup.get("needs", []), c.get("skillSet", []))
        return candidates

    def intern_matches(self, startup_id: str) -> list[dict]:
        """AI Matchmaking Feed, startup side: every unassigned candidate scored against this
        startup's needs, sorted best-first. Free tier sees the top 3, premium sees the top 10.
        Excludes candidates already claimed by any startup and rejected candidates — both are
        un-assignable via "Add to Workflow", so showing them here just produces a dead-end
        click (assign_to_startup 400s on an already-assigned candidate)."""
        startup = self.get(startup_id)
        pool = [
            c for c in self._candidates.list()
            if c.get("startupId") is None and c.get("status") != "rejected"
        ]
        scored = [
            {**c, "score": self._match_strategy.score(startup.get("needs", []), c.get("skillSet", []))}
            for c in pool
        ]
        scored.sort(key=lambda c: c["score"], reverse=True)
        limit = PREMIUM_INTERN_MATCH_LIMIT if startup.get("premium") else FREE_INTERN_MATCH_LIMIT
        return scored[:limit]

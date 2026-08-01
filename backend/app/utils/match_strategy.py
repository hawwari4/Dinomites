import random
from abc import ABC, abstractmethod


class MatchStrategy(ABC):
    @abstractmethod
    def score(self, needs: list[str], skills: list[str]) -> int:
        """Return a 0-100 match score between a startup's needs and a candidate's skills."""


class SkillIntersectionMatchStrategy(MatchStrategy):
    """Intersection % of needs covered by skills, scaled across the full MIN-MAX range so
    strong fits read as clearly high and weak fits as clearly low, plus a small jitter."""

    MIN_SCORE = 20
    MAX_SCORE = 97
    JITTER = 6

    def score(self, needs: list[str], skills: list[str]) -> int:
        if not needs:
            base = (self.MIN_SCORE + self.MAX_SCORE) / 2
        else:
            skill_set = {s.lower() for s in skills}
            overlap = sum(1 for n in needs if n.lower() in skill_set)
            ratio = overlap / len(needs)
            # sqrt curve so partial overlaps still read as solid (70s/80s) matches
            # instead of only full overlap reaching the high end.
            base = self.MIN_SCORE + (ratio ** 0.5) * (self.MAX_SCORE - self.MIN_SCORE)
        jittered = round(base + random.randint(-self.JITTER, self.JITTER))
        return max(self.MIN_SCORE, min(self.MAX_SCORE, jittered))

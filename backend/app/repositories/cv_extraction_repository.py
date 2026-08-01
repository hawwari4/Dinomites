from app.repositories.base_repository import BaseRepository


class CvExtractionRepository(BaseRepository[dict]):
    """Persists every CV auto-fill result (POST /api/candidates/extract) to
    cv_extractions.json, so the chatbot's auto-filled answers (name, email, skills, ...)
    are readable/replayable from disk instead of only living in frontend state."""

    filename = "cv_extractions.json"
    id_prefix = "cvx"

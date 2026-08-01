from app.repositories.byoc_repository import ByocRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.cv_extraction_repository import CvExtractionRepository
from app.repositories.internship_description_repository import InternshipDescriptionRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.startup_repository import StartupRepository
from app.repositories.university_repository import UniversityRepository
from app.services.auth_service import AuthService
from app.services.automation_service import AutomationService
from app.services.byoc_service import ByocService
from app.services.candidate_service import CandidateService
from app.services.contract_service import ContractService
from app.services.dashboard_service import DashboardService
from app.services.extraction_service import ExtractionService
from app.services.internship_description_service import InternshipDescriptionService
from app.services.notification_service import NotificationService
from app.services.startup_service import StartupService
from app.services.university_service import UniversityService
from app.utils.match_strategy import MatchStrategy, SkillIntersectionMatchStrategy

# Repositories are cheap, stateless wrappers around JSON files (no in-memory cache to
# preserve), so a fresh instance per request is created rather than a singleton. This
# also means each instance resolves app.core.config.DATA_DIR at construction time,
# which is what lets tests monkeypatch DATA_DIR and get isolated data per test.


def get_candidate_repository() -> CandidateRepository:
    return CandidateRepository()


def get_startup_repository() -> StartupRepository:
    return StartupRepository()


def get_university_repository() -> UniversityRepository:
    return UniversityRepository()


def get_contract_repository() -> ContractRepository:
    return ContractRepository()


def get_byoc_repository() -> ByocRepository:
    return ByocRepository()


def get_internship_description_repository() -> InternshipDescriptionRepository:
    return InternshipDescriptionRepository()


def get_cv_extraction_repository() -> CvExtractionRepository:
    return CvExtractionRepository()


def get_notification_repository() -> NotificationRepository:
    return NotificationRepository()


def get_match_strategy() -> MatchStrategy:
    return SkillIntersectionMatchStrategy()


def get_auth_service() -> AuthService:
    return AuthService(get_candidate_repository())


def get_extraction_service() -> ExtractionService:
    return ExtractionService(get_cv_extraction_repository())


def get_internship_description_service() -> InternshipDescriptionService:
    return InternshipDescriptionService(
        get_internship_description_repository(), get_startup_repository(), get_extraction_service()
    )


def get_candidate_service() -> CandidateService:
    return CandidateService(get_candidate_repository(), get_startup_repository(), get_match_strategy())


def get_startup_service() -> StartupService:
    return StartupService(get_startup_repository(), get_candidate_repository(), get_match_strategy())


def get_university_service() -> UniversityService:
    return UniversityService(get_university_repository())


def get_contract_service() -> ContractService:
    return ContractService(get_contract_repository())


def get_byoc_service() -> ByocService:
    return ByocService(get_byoc_repository(), get_candidate_repository(), get_startup_repository())


def get_notification_service() -> NotificationService:
    return NotificationService(get_notification_repository(), get_candidate_repository(), get_startup_repository())


def get_automation_service() -> AutomationService:
    return AutomationService(get_candidate_repository(), get_contract_service(), get_notification_service())


def get_dashboard_service() -> DashboardService:
    return DashboardService(
        get_candidate_repository(), get_startup_repository(), get_university_repository(), get_byoc_repository()
    )

from uuid import uuid4

from fastapi import HTTPException

from app.models.enums import Role
from app.repositories.candidate_repository import CandidateRepository

# Static mock profiles — mirrors loginAs() in the original single-page app.
# No password: selecting a role signs you in as that role's demo user.
MOCK_PROFILES: dict[str, dict] = {
    Role.INTERN.value: {
        "role": "intern",
        "candidateId": "seed-intern",
        "name": "Aisha Al-Kuwari",
        "email": "aisha@qu.edu.qa",
        "avatar": "AK",
    },
    Role.UNIVERSITY.value: {
        "role": "university",
        "universityId": "uni-udst",
        "name": "Dr. Hessa Al-Naimi",
        "org": "UDST · Career Services",
        "email": "career@udst.edu.qa",
        "avatar": "HN",
    },
    Role.STARTUP.value: {
        "role": "startup",
        "startupId": "st-nabta",
        "name": "Omar Faisal",
        "company": "Nabta Health",
        "email": "omar@nabta.co",
        "avatar": "OF",
    },
    Role.ADMIN.value: {
        "role": "admin",
        "name": "Layla Hassan",
        "org": "QSTP Operations",
        "email": "layla@qstp.qa",
        "avatar": "LH",
    },
}

# Fixed username/password pairs for the non-intern portals (still mock auth — no
# hashing/JWT — but the sign-in page now requires them instead of a one-click button).
ROLE_CREDENTIALS: dict[str, tuple[str, str]] = {
    Role.UNIVERSITY.value: ("university@qstp.qa", "university123"),
    Role.STARTUP.value: ("startup@qstp.qa", "startup123"),
    Role.ADMIN.value: ("admin@qstp.qa", "admin123"),
}


class AuthService:
    def __init__(self, candidates: CandidateRepository):
        self._candidates = candidates

    def login(self, role: Role) -> dict:
        profile = MOCK_PROFILES.get(role.value)
        if not profile:
            raise HTTPException(status_code=400, detail="Unknown role")
        return {"token": f"mock-{role.value}-{uuid4().hex[:12]}", "user": profile}

    def login_with_credentials(self, role: Role, username: str, password: str) -> dict:
        """Sign-in for university/startup/admin. Matches the fixed demo username for the role
        (trimmed, case-insensitive); like the intern portal, the password isn't verified —
        this is mock auth with no real security, see skill.md."""
        expected = ROLE_CREDENTIALS.get(role.value)
        if not expected or username.strip().lower() != expected[0].lower():
            raise HTTPException(status_code=401, detail="Invalid username or password")
        return self.login(role)

    def login_intern(self, email: str, password: str) -> dict:
        """Mock credential check: looks up a candidate by email; the password is not verified,
        matching this app's no-real-password-auth design (see skill.md)."""
        match = next(
            (c for c in self._candidates.list() if (c.get("email") or "").lower() == email.lower()),
            None,
        )
        if not match:
            raise HTTPException(status_code=404, detail="No application found for this email")
        name = match.get("fullName") or "Intern"
        avatar = "".join(x[0] for x in name.split(" ")[:2]).upper()
        profile = {
            "role": "intern",
            "candidateId": match["id"],
            "name": name,
            "email": match.get("email"),
            "avatar": avatar,
        }
        return {"token": f"mock-intern-{uuid4().hex[:12]}", "user": profile}

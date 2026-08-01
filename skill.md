# QSTP Connect — skill.md

Full reference for the QSTP Connect internship operations platform: a Python/FastAPI
backend (JSON-file persisted) + React/Vite frontend, migrated from a single-file
HTML/localStorage prototype (`index (3).html`, now retired — see §9).

## 1. Project Overview & Tech Stack

QSTP Connect runs the internship pipeline for four roles — **intern**, **university**,
**startup**, **admin** — across QSTP-Funded and Work Placement tracks, three yearly
cycles (Winter/Summer/Fall), and a 5-step workflow (App Submitted → Matched →
Interviewing → Onboarding → [Contract Sent → Payroll, admin-triggered]).

| Layer | Stack |
|---|---|
| Backend | Python 3.13, FastAPI, Pydantic v2, uvicorn, stdlib `json`+`pathlib` for storage, pytest, `pypdf` + a hand-written local parser (`app/services/pdf_parsing.py`) for CV + job-description PDFs — no external AI API, `python-docx` (reads uploaded `.docx` job descriptions, still supported alongside PDF), `python-dotenv` |
| Frontend | React 19, Vite, Tailwind CSS v4, lucide-react, axios, React Context |

No database — every collection is a JSON file under `backend/data/`. No real password
auth anywhere in the app (documented, intentional — see §9):
- University/Startup/Admin: the Login page is a **2-step flow** — a role-picker grid, then a role-specific credentials page — that requires a **fixed username+password per role**, checked server-side (`POST /api/auth/login/role`) against `AuthService.ROLE_CREDENTIALS` — still a mock (no hashing/session store). Credentials: `university@qstp.qa`/`university123`, `startup@qstp.qa`/`startup123`, `admin@qstp.qa`/`admin123` (username match is case-insensitive). The credentials page pre-fills the correct demo username+password the moment a role is picked, so the fields are never empty — partly for convenience, partly because empty text/password fields are what invite browser extensions (password managers, form-fill QA tools) to inject their own autofill values, which is indistinguishable from a real bug at a glance. `POST /api/auth/login` (bare `{role}`, no credentials) still exists underneath and powers the dev-mode shortcuts below.
- Intern: two entry points on the same credentials page — **sign in** (`POST /api/auth/login/intern`, email+password form, but only the email is checked against existing candidate records — the password field is UI-only, pre-filled with a seeded demo email) or, if no application exists yet, **start a new application** (a self-service wizard, §5).
- **Dev mode**: when the frontend is built/run with `VITE_DEV_MODE=true` (`frontend/.env`, gitignored — see `frontend/.env.example`), the Login page shows an extra panel with one-click instant login for all 4 roles (calls `POST /api/auth/login`), bypassing credentials entirely. Off (`.env` absent or flag false) in a normal/production-style run, where interns must go through the email/password or new-application flow, and the other 3 roles must use their fixed username/password.

## 2. Architecture

```
Browser (React SPA)
   │  axios (src/api/*)
   ▼
FastAPI routers (app/api/v1/*)      ← request/response mapping only
   │  Depends()
   ▼
Services (app/services/*)           ← all business logic
   │
   ▼
Repositories (app/repositories/*)   ← generic JSON CRUD (BaseRepository)
   │
   ▼
backend/data/*.json
```

Design patterns used:
- **Repository** — `BaseRepository[T]` (`app/repositories/base_repository.py`) does generic
  list/get/create/update/delete/replace_all over a JSON file; one subclass per entity
  (`candidate_repository.py`, `startup_repository.py`, etc.) just sets `filename`/`id_prefix`.
- **Service Layer** — one service per domain owns business rules; routers only
  validate/deserialize the request and call a service method.
- **Dependency Injection** — `app/core/dependencies.py` exposes `get_*_service()`/
  `get_*_repository()` functions wired via FastAPI `Depends()`. Repositories are
  constructed fresh per request (cheap, stateless) rather than cached, so tests can
  monkeypatch `app.core.config.DATA_DIR` for isolation.
- **Factory** — `app/utils/factories.py`: `CandidateFactory.build/build_placement/from_byoc`
  (mirrors the three ways a candidate enters the system) and `ContractFactory.build`.
- **Strategy** — `app/utils/match_strategy.py`: `MatchStrategy` ABC +
  `SkillIntersectionMatchStrategy` (the only implementation today, injected into
  `CandidateService`/`StartupService` — swap in a new strategy without touching callers).
- **Enums** — `app/models/enums.py`: every fixed value (`Role`, `Track`, `Commitment`,
  `Cycle`, `CandidateStatus`, `WorkflowStep`, `ByocStatus`, `AutomationKind`) plus the
  `CYCLES` reference list and `WORKFLOW_STATUS_MAP`.

Frontend mirrors this with a thin client layer: `api/client.js` (axios instance + auth
header interceptor) → `api/endpoints.js` (one function per REST call) → pages/components.
State: `AuthContext` (current user/token, localStorage-persisted) and `ToastContext`
(global toasts). `useApi` is a generic fetch-with-loading/error hook; there is no router —
`App.jsx` renders one of four portals based on `user.role`, matching the original app's
single-view-per-role model.

## 3. Data Model

All JSON fields are camelCase (matches the original app's schema exactly, and what the
frontend consumes directly — no snake_case translation layer).

**Candidate** (`backend/data/candidates.json`, `app/models/candidate.py`)
| Field | Notes |
|---|---|
| id, fullName, qid, nationality, email, phone, gender | identity/profile |
| university, currentAcademicStatus, degree, major, gradYear | academic |
| commitment (`FT`/`PT`), cycle, track (`qstp`/`placement`) | program enrollment |
| startupId, startupName | null/`"Unassigned"` until matched |
| skillSet[] | drives match scoring |
| cvLink, linkedin, portfolio | `cvLink` is a real uploaded-PDF URL (`{BACKEND_BASE_URL}/uploads/...`) when the candidate came through the self-apply CV flow, otherwise an auto-generated slug link; `linkedin`/`portfolio` are always plain optional profile links, never parsed |
| status (CandidateStatus), workflowIdx (0-4), match (0-100 or null) | pipeline state |
| appliedAt, interviewStart, lastEmailedAt, contractSentAt, contractSignedAt, payrollAt, decidedAt | timestamps, set by automation/workflow actions. `decidedAt` is stamped on `advance`/`reject` and drives the admin Decisions Feed |
| feedback | set on rejection |
| howHeard, referralOrg, whyInterested, additionalComments | official-application fields (from `Internship knowledge MD.md`), collected by the self-apply chatbot |
| consentDataPolicy (required), consentMediaRelease (optional) | booleans, collected as the final chatbot questions |
| weeklyHours | defaults to 40 (FT) / 20 (PT) at creation, editable; drives the payroll preview |
| lastEmailSubject | last mass-email subject line sent to this candidate via the Automation Hub |

**Startup** (`startups.json`): id, name, sector, location, qstpCohortsUsed (0-3),
premium (bool), needs[] (skills — powers matching; populated by uploading an Internship
Description, see below — there is no manual tag editor anymore). Premium unlocks: up to 10
intern matches instead of 3 (`STARTUP_MATCH_PREMIUM_LIMIT`), up to 3 BYOC submissions instead
of 1 (`BYOC_CAP_PREMIUM`).

**InternshipDescription** (`internship_descriptions.json`, `app/models/internship_description.py`):
id, startupId, fileName, fileUrl (the raw uploaded PDF or `.docx`, served via `/uploads`),
extractedSkills[], summary, position, commitment (`FT`/`PT`), weeklyHours, weeks, cycle,
uploadedAt. Created by the startup-side "New Internship Description" upload (replaces the
old Identified Needs tag editor, §5/§9) — every upload's `extractedSkills` are merged
(deduped) into that startup's `needs[]`; position/commitment/weeklyHours/weeks/cycle are
extraction-only (best-effort, may be null) and purely informational display fields.

**CV extraction record** (`cv_extractions.json`, no dedicated model — same shape as the
`/api/candidates/extract` response plus `extractedAt`): one entry per successful CV
auto-fill, written by `ExtractionService.extract`. Nothing currently reads this back — it
exists so the auto-fill result (name, email, skills, ...) is inspectable/replayable from
disk instead of only living in frontend wizard state.

**University** (`universities.json`): id, name, focus, pushed (seed-only display counter;
live "pushed" counts are computed from candidates, not this field).

**Contract** (`contracts.json`): id (`K-XXXXXX`), candidateId, candidateName, track, startup,
cycle, commitment, weeks (12), signed (bool), sentAt, signedAt, startupSignedAt (stamped at
creation — auto-generated contracts are already startup/QSTP-agreed, see §5),
signatureData (base64 PNG data URL of the intern's e-signature, drawn on an HTML canvas or
uploaded as a PNG — null until signed).

**BYOC** (`byoc.json`): id, startupId, startupName, fullName, email, cvLink, track,
commitment, status (`pending_qstp_approval`/`approved`/`rejected`), submittedAt.

**Uploads** (`backend/data/uploads/`, gitignored-by-nature runtime dir): raw PDF files from
the intern CV-upload flow, served back at `GET /uploads/{filename}` via a `StaticFiles`
mount (`check_dir=False`, since the directory is created lazily on first upload).

## 4. API Reference

Base URL: `http://localhost:8000`. All bodies/responses are JSON.

### Auth
- `POST /api/auth/login` — `{"role": "intern"}` → `{"token": "...", "user": {...}}`. No password; the 4 mock profiles are in `app/services/auth_service.py:MOCK_PROFILES`. Used by the dev-mode instant-login shortcuts.
- `POST /api/auth/login/intern` — `{"email": "...", "password": "..."}` → same `{token, user}` shape. Looks up a candidate by case-insensitive email; **password is never checked** (mock, by design). 404 `"No application found for this email"` if unknown — the frontend uses this to offer "start a new application" instead.
- `POST /api/auth/login/role` — `{"role": "university"|"startup"|"admin", "username": "...", "password": "..."}` → same `{token, user}` shape. Checked (username case-insensitively) against a fixed username/password per role (`AuthService.ROLE_CREDENTIALS`: `university@qstp.qa`/`university123`, `startup@qstp.qa`/`startup123`, `admin@qstp.qa`/`admin123`); 401 `"Invalid username or password"` on mismatch. Powers the Login page's role-credentials step (§9).

### Candidates
- `GET /api/candidates?startupId=&university=&track=` — list, optionally filtered.
- `GET /api/candidates/{id}` — 404 if missing.
- `GET /api/candidates/{id}/matches` — every startup scored against this candidate's skills (intern's "AI Matchmaking Feed").
- `POST /api/candidates/push` — `{universityName, fullName, qid, nationality, email, phone, major, commitment, cycle, skillSet}` → creates a Work Placement candidate.
- `POST /api/candidates/bulk` — `{universityName, csvText}` (rows: `name,qid,email,major,commitment,cycle,skill1;skill2`) → array of created candidates.
- `POST /api/candidates/apply` — `SelfApplyRequest` (the full official-form field set, §3) → creates a `track=qstp`, `workflowIdx=1`, unassigned candidate. This is how the intern-facing self-apply chatbot (§5) submits.
- `POST /api/candidates/extract` — multipart `cv` file (PDF, ≤15MB) → extracted form fields as JSON (only fields the local parser actually found; others omitted) + a real `cvLink` pointing at the stored file. Every successful extraction is also appended to `cv_extractions.json` (§3). 400 if the PDF can't be read (empty/corrupt/oversized) — no API key needed, parsing is local (§5).
- `PUT /api/candidates/{id}` — partial update (profile edits), any `CandidateUpdate` field.
- `PUT /api/candidates/{id}/advance` — bump `workflowIdx` one step (caps at Onboarding), sync `status`, stamp `decidedAt`. Frontend labels this "Confirm Selection" when the candidate is still at App Submitted.
- `PUT /api/candidates/{id}/reject` — `{"feedback": "..."}` (required) → status=`rejected`, stamps `decidedAt`.
- `PUT /api/candidates/{id}/rescore` — recompute `match` against their assigned startup.

### Startups
- `GET /api/startups`, `GET /api/startups/{id}`.
- `PUT /api/startups/{id}` — partial update (e.g. `{"premium": true}`).
- `POST /api/startups/{id}/needs` — `{"need": "Rust"}`; `DELETE /api/startups/{id}/needs/{need}`. Still functional (backend-only now — no frontend UI calls these since the Identified Needs tag editor was replaced, §9), needs[] is populated via description uploads instead.
- `GET /api/startups/{id}/candidates` — candidates assigned to this startup, each with a freshly computed `match` score.
- `GET /api/startups/{id}/matches` — the symmetric AI-matching feed for startups: unassigned candidates (`startupId is None` **and** `status != "rejected"`) scored against this startup's `needs`, sorted desc, capped at 3 (free) or 10 (premium).
- `GET /api/startups/{id}/descriptions` — this startup's uploaded Internship Descriptions, newest first.
- `POST /api/startups/{id}/descriptions` — multipart `file` (PDF or `.docx`, ≤15MB) → stores the doc, extracts skills/position/commitment/summary locally (best-effort — the doc still saves even if parsing finds nothing), merges the skills into `startup.needs`, returns the created `InternshipDescription`. 400 for any other file extension.

### Universities
- `GET /api/universities`, `GET /api/universities/{id}`.

### Contracts
- `GET /api/contracts?candidateId=`.
- `PUT /api/contracts/{id}/sign` — body `{"signatureData"?: "data:image/png;base64,..."}` (optional) → marks signed + `signedAt` (+ `signatureData` if provided), and (via the router orchestrating both services) flips the candidate to `onboarding` + stamps `contractSignedAt`. This is the "Intern Signed" *and* "Executed" step of the Draft → Startup Signed → Intern Signed → Executed timeline (§5) — `startupSignedAt` is already set from contract creation.

### BYOC
- `GET /api/byoc?startupId=`.
- `POST /api/byoc` — submit; rejected with 400 if (a) `track=qstp` and the startup is already at the 3-cohort QSTP cap, or (b) the startup is at its BYOC submission cap (1 free / 3 premium, counting non-rejected submissions).
- `PUT /api/byoc/{id}/approve` — creates a real Candidate via `CandidateFactory.from_byoc`.
- `PUT /api/byoc/{id}/reject`.

### Automation
- `POST /api/automation` — `{"kind": "mass_email"|"contracts"|"payroll", "candidateIds": [...], "subject"?: "...", "body"?: "..."}` → `{"affected": N}`.
  - `mass_email`: sets `lastEmailedAt` (and `lastEmailSubject` if `subject` given) on every id. The admin Automation Hub composes `subject`/`body` in a popup before calling this; there's no real email delivery, it's a mocked/logged send like the rest of the app.
  - `contracts`: sets `status=contract_sent` + `contractSentAt`, creates a Contract record.
  - `payroll`: only affects candidates with `status=onboarding` and `track=qstp` → `status=payroll_processed` + `payrollAt`.
- `GET /api/automation/payroll-preview` — breakdown of every startup's active interns (status ∈ `onboarding`/`contract_sent`/`payroll_processed`) with `weeklyHours`, `hourlyRate` (30 QR/hr for `qstp`, 0 for `placement`), `weeklyCost`, per-startup `startupTotal`, and an overall `grandTotal`. Shown to the admin before they confirm a payroll run.

### Stats
- `GET /api/stats/dashboard` → `{applications, startupsLive, universities, qstpFundedSlots, workPlacementSlots, conversionPct, funnel[], startupLoad[], cycles[], byocPending, automationEligibility{}}`.

Full interactive docs: `http://localhost:8000/docs` (Swagger UI, auto-generated by FastAPI).

## 5. Core Business Logic

- **Candidate workflow**: `submitted → matched → interviewing → onboarding → contract_sent → payroll_processed`, rejectable at any stage (`CandidateService.reject`). `advance_workflow` bumps `workflowIdx` and looks up the matching status in `WORKFLOW_STATUS_MAP`; it caps at Onboarding (contract_sent/payroll_processed only happen via Automation, not manual advance). Both `advance_workflow` and `reject` stamp `decidedAt`, which feeds the admin **Decisions Feed** (`components/admin/DecisionsFeed.jsx`) — the one place admin sees every startup confirm/reject, with rejection feedback, without opening each candidate individually. Rejecting already drops a candidate off their startup's own 5-Step Workflow Tracker — `StartupService.candidate_scores` (the tracker's data source) filters `status != "rejected"`; `reject()` never clears `startupId`, so a rejected candidate stays tied to that startup but invisible on its tracker. (It also won't reappear in *any* startup's AI Matchmaking Feed, per the `intern_matches` fix above.)
- **Match scoring** (`SkillIntersectionMatchStrategy.score`): `overlap = count(needs ∩ skills, case-insensitive)`; `base = round(overlap/len(needs)*100)` (50 if no needs); add `±6` jitter; clamp to `[40, 99]`.
- **Intern self-apply** (`CandidateService.create_self_apply`, `POST /api/candidates/apply`): the intern-facing path into the system that doesn't go through a university or startup. Creates a `track=qstp`, `workflowIdx=1`, `startupId=None` candidate directly from the chatbot's answers (§ frontend below), then the frontend logs the new candidate straight in (`AuthContext.persistSession`) and shows their top-3 AI-matched startups.
- **CV extraction** (`ExtractionService.extract`, `POST /api/candidates/extract`): the *only* auto-fill/matching signal comes from the uploaded CV PDF — LinkedIn/portfolio are always plain optional link fields, never parsed or scored. Extraction is **local and deterministic** (`app/services/pdf_parsing.py`, no external AI API, no API key needed): `pypdf` pulls the raw text, then `parse_cv_text` reads it as a labeled resume (name = first line; contact line = `location | email | linkedin`; `EDUCATION` section → university/degree+major/gradYear/academic-status; `SKILLS` section, or the whole doc as a fallback, scanned against a canonical `SKILL_VOCABULARY` list for skill tags). Built around `Approved_Intern_Template.pdf`'s layout but degrades gracefully (returns whatever it finds, rest stays blank) on any similarly-structured resume. Only non-empty fields are merged into the form, and the full result is also persisted to `cv_extractions.json`. The PDF itself is stored under `backend/data/uploads/` and the returned `cvLink` points at it via the `/uploads` static mount.
- **Startup ⇄ intern AI matching is symmetric**: `CandidateService.startup_matches` (intern sees ranked startups) and `StartupService.intern_matches` (startup sees ranked unassigned interns) both use `SkillIntersectionMatchStrategy`, just with the pool/target swapped. Startup-side is capped: 3 results free, 10 premium (`STARTUP_MATCH_FREE_LIMIT`/`STARTUP_MATCH_PREMIUM_LIMIT`). `intern_matches`' pool filter is `startupId is None and status != "rejected"` — it used to be `startupId != this_startup_id`, which let candidates already claimed by *another* startup (or rejected ones, whose `startupId` is never cleared) show up as "matches"; clicking "Add to Workflow" on one of those always 400'd server-side (`assign_to_startup` rejects an already-assigned candidate), which is what made the button look broken.
- **Startup Premium** (`startup.premium`, toggled via `PUT /api/startups/{id}`): unlocks more AI-matched interns (3→10) and a bigger BYOC submission cap (1→3). Turning it on in the UI opens a mock "$12/month" checkout popup (`components/startup/PremiumModal.jsx`) explaining what unlocks before it actually flips the flag; turning it off is immediate, no popup.
- **Automation** (`AutomationService.run`): iterates candidate ids, applies the kind-specific mutation (see API reference above); unknown ids are silently skipped (not affected-counted). The admin Automation Hub lets the admin pick a **recipient filter** before composing a mass email — "Accepted interns" (matched/interviewing/onboarding/contract_sent/payroll_processed), "Signed contracts" (`contractSignedAt` set), or "Everyone" — then opens a free-text subject/body popup (`components/admin/EmailComposeModal.jsx`) before sending.
- **Payroll preview** (`AutomationService.payroll_preview`, `GET /api/automation/payroll-preview`): shown to the admin (`components/admin/PayrollPreviewModal.jsx`) before they confirm a payroll run — every startup's active interns, weekly hours (`weeklyHours`, defaults 40 FT / 20 PT), and cost at `PAYROLL_RATE_QR_PER_HOUR = 30` QR/hr; Work Placement interns always cost 0 (unpaid). Confirming still only actually processes `status=onboarding`+`track=qstp` candidates (unchanged automation semantics) — the preview is informational/whole-picture, the run itself is scoped the same as before.
- **Digital contract signature** (`ContractHub.jsx`/`SignaturePad.jsx`, `ContractService.sign`): implements Feature 3's Draft → Startup Signed → Intern Signed → Executed timeline. `ContractFactory.build` stamps `startupSignedAt` at creation time (an auto-drafted, admin-sent contract is already startup/QSTP-agreed, so stage 1 "Draft" and stage 2 "Startup Signed" are both satisfied the moment the contract exists) — the only remaining real step is the intern's e-signature, captured via `SignaturePad` as either a live HTML5 `<canvas>` drawing (`canvas.toDataURL('image/png')`) or an uploaded PNG (`FileReader.readAsDataURL`), sent as `signatureData` on `PUT /api/contracts/{id}/sign`. That one action satisfies stage 3 "Intern Signed" *and* stage 4 "Executed" simultaneously (nothing else needs to happen after the intern signs in this system) and time-stamps the signature via `signedAt`. `ContractTimeline` (in `ContractHub.jsx`) renders the 4-stage rail from `signed`/`startupSignedAt`. "Notifies Startup, Intern, and QSTP Admin" is represented the same way every other notification in this app is (mocked, no real email/SMS) — a toast on sign.
- **BYOC flow**: startup submits (`ByocService.submit`, blocked at 400 if either the QSTP cohort cap or the BYOC submission cap is reached) → admin approves (creates a Candidate, `status=matched`, `match=70`) or rejects (no candidate created).
- **Internship Description upload** (`InternshipDescriptionService.upload`, `POST /api/startups/{id}/descriptions`): replaces the old manual Identified Needs tag editor. Startup uploads a PDF (e.g. `Approved_JD_Template.pdf`) or `.docx` job description; extension picked by `filename`. PDF → `pdf_parsing.parse_job_text` reads `Position:`/`Duration:`/`Commitment:` label lines (weeks + cycle out of Duration, FT/PT + weekly hours out of Commitment) and scans a `Required Skills` section (or the whole doc as fallback) against the same `SKILL_VOCABULARY` used for CVs; `.docx` → `python-docx` pulls the text first, then the same `parse_job_text`. Skills are deduped into `startup.needs`; position/commitment/weeklyHours/weeks/cycle are stored on the `InternshipDescription` record for display. The raw file is always saved and the record always created even if parsing finds nothing (wrapped in a broad `try/except` — best-effort, non-fatal) so the upload always ends in "uploaded successfully."
- **Local PDF parsing** (`app/services/pdf_parsing.py`): the single source of truth for both CV and job-description extraction — no external AI API call, so it needs no API key and works offline. `extract_pdf_text` (pypdf) → `parse_cv_text`/`parse_job_text`. `_find_skills` matches a canonical `SKILL_VOCABULARY` list against free text (longest phrase first, case-insensitive, whole-word-ish boundaries, first-occurrence order) so extracted tags line up with the rest of the app's skill taxonomy (seed `startup.needs[]`, candidate `skillSet[]`). Both parsers are section-aware (`EDUCATION`/`SKILLS` for CVs — detected via ALL-CAPS headers; `About Us`/`Required Skills` for JDs — detected via a known Title-Case header list) but degrade to scanning the whole document if a section isn't found, so a differently-formatted PDF still yields a best-effort result instead of nothing.
- **Cohort cap**: every startup can host at most 3 QSTP-funded cohorts (`qstpCohortsUsed`, `QSTP_COHORT_CAP=3` in `byoc_service.py`); Work Placement is uncapped.
- **BYOC submission cap**: independent of the cohort cap — 1 total submission free, 3 premium (`BYOC_CAP_FREE`/`BYOC_CAP_PREMIUM` in `byoc_service.py`), counting non-rejected submissions for that startup.

## 6. File Structure

```
backend/
  app/
    main.py                  FastAPI app, lifespan (seed + integrity check), router registration, /uploads static mount
    core/config.py            DATA_DIR, UPLOAD_DIR, CORS_ORIGINS, BACKEND_BASE_URL (backend needs zero required env vars now)
    core/dependencies.py      DI wiring — get_*_repository()/get_*_service()
    models/                   Pydantic request/response models + enums.py
      internship_description.py InternshipDescription model (incl. position/commitment/weeklyHours/weeks/cycle)
      contract.py               Contract model (incl. startupSignedAt/signatureData), SignContractRequest
    repositories/              BaseRepository + one subclass per entity
      internship_description_repository.py  internship_descriptions.json
      cv_extraction_repository.py            cv_extractions.json
    services/                  business logic, one file per domain
      pdf_parsing.py             local, deterministic PDF text -> JSON for both CV and job-description templates — no external AI API (§5)
      extraction_service.py     thin wrapper over pdf_parsing.py (+ docx text extraction) — stores uploads, persists cv_extractions.json
      internship_description_service.py  startup PDF/.docx upload → store + extract skills/position/commitment → merge into startup.needs
    api/v1/                    routers, one file per domain
    utils/
      file_utils.py            read_json/write_json/check_data_integrity
      factories.py             CandidateFactory, ContractFactory
      match_strategy.py        MatchStrategy, SkillIntersectionMatchStrategy
      seed.py                  seed_if_empty() — ports the original app's demo data
  data/*.json                  runtime data (seeded on first boot)
  data/uploads/                 uploaded CV PDFs + internship-description PDF/.docx files (created lazily, gitignored)
  tests/
    test_backend.py            consolidated repo+service+API coverage (35 tests, incl. real extraction against Approved_Intern_Template.pdf/Approved_JD_Template.pdf)
    test_full_app.py           one end-to-end lifecycle test across all 4 roles
  requirements.txt

frontend/
  src/
    main.jsx, App.jsx           entry + role-gated shell (no router)
    api/{client.js,endpoints.js}
    context/{AuthContext,ToastContext}.jsx
    hooks/{useAuth,useApi,useToast}.js
    pages/{Login,InternPortal,UniversityPortal,StartupPortal,AdminPortal}.jsx
      Login.jsx                 2-step flow: role-picker grid ("Sign in — select your role"), then a role-specific credentials page (back button, pre-filled demo username+password for org roles / demo email for intern) that signs straight into that role's portal
    components/
      common/                    Modal, Spinner, Navbar, etc.
      intern/
        NewApplicationWizard.jsx  full-page (not modal) 4-step flow with a step rail + slide/fade transitions: mock Google sign-in → CV PDF upload/extract → chatbot application → top-3 match results. Login renders it as a full page swap (`if (wizardOpen) return <NewApplicationWizard .../>`), not an overlay.
        ChatApplication.jsx       the conversational Q&A engine step 3 delegates to — batches of ≤3 quick questions or 1 long-answer question at a time, a % progress bar + motivational copy, and a slide-up entrance animation per question group
        ContractHub.jsx            contract list + Draft→Startup Signed→Intern Signed→Executed timeline (`ContractTimeline`)
        SignaturePad.jsx           e-signature modal — draw on an HTML5 canvas or upload a PNG, returns a base64 data URL
      startup/
        PremiumModal.jsx          mock $12/mo checkout popup shown when premium is turned on
        InternFeed.jsx            AI-matched interns feed (free/premium capped)
        ByocPanel.jsx              BYOC submission form + used/cap counter + upgrade CTA at cap
        InternshipDescriptions.jsx  "New Internship Description" PDF/.docx upload (replaces NeedsEditor) — dropzone, pop-in success state (position/commitment/hours/weeks + extracted skills), and a list of past uploads
        CandidateList.jsx
      admin/
        AutomationHub.jsx          mass-email recipient filters + contracts + payroll, opens the two modals below
        EmailComposeModal.jsx      free-text subject/body popup for mass email
        PayrollPreviewModal.jsx    per-startup/per-intern payroll breakdown before confirming a run
        DecisionsFeed.jsx          recent startup confirm/reject decisions, with feedback
        ByocQueue.jsx, Funnel.jsx, StartupLoad.jsx, CycleGrid.jsx
    utils/{constants.js,helpers.js}
    styles/index.css            Tailwind v4 @theme (qstp color scale) + ported custom CSS
  .env                          VITE_DEV_MODE=true, gitignored — see .env.example
  .env.example
```

## 7. Enum Index (`app/models/enums.py`)

| Enum | Values |
|---|---|
| `Role` | intern, university, startup, admin |
| `Track` | qstp, placement |
| `Commitment` | FT, PT |
| `Cycle` | winter, summer, fall |
| `CandidateStatus` | submitted, matched, interviewing, onboarding, contract_sent, payroll_processed, rejected |
| `WorkflowStep` | 1=App Submitted … 4=Onboarding (`.label(idx)` helper; 0="Identify Needs" is startup-side only) |
| `ByocStatus` | pending_qstp_approval, approved, rejected |
| `AutomationKind` | mass_email, contracts, payroll |
| `CYCLES` | not an enum — the 3 cycle date-range dicts, reused by seed data and the dashboard |

## 8. Key Function Index — where to add a new feature

| If you want to… | Touch |
|---|---|
| Add a new candidate field | `models/candidate.py` (Candidate + CandidateUpdate) → `utils/factories.py::CandidateFactory.build` → frontend `EditProfileModal.jsx`/`InternPortal.jsx` |
| Change match-scoring logic | Add a new class implementing `MatchStrategy` in `utils/match_strategy.py`, wire it in `core/dependencies.py::get_match_strategy` — no service/router changes needed |
| Add a new workflow stage | `models/enums.py::CandidateStatus`/`WorkflowStep`/`WORKFLOW_STATUS_MAP` → `services/candidate_service.py::advance_workflow` → frontend `utils/constants.js::WORKFLOW` |
| Add a new automation op | `models/enums.py::AutomationKind` → `services/automation_service.py::run` (new `elif` branch) → frontend `components/admin/AutomationHub.jsx` (add a button + wire eligibility) |
| Add a new REST resource end-to-end | new file in `models/`, `repositories/` (subclass `BaseRepository`), `services/`, `api/v1/` (router) → register in `main.py` → wire a `get_*_service` in `core/dependencies.py` → add calls in `frontend/src/api/endpoints.js` |
| Change seed/demo data | `utils/seed.py` (delete `backend/data/*.json` to force reseed — seeding only runs when `candidates.json` is missing) |
| Add a new admin dashboard metric | `services/dashboard_service.py::DashboardService.summary` → frontend `pages/AdminPortal.jsx` + a new component in `components/admin/` |
| Change what the CV extraction fills in | `services/pdf_parsing.py` (`parse_cv_text`/`SKILL_VOCABULARY`) → `models/candidate.py::SelfApplyRequest` if it's a wholly new field → `components/intern/ChatApplication.jsx::FIELDS` |
| Add/reorder a chatbot application question | `components/intern/ChatApplication.jsx::FIELDS` — mark `long: true` for an essay-style field to give it its own turn, otherwise it's auto-batched into groups of ≤3 by `buildGroups` |
| Change the payroll rate or weekly-hours default | `services/automation_service.py::PAYROLL_RATE_QR_PER_HOUR`/`DEFAULT_WEEKLY_HOURS` |
| Change BYOC/premium-match caps | `services/byoc_service.py::BYOC_CAP_FREE`/`BYOC_CAP_PREMIUM`, `services/startup_service.py::FREE_INTERN_MATCH_LIMIT`/`PREMIUM_INTERN_MATCH_LIMIT` → mirrored in frontend `utils/constants.js` |
| Change what the internship-description upload extracts | `services/pdf_parsing.py` (`parse_job_text`/`SKILL_VOCABULARY`) → `services/internship_description_service.py::upload` |
| Change the fixed role-login credentials | `services/auth_service.py::ROLE_CREDENTIALS` → mirror the default in frontend `pages/Login.jsx::DEFAULT_CREDENTIALS` |
| Add a skill to the shared vocabulary (so CV/JD parsing recognizes it) | `services/pdf_parsing.py::SKILL_VOCABULARY` |
| Change the contract signature/timeline workflow | `services/contract_service.py::sign`, `utils/factories.py::ContractFactory.build` → frontend `components/intern/ContractHub.jsx` (`ContractTimeline`, `stageIdx`), `SignaturePad.jsx` |

## 9. Finished vs. Remaining Features

**Finished (implemented end-to-end, backend + frontend, covered by tests):**
- Auth: intern email/password login (email-only check) or a fixed username/password per role for University/Startup/Admin (`POST /api/auth/login/role`, §4/§9-below), dev-mode instant-login shortcut panel (`VITE_DEV_MODE`, still bare `{role}` login for all 4 roles)
- Intern: self-service application as a **full-page** (not modal) flow with a step rail + transitions (mock Google sign-in → CV PDF upload/extraction → conversational chatbot form with a motivation/progress tracker and per-question slide-up animation → top-3 AI-matched startups), profile view/edit, AI match feed (all startups scored), contract view + sign
- CV parsing: real PDF upload, extracted via the Anthropic API (`claude-opus-5`, forced tool-call for schema-constrained output) — the sole source of auto-fill and matching signal; result also persisted to `cv_extractions.json`; LinkedIn/portfolio are plain optional links, never parsed
- University: single push, CSV bulk upload, pipeline list, cycle timelines
- Startup: 5-step workflow tracker + advance ("Confirm Selection" at App Submitted)/reject (with mandatory feedback — rejecting drops the candidate off this tracker, §5), **New Internship Description** `.docx` upload (replaces the old manual needs tag editor — auto-extracts required skills into `needs[]`, always ends in an "uploaded successfully" state even if AI extraction fails), premium toggle (mock $12/mo popup) unlocking more AI-matched interns (3→10) and more BYOC slots (1→3) with a used/cap counter, symmetric AI intern-matching feed (now correctly excludes candidates already claimed elsewhere and rejected candidates, §5), BYOC submission (with cohort-cap *and* submission-cap validation), candidate detail modal, client-side name/track/commitment/university/gender filters
- Admin: dashboard metrics, application funnel, startup cohort load, automation hub with recipient filters (accepted/signed-contracts/everyone) + a free-text email compose popup, contract generation, a payroll-preview breakdown (per-startup, per-intern hours/rate/cost at 30 QR/hr, QSTP-funded only — Work Placement is unpaid) before confirming a run, a recent-decisions feed (confirm/reject + feedback, surfaced from `decidedAt`), BYOC approval queue, cycle timelines
- JSON-file persistence with a startup-time integrity check
- Consolidated pytest suite (32 tests: repository CRUD, match-strategy bounds, every API route, cohort-cap/BYOC-cap edge cases, payroll preview breakdown, one full 9-step cross-role lifecycle test) — all passing after the auth/matching/extraction changes above

**Remaining / not implemented (explicitly out of scope for this pass — see §10 for why):**
- Real authentication (hashing/JWT/sessions) — the University/Startup/Admin logins now do check a fixed username+password server-side, but it's still one shared plaintext pair per role, not per-account credentials, hashing, or a session store; the intern email/password login and CV-upload flows remain realistic-*looking* UX but neither verifies a password nor requires a real Google/LinkedIn account
- A real database — spec asked for JSON files only
- The original app's manual "Re-run AI Match" button (bulk re-score + re-sort on click) has no direct equivalent — this rebuild instead recomputes every candidate's `match` live on each `GET /api/startups/{id}/candidates` call, so scores are always fresh without a manual trigger. A dedicated `/rescore-all` endpoint could be added if a manual, point-in-time re-score-and-freeze is preferred instead.
- CSV/bulk *export* (only bulk *import* exists)
- Real email delivery — mass email is mocked (stamps `lastEmailedAt`/`lastEmailSubject`, no SMTP/provider integration); same for payroll ("processing" just flips status/timestamps, no real payment rail)
- File uploads beyond the CV PDF and the startup's internship-description `.docx` — LinkedIn/portfolio/contract documents are still links, not uploaded files
- Pagination/search on `GET /api/candidates` beyond the existing query-param filters

## 10. Recommendations

- **Data integrity script**: implemented — `check_data_integrity()` runs at startup and logs (doesn't crash on) malformed JSON. Consider making it fail loudly (raise) in a stricter environment.
- **`.gitignore` for `backend/data/`**: not currently gitignored. Since the JSON files double as both seed data and runtime-mutated state, either (a) gitignore `backend/data/*.json` and commit a `backend/data/seed/` copy the app reads from instead, or (b) keep committing seed data but reset via `git checkout backend/data/` before demos. Pick based on whether you want the repo to always start from a clean demo state.
- **Concurrency**: `write_json` does read-modify-write with no file locking — fine for a single-user local prototype, not safe for concurrent writers. Add file locking (e.g. `filelock`) before any multi-user deployment.
- **IDs**: candidate/startup/etc ids are random hex suffixes; if you need human-referenceable ids later, consider sequential/slug-based ids instead.
- **Repo hygiene note**: this project's `.git` root was found to extend well above the `Dinomites` folder (it enumerated unrelated directories like `Documents`, `Cookies`, `Application Data` during a `git rm`). Worth checking `git rev-parse --show-toplevel` and confirming the repo is scoped to just this project before further commits.

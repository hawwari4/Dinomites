import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1 import automation, auth, byoc, candidates, contracts, notifications, startups, stats, universities
from app.core import config
from app.core.config import CORS_ORIGINS
from app.utils.file_utils import check_data_integrity
from app.utils.seed import seed_if_empty

logger = logging.getLogger("qstp")


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_if_empty()
    problems = check_data_integrity(
        config.DATA_DIR, ["candidates.json", "startups.json", "universities.json", "contracts.json", "byoc.json"]
    )
    for p in problems:
        logger.warning("Data integrity issue: %s", p)
    yield


app = FastAPI(title="QSTP Connect API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR, check_dir=False), name="uploads")

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(startups.router)
app.include_router(universities.router)
app.include_router(contracts.router)
app.include_router(byoc.router)
app.include_router(notifications.router)
app.include_router(automation.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

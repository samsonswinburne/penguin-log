from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.auth import router as auth_router
from app.database import Base, engine
from app.health import router as health_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    if engine is not None:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(health_router)
app.include_router(auth_router)

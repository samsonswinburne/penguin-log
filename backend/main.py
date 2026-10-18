from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.auth import router as auth_router
from app.database import Base, SessionLocal, engine
from app.games import router as games_router
from app.genres import router as genres_router
from app.health import router as health_router
from app.me import router as me_router
from app.reviews import router as reviews_router
from app.seed import seed_if_empty
from app.users import router as users_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    if engine is not None and SessionLocal is not None:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(genres_router)
app.include_router(games_router)
app.include_router(reviews_router)
app.include_router(users_router)
app.include_router(me_router)

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.cassandra import init_cassandra
from database.neo4j import init_neo4j

from routers.threads import router as threads_router
from routers.posts import router as posts_router
from routers.recommend import router as recommend_router, router_api as recommend_router_api

app = FastAPI(title="BDNR Backend", version="1.0")

# Parse comma-separated origins from env; fallback to allow all for local dev
origins_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_cassandra()
    init_neo4j()

app.include_router(threads_router)
app.include_router(posts_router)
app.include_router(recommend_router)
app.include_router(recommend_router_api)

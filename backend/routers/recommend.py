from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from database.neo4j import (
    log_recommendation,
    recomendar as recommend_graph,
    register_performance,
    registrar_progreso,
    set_difficulty,
    set_similarity_pairs,
    set_user_error,
    set_user_interest,
    tag_exercise_with_interest,
    upsert_error_type,
    upsert_exercise,
    upsert_interest,
    upsert_skill,
    upsert_user,
)

router = APIRouter(prefix="/recommend", tags=["recommend"])
router_api = APIRouter(prefix="/api/recommend", tags=["recommend"])


class Progress(BaseModel):
    user_id: str
    course_id: str
    level: str | None = None


class UserPayload(BaseModel):
    user_id: str
    primary_language: Optional[str] = None
    current_level: Optional[int] = None
    streak: Optional[int] = None


class ExercisePayload(BaseModel):
    exercise_id: str
    type: Optional[str] = None
    difficulty: Optional[int] = None
    language: Optional[str] = None


class SkillPayload(BaseModel):
    skill_id: str
    name: Optional[str] = None
    category: Optional[str] = None
    level: Optional[int] = None


class InterestPayload(BaseModel):
    interest_id: str
    name: Optional[str] = None
    category: Optional[str] = None


class ErrorTypePayload(BaseModel):
    error_id: str
    description: Optional[str] = None
    category: Optional[str] = None


class PerformancePayload(BaseModel):
    user_id: str
    exercise_id: str
    correct_ratio: float = Field(ge=0, le=1)
    attempts: Optional[int] = None


class DifficultyPayload(BaseModel):
    user_id: str
    skill_id: str
    error_score: float = Field(ge=0, le=1)


class UserErrorPayload(BaseModel):
    user_id: str
    error_id: str
    frequency: float = Field(ge=0, le=1)


class InterestLinkPayload(BaseModel):
    user_id: str
    interest_id: str
    weight: float = Field(ge=0, le=1)


class ExerciseTagPayload(BaseModel):
    exercise_id: str
    interest_id: str


class SimilarPair(BaseModel):
    user1: str
    user2: str
    score: float = Field(ge=0, le=1)
    metric: Optional[str] = None


class RecommendationLog(BaseModel):
    user_id: str
    exercise_id: str
    strategy: str
    accepted: Optional[bool] = None


@router.post("/progress")
def progress(data: Progress):
    registrar_progreso(data.user_id, data.course_id, data.level)
    return {"status": "ok"}


@router.post("/users", status_code=201)
def add_user(payload: UserPayload):
    upsert_user(
        payload.user_id, payload.primary_language, payload.current_level, payload.streak
    )
    return {"status": "created", "user_id": payload.user_id}


@router.post("/exercises", status_code=201)
def add_exercise(payload: ExercisePayload):
    upsert_exercise(
        payload.exercise_id, payload.type, payload.difficulty, payload.language
    )
    return {"status": "created", "exercise_id": payload.exercise_id}


@router.post("/skills", status_code=201)
def add_skill(payload: SkillPayload):
    upsert_skill(payload.skill_id, payload.name, payload.category, payload.level)
    return {"status": "created", "skill_id": payload.skill_id}


@router.post("/interests", status_code=201)
def add_interest(payload: InterestPayload):
    upsert_interest(payload.interest_id, payload.name, payload.category)
    return {"status": "created", "interest_id": payload.interest_id}


@router.post("/error-types", status_code=201)
def add_error_type(payload: ErrorTypePayload):
    upsert_error_type(payload.error_id, payload.description, payload.category)
    return {"status": "created", "error_id": payload.error_id}


@router.post("/performed", status_code=201)
def add_performance(payload: PerformancePayload):
    register_performance(
        payload.user_id, payload.exercise_id, payload.correct_ratio, payload.attempts
    )
    return {"status": "created"}


@router.post("/difficulties", status_code=201)
def add_difficulty(payload: DifficultyPayload):
    set_difficulty(payload.user_id, payload.skill_id, payload.error_score)
    return {"status": "created"}


@router.post("/errors", status_code=201)
def add_error(payload: UserErrorPayload):
    set_user_error(payload.user_id, payload.error_id, payload.frequency)
    return {"status": "created"}


@router.post("/interested-in", status_code=201)
def add_interest_link(payload: InterestLinkPayload):
    set_user_interest(payload.user_id, payload.interest_id, payload.weight)
    return {"status": "created"}


@router.post("/tags", status_code=201)
def add_tag(payload: ExerciseTagPayload):
    tag_exercise_with_interest(payload.exercise_id, payload.interest_id)
    return {"status": "created"}


@router.post("/similarities", status_code=201)
def add_similarities(pairs: List[SimilarPair]):
    set_similarity_pairs([p.dict() for p in pairs])
    return {"status": "created", "count": len(pairs)}


@router.post("/log", status_code=201)
def log_recommendation_edge(payload: RecommendationLog):
    log_recommendation(
        payload.user_id, payload.exercise_id, payload.strategy, payload.accepted
    )
    return {"status": "created"}


@router.get("/{user_id}")
def recommend_user(user_id: str):
    return recommend_graph(user_id)


# aliases under /api/recommend for clients that keep /api prefix
@router_api.post("/progress")
def progress_api(data: Progress):
    return progress(data)


@router_api.post("/users")
def add_user_api(payload: UserPayload):
    return add_user(payload)


@router_api.post("/exercises")
def add_exercise_api(payload: ExercisePayload):
    return add_exercise(payload)


@router_api.post("/skills")
def add_skill_api(payload: SkillPayload):
    return add_skill(payload)


@router_api.post("/interests")
def add_interest_api(payload: InterestPayload):
    return add_interest(payload)


@router_api.post("/error-types")
def add_error_type_api(payload: ErrorTypePayload):
    return add_error_type(payload)


@router_api.post("/performed")
def add_performance_api(payload: PerformancePayload):
    return add_performance(payload)


@router_api.post("/difficulties")
def add_difficulty_api(payload: DifficultyPayload):
    return add_difficulty(payload)


@router_api.post("/errors")
def add_error_api(payload: UserErrorPayload):
    return add_error(payload)


@router_api.post("/interested-in")
def add_interest_link_api(payload: InterestLinkPayload):
    return add_interest_link(payload)


@router_api.post("/tags")
def add_tag_api(payload: ExerciseTagPayload):
    return add_tag(payload)


@router_api.post("/similarities")
def add_similarities_api(pairs: List[SimilarPair]):
    return add_similarities(pairs)


@router_api.post("/log")
def log_recommendation_edge_api(payload: RecommendationLog):
    return log_recommendation_edge(payload)


@router_api.get("/{user_id}")
def recommend_user_api(user_id: str):
    return recommend_user(user_id)

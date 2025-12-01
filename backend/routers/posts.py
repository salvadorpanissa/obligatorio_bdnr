from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from database.cassandra import create_post as cassandra_create_post

router = APIRouter(prefix="/posts")


class PostCreate(BaseModel):
    user_id: str
    content: str


@router.post("/{thread_id}")
def create_post(thread_id: str, data: PostCreate):
    # Validate UUID format early to return a clean 400
    try:
        uuid.UUID(thread_id)
    except ValueError:
        raise HTTPException(400, "Invalid thread_id")

    try:
        return cassandra_create_post(thread_id, data.user_id, data.content)
    except LookupError:
        raise HTTPException(404, "Thread not found")
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(500, f"Error creating post: {exc}")

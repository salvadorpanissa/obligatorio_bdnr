from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from database.cassandra import agregar_post, obtener_post

router = APIRouter(prefix="/posts")

class PostCreate(BaseModel):
    user_id: str
    content: str

@router.post("/{thread_id}")
def create_post(thread_id: str, data: PostCreate):
    try:
        thread_uuid = uuid.UUID(thread_id)
    except ValueError:
        raise HTTPException(400, "Invalid thread_id")

    post_id = agregar_post(thread_uuid, data.user_id, data.content)
    row = obtener_post(thread_uuid, post_id)
    if not row:
        raise HTTPException(404, "Post not found after creation")
    return row

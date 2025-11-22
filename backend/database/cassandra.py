from cassandra.cluster import Cluster
from datetime import datetime
from uuid import UUID, uuid1, uuid4
import config

cluster = None
session = None

def init_cassandra():
    """Initialize Cassandra connection and ensure required tables exist."""
    global cluster, session
    print(f"[CASSANDRA] Connecting to {config.CASSANDRA_HOST}:{config.CASSANDRA_PORT}")

    cluster = Cluster(
        contact_points=[config.CASSANDRA_HOST],
        port=config.CASSANDRA_PORT
    )
    session = cluster.connect()

    session.execute(f"""
        CREATE KEYSPACE IF NOT EXISTS {config.CASSANDRA_KEYSPACE}
        WITH replication = {{
            'class': 'SimpleStrategy',
            'replication_factor': 1
        }};
    """)
    session.set_keyspace(config.CASSANDRA_KEYSPACE)

    session.execute("""
        CREATE TABLE IF NOT EXISTS threads_by_course (
            course_id TEXT,
            created_at TIMESTAMP,
            thread_id UUID,
            title TEXT,
            author_id TEXT,
            last_activity_at TIMESTAMP,
            PRIMARY KEY (course_id, created_at)
        ) WITH CLUSTERING ORDER BY (created_at DESC);
    """)

    session.execute("""
        CREATE TABLE IF NOT EXISTS posts_by_thread (
            thread_id UUID,
            post_id TIMEUUID,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP,
            PRIMARY KEY (thread_id, post_id)
        ) WITH CLUSTERING ORDER BY (post_id ASC);
    """)

    session.execute("""
        CREATE TABLE IF NOT EXISTS posts_by_user (
            user_id TEXT,
            created_at TIMESTAMP,
            thread_id UUID,
            post_id TIMEUUID,
            content TEXT,
            PRIMARY KEY (user_id, created_at)
        ) WITH CLUSTERING ORDER BY (created_at DESC);
    """)

    session.execute("""
        CREATE TABLE IF NOT EXISTS thread_metadata (
            thread_id UUID PRIMARY KEY,
            course_id TEXT,
            title TEXT,
            author_id TEXT,
            created_at TIMESTAMP,
            last_activity_at TIMESTAMP
        );
    """)

    session.execute("""
        CREATE TABLE IF NOT EXISTS thread_counters (
            thread_id UUID PRIMARY KEY,
            post_count COUNTER
        );
    """)

    print("[CASSANDRA] Ready.")


def crear_thread(course_id: str, title: str, author_id: str) -> dict:
    """Create a new thread and seed related tables."""
    now = datetime.utcnow()
    thread_id = uuid4()

    session.execute("""
        INSERT INTO threads_by_course
        (course_id, created_at, thread_id, title, author_id, last_activity_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (course_id, now, thread_id, title, author_id, now))

    session.execute("""
        INSERT INTO thread_metadata
        (thread_id, course_id, title, author_id, created_at, last_activity_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (thread_id, course_id, title, author_id, now, now))

    session.execute("""
        UPDATE thread_counters
        SET post_count = post_count + 0
        WHERE thread_id = %s
    """, (thread_id,))

    return {
        "thread_id": thread_id,
        "course_id": course_id,
        "title": title,
        "author_id": author_id,
        "created_at": now,
        "last_activity_at": now,
        "post_count": 0,
    }


def listar_threads_por_curso(course_id: str, limit: int = 50) -> list[dict]:
    rows = session.execute("""
        SELECT course_id, created_at, thread_id, title, author_id, last_activity_at
        FROM threads_by_course
        WHERE course_id = %s
        LIMIT %s
    """, (course_id, limit))
    return [dict(r._asdict()) for r in rows]


def obtener_thread(thread_id: UUID) -> dict | None:
    row = session.execute("""
        SELECT thread_id, course_id, title, author_id, created_at, last_activity_at
        FROM thread_metadata
        WHERE thread_id = %s
    """, (thread_id,)).one()
    if not row:
        return None

    counter_row = session.execute("""
        SELECT post_count FROM thread_counters WHERE thread_id = %s
    """, (thread_id,)).one()
    post_count = counter_row.post_count if counter_row else 0

    data = dict(row._asdict())
    data["post_count"] = int(post_count)
    return data


def obtener_posts_por_thread(thread_id: UUID, limit: int = 50) -> list[dict]:
    rows = session.execute("""
        SELECT thread_id, post_id, user_id, content, created_at
        FROM posts_by_thread
        WHERE thread_id = %s
        LIMIT %s
    """, (thread_id, limit))
    return [dict(r._asdict()) for r in rows]


def agregar_post(thread_id: UUID, user_id: str, content: str):
    """Insert a post across thread/user views and refresh metadata."""
    now = datetime.utcnow()
    post_id = uuid1()

    session.execute("""
        INSERT INTO posts_by_thread (thread_id, post_id, user_id, content, created_at)
        VALUES (%s, %s, %s, %s, %s)
    """, (thread_id, post_id, user_id, content, now))

    session.execute("""
        INSERT INTO posts_by_user (user_id, created_at, thread_id, post_id, content)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_id, now, thread_id, post_id, content))

    session.execute("""
        UPDATE thread_counters
        SET post_count = post_count + 1
        WHERE thread_id = %s
    """, (thread_id,))

    meta = session.execute("""
        SELECT course_id, created_at FROM thread_metadata WHERE thread_id = %s
    """, (thread_id,)).one()

    session.execute("""
        UPDATE thread_metadata SET last_activity_at = %s WHERE thread_id = %s
    """, (now, thread_id))

    if meta:
        session.execute("""
            UPDATE threads_by_course
            SET last_activity_at = %s
            WHERE course_id = %s AND created_at = %s
        """, (now, meta.course_id, meta.created_at))

    return post_id


def obtener_post(thread_id: UUID, post_id: UUID) -> dict | None:
    row = session.execute("""
        SELECT thread_id, post_id, user_id, content, created_at
        FROM posts_by_thread
        WHERE thread_id = %s AND post_id = %s
    """, (thread_id, post_id)).one()
    return dict(row._asdict()) if row else None

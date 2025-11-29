from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement
from cassandra import ConsistencyLevel
import uuid
from datetime import datetime, timezone
import config

KEYSPACE = config.CASSANDRA_KEYSPACE
CLUSTER_HOSTS = [config.CASSANDRA_HOST]
CLUSTER_PORT = config.CASSANDRA_PORT

cluster = None
session = None

# Consistency levels según lo que pusiste en el doc:
# Escrituras rápidas: CL.ONE, lecturas: LOCAL_QUORUM
CL_WRITE = ConsistencyLevel.ONE
CL_READ = ConsistencyLevel.LOCAL_QUORUM


def init_cassandra():
    global cluster, session
    if session:
        return session

    cluster = Cluster(CLUSTER_HOSTS, port=CLUSTER_PORT)
    tmp_session = cluster.connect()

    # Crear keyspace y tablas si no existen
    tmp_session.execute(f"""
        CREATE KEYSPACE IF NOT EXISTS {KEYSPACE}
        WITH replication = {{ 'class': 'SimpleStrategy', 'replication_factor': 1 }}
    """)
    tmp_session.set_keyspace(KEYSPACE)

    tmp_session.execute("""
        CREATE TABLE IF NOT EXISTS threads_by_course (
            course_id text,
            thread_id uuid,
            title text,
            author_id text,
            created_at timestamp,
            last_activity_at timestamp,
            PRIMARY KEY ((course_id), created_at, thread_id)
        ) WITH CLUSTERING ORDER BY (created_at DESC, thread_id DESC)
    """)

    tmp_session.execute("""
        CREATE TABLE IF NOT EXISTS thread_metadata (
            thread_id uuid PRIMARY KEY,
            course_id text,
            title text,
            author_id text,
            created_at timestamp,
            last_activity_at timestamp
        )
    """)

    tmp_session.execute("""
        CREATE TABLE IF NOT EXISTS thread_counts (
            thread_id uuid PRIMARY KEY,
            post_count counter
        )
    """)

    tmp_session.execute("""
        CREATE TABLE IF NOT EXISTS posts_by_thread (
            thread_id uuid,
            post_id timeuuid,
            user_id text,
            content text,
            created_at timestamp,
            PRIMARY KEY ((thread_id), created_at, post_id)
        ) WITH CLUSTERING ORDER BY (created_at DESC, post_id DESC)
    """)

    tmp_session.execute("""
        CREATE TABLE IF NOT EXISTS posts_by_user (
            user_id text,
            created_at timestamp,
            thread_id uuid,
            post_id timeuuid,
            content text,
            PRIMARY KEY ((user_id), created_at, post_id)
        ) WITH CLUSTERING ORDER BY (created_at DESC, post_id DESC)
    """)

    session = tmp_session
    return session


def create_thread(course_id: str, title: str, author_id: str):
    if not session:
        init_cassandra()
    thread_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    # 1) threads_by_course
    q1 = SimpleStatement("""
        INSERT INTO threads_by_course (
            course_id, thread_id, title, author_id, created_at, last_activity_at
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, consistency_level=CL_WRITE)

    # 2) thread_metadata
    q2 = SimpleStatement("""
        INSERT INTO thread_metadata (
            thread_id, course_id, title, author_id, created_at, last_activity_at
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, consistency_level=CL_WRITE)

    session.execute(q1, (course_id, thread_id, title, author_id, now, now))
    session.execute(q2, (thread_id, course_id, title, author_id, now, now))
    session.execute(SimpleStatement("""
        UPDATE thread_counts SET post_count = post_count + 0 WHERE thread_id = ?
    """, consistency_level=CL_WRITE), (thread_id,))

    return {
        "thread_id": str(thread_id),
        "course_id": course_id,
        "title": title,
        "author_id": author_id,
        "created_at": now.isoformat(),
        "last_activity_at": now.isoformat(),
        "post_count": 0,
    }


def list_threads_by_course(course_id: str, limit: int = 20):
    if not session:
        init_cassandra()
    q = SimpleStatement("""
        SELECT thread_id, title, author_id, created_at, last_activity_at
        FROM threads_by_course
        WHERE course_id = ?
        LIMIT ?
    """, consistency_level=CL_READ)

    rows = session.execute(q, (course_id, limit))
    return [
        {
            "thread_id": str(r.thread_id),
            "title": r.title,
            "author_id": r.author_id,
            "created_at": r.created_at.isoformat(),
            "last_activity_at": r.last_activity_at.isoformat() if r.last_activity_at else None,
        }
        for r in rows
    ]


def get_thread_metadata(thread_id: str):
    if not session:
        init_cassandra()
    tid = uuid.UUID(thread_id)
    q = SimpleStatement("""
        SELECT thread_id, course_id, title, author_id, created_at, last_activity_at
        FROM thread_metadata
        WHERE thread_id = ?
    """, consistency_level=CL_READ)

    row = session.execute(q, (tid,)).one()
    if not row:
        return None

    count_row = session.execute(SimpleStatement("""
        SELECT post_count FROM thread_counts WHERE thread_id = ?
    """, consistency_level=CL_READ), (tid,)).one()
    post_count = int(count_row.post_count) if count_row and count_row.post_count is not None else 0

    return {
        "thread_id": str(row.thread_id),
        "course_id": row.course_id,
        "title": row.title,
        "author_id": row.author_id,
        "created_at": row.created_at.isoformat(),
        "post_count": post_count,
        "last_activity_at": row.last_activity_at.isoformat() if row.last_activity_at else None,
    }


def create_post(thread_id: str, user_id: str, content: str):
    if not session:
        init_cassandra()
    tid = uuid.UUID(thread_id)
    post_id = uuid.uuid1()  # TIMEUUID, respeta el modelo
    now = datetime.now(timezone.utc)

    # posts_by_thread
    q_post_thread = SimpleStatement("""
        INSERT INTO posts_by_thread (
            thread_id, post_id, user_id, content, created_at
        ) VALUES (?, ?, ?, ?, ?)
    """, consistency_level=CL_WRITE)

    # posts_by_user
    q_post_user = SimpleStatement("""
        INSERT INTO posts_by_user (
            user_id, created_at, thread_id, post_id, content
        ) VALUES (?, ?, ?, ?, ?)
    """, consistency_level=CL_WRITE)

    # actualizar thread_metadata
    q_update_meta = SimpleStatement("""
        UPDATE thread_metadata
        SET last_activity_at = ?
        WHERE thread_id = ?
    """, consistency_level=CL_WRITE)

    session.execute(q_post_thread, (tid, post_id, user_id, content, now))
    session.execute(q_post_user, (user_id, now, tid, post_id, content))
    session.execute(q_update_meta, (now, tid))
    session.execute(SimpleStatement("""
        UPDATE thread_counts SET post_count = post_count + 1 WHERE thread_id = ?
    """, consistency_level=CL_WRITE), (tid,))

    return {
        "thread_id": thread_id,
        "post_id": str(post_id),
        "user_id": user_id,
        "content": content,
        "created_at": now.isoformat(),
    }


def list_posts_by_thread(thread_id: str, limit: int = 100):
    if not session:
        init_cassandra()
    q = SimpleStatement("""
        SELECT post_id, user_id, content, created_at
        FROM posts_by_thread
        WHERE thread_id = ?
        LIMIT ?
    """, consistency_level=CL_READ)

    rows = session.execute(q, (uuid.UUID(thread_id), limit))
    return [
        {
            "post_id": str(r.post_id),
            "user_id": r.user_id,
            "content": r.content,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


def list_posts_by_user(user_id: str, limit: int = 50):
    if not session:
        init_cassandra()
    q = SimpleStatement("""
        SELECT created_at, thread_id, post_id, content
        FROM posts_by_user
        WHERE user_id = ?
        LIMIT ?
    """, consistency_level=CL_READ)

    rows = session.execute(q, (user_id, limit))
    return [
        {
            "thread_id": str(r.thread_id),
            "post_id": str(r.post_id),
            "content": r.content,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]

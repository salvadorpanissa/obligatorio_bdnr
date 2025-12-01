from typing import Iterable, Optional

from neo4j import GraphDatabase

import config

driver = None


def _ensure_driver():
    if driver is None:
        init_neo4j()


def init_neo4j():
    global driver
    if driver:
        return driver

    print(f"[NEO4J] Connecting to {config.NEO4J_URI}")
    driver = GraphDatabase.driver(
        config.NEO4J_URI,
        auth=(config.NEO4J_USER, config.NEO4J_PASSWORD)
    )
    with driver.session() as s:
        constraints = [
            ("User", "user_id"),
            ("Exercise", "exercise_id"),
            ("Skill", "skill_id"),
            ("ErrorType", "error_id"),
            ("Interest", "interest_id"),
            ("Course", "course_id"),
        ]
        for label, field in constraints:
            s.run(f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.{field} IS UNIQUE")

    print("[NEO4J] Ready.")
    return driver


def registrar_progreso(user_id, course_id, level):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            MERGE (c:Course {course_id: $course_id})
            MERGE (u)-[r:COMPLETED]->(c)
            SET r.level = $level, r.created_at = datetime()
        """, user_id=user_id, course_id=course_id, level=level)


def upsert_user(user_id: str, primary_language: Optional[str], current_level: Optional[int], streak: Optional[int]):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            SET u.primary_language = coalesce($primary_language, u.primary_language),
                u.current_level = coalesce($current_level, u.current_level),
                u.streak = coalesce($streak, u.streak),
                u.created_at = coalesce(u.created_at, datetime())
        """, user_id=user_id, primary_language=primary_language, current_level=current_level, streak=streak)


def upsert_exercise(exercise_id: str, type_: Optional[str], difficulty: Optional[int], language: Optional[str]):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (e:Exercise {exercise_id: $exercise_id})
            SET e.type = coalesce($type_, e.type),
                e.difficulty = coalesce($difficulty, e.difficulty),
                e.language = coalesce($language, e.language),
                e.created_at = coalesce(e.created_at, datetime())
        """, exercise_id=exercise_id, type_=type_, difficulty=difficulty, language=language)


def upsert_skill(skill_id: str, name: Optional[str], category: Optional[str], level: Optional[int]):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (s:Skill {skill_id: $skill_id})
            SET s.name = coalesce($name, s.name),
                s.category = coalesce($category, s.category),
                s.level = coalesce($level, s.level)
        """, skill_id=skill_id, name=name, category=category, level=level)


def upsert_interest(interest_id: str, name: Optional[str], category: Optional[str]):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (i:Interest {interest_id: $interest_id})
            SET i.name = coalesce($name, i.name),
                i.category = coalesce($category, i.category)
        """, interest_id=interest_id, name=name, category=category)


def upsert_error_type(error_id: str, description: Optional[str], category: Optional[str]):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (e:ErrorType {error_id: $error_id})
            SET e.description = coalesce($description, e.description),
                e.category = coalesce($category, e.category)
        """, error_id=error_id, description=description, category=category)


def register_performance(user_id: str, exercise_id: str, correct_ratio: float, attempts: Optional[int] = None):
    """
    Registra la relacion PERFORMED sumando intentos y dejando timestamp.
    """
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            MERGE (e:Exercise {exercise_id: $exercise_id})
            MERGE (u)-[p:PERFORMED]->(e)
            SET p.correct_ratio = $correct_ratio,
                p.attempts = coalesce($attempts, coalesce(p.attempts, 0) + 1),
                p.performed_at = datetime()
        """, user_id=user_id, exercise_id=exercise_id, correct_ratio=correct_ratio, attempts=attempts)


def set_difficulty(user_id: str, skill_id: str, error_score: float):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            MERGE (s:Skill {skill_id: $skill_id})
            MERGE (u)-[d:HAS_DIFFICULTY]->(s)
            SET d.error_score = $error_score,
                d.updated_at = datetime()
        """, user_id=user_id, skill_id=skill_id, error_score=error_score)


def set_user_error(user_id: str, error_id: str, frequency: float):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            MERGE (e:ErrorType {error_id: $error_id})
            MERGE (u)-[m:MAKES_ERROR]->(e)
            SET m.frequency = $frequency,
                m.updated_at = datetime()
        """, user_id=user_id, error_id=error_id, frequency=frequency)


def tag_exercise_with_interest(exercise_id: str, interest_id: str):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (e:Exercise {exercise_id: $exercise_id})
            MERGE (i:Interest {interest_id: $interest_id})
            MERGE (e)-[:TAGGED_AS]->(i)
        """, exercise_id=exercise_id, interest_id=interest_id)


def set_user_interest(user_id: str, interest_id: str, weight: float):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MERGE (u:User {user_id: $user_id})
            MERGE (i:Interest {interest_id: $interest_id})
            MERGE (u)-[r:INTERESTED_IN]->(i)
            SET r.weight = $weight,
                r.updated_at = datetime()
        """, user_id=user_id, interest_id=interest_id, weight=weight)


def set_similarity_pairs(pairs: Iterable[dict]):
    """
    Recibe pares [{user1, user2, score, metric}]
    """
    _ensure_driver()
    payload = [dict(pair) for pair in pairs]
    with driver.session() as s:
        s.run("""
            UNWIND $pairs AS pair
            MERGE (u1:User {user_id: pair.user1})
            MERGE (u2:User {user_id: pair.user2})
            MERGE (u1)-[sim:SIMILAR_TO]->(u2)
            SET sim.similarity_score = pair.score,
                sim.metric = pair.metric,
                sim.updated_at = datetime()
        """, pairs=payload)


def log_recommendation(user_id: str, exercise_id: str, strategy: str, accepted: Optional[bool] = None):
    _ensure_driver()
    with driver.session() as s:
        s.run("""
            MATCH (u:User {user_id: $user_id})
            MATCH (e:Exercise {exercise_id: $exercise_id})
            MERGE (u)-[r:RECOMMENDED]->(e)
            SET r.timestamp = datetime(),
                r.strategy = $strategy,
                r.accepted = $accepted
        """, user_id=user_id, exercise_id=exercise_id, strategy=strategy, accepted=accepted)


def recomendar(user_id, limit=10):
    """
    Devuelve recomendaciones en tres estrategias: dificultad, usuarios similares y errores+intereses.
    """
    _ensure_driver()
    with driver.session() as s:
        # Basada en dificultades declaradas
        difficulty_res = s.run("""
            MATCH (u:User {user_id: $user_id})-[d:HAS_DIFFICULTY]->(s:Skill)<-[:EVALUATES]-(e:Exercise)
            WHERE d.error_score > 0.6
            RETURN e.exercise_id AS exercise_id,
                   e.difficulty AS difficulty,
                   d.error_score AS error_score
            ORDER BY d.error_score DESC, e.difficulty
            LIMIT $limit
        """, user_id=user_id, limit=limit)
        by_difficulty = [
            {
                "exercise_id": row["exercise_id"],
                "difficulty": row["difficulty"],
                "error_score": float(row["error_score"]) if row["error_score"] is not None else None,
            }
            for row in difficulty_res
        ]

        # Basada en usuarios similares
        similar_res = s.run("""
            MATCH (u:User {user_id: $user_id})-[:HAS_DIFFICULTY]->(s:Skill)
            MATCH (u)-[sim:SIMILAR_TO]->(v:User)
            WHERE sim.similarity_score > 0.6
            MATCH (v)-[p:PERFORMED]->(e:Exercise)-[:EVALUATES]->(s)
            WHERE p.correct_ratio > 0.7
            RETURN e.exercise_id AS exercise_id,
                   sim.similarity_score AS similarity,
                   avg(p.correct_ratio) AS performance
            ORDER BY performance DESC, similarity DESC
            LIMIT $limit
        """, user_id=user_id, limit=limit)
        by_similar = [
            {
                "exercise_id": row["exercise_id"],
                "similarity": float(row["similarity"]) if row["similarity"] is not None else None,
                "performance": float(row["performance"]) if row["performance"] is not None else None,
            }
            for row in similar_res
        ]

        # Basada en errores recurrentes + intereses
        error_interest_res = s.run("""
            MATCH (u:User {user_id: $user_id})-[me:MAKES_ERROR]->(et:ErrorType)
            WHERE me.frequency > 0.6
            MATCH (et)<-[:TAGGED_AS]-(e:Exercise)
            OPTIONAL MATCH (u)-[in:INTERESTED_IN]->(t:Interest)<-[:TAGGED_AS]-(e)
            RETURN e.exercise_id AS exercise_id,
                   me.frequency AS error_weight,
                   in.weight AS interest_weight
            ORDER BY error_weight DESC, interest_weight DESC
            LIMIT $limit
        """, user_id=user_id, limit=limit)
        by_errors_interests = [
            {
                "exercise_id": row["exercise_id"],
                "error_weight": float(row["error_weight"]) if row["error_weight"] is not None else None,
                "interest_weight": float(row["interest_weight"]) if row["interest_weight"] is not None else None,
            }
            for row in error_interest_res
        ]

    return {
        "by_difficulty": by_difficulty,
        "by_similar_users": by_similar,
        "by_errors_and_interests": by_errors_interests,
    }


# --------- Getters para exponer datos de tablas/relaciones ----------
def list_users():
    _ensure_driver()
    with driver.session() as s:
        result = s.run("MATCH (u:User) RETURN u ORDER BY u.user_id")
        return [dict(r["u"]) for r in result]


def list_exercises():
    _ensure_driver()
    with driver.session() as s:
        result = s.run("MATCH (e:Exercise) RETURN e ORDER BY e.exercise_id")
        return [dict(r["e"]) for r in result]


def list_skills():
    _ensure_driver()
    with driver.session() as s:
        result = s.run("MATCH (s:Skill) RETURN s ORDER BY s.skill_id")
        return [dict(r["s"]) for r in result]


def list_interests():
    _ensure_driver()
    with driver.session() as s:
        result = s.run("MATCH (i:Interest) RETURN i ORDER BY i.interest_id")
        return [dict(r["i"]) for r in result]


def list_error_types():
    _ensure_driver()
    with driver.session() as s:
        result = s.run("MATCH (e:ErrorType) RETURN e ORDER BY e.error_id")
        return [dict(r["e"]) for r in result]


def list_performed(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User)-[p:PERFORMED]->(e:Exercise)
            RETURN u.user_id AS user_id,
                   e.exercise_id AS exercise_id,
                   p.correct_ratio AS correct_ratio,
                   p.attempts AS attempts,
                   p.performed_at AS performed_at
            ORDER BY performed_at DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_difficulties(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User)-[d:HAS_DIFFICULTY]->(s:Skill)
            RETURN u.user_id AS user_id,
                   s.skill_id AS skill_id,
                   d.error_score AS error_score,
                   d.updated_at AS updated_at
            ORDER BY d.error_score DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_user_errors(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User)-[m:MAKES_ERROR]->(e:ErrorType)
            RETURN u.user_id AS user_id,
                   e.error_id AS error_id,
                   m.frequency AS frequency,
                   m.updated_at AS updated_at
            ORDER BY m.frequency DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_user_interests(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User)-[r:INTERESTED_IN]->(i:Interest)
            RETURN u.user_id AS user_id,
                   i.interest_id AS interest_id,
                   r.weight AS weight,
                   r.updated_at AS updated_at
            ORDER BY r.weight DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_tags(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (e:Exercise)-[:TAGGED_AS]->(i:Interest)
            RETURN e.exercise_id AS exercise_id,
                   i.interest_id AS interest_id
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_similarities(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u1:User)-[s:SIMILAR_TO]->(u2:User)
            RETURN u1.user_id AS user_id,
                   u2.user_id AS similar_to,
                   s.similarity_score AS similarity_score,
                   s.metric AS metric,
                   s.updated_at AS updated_at
            ORDER BY similarity_score DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]


def list_recommendations(limit=200):
    _ensure_driver()
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User)-[r:RECOMMENDED]->(e:Exercise)
            RETURN u.user_id AS user_id,
                   e.exercise_id AS exercise_id,
                   r.strategy AS strategy,
                   r.accepted AS accepted,
                   r.timestamp AS timestamp
            ORDER BY r.timestamp DESC
            LIMIT $limit
        """, limit=limit)
        return [dict(r) for r in result]

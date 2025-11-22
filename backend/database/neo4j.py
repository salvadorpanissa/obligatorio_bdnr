from neo4j import GraphDatabase
import config

driver = None

def init_neo4j():
    global driver
    print(f"[NEO4J] Connecting to {config.NEO4J_URI}")
    driver = GraphDatabase.driver(
        config.NEO4J_URI,
        auth=(config.NEO4J_USER, config.NEO4J_PASSWORD)
    )
    with driver.session() as s:
        s.run("CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE")
        s.run("CREATE CONSTRAINT IF NOT EXISTS FOR (c:Course) REQUIRE c.id IS UNIQUE")

    print("[NEO4J] Ready.")


def registrar_progreso(user_id, course_id, level):
    with driver.session() as s:
        s.run("""
            MERGE (u:User {id: $user_id})
            MERGE (c:Course {id: $course_id})
            MERGE (u)-[r:COMPLETED]->(c)
            SET r.level = $level, r.created_at = datetime()
        """, user_id=user_id, course_id=course_id, level=level)


def recomendar(user_id, limit=5):
    with driver.session() as s:
        result = s.run("""
            MATCH (u:User {id: $user_id})-[:COMPLETED]->(c:Course)
            MATCH (other:User)-[:COMPLETED]->(c)
            WHERE other.id <> u.id

            MATCH (other)-[:COMPLETED]->(other_course:Course)
            WHERE NOT (u)-[:COMPLETED]->(other_course)

            RETURN other_course.id AS course_id,
                   count(DISTINCT other.id) AS score
            ORDER BY score DESC
            LIMIT $limit
        """, user_id=user_id, limit=limit)
        return [{"course_id": r["course_id"], "score": float(r["score"])} for r in result]

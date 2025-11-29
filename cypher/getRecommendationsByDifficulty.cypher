// Recomendaciones basadas en dificultades del usuario
MATCH (u:User {user_id: $userId})
      -[d:HAS_DIFFICULTY]->(s:Skill)<-[:EVALUATES]-(e:Exercise)
WHERE d.error_score > 0.6
RETURN
  e.exercise_id AS exercise_id,
  d.error_score AS error_score,
  e.difficulty AS difficulty
ORDER BY d.error_score DESC, e.difficulty
LIMIT coalesce($limit, 20);

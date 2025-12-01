// Dificultades por usuario y habilidad
MATCH (u:User)-[d:HAS_DIFFICULTY]->(s:Skill)
RETURN
  u.user_id AS user_id,
  s.skill_id AS skill_id,
  d.error_score AS error_score,
  d.updated_at AS updated_at
ORDER BY d.error_score DESC;

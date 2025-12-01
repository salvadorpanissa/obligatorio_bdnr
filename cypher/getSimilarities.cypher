// Relaciones de similitud entre usuarios
MATCH (u1:User)-[s:SIMILAR_TO]->(u2:User)
RETURN
  u1.user_id AS user_id,
  u2.user_id AS similar_to,
  s.similarity_score AS similarity_score,
  s.metric AS metric,
  s.updated_at AS updated_at
ORDER BY similarity_score DESC, user_id;

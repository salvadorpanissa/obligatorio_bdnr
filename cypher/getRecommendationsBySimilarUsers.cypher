// Recomendaciones colaborativas por usuarios similares
MATCH (u:User {user_id: $userId})-[:HAS_DIFFICULTY]->(s:Skill)
MATCH (u)-[sim:SIMILAR_TO]->(v:User)
WHERE sim.similarity_score > 0.6
MATCH (v)-[p:PERFORMED]->(e:Exercise)-[:EVALUATES]->(s)
WHERE p.correct_ratio > 0.7
RETURN
  e.exercise_id AS exercise_id,
  sim.similarity_score AS similarity,
  avg(p.correct_ratio) AS performance
ORDER BY performance DESC, similarity DESC
LIMIT coalesce($limit, 20);

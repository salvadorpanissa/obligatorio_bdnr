// Desempeño de usuarios sobre ejercicios
MATCH (u:User)-[p:PERFORMED]->(e:Exercise)
RETURN
  u.user_id AS user_id,
  e.exercise_id AS exercise_id,
  p.correct_ratio AS correct_ratio,
  p.attempts AS attempts,
  p.performed_at AS performed_at
ORDER BY p.performed_at DESC, u.user_id;

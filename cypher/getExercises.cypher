// Lista ejercicios disponibles
MATCH (e:Exercise)
RETURN
  e.exercise_id AS exercise_id,
  e.type AS type,
  e.difficulty AS difficulty,
  e.language AS language,
  e.created_at AS created_at
ORDER BY e.exercise_id;

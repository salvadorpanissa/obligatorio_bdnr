// Errores recurrentes por usuario
MATCH (u:User)-[m:MAKES_ERROR]->(e:ErrorType)
RETURN
  u.user_id AS user_id,
  e.error_id AS error_id,
  m.frequency AS frequency,
  m.updated_at AS updated_at
ORDER BY m.frequency DESC, user_id;

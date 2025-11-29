// Lista tipos de error recurrente
MATCH (e:ErrorType)
RETURN
  e.error_id AS error_id,
  e.description AS description,
  e.category AS category
ORDER BY e.error_id;

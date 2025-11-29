// Lista intereses/tópicos disponibles
MATCH (i:Interest)
RETURN
  i.interest_id AS interest_id,
  i.name AS name,
  i.category AS category
ORDER BY i.interest_id;

// Etiquetas de ejercicios por interés
MATCH (e:Exercise)-[:TAGGED_AS]->(i:Interest)
RETURN
  e.exercise_id AS exercise_id,
  i.interest_id AS interest_id
ORDER BY e.exercise_id, i.interest_id;

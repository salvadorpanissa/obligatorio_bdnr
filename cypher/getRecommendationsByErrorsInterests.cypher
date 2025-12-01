// Recomendaciones combinando errores recurrentes e intereses
MATCH (u:User {user_id: $userId})-[me:MAKES_ERROR]->(et:ErrorType)
WHERE me.frequency > 0.6
MATCH (et)<-[:TAGGED_AS]-(e:Exercise)
OPTIONAL MATCH (u)-[in:INTERESTED_IN]->(t:Interest)<-[:TAGGED_AS]-(e)
RETURN
  e.exercise_id AS exercise_id,
  me.frequency AS error_weight,
  in.weight AS interest_weight
ORDER BY error_weight DESC, interest_weight DESC
LIMIT coalesce($limit, 20);

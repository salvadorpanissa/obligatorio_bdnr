MATCH (u:User {user_id: $userId}), (i:Interest {interest_id: $interestId})
MERGE (u)-[rel:INTERESTED_IN]->(i)
SET
  rel.weight = $weight, // e.g. 0.9
  rel.updated_at = datetime();

// Exercise tagged with an interest/topic
MATCH
  (e:Exercise {exercise_id: $exerciseId}),
  (i:Interest {interest_id: $interestId})
MERGE (e)-[:TAGGED_AS]->(i);
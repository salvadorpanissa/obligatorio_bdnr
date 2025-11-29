// Intereses del usuario
MATCH (u:User)-[r:INTERESTED_IN]->(i:Interest)
RETURN
  u.user_id AS user_id,
  i.interest_id AS interest_id,
  r.weight AS weight,
  r.updated_at AS updated_at
ORDER BY weight DESC, user_id;

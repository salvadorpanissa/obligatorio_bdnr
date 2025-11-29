MATCH (u:User)
RETURN
  u.user_id AS user_id,
  u.primary_language AS primary_language,
  u.current_level AS current_level,
  u.streak AS streak
ORDER BY u.user_id
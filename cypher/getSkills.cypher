// Lista habilidades registradas
MATCH (s:Skill)
RETURN
  s.skill_id AS skill_id,
  s.name AS name,
  s.category AS category,
  s.level AS level
ORDER BY s.skill_id;

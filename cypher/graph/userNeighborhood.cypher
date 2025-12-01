// Visualiza el vecindario de un usuario (nodos y relaciones relevantes, en ambos sentidos)
MATCH (u:User {user_id: $userId})
OPTIONAL MATCH (u)-[r1]-(n1)
OPTIONAL MATCH (n1)-[r2]-(n2)
RETURN DISTINCT u, n1, r1, n2, r2
LIMIT coalesce($limit, 300);

// Subgrafo completo (ojo: puede ser grande). Ajusta LIMIT si hay demasiados nodos.
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT coalesce($limit, 200);
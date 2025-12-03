# Obligatorio Base de Datos No Relacionales - Setiembre 2025

Repository for requirement 4.

Members:
* Salvador Panissa
* Pablo Pereyra
* Uriel Strimber

## Sample data
- Neo4j: open `cypher/seed/seedDuolingoSample.cypher` in Neo4j Browser and execute it as a single script.
- Cassandra: from `backend/` run `python scripts/seed_cassandra.py` with your env vars (defaults work with the docker compose service name `cassandra`). It will create a few threads and posts you can browse from the frontend.

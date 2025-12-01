from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

def get_env(name: str, default: str | None = None):
    val = os.getenv(name)
    if val is None or val.strip() == "":
        return default
    return val.strip()

CASSANDRA_HOST = get_env("CASSANDRA_HOST", "cassandra")
CASSANDRA_PORT = int(get_env("CASSANDRA_PORT", "9042"))
CASSANDRA_KEYSPACE = get_env("CASSANDRA_KEYSPACE", "foros")

NEO4J_URI = get_env("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = get_env("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = get_env("NEO4J_PASSWORD", "admin")

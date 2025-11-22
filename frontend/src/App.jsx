import React, { useState } from "react";
import CassandraView from "./views/CassandraView.jsx";
import Neo4jView from "./views/Neo4jView.jsx";

const tabs = [
  { key: "home", label: "Home" },
  { key: "cassandra", label: "Cassandra" },
  { key: "neo4j", label: "Neo4j" }
];

export default function App() {
  const [active, setActive] = useState("home");

  const renderBody = () => {
    if (active === "cassandra") return <CassandraView />;
    if (active === "neo4j") return <Neo4jView />;
    return (
      <section className="panel">
        <h2>Choose a backend</h2>
        <p className="muted">
          Two dedicated workspaces: Cassandra for threads/posts and Neo4j for course recommendations.
        </p>
        <div className="grid cards">
          <button className="card" onClick={() => setActive("cassandra")}>
            <h3>Cassandra Threads</h3>
            <p>Create threads, list by course, browse posts, and add replies.</p>
            <span className="pill">Uses /threads and /posts APIs</span>
          </button>
          <button className="card" onClick={() => setActive("neo4j")}>
            <h3>Neo4j Recommendations</h3>
            <p>Record user progress and fetch course recommendations.</p>
            <span className="pill">Uses /recommend APIs</span>
          </button>
        </div>
      </section>
    );
  };

  return (
    <>
      <header>
        <h1>BDNR Playground</h1>
        <nav>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`nav-btn ${active === t.key ? "active" : ""}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="page">{renderBody()}</main>
    </>
  );
}

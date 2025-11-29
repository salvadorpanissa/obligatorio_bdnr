import React, { useState } from "react";
import { apiFetch } from "../api.js";

function RecommendationList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No recommendations yet.</p>;
  return (
    <div className="feed">
      {items.map((item, idx) => (
        <article className="tile" key={`${item.course_id}-${idx}`}>
          <header className="tile__header">
            <strong>{item.course_id}</strong>
            <span className="badge ghost">Score {Number(item.score).toFixed(2)}</span>
          </header>
        </article>
      ))}
    </div>
  );
}

export default function Neo4jView({ apiBase, onFlash }) {
  const [status, setStatus] = useState({ text: "Ready", error: false });
  const [progress, setProgress] = useState({ user_id: "", course_id: "", level: "" });
  const [recommendUser, setRecommendUser] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const updateStatus = (text, error = false) => {
    setStatus({ text, error });
    if (!error && onFlash) onFlash(text);
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progress.user_id.trim() || !progress.course_id.trim()) {
      updateStatus("User and course are required.", true);
      return;
    }
    updateStatus("Sending progress...");
    try {
      const res = await apiFetch("/recommend/progress", {
        method: "POST",
        body: JSON.stringify({
          user_id: progress.user_id,
          course_id: progress.course_id,
          level: progress.level || null
        })
      });
      if (!res.ok) throw new Error(await res.text());
      updateStatus("Progress recorded.");
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    if (!recommendUser.trim()) {
      updateStatus("User id is required.", true);
      return;
    }
    updateStatus("Fetching recommendations...");
    try {
      const res = await apiFetch(`/recommend/${encodeURIComponent(recommendUser)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRecommendations(data);
      updateStatus(`Received ${data.length} course${data.length === 1 ? "" : "s"}.`);
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Neo4j</p>
            <h3>Learning mentor</h3>
            <p className="muted small">Send learner progress and retrieve ordered recommendations.</p>
          </div>
          <span className="badge ghost">Base {apiBase}</span>
        </div>

        <div className="grid two-col">
          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">Progress</p>
                <strong>Record completion</strong>
              </div>
              <span className="badge success">POST /recommend/progress</span>
            </header>
            <form className="stack" onSubmit={handleProgressSubmit}>
              <input
                type="text"
                placeholder="user_id"
                value={progress.user_id}
                onChange={(e) => setProgress({ ...progress, user_id: e.target.value })}
              />
              <input
                type="text"
                placeholder="course_id"
                value={progress.course_id}
                onChange={(e) => setProgress({ ...progress, course_id: e.target.value })}
              />
              <input
                type="text"
                placeholder="level (optional)"
                value={progress.level}
                onChange={(e) => setProgress({ ...progress, level: e.target.value })}
              />
              <button type="submit">Save progress</button>
            </form>
          </div>

          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">Recommendations</p>
                <strong>Fetch courses</strong>
              </div>
              <span className="badge">GET /recommend/:user_id</span>
            </header>
            <form className="inline-actions" onSubmit={handleRecommendSubmit}>
              <input
                type="text"
                placeholder="user_id"
                value={recommendUser}
                onChange={(e) => setRecommendUser(e.target.value)}
              />
              <button type="submit">Fetch</button>
            </form>
            <RecommendationList items={recommendations} />
          </div>
        </div>
      </section>

      <div className={`status-bar ${status.error ? "error" : ""}`}>
        <span>{status.text}</span>
      </div>
    </div>
  );
}

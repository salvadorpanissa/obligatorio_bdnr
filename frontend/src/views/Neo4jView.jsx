import React, { useEffect, useState } from "react";
import { apiFetch, getBaseUrl, setBaseUrl } from "../api.js";

function RecommendationList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No recommendations yet.</p>;
  return (
    <div className="list">
      {items.map((item, idx) => (
        <div className="card" key={`${item.course_id}-${idx}`}>
          <strong>{item.course_id}</strong>
          <br />
          <span className="small">score: {Number(item.score).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Neo4jView() {
  const [apiBase, setApiBaseState] = useState(getBaseUrl());
  const [status, setStatus] = useState({ text: "", error: false });
  const [progress, setProgress] = useState({ user_id: "", course_id: "", level: "" });
  const [recommendUser, setRecommendUser] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    setBaseUrl(apiBase);
  }, [apiBase]);

  const updateStatus = (text, error = false) => setStatus({ text, error });

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
    <>
      <section className="panel inline">
        <label htmlFor="apiBase">API base</label>
        <input
          id="apiBase"
          type="text"
          value={apiBase}
          onChange={(e) => setApiBaseState(e.target.value)}
          placeholder="http://localhost:8000"
        />
        <p className="muted small">Applied to all requests on this page.</p>
      </section>

      <section className="panel">
        <h2>Record progress</h2>
        <form className="grid" style={{ gap: 10 }} onSubmit={handleProgressSubmit}>
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
      </section>

      <section className="panel">
        <h2>Get recommendations</h2>
        <form className="inline" onSubmit={handleRecommendSubmit}>
          <input
            type="text"
            placeholder="user_id"
            value={recommendUser}
            onChange={(e) => setRecommendUser(e.target.value)}
          />
          <button type="submit">Fetch</button>
        </form>
        <div style={{ marginTop: 12 }}>
          <RecommendationList items={recommendations} />
        </div>
      </section>

      <p className="status" style={{ color: status.error ? "#ffb3b3" : undefined }}>{status.text}</p>
    </>
  );
}

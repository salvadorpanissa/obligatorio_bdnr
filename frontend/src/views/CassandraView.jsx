import React, { useState } from "react";
import { apiFetch } from "../api.js";

function ThreadsList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No threads for that course yet.</p>;
  return (
    <div className="feed">
      {items.map((t) => (
        <article className="tile" key={t.thread_id}>
          <header className="tile__header">
            <strong>{t.title}</strong>
            <span className="badge ghost">{t.thread_id}</span>
          </header>
          <p className="muted small">Course {t.course_id} · Author {t.author_id}</p>
          <p className="small">
            Created {new Date(t.created_at).toLocaleString()} · Last activity{" "}
            {t.last_activity_at ? new Date(t.last_activity_at).toLocaleString() : "-"}
          </p>
        </article>
      ))}
    </div>
  );
}

function ThreadDetail({ data }) {
  if (!data) return <p className="muted">No thread loaded.</p>;
  return (
    <div className="thread-detail">
      <div>
        <p className="eyebrow">Thread</p>
        <h3>{data.title}</h3>
        <p className="muted small">
          Course {data.course_id} · Author {data.author_id}
        </p>
        <p className="small">
          Created {new Date(data.created_at).toLocaleString()} · Last activity{" "}
          {data.last_activity_at ? new Date(data.last_activity_at).toLocaleString() : "-"}
        </p>
      </div>
      <div className="pill">Posts: {data.post_count ?? 0}</div>
    </div>
  );
}

function PostsList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No posts yet.</p>;
  return (
    <div className="feed">
      {items.map((p) => (
        <article className="tile" key={p.post_id}>
          <header className="tile__header">
            <strong>{p.user_id}</strong>
            <span className="badge">{p.post_id}</span>
          </header>
          <p>{p.content}</p>
          <p className="muted small">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</p>
        </article>
      ))}
    </div>
  );
}

export default function CassandraView({ apiBase, onFlash }) {
  const [status, setStatus] = useState({ text: "Ready", error: false });
  const [threads, setThreads] = useState([]);
  const [threadDetail, setThreadDetail] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState("");

  const [createForm, setCreateForm] = useState({ course_id: "", title: "", author_id: "" });
  const [listForm, setListForm] = useState({ courseId: "", limit: 50 });
  const [loadId, setLoadId] = useState("");
  const [postForm, setPostForm] = useState({ user_id: "", content: "" });

  const updateStatus = (text, error = false) => {
    setStatus({ text, error });
    if (!error && onFlash) onFlash(text);
  };

  const handleLoadThreads = async (e) => {
    e.preventDefault();
    if (!listForm.courseId.trim()) {
      updateStatus("Course id is required.", true);
      return;
    }
    updateStatus("Loading threads...");
    try {
      const res = await apiFetch(`/threads/course/${encodeURIComponent(listForm.courseId)}?limit=${listForm.limit}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setThreads(data);
      updateStatus(`Loaded ${data.length} threads.`);
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    const { course_id, title, author_id } = createForm;
    if (!course_id.trim() || !title.trim() || !author_id.trim()) {
      updateStatus("Fill course, title, and author.", true);
      return;
    }
    updateStatus("Creating thread...");
    try {
      const res = await apiFetch("/threads/", {
        method: "POST",
        body: JSON.stringify({ course_id, title, author_id })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      updateStatus(`Thread created: ${data.thread_id}`);
      setCurrentThreadId(data.thread_id);
      setLoadId(data.thread_id);
      await loadThreadById(data.thread_id);
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  const loadThreadById = async (threadId) => {
    if (!threadId) {
      updateStatus("Thread id is required.", true);
      return;
    }
    updateStatus("Loading thread...");
    try {
      const detailRes = await apiFetch(`/threads/${threadId}`);
      if (!detailRes.ok) throw new Error(await detailRes.text());
      const detail = await detailRes.json();
      setCurrentThreadId(detail.thread_id);
      setThreadDetail(detail);

      const postsRes = await apiFetch(`/threads/${threadId}/posts`);
      if (!postsRes.ok) throw new Error(await postsRes.text());
      const postsData = await postsRes.json();
      setPosts(postsData);
      updateStatus("Thread loaded.");
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  const handleLoadThreadSubmit = async (e) => {
    e.preventDefault();
    await loadThreadById(loadId.trim());
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!currentThreadId) {
      updateStatus("Load a thread first.", true);
      return;
    }
    if (!postForm.user_id.trim() || !postForm.content.trim()) {
      updateStatus("User and content required.", true);
      return;
    }
    updateStatus("Adding post...");
    try {
      const res = await apiFetch(`/posts/${currentThreadId}`, {
        method: "POST",
        body: JSON.stringify(postForm)
      });
      if (!res.ok) throw new Error(await res.text());
      await loadThreadById(currentThreadId);
      setPostForm({ ...postForm, content: "" });
      updateStatus("Post added.");
    } catch (err) {
      updateStatus(`Error: ${err.message || err}`, true);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Cassandra</p>
            <h3>Threads and posts</h3>
            <p className="muted small">Create threads, browse a course, and drill into details.</p>
          </div>
          <span className="badge ghost">Base {apiBase}</span>
        </div>

        <div className="grid two-col">
          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">New thread</p>
                <strong>Create</strong>
              </div>
              <span className="badge success">POST /threads/</span>
            </header>
            <form className="stack" onSubmit={handleCreateThread}>
              <input
                type="text"
                placeholder="course_id"
                value={createForm.course_id}
                onChange={(e) => setCreateForm({ ...createForm, course_id: e.target.value })}
              />
              <input
                type="text"
                placeholder="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="author_id"
                value={createForm.author_id}
                onChange={(e) => setCreateForm({ ...createForm, author_id: e.target.value })}
              />
              <button type="submit">Create thread</button>
            </form>
          </div>

          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">Course feed</p>
                <strong>List threads</strong>
              </div>
              <span className="badge">GET /threads/course/</span>
            </header>
            <form className="inline-actions" onSubmit={handleLoadThreads}>
              <input
                type="text"
                placeholder="course_id"
                value={listForm.courseId}
                onChange={(e) => setListForm({ ...listForm, courseId: e.target.value })}
              />
              <input
                type="number"
                min="1"
                max="200"
                value={listForm.limit}
                onChange={(e) => setListForm({ ...listForm, limit: Number(e.target.value) || 1 })}
              />
              <button type="submit">Fetch</button>
            </form>
            <ThreadsList items={threads} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Thread deep dive</p>
            <h3>Load details & posts</h3>
          </div>
          <span className="badge ghost">{currentThreadId ? `Thread ${currentThreadId}` : "No thread loaded"}</span>
        </div>

        <div className="grid two-col">
          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">Lookup</p>
                <strong>Load thread</strong>
              </div>
              <span className="badge">GET /threads/:id</span>
            </header>
            <form className="inline-actions" onSubmit={handleLoadThreadSubmit}>
              <input
                type="text"
                placeholder="thread_id"
                value={loadId}
                onChange={(e) => setLoadId(e.target.value)}
              />
              <button type="submit">Load</button>
            </form>
            <ThreadDetail data={threadDetail} />
          </div>

          <div className="tile">
            <header className="tile__header">
              <div>
                <p className="eyebrow">Reply</p>
                <strong>Add post</strong>
              </div>
              <span className="badge success">POST /posts/:thread_id</span>
            </header>
            <form className="stack" onSubmit={handleAddPost}>
              <input
                type="text"
                placeholder="user_id"
                value={postForm.user_id}
                onChange={(e) => setPostForm({ ...postForm, user_id: e.target.value })}
              />
              <textarea
                placeholder="content"
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              ></textarea>
              <button type="submit">Submit post</button>
            </form>
          </div>
        </div>

        <div className="tile" style={{ marginTop: 12 }}>
          <header className="tile__header">
            <div>
              <p className="eyebrow">Posts</p>
              <strong>Thread timeline</strong>
            </div>
            <span className="badge">GET /threads/:id/posts</span>
          </header>
          <PostsList items={posts} />
        </div>
      </section>

      <div className={`status-bar ${status.error ? "error" : ""}`}>
        <span>{status.text}</span>
      </div>
    </div>
  );
}

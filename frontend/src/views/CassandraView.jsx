import React, { useEffect, useState } from "react";
import { apiFetch, getBaseUrl, setBaseUrl } from "../api.js";

function ThreadsList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No threads found for that course.</p>;
  return (
    <div className="list">
      {items.map((t) => (
        <div className="card" key={t.thread_id}>
          <strong>{t.title}</strong>
          <br />
          <span className="muted">thread_id: {t.thread_id}</span>
          <br />
          <span className="small">
            Author: {t.author_id} · Created: {new Date(t.created_at).toLocaleString()}
          </span>
          <br />
          <span className="small">
            Last activity: {t.last_activity_at ? new Date(t.last_activity_at).toLocaleString() : "-"}
          </span>
        </div>
      ))}
    </div>
  );
}

function ThreadDetail({ data }) {
  if (!data) return <p className="muted">No thread loaded.</p>;
  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <h3>{data.title}</h3>
      <p className="small">thread_id: {data.thread_id}</p>
      <p className="small">Course: {data.course_id} · Author: {data.author_id}</p>
      <p className="small">
        Created: {new Date(data.created_at).toLocaleString()} · Last activity:{" "}
        {data.last_activity_at ? new Date(data.last_activity_at).toLocaleString() : "-"}
      </p>
      <p className="pill">Posts: {data.post_count ?? 0}</p>
    </div>
  );
}

function PostsList({ items }) {
  if (!items || items.length === 0) return <p className="muted">No posts yet.</p>;
  return (
    <div className="list">
      {items.map((p) => (
        <div className="card" key={p.post_id}>
          <strong>{p.user_id}</strong>
          <p>{p.content}</p>
          <span className="small">post_id: {p.post_id}</span>
          <br />
          <span className="muted">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function CassandraView() {
  const [apiBase, setApiBaseState] = useState(getBaseUrl());
  const [status, setStatus] = useState({ text: "", error: false });
  const [threads, setThreads] = useState([]);
  const [threadDetail, setThreadDetail] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState("");

  const [createForm, setCreateForm] = useState({ course_id: "", title: "", author_id: "" });
  const [listForm, setListForm] = useState({ courseId: "", limit: 50 });
  const [loadId, setLoadId] = useState("");
  const [postForm, setPostForm] = useState({ user_id: "", content: "" });

  useEffect(() => {
    setBaseUrl(apiBase);
  }, [apiBase]);

  const updateStatus = (text, error = false) => setStatus({ text, error });

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
      updateStatus("Fill in course, title, and author.", true);
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
        <h2>Create thread</h2>
        <form className="grid" style={{ gap: 10 }} onSubmit={handleCreateThread}>
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
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <h2>List threads by course</h2>
        <form className="inline" onSubmit={handleLoadThreads}>
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
        <div style={{ marginTop: 12 }}>
          <ThreadsList items={threads} />
        </div>
      </section>

      <section className="panel">
        <h2>Thread details & posts</h2>
        <form className="inline" onSubmit={handleLoadThreadSubmit}>
          <input
            type="text"
            placeholder="thread_id"
            value={loadId}
            onChange={(e) => setLoadId(e.target.value)}
          />
          <button type="submit">Load</button>
        </form>

        <ThreadDetail data={threadDetail} />

        <div className="panel" style={{ marginTop: 12 }}>
          <h3>Posts</h3>
          <PostsList items={posts} />
        </div>

        <div className="panel" style={{ marginTop: 12 }}>
          <h3>Add post</h3>
          <form className="grid" style={{ gap: 10 }} onSubmit={handleAddPost}>
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
      </section>

      <p className="status" style={{ color: status.error ? "#ffb3b3" : undefined }}>{status.text}</p>
    </>
  );
}

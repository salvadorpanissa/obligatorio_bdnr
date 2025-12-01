import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "./config";

type ThreadMeta = {
  thread_id: string;
  course_id: string;
  title: string;
  author_id: string;
  created_at: string;
  post_count: number;
  last_activity_at: string | null;
};

type Post = {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<ThreadMeta | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState("user-123");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortPosts = (items: Post[]) =>
    [...items].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  const loadThread = async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const [metaRes, postsRes] = await Promise.all([
        fetch(`${API_BASE}/threads/${threadId}`),
        fetch(`${API_BASE}/threads/${threadId}/posts`),
      ]);

      if (!metaRes.ok) {
        const detail = await metaRes.text();
        throw new Error(
          detail ||
            (metaRes.status === 404
              ? "Hilo no encontrado"
              : "No se pudo cargar el hilo")
        );
      }
      if (!postsRes.ok) {
        const detail = await postsRes.text();
        throw new Error(detail || "No se pudieron cargar los posts");
      }

      const meta = await metaRes.json();
      const postsData: Post[] = await postsRes.json();
      setThread(meta);
      setPosts(sortPosts(postsData));
    } catch (err: any) {
      setThread(null);
      setPosts([]);
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !content.trim()) return;

    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/threads/${threadId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "Error creando post");
      }

      const created: Post = await res.json();
      setPosts((prev) => sortPosts([...prev, created]));
      setThread((prev) =>
        prev
          ? {
              ...prev,
              post_count: (prev.post_count || 0) + 1,
              last_activity_at: created.created_at,
            }
          : prev
      );
      setContent("");
    } catch (err: any) {
      setError(err?.message || "No se pudo publicar");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <p className="text-sm text-gray-500">Cargando hilo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-3">
        <p className="text-red-500">{error}</p>
        <button
          className="border rounded px-3 py-1"
          onClick={loadThread}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <p>No se encontró el hilo.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">{thread.title}</h1>
      <div className="text-xs text-gray-600 mb-4">
        Curso: {thread.course_id} • por {thread.author_id} •{" "}
        {new Date(thread.created_at).toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mb-4">
        {thread.post_count ?? 0} posts • Última actividad:{" "}
        {thread.last_activity_at
          ? new Date(thread.last_activity_at).toLocaleString()
          : "Sin actividad"}
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Responder</h2>
        <form onSubmit={handleReply} className="flex flex-col gap-2">
          <input
            className="border rounded px-2 py-1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user_id"
          />
          <textarea
            className="border rounded px-2 py-1 min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí tu respuesta..."
          />
          <button
            type="submit"
            className="self-end border rounded px-3 py-1"
            disabled={posting}
          >
            {posting ? "Publicando..." : "Publicar"}
          </button>
        </form>
      </div>

      <h2 className="font-semibold mb-2">Posts</h2>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.post_id} className="border rounded p-2">
            <div className="text-sm whitespace-pre-wrap">
              {p.content}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {p.user_id} • {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay respuestas. Podés ser la primera persona en hablar,
            qué responsabilidad.
          </p>
        )}
      </ul>
    </div>
  );
}

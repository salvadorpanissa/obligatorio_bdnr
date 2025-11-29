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

  useEffect(() => {
    if (!threadId) return;

    // metadata
    fetch(`${API_BASE}/threads/${threadId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then(setThread)
      .catch(console.error);

    // posts
    fetch(`${API_BASE}/threads/${threadId}/posts`)
      .then((res) => res.json())
      .then(setPosts)
      .catch(console.error);
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !content.trim()) return;

    const res = await fetch(`${API_BASE}/threads/${threadId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, content }),
    });

    if (!res.ok) {
      console.error("Error creando post");
      return;
    }

    const created: Post = await res.json();
    setPosts((prev) => [...prev, created]);
    setContent("");
  };

  if (!thread) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <p>Cargando hilo...</p>
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

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Responder</h2>
        <form onSubmit={handleReply} className="flex flex-col gap-2">
          <textarea
            className="border rounded px-2 py-1 min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí tu respuesta..."
          />
          <button type="submit" className="self-end border rounded px-3 py-1">
            Publicar
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

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "./config";

type UserPost = {
  thread_id: string;
  post_id: string;
  content: string;
  created_at: string;
};

export function UserPostsPage() {
  const { userId: userParam } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(userParam ?? "");
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userParam) {
      setUserId(userParam);
      fetchPosts(userParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userParam]);

  const fetchPosts = async (targetUser: string) => {
    if (!targetUser.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${targetUser}/posts`);
      if (!res.ok) throw new Error("No se pudieron obtener los posts");
      const data = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    navigate(`/users/${userId}/posts`);
    fetchPosts(userId);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cassandra</p>
        <h1 className="text-2xl font-bold">Posts por usuario</h1>
        <p className="text-sm text-gray-500">Endpoint: GET /api/users/:user_id/posts</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="user_id"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button type="submit" className="px-3 py-1 border rounded">
          Buscar
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Cargando...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.post_id} className="border rounded p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs text-gray-500">#{p.post_id}</span>
              <Link to={`/threads/${p.thread_id}`} className="text-xs underline">
                Ver hilo
              </Link>
            </div>
            <p className="whitespace-pre-wrap text-sm">{p.content}</p>
            <div className="text-[11px] text-gray-500 mt-1">
              {new Date(p.created_at).toLocaleString()}
            </div>
          </li>
        ))}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-gray-500">Sin posts para este usuario.</p>
        )}
      </ul>
    </div>
  );
}

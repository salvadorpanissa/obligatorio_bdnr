import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE } from "./config";

type Thread = {
  thread_id: string;
  title: string;
  author_id: string;
  created_at: string;
  last_activity_at: string | null;
  post_count?: number;
};

export function CourseThreadsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [authorId, setAuthorId] = useState("user-123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThreads = async () => {
      if (!courseId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/threads`);
        if (!res.ok) throw new Error("No se pudieron cargar los hilos");
        const data = await res.json();
        setThreads(data);
      } catch (err: any) {
        setError(err?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [courseId]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author_id: authorId }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || "Error creando thread");
      }

      const created = await res.json();
      setThreads((prev) => [created, ...prev]);
      setTitle("");
    } catch (err: any) {
      setError(err?.message || "No se pudo crear el hilo");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Foro del curso {courseId}
      </h1>

      <form onSubmit={handleCreateThread} className="mb-6 flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="Título del hilo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="submit"
          className="px-3 py-1 border rounded"
        >
          Crear
        </button>
      </form>

      {loading && (
        <p className="text-sm text-gray-500">Cargando hilos del curso...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="space-y-2">
        {threads.map((t) => (
          <li key={t.thread_id} className="border rounded p-3">
            <Link
              to={`/threads/${t.thread_id}`}
              className="font-semibold hover:underline"
            >
              {t.title}
            </Link>
            <div className="text-xs text-gray-600">
              por {t.author_id} • {new Date(t.created_at).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Última actividad:{" "}
              {t.last_activity_at
                ? new Date(t.last_activity_at).toLocaleString()
                : "Sin actividad"}{" "}
              • {t.post_count ?? 0} posts
            </div>
          </li>
        ))}
        {threads.length === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay hilos en este curso.
          </p>
        )}
      </ul>
    </div>
  );
}

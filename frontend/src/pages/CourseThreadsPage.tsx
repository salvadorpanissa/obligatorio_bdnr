import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE } from "./config";

type Thread = {
  thread_id: string;
  title: string;
  author_id: string;
  created_at: string;
  last_activity_at: string | null;
};

export function CourseThreadsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [authorId, setAuthorId] = useState("user-123"); // en serio deberías sacarlo del auth

  useEffect(() => {
    if (!courseId) return;

    fetch(`${API_BASE}/courses/${courseId}/threads`)
      .then((res) => res.json())
      .then(setThreads)
      .catch((err) => console.error(err));
  }, [courseId]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim()) return;

    const res = await fetch(`${API_BASE}/courses/${courseId}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author_id: authorId }),
    });

    if (!res.ok) {
      console.error("Error creando thread");
      return;
    }

    const created = await res.json();
    setThreads((prev) => [created, ...prev]);
    setTitle("");
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

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE, RECOMMEND_BASE } from "./config";

export function HomePage() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [userId, setUserId] = useState("");
  const [recUserId, setRecUserId] = useState("");
  const [createCourseId, setCreateCourseId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createAuthor, setCreateAuthor] = useState("");
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [progUser, setProgUser] = useState("");
  const [progCourse, setProgCourse] = useState("");
  const [progLevel, setProgLevel] = useState("");
  const [progStatus, setProgStatus] = useState<string | null>(null);

  const goTo = (path: string) => {
    if (!path) return;
    navigate(path);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCourseId.trim() || !createTitle.trim() || !createAuthor.trim()) {
      setCreateStatus("Completá curso, título y autor.");
      return;
    }
    setCreateStatus("Creando hilo...");
    try {
      const res = await fetch(`${API_BASE}/courses/${createCourseId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: createTitle, author_id: createAuthor }),
      });
      if (!res.ok) throw new Error("Error creando hilo");
      const created = await res.json();
      setCreateStatus(`Listo: ${created.thread_id}`);
      setCreateTitle("");
      setThreadId(created.thread_id);
    } catch (err: any) {
      setCreateStatus(err?.message || "Error desconocido");
    }
  };

  const handleProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progUser.trim() || !progCourse.trim()) {
      setProgStatus("Usuario y curso son requeridos.");
      return;
    }
    setProgStatus("Enviando...");
    try {
      const res = await fetch(`${RECOMMEND_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: progUser,
          course_id: progCourse,
          level: progLevel || null,
        }),
      });
      if (!res.ok) throw new Error("No se pudo registrar el progreso");
      setProgStatus("Progreso registrado, ya podés pedir recomendaciones.");
      setRecUserId(progUser);
    } catch (err: any) {
      setProgStatus(err?.message || "Error desconocido");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <header>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">BDNR</p>
        <h1 className="text-3xl font-bold">Panel de prueba</h1>
        <p className="text-sm text-gray-500">
          Usa estos accesos rápidos para probar Cassandra (hilos, posts) y Neo4j (progreso, recomendaciones).
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Cassandra</p>
            <h2 className="font-semibold text-lg">Hilos por curso</h2>
            <p className="text-sm text-gray-500">GET /api/courses/:course_id/threads</p>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder="course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            />
            <button
              className="px-3 py-1 border rounded"
              onClick={() => courseId && goTo(`/courses/${courseId}/threads`)}
            >
              Abrir
            </button>
          </div>
          <p className="text-xs text-gray-500">Ahí mismo podés crear nuevos hilos.</p>
        </div>

        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Cassandra</p>
            <h2 className="font-semibold text-lg">Detalle de hilo</h2>
            <p className="text-sm text-gray-500">GET /api/threads/:thread_id</p>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder="thread_id"
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
            />
            <button
              className="px-3 py-1 border rounded"
              onClick={() => threadId && goTo(`/threads/${threadId}`)}
            >
              Abrir
            </button>
          </div>
          <p className="text-xs text-gray-500">Ahí podés responder con posts.</p>
        </div>

        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Cassandra</p>
            <h2 className="font-semibold text-lg">Crear hilo</h2>
            <p className="text-sm text-gray-500">POST /api/courses/:course_id/threads</p>
          </div>
          <form className="space-y-2" onSubmit={handleCreateThread}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="border rounded px-2 py-1 w-full"
                placeholder="course_id"
                value={createCourseId}
                onChange={(e) => setCreateCourseId(e.target.value)}
              />
              <input
                className="border rounded px-2 py-1 w-full"
                placeholder="author_id"
                value={createAuthor}
                onChange={(e) => setCreateAuthor(e.target.value)}
              />
            </div>
            <input
              className="border rounded px-2 py-1 w-full"
              placeholder="Título"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded" type="submit">
                Crear
              </button>
              {createStatus && <span className="text-xs text-gray-500">{createStatus}</span>}
            </div>
          </form>
        </div>

        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Cassandra</p>
            <h2 className="font-semibold text-lg">Posts por usuario</h2>
            <p className="text-sm text-gray-500">GET /api/users/:user_id/posts</p>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder="user_id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <button
              className="px-3 py-1 border rounded"
              onClick={() => userId && goTo(`/users/${userId}/posts`)}
            >
              Abrir
            </button>
          </div>
          <p className="text-xs text-gray-500">Lista los posts que hizo esa persona.</p>
        </div>
      </section>
    </div>
  );
}

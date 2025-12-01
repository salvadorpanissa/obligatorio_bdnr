import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "./config";

type Thread = {
  thread_id: string;
  title: string;
  author_id: string;
  created_at: string;
  last_activity_at: string | null;
  post_count?: number;
  course_id?: string;
};

type Post = {
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export function CassandraDataPage() {
  const [courseId, setCourseId] = useState("");
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [limit, setLimit] = useState(15);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreadsByCourse = async (targetCourse: string, targetLimit: number) => {
    const safeLimit = Math.min(Math.max(targetLimit || 1, 1), 100);
    setLoadingThreads(true);
    setError(null);
    setPosts([]);
    setSelectedThreadId("");
    try {
      const res = await fetch(`${API_BASE}/courses/${targetCourse}/threads?limit=${safeLimit}`);
      if (!res.ok) throw new Error("No se pudieron cargar los hilos");
      const data: Thread[] = await res.json();
      const withCourse = data.map((t) => ({ ...t, course_id: targetCourse }));
      setThreads(withCourse);
    } catch (err: any) {
      setError(err?.message || "Error desconocido al cargar hilos");
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchMultipleCourses = async () => {
    const targets = courseOptions.length ? courseOptions : [courseId].filter(Boolean);
    if (!targets.length) {
      setError("No hay cursos disponibles.");
      return;
    }
    setLoadingThreads(true);
    setError(null);
    setPosts([]);
    setSelectedThreadId("");
    try {
      const results = await Promise.all(
        targets.map(async (c) => {
          const safeLimit = Math.min(Math.max(limit || 1, 1), 100);
          const res = await fetch(`${API_BASE}/courses/${c}/threads?limit=${safeLimit}`);
          if (!res.ok) throw new Error(`No se pudieron cargar hilos de ${c}`);
          const data: Thread[] = await res.json();
          return data.map((t) => ({ ...t, course_id: c }));
        })
      );
      const merged = results.flat();
      setThreads(merged);
    } catch (err: any) {
      setError(err?.message || "Error desconocido al cargar cursos");
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchPosts = async (threadId: string) => {
    setSelectedThreadId(threadId);
    setLoadingPosts(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/threads/${threadId}/posts`);
      if (!res.ok) throw new Error("No se pudieron obtener los posts del hilo");
      const data: Post[] = await res.json();
      setPosts(data);
    } catch (err: any) {
      setError(err?.message || "Error desconocido al cargar posts");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load available course IDs from the backend
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/courses`);
        if (!res.ok) throw new Error("No se pudieron obtener los cursos");
        const data: string[] = await res.json();
        setCourseOptions(data);
        if (!courseId && data.length) {
          setCourseId(data[0]);
          fetchThreadsByCourse(data[0], limit);
        }
      } catch (err: any) {
        setError(err?.message || "Error cargando cursos");
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!threads.length) return null;
    const byCreated = [...threads].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const byActivity = [...threads]
      .filter((t) => t.last_activity_at)
      .sort(
        (a, b) =>
          new Date(b.last_activity_at || 0).getTime() - new Date(a.last_activity_at || 0).getTime()
      );
    const totalPosts = threads.reduce((acc, t) => acc + (t.post_count ?? 0), 0);
    return {
      newest: byCreated[0],
      mostActive: byActivity[0],
      avgPosts: threads.length ? (totalPosts / threads.length).toFixed(1) : "0",
      totalThreads: threads.length,
    };
  }, [threads]);

  const latestThreads = useMemo(
    () =>
      [...threads]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [threads]
  );

  const activeThreads = useMemo(
    () =>
      threads
        .filter((t) => t.last_activity_at)
        .sort(
          (a, b) =>
            new Date(b.last_activity_at || 0).getTime() - new Date(a.last_activity_at || 0).getTime()
        )
        .slice(0, 5),
    [threads]
  );

  const selectedMeta = threads.find((t) => t.thread_id === selectedThreadId);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Cassandra</p>
        <h1 className="text-3xl font-bold">Datos de hilos y posts</h1>
        <p className="text-sm text-gray-500">
          Consulta hilos, posts y métricas básicas. Usa un curso puntual o carga varias colecciones
          rápidas.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border rounded p-3 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Consulta</p>
              <h2 className="font-semibold text-lg">Hilos por curso</h2>
            </div>
            <button
              className="text-xs underline text-gray-300"
              onClick={fetchMultipleCourses}
              disabled={loadingThreads || loadingCourses}
            >
              Cargar todos los cursos
            </button>
          </div>
          <form
            className="flex flex-col md:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (courseId) {
                fetchThreadsByCourse(courseId, limit);
              }
            }}
          >
            <select
              className="border rounded px-2 py-1 w-full md:w-auto flex-1 bg-transparent"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loadingCourses}
            >
              {courseOptions.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c}
                </option>
              ))}
              {courseOptions.length === 0 && (
                <option value="" className="text-black">
                  Cargando cursos...
                </option>
              )}
            </select>
            <input
              className="border rounded px-2 py-1 w-full md:w-28"
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 1)}
            />
            <button
              type="submit"
              className="px-3 py-1 border rounded"
              disabled={loadingThreads || !courseId}
            >
              {loadingThreads ? "Cargando..." : "Buscar"}
            </button>
          </form>

          <div className="text-xs text-gray-400">
            {loadingCourses
              ? "Cargando cursos..."
              : courseOptions.length
              ? `${courseOptions.length} cursos disponibles.`
              : "No se encontraron cursos aún (creá hilos para poblarlos)."}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loadingThreads && !threads.length && (
            <p className="text-sm text-gray-500">No hay hilos cargados aún.</p>
          )}
        </div>

        <div className="border rounded p-3 space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Métricas</p>
          {stats ? (
            <div className="space-y-2 text-sm">
              <div>Hilos cargados: {stats.totalThreads}</div>
              <div>Promedio de posts por hilo: {stats.avgPosts}</div>
              <div>
                Último creado:{" "}
                <span className="font-semibold">
                  {stats.newest.title} ({stats.newest.course_id || courseId})
                </span>
              </div>
              <div>
                Más activo:{" "}
                <span className="font-semibold">
                  {stats.mostActive
                    ? `${stats.mostActive.title} (${stats.mostActive.course_id || courseId})`
                    : "N/A"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Carga hilos para ver métricas.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Listados rápidos</p>
              <h3 className="font-semibold">Últimos threads creados</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {latestThreads.map((t) => (
              <li key={t.thread_id} className="border border-white/10 rounded p-2">
                <div className="flex items-center justify-between">
                  <Link to={`/threads/${t.thread_id}`} className="font-semibold hover:underline">
                    {t.title}
                  </Link>
                  <span className="text-[11px] text-gray-400">{t.course_id || courseId}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Creado: {new Date(t.created_at).toLocaleString()} • {t.post_count ?? 0} posts
                </div>
              </li>
            ))}
            {!latestThreads.length && (
              <p className="text-sm text-gray-500">Sin datos, carga un curso.</p>
            )}
          </ul>
        </div>

        <div className="border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Listados rápidos</p>
              <h3 className="font-semibold">Threads más activos</h3>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {activeThreads.map((t) => (
              <li key={t.thread_id} className="border border-white/10 rounded p-2">
                <div className="flex items-center justify-between">
                  <Link to={`/threads/${t.thread_id}`} className="font-semibold hover:underline">
                    {t.title}
                  </Link>
                  <span className="text-[11px] text-gray-400">{t.course_id || courseId}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Última actividad:{" "}
                  {t.last_activity_at
                    ? new Date(t.last_activity_at).toLocaleString()
                    : "Sin actividad"}{" "}
                  • {t.post_count ?? 0} posts
                </div>
                <button
                  className="mt-2 text-xs underline"
                  onClick={() => fetchPosts(t.thread_id)}
                  disabled={loadingPosts}
                >
                  Ver posts
                </button>
              </li>
            ))}
            {!activeThreads.length && (
              <p className="text-sm text-gray-500">Sin datos, carga un curso.</p>
            )}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Threads</p>
              <h3 className="font-semibold">Todos los hilos cargados</h3>
            </div>
            {threads.length > 0 && (
              <span className="text-xs text-gray-500">{threads.length} en total</span>
            )}
          </div>
          <ul className="space-y-2 text-sm max-h-[480px] overflow-y-auto pr-1">
            {threads.map((t) => (
              <li
                key={t.thread_id}
                className="border border-white/10 rounded p-2 hover:border-white/30 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{t.title}</div>
                  <span className="text-[11px] text-gray-400">{t.course_id || courseId}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(t.created_at).toLocaleString()} • {t.post_count ?? 0} posts • Última:{" "}
                  {t.last_activity_at ? new Date(t.last_activity_at).toLocaleString() : "—"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="text-xs underline"
                    onClick={() => fetchPosts(t.thread_id)}
                    disabled={loadingPosts}
                  >
                    Ver posts
                  </button>
                  <Link to={`/threads/${t.thread_id}`} className="text-xs underline">
                    Abrir página
                  </Link>
                </div>
              </li>
            ))}
            {!threads.length && !loadingThreads && (
              <p className="text-sm text-gray-500">No hay hilos cargados todavía.</p>
            )}
          </ul>
        </div>

        <div className="border rounded p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Posts</p>
            <h3 className="font-semibold">Hilo seleccionado</h3>
            {selectedMeta && (
              <p className="text-xs text-gray-500">
                {selectedMeta.title} • {selectedMeta.course_id || courseId}
              </p>
            )}
          </div>
          {loadingPosts && <p className="text-sm text-gray-500">Cargando posts...</p>}
          {!loadingPosts && selectedThreadId && posts.length === 0 && (
            <p className="text-sm text-gray-500">Este hilo no tiene posts.</p>
          )}
          {!selectedThreadId && <p className="text-sm text-gray-500">Elegí un hilo para ver posts.</p>}
          <ul className="space-y-2 text-sm max-h-[480px] overflow-y-auto pr-1">
            {posts.map((p) => (
              <li key={p.post_id} className="border border-white/10 rounded p-2">
                <div className="text-xs text-gray-500 mb-1">
                  {p.user_id} • {new Date(p.created_at).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap">{p.content}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

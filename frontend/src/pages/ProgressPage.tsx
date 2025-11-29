import { useState } from "react";
import { RECOMMEND_BASE } from "./config";

export function ProgressPage() {
  const [userId, setUserId] = useState("user-123");
  const [courseId, setCourseId] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !courseId.trim()) return;

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${RECOMMEND_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          level: level || null,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar el progreso");
      setStatus("Progreso guardado correctamente.");
    } catch (err: any) {
      setStatus(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Neo4j</p>
        <h1 className="text-2xl font-bold">Registrar progreso</h1>
        <p className="text-sm text-gray-500">Endpoint: POST /recommend/progress</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded px-2 py-1"
            placeholder="user_id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="course_id"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
        </div>
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="level (opcional)"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />

        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 border rounded" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
          {status && (
            <span className="text-sm text-gray-500">
              {status}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RECOMMEND_BASE } from "./config";

type Recommendation = {
  course_id: string;
  score: number | string;
};

export function RecommendPage() {
  const { userId: userParam } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(userParam ?? "");
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userParam) {
      setUserId(userParam);
      fetchRecs(userParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userParam]);

  const fetchRecs = async (targetUser: string) => {
    if (!targetUser.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${RECOMMEND_BASE}/${targetUser}`);
      if (!res.ok) throw new Error("No se pudieron obtener recomendaciones");
      const data = await res.json();
      setRecs(data);
    } catch (err: any) {
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    navigate(`/recommend/${userId}`);
    fetchRecs(userId);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Neo4j</p>
        <h1 className="text-2xl font-bold">Recomendaciones</h1>
        <p className="text-sm text-gray-500">Endpoint: GET /recommend/:user_id</p>
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

      <ul className="space-y-2">
        {recs.map((r, idx) => (
          <li key={`${r.course_id}-${idx}`} className="border rounded p-3 flex items-center justify-between">
            <div className="font-semibold">{r.course_id}</div>
            <div className="text-sm text-gray-500">score: {Number(r.score).toFixed(2)}</div>
          </li>
        ))}
        {!loading && recs.length === 0 && (
          <p className="text-sm text-gray-500">Nada por aquí todavía.</p>
        )}
      </ul>
    </div>
  );
}

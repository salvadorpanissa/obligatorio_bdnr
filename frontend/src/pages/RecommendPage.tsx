import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RECOMMEND_BASE } from "./config";

type DifficultyRec = { exercise_id: string; difficulty?: number; error_score?: number };
type SimilarRec = { exercise_id: string; similarity?: number; performance?: number };
type ErrorInterestRec = { exercise_id: string; error_weight?: number; interest_weight?: number };

type RecommendationResponse = {
  by_difficulty?: DifficultyRec[];
  by_similar_users?: SimilarRec[];
  by_errors_and_interests?: ErrorInterestRec[];
};

export function RecommendPage() {
  const { userId: userParam } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(userParam ?? "");
  const [data, setData] = useState<RecommendationResponse>({
    by_difficulty: [],
    by_similar_users: [],
    by_errors_and_interests: [],
  });
  const [legacy, setLegacy] = useState<any[]>([]);
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
      const json = await res.json();
      if (Array.isArray(json)) {
        setLegacy(json);
        setData({ by_difficulty: [], by_similar_users: [], by_errors_and_interests: [] });
      } else {
        setData(json);
        setLegacy([]);
      }
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

  const Section = ({
    title,
    subtitle,
    items,
    renderItem,
  }: {
    title: string;
    subtitle: string;
    items: any[];
    renderItem: (item: any, idx: number) => React.ReactNode;
  }) => (
    <div className="border border-white/10 rounded-lg p-4 space-y-2 bg-white/5">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{subtitle}</p>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Sin resultados para esta estrategia.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`} className="border border-white/10 rounded p-3 bg-black/20">
              {renderItem(item, idx)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-5">
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

      {legacy.length > 0 && (
        <Section
          title="Legacy /completed -> similar courses"
          subtitle="Compatibilidad"
          items={legacy}
          renderItem={(r) => (
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.course_id}</div>
              <div className="text-sm text-gray-400">score: {Number(r.score).toFixed(2)}</div>
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section
          title="Por dificultad declarada"
          subtitle="HAS_DIFFICULTY -> EVALUATES"
          items={data.by_difficulty || []}
          renderItem={(r: DifficultyRec) => (
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.exercise_id}</div>
              <div className="text-sm text-gray-400">
                error_score: {r.error_score ?? "?"} · diff: {r.difficulty ?? "?"}
              </div>
            </div>
          )}
        />

        <Section
          title="Por usuarios similares"
          subtitle="SIMILAR_TO + PERFORMED"
          items={data.by_similar_users || []}
          renderItem={(r: SimilarRec) => (
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.exercise_id}</div>
              <div className="text-sm text-gray-400">
                perf: {r.performance?.toFixed ? r.performance.toFixed(2) : r.performance ?? "?"} · sim:{" "}
                {r.similarity?.toFixed ? r.similarity.toFixed(2) : r.similarity ?? "?"}
              </div>
            </div>
          )}
        />

        <Section
          title="Por errores e intereses"
          subtitle="MAKES_ERROR + TAGGED_AS + INTERESTED_IN"
          items={data.by_errors_and_interests || []}
          renderItem={(r: ErrorInterestRec) => (
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.exercise_id}</div>
              <div className="text-sm text-gray-400">
                error: {r.error_weight ?? "?"} · interest: {r.interest_weight ?? "?"}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

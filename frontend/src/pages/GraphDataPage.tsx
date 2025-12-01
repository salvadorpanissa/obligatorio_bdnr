import { JSX, useState } from "react";
import { RECOMMEND_BASE } from "./config";
import React from "react";

type Status = { message: string; kind: "ok" | "error" };

const StatusBadge = ({ status }: { status: Status | null }) => {
  if (!status) return null;
  const color = status.kind === "ok" ? "text-green-400" : "text-red-400";
  return <span className={`text-sm ${color}`}>{status.message}</span>;
};

const numberOrUndefined = (val: string) => {
  if (val === "" || val === undefined || val === null) return undefined;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const formatCellValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean")
    return String(val);
  if (Array.isArray(val)) return val.map(formatCellValue).join(", ");
  if (typeof val === "object") {
    if ("_DateTime__date" in val && "_DateTime__time" in val) {
      const dateObj: any = (val as any)["_DateTime__date"];
      const timeObj: any = (val as any)["_DateTime__time"];
      const date = new Date(
        Date.UTC(
          dateObj._Date__year ?? dateObj.year ?? 1970,
          (dateObj._Date__month ?? dateObj.month ?? 1) - 1,
          dateObj._Date__day ?? dateObj.day ?? 1,
          timeObj._Time__hour ?? timeObj.hour ?? 0,
          timeObj._Time__minute ?? timeObj.minute ?? 0,
          timeObj._Time__second ?? timeObj.second ?? 0,
          Math.floor((timeObj._Time__nanosecond ?? timeObj.nanosecond ?? 0) / 1e6)
        )
      );
      return date.toISOString().replace("T", " ").replace("Z", " UTC");
    }
    if ("year" in val && "month" in val && "day" in val) {
      const dateObj: any = val;
      const date = new Date(
        Date.UTC(
          dateObj.year,
          (dateObj.month || 1) - 1,
          dateObj.day || 1,
          dateObj.hour || 0,
          dateObj.minute || 0,
          dateObj.second || 0,
          Math.floor((dateObj.nanosecond || 0) / 1e6)
        )
      );
      return date.toISOString().replace("T", " ").replace("Z", " UTC");
    }
    if ("low" in val && "high" in val) {
      const low = (val as any).low;
      const high = (val as any).high;
      if (typeof low === "number" && typeof high === "number") {
        return String(high * 2 ** 32 + low);
      }
    }
    return JSON.stringify(val);
  }
  return String(val);
};

async function postJson(path: string, payload: any): Promise<void> {
  const res = await fetch(`${RECOMMEND_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Error ${res.status}`);
  }
}

export function GraphDataPage() {
  const [user, setUser] = useState({
    user_id: "",
    primary_language: "",
    current_level: "",
    streak: "",
  });
  const [exercise, setExercise] = useState({
    exercise_id: "",
    type: "",
    difficulty: "",
    language: "",
  });
  const [skill, setSkill] = useState({
    skill_id: "",
    name: "",
    category: "",
    level: "",
  });
  const [interest, setInterest] = useState({
    interest_id: "",
    name: "",
    category: "",
  });
  const [errorType, setErrorType] = useState({
    error_id: "",
    description: "",
    category: "",
  });

  const [performance, setPerformance] = useState({
    user_id: "",
    exercise_id: "",
    correct_ratio: "",
    attempts: "",
  });
  const [difficulty, setDifficulty] = useState({
    user_id: "",
    skill_id: "",
    error_score: "",
  });
  const [userError, setUserError] = useState({
    user_id: "",
    error_id: "",
    frequency: "",
  });
  const [interestLink, setInterestLink] = useState({
    user_id: "",
    interest_id: "",
    weight: "",
  });
  const [tagLink, setTagLink] = useState({ exercise_id: "", interest_id: "" });
  const [similarity, setSimilarity] = useState({
    user1: "",
    user2: "",
    score: "",
    metric: "",
  });
  const [logRec, setLogRec] = useState({
    user_id: "",
    exercise_id: "",
    strategy: "",
    accepted: "",
  });

  const [statusMap, setStatusMap] = useState<Record<string, Status | null>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const submit = async (key: string, path: string, payload: any) => {
    try {
      setLoadingKey(key);
      setStatusMap((m) => ({ ...m, [key]: null }));
      await postJson(path, payload);
      setStatusMap((m) => ({
        ...m,
        [key]: { kind: "ok", message: "Guardado" },
      }));
    } catch (err: any) {
      setStatusMap((m) => ({
        ...m,
        [key]: { kind: "error", message: err?.message || "Error" },
      }));
    } finally {
      setLoadingKey(null);
    }
  };

  const card = (
    key: string,
    title: string,
    subtitle: string,
    form: JSX.Element
  ) => (
    <div className="border border-white/10 rounded-lg p-4 space-y-3 bg-white/5">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {subtitle}
        </p>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      {form}
      <StatusBadge status={statusMap[key] || null} />
    </div>
  );

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
          Motor de recomendaciones
        </p>
        <h1 className="text-2xl font-bold">Administrar datos del grafo</h1>
        <p className="text-sm text-gray-500">
          Inserciones y relaciones segun el modelo de grafos (usuarios,
          ejercicios, habilidades, intereses, errores y sus vinculos).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {card(
          "user",
          "Upsert User",
          "Nodo User",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("user", "/users", {
                user_id: user.user_id,
                primary_language: user.primary_language || undefined,
                current_level: numberOrUndefined(user.current_level),
                streak: numberOrUndefined(user.streak),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={user.user_id}
              onChange={(e) => setUser({ ...user, user_id: e.target.value })}
            />
            <input
              className="input"
              placeholder="primary_language"
              value={user.primary_language}
              onChange={(e) =>
                setUser({ ...user, primary_language: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="current_level (int)"
              value={user.current_level}
              onChange={(e) =>
                setUser({ ...user, current_level: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="streak (int)"
              value={user.streak}
              onChange={(e) => setUser({ ...user, streak: e.target.value })}
            />
            <button className="btn" disabled={loadingKey === "user"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "exercise",
          "Upsert Exercise",
          "Nodo Exercise",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("exercise", "/exercises", {
                exercise_id: exercise.exercise_id,
                type: exercise.type || undefined,
                difficulty: numberOrUndefined(exercise.difficulty),
                language: exercise.language || undefined,
              });
            }}
          >
            <input
              className="input"
              placeholder="exercise_id"
              value={exercise.exercise_id}
              onChange={(e) =>
                setExercise({ ...exercise, exercise_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="type (listening, translation...)"
              value={exercise.type}
              onChange={(e) =>
                setExercise({ ...exercise, type: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="difficulty (int)"
              value={exercise.difficulty}
              onChange={(e) =>
                setExercise({ ...exercise, difficulty: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="language"
              value={exercise.language}
              onChange={(e) =>
                setExercise({ ...exercise, language: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "exercise"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "skill",
          "Upsert Skill",
          "Nodo Skill",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("skill", "/skills", {
                skill_id: skill.skill_id,
                name: skill.name || undefined,
                category: skill.category || undefined,
                level: numberOrUndefined(skill.level),
              });
            }}
          >
            <input
              className="input"
              placeholder="skill_id"
              value={skill.skill_id}
              onChange={(e) => setSkill({ ...skill, skill_id: e.target.value })}
            />
            <input
              className="input"
              placeholder="name"
              value={skill.name}
              onChange={(e) => setSkill({ ...skill, name: e.target.value })}
            />
            <input
              className="input"
              placeholder="category"
              value={skill.category}
              onChange={(e) => setSkill({ ...skill, category: e.target.value })}
            />
            <input
              className="input"
              placeholder="level (int)"
              value={skill.level}
              onChange={(e) => setSkill({ ...skill, level: e.target.value })}
            />
            <button className="btn" disabled={loadingKey === "skill"}>
              Guardar
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {card(
          "interest",
          "Upsert Interest",
          "Nodo Interest",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("interest", "/interests", {
                interest_id: interest.interest_id,
                name: interest.name || undefined,
                category: interest.category || undefined,
              });
            }}
          >
            <input
              className="input"
              placeholder="interest_id"
              value={interest.interest_id}
              onChange={(e) =>
                setInterest({ ...interest, interest_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="name"
              value={interest.name}
              onChange={(e) =>
                setInterest({ ...interest, name: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="category"
              value={interest.category}
              onChange={(e) =>
                setInterest({ ...interest, category: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "interest"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "errorType",
          "Upsert ErrorType",
          "Nodo ErrorType",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("errorType", "/error-types", {
                error_id: errorType.error_id,
                description: errorType.description || undefined,
                category: errorType.category || undefined,
              });
            }}
          >
            <input
              className="input"
              placeholder="error_id"
              value={errorType.error_id}
              onChange={(e) =>
                setErrorType({ ...errorType, error_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="description"
              value={errorType.description}
              onChange={(e) =>
                setErrorType({ ...errorType, description: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="category"
              value={errorType.category}
              onChange={(e) =>
                setErrorType({ ...errorType, category: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "errorType"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "performance",
          "Registro PERFORMED",
          "User -> Exercise",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("performance", "/performed", {
                user_id: performance.user_id,
                exercise_id: performance.exercise_id,
                correct_ratio: Number(performance.correct_ratio),
                attempts: numberOrUndefined(performance.attempts),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={performance.user_id}
              onChange={(e) =>
                setPerformance({ ...performance, user_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="exercise_id"
              value={performance.exercise_id}
              onChange={(e) =>
                setPerformance({ ...performance, exercise_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="correct_ratio (0-1)"
              value={performance.correct_ratio}
              onChange={(e) =>
                setPerformance({
                  ...performance,
                  correct_ratio: e.target.value,
                })
              }
            />
            <input
              className="input"
              placeholder="attempts (opcional)"
              value={performance.attempts}
              onChange={(e) =>
                setPerformance({ ...performance, attempts: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "performance"}>
              Guardar
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {card(
          "difficulty",
          "HAS_DIFFICULTY",
          "User -> Skill",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("difficulty", "/difficulties", {
                user_id: difficulty.user_id,
                skill_id: difficulty.skill_id,
                error_score: Number(difficulty.error_score),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={difficulty.user_id}
              onChange={(e) =>
                setDifficulty({ ...difficulty, user_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="skill_id"
              value={difficulty.skill_id}
              onChange={(e) =>
                setDifficulty({ ...difficulty, skill_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="error_score (0-1)"
              value={difficulty.error_score}
              onChange={(e) =>
                setDifficulty({ ...difficulty, error_score: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "difficulty"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "userError",
          "MAKES_ERROR",
          "User -> ErrorType",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("userError", "/errors", {
                user_id: userError.user_id,
                error_id: userError.error_id,
                frequency: Number(userError.frequency),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={userError.user_id}
              onChange={(e) =>
                setUserError({ ...userError, user_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="error_id"
              value={userError.error_id}
              onChange={(e) =>
                setUserError({ ...userError, error_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="frequency (0-1)"
              value={userError.frequency}
              onChange={(e) =>
                setUserError({ ...userError, frequency: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "userError"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "interestLink",
          "INTERESTED_IN",
          "User -> Interest",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("interestLink", "/interested-in", {
                user_id: interestLink.user_id,
                interest_id: interestLink.interest_id,
                weight: Number(interestLink.weight),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={interestLink.user_id}
              onChange={(e) =>
                setInterestLink({ ...interestLink, user_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="interest_id"
              value={interestLink.interest_id}
              onChange={(e) =>
                setInterestLink({
                  ...interestLink,
                  interest_id: e.target.value,
                })
              }
            />
            <input
              className="input"
              placeholder="weight (0-1)"
              value={interestLink.weight}
              onChange={(e) =>
                setInterestLink({ ...interestLink, weight: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "interestLink"}>
              Guardar
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {card(
          "tagLink",
          "TAGGED_AS",
          "Exercise -> Interest",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("tagLink", "/tags", {
                exercise_id: tagLink.exercise_id,
                interest_id: tagLink.interest_id,
              });
            }}
          >
            <input
              className="input"
              placeholder="exercise_id"
              value={tagLink.exercise_id}
              onChange={(e) =>
                setTagLink({ ...tagLink, exercise_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="interest_id"
              value={tagLink.interest_id}
              onChange={(e) =>
                setTagLink({ ...tagLink, interest_id: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "tagLink"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "similarity",
          "SIMILAR_TO",
          "User -> User",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("similarity", "/similarities", [
                {
                  user1: similarity.user1,
                  user2: similarity.user2,
                  score: Number(similarity.score),
                  metric: similarity.metric || undefined,
                },
              ]);
            }}
          >
            <input
              className="input"
              placeholder="user1"
              value={similarity.user1}
              onChange={(e) =>
                setSimilarity({ ...similarity, user1: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="user2"
              value={similarity.user2}
              onChange={(e) =>
                setSimilarity({ ...similarity, user2: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="score (0-1)"
              value={similarity.score}
              onChange={(e) =>
                setSimilarity({ ...similarity, score: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="metric (ej: errors+skills)"
              value={similarity.metric}
              onChange={(e) =>
                setSimilarity({ ...similarity, metric: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "similarity"}>
              Guardar
            </button>
          </form>
        )}

        {card(
          "logRec",
          "RECOMMENDED",
          "User -> Exercise",
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit("logRec", "/log", {
                user_id: logRec.user_id,
                exercise_id: logRec.exercise_id,
                strategy: logRec.strategy,
                accepted:
                  logRec.accepted.trim() === ""
                    ? undefined
                    : ["true", "1", "yes", "si"].includes(
                        logRec.accepted.toLowerCase()
                      ),
              });
            }}
          >
            <input
              className="input"
              placeholder="user_id"
              value={logRec.user_id}
              onChange={(e) =>
                setLogRec({ ...logRec, user_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="exercise_id"
              value={logRec.exercise_id}
              onChange={(e) =>
                setLogRec({ ...logRec, exercise_id: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="strategy"
              value={logRec.strategy}
              onChange={(e) =>
                setLogRec({ ...logRec, strategy: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="accepted (true/false opcional)"
              value={logRec.accepted}
              onChange={(e) =>
                setLogRec({ ...logRec, accepted: e.target.value })
              }
            />
            <button className="btn" disabled={loadingKey === "logRec"}>
              Guardar
            </button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Lectura de datos (GET)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DataTable
            title="Usuarios"
            endpoint="/data/users"
            columns={["user_id", "primary_language", "current_level", "streak"]}
          />
          <DataTable
            title="Ejercicios"
            endpoint="/data/exercises"
            columns={["exercise_id", "type", "difficulty", "language"]}
          />
          <DataTable
            title="Skills"
            endpoint="/data/skills"
            columns={["skill_id", "name", "category", "level"]}
          />
          <DataTable
            title="Intereses"
            endpoint="/data/interests"
            columns={["interest_id", "name", "category"]}
          />
          <DataTable
            title="Tipos de error"
            endpoint="/data/error-types"
            columns={["error_id", "description", "category"]}
          />
          <DataTable
            title="Performed"
            endpoint="/data/performed"
            columns={[
              "user_id",
              "exercise_id",
              "correct_ratio",
              "attempts",
              "performed_at",
            ]}
          />
          <DataTable
            title="Dificultades"
            endpoint="/data/difficulties"
            columns={["user_id", "skill_id", "error_score", "updated_at"]}
          />
          <DataTable
            title="Errores de usuario"
            endpoint="/data/user-errors"
            columns={["user_id", "error_id", "frequency", "updated_at"]}
          />
          <DataTable
            title="Intereses de usuario"
            endpoint="/data/user-interests"
            columns={["user_id", "interest_id", "weight", "updated_at"]}
          />

          <DataTable
            title="Similitudes"
            endpoint="/data/similarities"
            columns={[
              "user_id",
              "similar_to",
              "similarity_score",
              "metric",
              "updated_at",
            ]}
          />
          <DataTable
            title="Recomendadas"
            endpoint="/data/recommended"
            columns={["user_id", "exercise_id", "strategy", "accepted", "timestamp"]}
          />
        </div>
      </div>
    </div>
  );
}
type DataTableProps = {
  title: string;
  endpoint: string;
  columns: string[];
};

function DataTable({ title, endpoint, columns }: DataTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${RECOMMEND_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-3 bg-white/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            GET {endpoint}
          </p>
          <h2 className="font-semibold text-lg">{title}</h2>
        </div>
        <button className="btn" onClick={fetchRows} disabled={loading}>
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {rows.length === 0 && !loading && (
        <p className="text-sm text-gray-500">Sin datos</p>
      )}
      {rows.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="text-left text-gray-400 font-normal pr-3 pb-1 border-b border-white/10"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  {columns.map((c) => (
                    <td
                      key={c}
                      className="pr-3 py-1 text-gray-200 whitespace-pre"
                    >
                      {formatCellValue(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { RECOMMEND_BASE } from "./config";

type ParamDef = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number";
  step?: string;
  min?: number;
  max?: number;
  defaultValue?: string;
  required?: boolean;
};

type ColumnDef = { key: string; label: string };

type PatternDef = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  params: ParamDef[];
  columns: ColumnDef[];
};

const formatCellValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "number") return Number.isInteger(val) ? String(val) : val.toFixed(3);
  if (typeof val === "string" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(formatCellValue).join(", ");
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

const PATTERNS: PatternDef[] = [
  {
    key: "difficulty",
    title: "Basada en dificultades",
    description: "Usuario → skills con error_score alto → ejercicios que las evalúan.",
    endpoint: "/patterns/by-difficulty",
    params: [
      { name: "user_id", label: "user_id", placeholder: "u123", required: true },
      { name: "threshold", label: "error_score mínimo", type: "number", step: "0.05", min: 0, max: 1, defaultValue: "0.6" },
      { name: "limit", label: "limit", type: "number", min: 1, max: 200, defaultValue: "20" },
    ],
    columns: [
      { key: "exercise_id", label: "exercise_id" },
      { key: "skill_id", label: "skill_id" },
      { key: "error_score", label: "error_score" },
      { key: "exercise_difficulty", label: "exercise_difficulty" },
    ],
  },
  {
    key: "similarUsers",
    title: "Colaborativa (usuarios similares)",
    description: "Usuarios similares → ejercicios con buen desempeño sobre skills donde el usuario falla.",
    endpoint: "/patterns/by-similar-users",
    params: [
      { name: "user_id", label: "user_id", placeholder: "u123", required: true },
      {
        name: "similarity_threshold",
        label: "similarity_score mínimo",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.8",
      },
      {
        name: "performance_threshold",
        label: "correct_ratio mínimo",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.8",
      },
      { name: "limit", label: "limit", type: "number", min: 1, max: 200, defaultValue: "20" },
    ],
    columns: [
      { key: "exercise_id", label: "exercise_id" },
      { key: "skill_id", label: "skill_id" },
      { key: "performance", label: "performance" },
      { key: "similarity", label: "similarity" },
    ],
  },
  {
    key: "errors",
    title: "Errores recurrentes",
    description: "Errores frecuentes → ejercicios etiquetados con ese error.",
    endpoint: "/patterns/by-errors",
    params: [
      { name: "user_id", label: "user_id", placeholder: "u123", required: true },
      {
        name: "frequency_threshold",
        label: "frequency mínima",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.7",
      },
      { name: "limit", label: "limit", type: "number", min: 1, max: 200, defaultValue: "20" },
    ],
    columns: [
      { key: "exercise_id", label: "exercise_id" },
      { key: "error_id", label: "error_id" },
      { key: "frequency", label: "frequency" },
    ],
  },
  {
    key: "interests",
    title: "Intereses + refuerzo",
    description: "Temas de interés del usuario combinados con skills donde necesita refuerzo.",
    endpoint: "/patterns/by-interests",
    params: [
      { name: "user_id", label: "user_id", placeholder: "u123", required: true },
      {
        name: "weight_threshold",
        label: "interés mínimo",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.5",
      },
      {
        name: "min_error_score",
        label: "error_score mínimo",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.0",
      },
      { name: "limit", label: "limit", type: "number", min: 1, max: 200, defaultValue: "20" },
    ],
    columns: [
      { key: "exercise_id", label: "exercise_id" },
      { key: "interest_id", label: "interest_id" },
      { key: "interest_weight", label: "interest_weight" },
      { key: "error_score", label: "error_score" },
    ],
  },
  {
    key: "multiHop",
    title: "Multi-salto combinado",
    description: "Dificultades → ejercicios → otros usuarios → nuevos ejercicios recomendados.",
    endpoint: "/patterns/multi-hop",
    params: [
      { name: "user_id", label: "user_id", placeholder: "u123", required: true },
      {
        name: "performance_threshold",
        label: "correct_ratio mínimo",
        type: "number",
        step: "0.05",
        min: 0,
        max: 1,
        defaultValue: "0.75",
      },
      { name: "limit", label: "limit", type: "number", min: 1, max: 200, defaultValue: "20" },
    ],
    columns: [
      { key: "exercise_id", label: "exercise_id" },
      { key: "source_user", label: "source_user" },
      { key: "related_skill", label: "related_skill" },
      { key: "avg_correct_ratio", label: "avg_correct_ratio" },
    ],
  },
];

export function GraphPatternsPage() {
  const initialParams = useMemo(
    () =>
      PATTERNS.reduce<Record<string, Record<string, string>>>((acc, p) => {
        acc[p.key] = p.params.reduce<Record<string, string>>((vals, param) => {
          vals[param.name] = param.defaultValue ?? "";
          return vals;
        }, {});
        return acc;
      }, {}),
    []
  );

  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>(initialParams);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleChange = (patternKey: string, name: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [patternKey]: { ...(prev[patternKey] || {}), [name]: value },
    }));
  };

  const runPattern = async (pattern: PatternDef) => {
    const values = formValues[pattern.key] || {};
    if (!values.user_id || !values.user_id.trim()) {
      setErrors((e) => ({ ...e, [pattern.key]: "user_id es requerido" }));
      return;
    }
    setLoadingKey(pattern.key);
    setErrors((e) => ({ ...e, [pattern.key]: null }));
    try {
      const qs = new URLSearchParams();
      pattern.params.forEach((p) => {
        const val = values[p.name];
        if (val !== undefined && val !== "") {
          qs.append(p.name, val);
        }
      });
      const res = await fetch(`${RECOMMEND_BASE}${pattern.endpoint}?${qs.toString()}`);
      if (!res.ok) throw new Error(`Error ${res.status} en ${pattern.endpoint}`);
      const data = await res.json();
      setResults((r) => ({ ...r, [pattern.key]: Array.isArray(data) ? data : [] }));
    } catch (err: any) {
      setErrors((e) => ({ ...e, [pattern.key]: err?.message || "Error desconocido" }));
      setResults((r) => ({ ...r, [pattern.key]: [] }));
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Motor de recomendaciones</p>
        <h1 className="text-2xl font-bold">Patrones de acceso (Neo4j)</h1>
        <p className="text-sm text-gray-500">
          Ejecuta las consultas de patrones descritas en el enunciado: dificultades, usuarios similares,
          errores, intereses y multi-saltos combinados.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PATTERNS.map((pattern) => (
          <div key={pattern.key} className="border border-white/10 rounded-lg p-4 space-y-3 bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">GET {pattern.endpoint}</p>
                <h2 className="font-semibold text-lg">{pattern.title}</h2>
                <p className="text-sm text-gray-500">{pattern.description}</p>
              </div>
              <button
                className="btn"
                onClick={() => runPattern(pattern)}
                disabled={loadingKey === pattern.key}
              >
                {loadingKey === pattern.key ? "Consultando..." : "Ejecutar"}
              </button>
            </div>

            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                runPattern(pattern);
              }}
            >
              {pattern.params.map((p) => (
                <label key={p.name} className="text-xs text-gray-400 flex flex-col gap-1">
                  <span>{p.label}</span>
                  <input
                    className="input"
                    type={p.type || "text"}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    placeholder={p.placeholder}
                    required={p.required}
                    value={formValues[pattern.key]?.[p.name] ?? ""}
                    onChange={(e) => handleChange(pattern.key, p.name, e.target.value)}
                  />
                </label>
              ))}
            </form>

            {errors[pattern.key] && <p className="text-sm text-red-400">{errors[pattern.key]}</p>}

            <div className="border border-white/10 rounded p-2 bg-black/20">
              {results[pattern.key]?.length ? (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {pattern.columns.map((c) => (
                          <th
                            key={c.key}
                            className="text-left text-gray-400 font-normal pr-3 pb-1 border-b border-white/10"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results[pattern.key].map((row, idx) => (
                        <tr key={idx} className="border-b border-white/5">
                          {pattern.columns.map((c) => (
                            <td key={c.key} className="pr-3 py-1 text-gray-200 whitespace-pre">
                              {formatCellValue(row[c.key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {loadingKey === pattern.key ? "Cargando..." : "Sin resultados aún. Ejecuta la consulta."}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

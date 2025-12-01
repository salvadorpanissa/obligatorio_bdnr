// Seed para 20 usuarios estilo Duolingo (solo funciones nativas, sin APOC).
// Ejecutar en Neo4j Browser como un solo script.
// ---------- Nodos base ----------
UNWIND [
  {skill_id: "past_simple", name: "Past Simple", category: "grammar", level: 2},
  {
    skill_id: "present_perfect",
    name: "Present Perfect",
    category: "grammar",
    level: 3
  },
  {
    skill_id: "future_simple",
    name: "Future Simple",
    category: "grammar",
    level: 2
  },
  {skill_id: "gender", name: "Gender", category: "grammar", level: 1},
  {
    skill_id: "plural_forms",
    name: "Plural Forms",
    category: "grammar",
    level: 1
  }
] AS s
MERGE (sk:Skill {skill_id: s.skill_id})
SET sk.name = s.name, sk.category = s.category, sk.level = s.level;

UNWIND [
  {interest_id: "travel", name: "Travel", category: "topic"},
  {interest_id: "food", name: "Food", category: "topic"},
  {interest_id: "music", name: "Music", category: "topic"},
  {interest_id: "tech", name: "Tech", category: "topic"},
  {interest_id: "sports", name: "Sports", category: "topic"}
] AS t
MERGE (it:Interest {interest_id: t.interest_id})
SET it.name = t.name, it.category = t.category;

UNWIND [
  {
    error_id: "verb_tense",
    description: "Incorrect verb tense",
    category: "grammar"
  },
  {
    error_id: "gender_agreement",
    description: "Gender agreement errors",
    category: "grammar"
  },
  {
    error_id: "spelling",
    description: "Spelling mistakes",
    category: "orthography"
  },
  {
    error_id: "word_order",
    description: "Word order mistakes",
    category: "syntax"
  }
] AS e
MERGE (er:ErrorType {error_id: e.error_id})
SET er.description = e.description, er.category = e.category;

// ---------- Ejercicios, tags e evaluates ----------
UNWIND [
  {
    exercise_id: "ex_travel_1",
    type: "translation",
    difficulty: 3,
    language: "en",
    interest: "travel",
    skills: ["past_simple"]
  },
  {
    exercise_id: "ex_travel_2",
    type: "listening",
    difficulty: 2,
    language: "en",
    interest: "travel",
    skills: ["future_simple"]
  },
  {
    exercise_id: "ex_food_1",
    type: "multiple_choice",
    difficulty: 1,
    language: "en",
    interest: "food",
    skills: ["plural_forms"]
  },
  {
    exercise_id: "ex_food_2",
    type: "translation",
    difficulty: 2,
    language: "en",
    interest: "food",
    skills: ["present_perfect"]
  },
  {
    exercise_id: "ex_music_1",
    type: "listening",
    difficulty: 2,
    language: "en",
    interest: "music",
    skills: ["past_simple"]
  },
  {
    exercise_id: "ex_music_2",
    type: "translation",
    difficulty: 3,
    language: "en",
    interest: "music",
    skills: ["present_perfect"]
  },
  {
    exercise_id: "ex_tech_1",
    type: "multiple_choice",
    difficulty: 2,
    language: "en",
    interest: "tech",
    skills: ["future_simple"]
  },
  {
    exercise_id: "ex_sports_1",
    type: "translation",
    difficulty: 2,
    language: "en",
    interest: "sports",
    skills: ["gender"]
  }
] AS ex
MERGE (exn:Exercise {exercise_id: ex.exercise_id})
SET
  exn.type = ex.type,
  exn.difficulty = ex.difficulty,
  exn.language = ex.language,
  exn.created_at = coalesce(exn.created_at, datetime())
WITH ex, exn
MATCH (i:Interest {interest_id: ex.interest})
MERGE (exn)-[:TAGGED_AS]->(i)
WITH ex, exn
UNWIND ex.skills AS skill
MATCH (s:Skill {skill_id: skill})
MERGE (exn)-[:EVALUATES]->(s);

// ---------- Usuarios ----------
UNWIND range(1, 20) AS n
WITH n, right("000" + toString(n), 3) AS padded
MERGE (u:User {user_id: "u" + padded})
SET
  u.primary_language =
    CASE
      WHEN n % 2 = 0 THEN "es"
      ELSE "en"
    END,
  u.current_level = 1 + (n % 5),
  u.streak = 3 + (n % 15),
  u.created_at = coalesce(u.created_at, datetime());

// Intereses por usuario (dos por usuario)
UNWIND range(1, 20) AS n
WITH
  n,
  right("000" + toString(n), 3) AS padded,
  CASE n % 5
    WHEN 0 THEN "travel"
    WHEN 1 THEN "food"
    WHEN 2 THEN "music"
    WHEN 3 THEN "tech"
    ELSE "sports"
  END AS primary_interest,
  CASE n % 5
    WHEN 0 THEN "music"
    WHEN 1 THEN "sports"
    WHEN 2 THEN "travel"
    WHEN 3 THEN "food"
    ELSE "tech"
  END AS secondary_interest
MATCH (u:User {user_id: "u" + padded})
MATCH (i1:Interest {interest_id: primary_interest})
MATCH (i2:Interest {interest_id: secondary_interest})
MERGE (u)-[r1:INTERESTED_IN]->(i1)
SET r1.weight = 0.9 - (n % 3) * 0.1, r1.updated_at = datetime()
MERGE (u)-[r2:INTERESTED_IN]->(i2)
SET r2.weight = 0.6 - (n % 2) * 0.1, r2.updated_at = datetime();

// Courses y progreso (COMPLETED) para compatibilidad con cursos
UNWIND [
  {course_id: "es_basics", name: "Basics ES->EN"},
  {course_id: "en_basics", name: "Basics EN->ES"},
  {course_id: "travel_pack", name: "Travel Pack"},
  {course_id: "food_pack", name: "Food Pack"},
  {course_id: "music_pack", name: "Music Pack"}
] AS c
MERGE (co:Course {course_id: c.course_id})
SET co.name = c.name;

UNWIND range(1, 20) AS n
WITH n, right("000" + toString(n), 3) AS padded,
     CASE n % 5 WHEN 0 THEN "travel_pack" WHEN 1 THEN "food_pack" WHEN 2 THEN "music_pack" WHEN 3 THEN "es_basics" ELSE "en_basics" END AS course_id
MATCH (u:User {user_id: "u" + padded})
MATCH (c:Course {course_id: course_id})
MERGE (u)-[r:COMPLETED]->(c)
  SET r.level = 1 + (n % 3),
      r.created_at = coalesce(r.created_at, datetime());

// Dificultades (HAS_DIFFICULTY) en 3 skills por usuario
UNWIND range(1, 20) AS n
WITH
  n,
  right("000" + toString(n), 3) AS padded,
  ["past_simple", "present_perfect", "gender"] AS skills
UNWIND skills AS skillId
MATCH (u:User {user_id: "u" + padded})
MATCH (s:Skill {skill_id: skillId})
MERGE (u)-[d:HAS_DIFFICULTY]->(s)
SET
  d.error_score =
    0.45 +
    (0.03 *
      ((n +
          CASE skillId
            WHEN 'past_simple' THEN 0
            WHEN 'present_perfect' THEN 1
            ELSE 2
          END) %
        8)),
  d.updated_at = datetime();

// Errores recurrentes
UNWIND range(1, 20) AS n
WITH
  n,
  right("000" + toString(n), 3) AS padded,
  CASE n % 3
    WHEN 0 THEN "verb_tense"
    WHEN 1 THEN "gender_agreement"
    ELSE "spelling"
  END AS err
MATCH (u:User {user_id: "u" + padded})
MATCH (e:ErrorType {error_id: err})
MERGE (u)-[m:MAKES_ERROR]->(e)
SET m.frequency = 0.5 + (0.05 * (n % 5)), m.updated_at = datetime();

// PERFORMED (historial de ejercicios)
UNWIND [
  ["u001", "ex_travel_1", 0.62],
  ["u002", "ex_travel_1", 0.71],
  ["u003", "ex_music_1", 0.85],
  ["u004", "ex_food_1", 0.92],
  ["u005", "ex_food_2", 0.55],
  ["u006", "ex_tech_1", 0.73],
  ["u007", "ex_sports_1", 0.66],
  ["u008", "ex_music_2", 0.77],
  ["u009", "ex_travel_2", 0.44],
  ["u010", "ex_food_2", 0.69],
  ["u011", "ex_travel_1", 0.81],
  ["u012", "ex_music_1", 0.64],
  ["u013", "ex_food_1", 0.58],
  ["u014", "ex_music_2", 0.79],
  ["u015", "ex_travel_2", 0.88],
  ["u016", "ex_tech_1", 0.51],
  ["u017", "ex_sports_1", 0.74],
  ["u018", "ex_food_2", 0.63],
  ["u019", "ex_music_1", 0.69],
  ["u020", "ex_travel_1", 0.72]
] AS perf
WITH perf[0] AS userId, perf[1] AS exId, perf[2] AS ratio
MATCH (u:User {user_id: userId})
MATCH (e:Exercise {exercise_id: exId})
MERGE (u)-[p:PERFORMED]->(e)
SET
  p.correct_ratio = ratio,
  p.attempts = coalesce(p.attempts, 0) + 1,
  p.performed_at = datetime();

// Similitudes (SIMILAR_TO)
UNWIND [
  ["u001", "u011", 0.82, "errors+skills"],
  ["u002", "u015", 0.78, "errors+skills"],
  ["u003", "u019", 0.81, "skills"],
  ["u004", "u013", 0.76, "interests"],
  ["u005", "u018", 0.73, "errors"],
  ["u006", "u016", 0.71, "skills"],
  ["u007", "u017", 0.75, "skills"],
  ["u008", "u014", 0.77, "performance"],
  ["u009", "u020", 0.70, "errors"],
  ["u010", "u012", 0.74, "skills"]
] AS pair
WITH pair[0] AS u1, pair[1] AS u2, pair[2] AS score, pair[3] AS metric
MATCH (a:User {user_id: u1})
MATCH (b:User {user_id: u2})
MERGE (a)-[s:SIMILAR_TO]->(b)
SET s.similarity_score = score, s.metric = metric, s.updated_at = datetime();

// Recomendaciones emitidas (RECOMMENDED)
UNWIND [
  ["u001", "ex_music_1", "similar_users"],
  ["u002", "ex_travel_2", "difficulty"],
  ["u003", "ex_travel_1", "errors"],
  ["u005", "ex_music_2", "similar_users"],
  ["u008", "ex_travel_2", "interest"]
] AS rec
WITH rec[0] AS userId, rec[1] AS exId, rec[2] AS strategy
MATCH (u:User {user_id: userId})
MATCH (e:Exercise {exercise_id: exId})
MERGE (u)-[r:RECOMMENDED]->(e)
SET r.timestamp = datetime(), r.strategy = strategy;

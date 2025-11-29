import { Link, Navigate, Route, Routes } from "react-router-dom";
import { CourseThreadsPage } from "./pages/CourseThreadsPage.tsx";
import { ThreadPage } from "./pages/ThreadPage.tsx";
import { UserPostsPage } from "./pages/UserPostsPage.tsx";
import { ProgressPage } from "./pages/ProgressPage.tsx";
import { RecommendPage } from "./pages/RecommendPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-50">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="font-bold tracking-tight">
            BDNR frontend
          </Link>
          <nav className="flex gap-3 text-sm text-slate-200">
            <Link className="hover:underline" to="/recommend">
              Recomendaciones
            </Link>
            <Link className="hover:underline" to="/recommend/progress">
              Progreso
            </Link>
            <Link className="hover:underline" to="/users/demo-user/posts">
              Posts usuario
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses/:courseId/threads" element={<CourseThreadsPage />} />
          <Route path="/threads/:threadId" element={<ThreadPage />} />
          <Route path="/users/:userId/posts" element={<UserPostsPage />} />
          <Route path="/recommend/progress" element={<ProgressPage />} />
          <Route path="/recommend/:userId" element={<RecommendPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Tasks } from "@/pages/Tasks";
import { Projects } from "@/pages/Projects";
import { ProjectWorkspace } from "@/pages/ProjectWorkspace";

// Secondary pages (and the login screen) are code-split.
const Login = lazy(() => import("@/pages/Login"));
const Chats = lazy(() => import("@/pages/Chats"));
const Activity = lazy(() => import("@/pages/Activity"));
const Connectors = lazy(() => import("@/pages/Connectors"));
const Settings = lazy(() => import("@/pages/Settings"));

const Loading = () => (
  <div className="page"><div className="empty"><p>Loading…</p></div></div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="my-tasks" element={<Tasks scope="mine" />} />
        <Route path="tasks" element={<Tasks scope="all" />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectWorkspace />} />
        <Route path="chats" element={<Suspense fallback={<Loading />}><Chats /></Suspense>} />
        <Route path="activity" element={<Suspense fallback={<Loading />}><Activity /></Suspense>} />
        <Route path="connectors" element={<Suspense fallback={<Loading />}><Connectors /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

// Decides between the login screen and the app, once the session is known.
function AuthGate() {
  const authChecked = useStore((s) => s.authChecked);
  const currentUser = useStore((s) => s.currentUser);
  const checkAuth = useStore((s) => s.checkAuth);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (!authChecked) return <div className="splash">Loading…</div>;
  if (!currentUser) return <Suspense fallback={<div className="splash" />}><Login /></Suspense>;
  return <AppRoutes />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}

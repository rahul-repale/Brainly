import { Routes, Route, Navigate } from "react-router";
import { AppShell } from "@/components/layout";
import { useAuthStore } from "@/stores/useAuthStore";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import AllCardsPage from "@/pages/AllCardsPage";
import TagsPage from "@/pages/TagsPage";
import SharedLinksPage from "@/pages/SharedLinksPage";
import BoardPage from "@/pages/BoardPage";
import PublicBrainPage from "@/pages/PublicBrainPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/share/:token" element={<PublicBrainPage />} />
      <Route path="/shared/:token" element={<PublicBrainPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cards" element={<AllCardsPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/links" element={<SharedLinksPage />} />
        <Route path="/board/:cardId" element={<BoardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

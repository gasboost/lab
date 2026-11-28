import { useBootstrap } from "@gasboost/bootstrap/react";
import { useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { officeManagement, policy } from "../../shared/policy";
import { routes } from "../../shared/routes";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { OfficesPage } from "../features/offices/OfficesPage";
import { AppsScriptSignInPage } from "./AppsScriptSignInPage";
import { BootstrapPage } from "./BootstrapPage";
import { ForbiddenPage } from "./ForbiddenPage";
import { AuthGuard, BootstrapGuard, PermissionGuard } from "./Guard";

export function AuthApp({
  sessionEffects,
}: {
  sessionEffects?: import("react").ReactNode;
}) {
  return (
    <Routes>
      <Route path={routes.system.bootstrap} element={<BootstrapRoute />} />
      <Route element={<BootstrapGuard />}>
        <Route
          element={
            <AuthProvider>
              {sessionEffects}
              <SessionRoutes />
            </AuthProvider>
          }
        >
          <Route path={routes.auth.signIn} element={<AppsScriptSignInPage />} />
          <Route element={<AuthGuard />}>
            <Route path={routes.home} element={<Account />} />
            <Route element={<PermissionGuard requirement={officeManagement} />}>
              <Route path={routes.offices} element={<OfficesPage />} />
            </Route>
            <Route path={routes.system.forbidden} element={<ForbiddenPage />} />
          </Route>
          <Route path="*" element={<Navigate to={routes.home} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}

function Account() {
  const { user, signOut, isLoading } = useAuth();
  const [failed, setFailed] = useState(false);
  return (
    <main className="space-y-4 p-6">
      <h1>GAS BOOST</h1>
      <p>{user?.name}</p>
      {user && policy.can(user.data.permissions, officeManagement) && (
        <p>
          <Link className="underline underline-offset-4" to={routes.offices}>
            拠点管理
          </Link>
        </p>
      )}
      {failed && (
        <p role="alert">ログアウトできませんでした。再試行してください。</p>
      )}
      <Button
        disabled={isLoading}
        onClick={() => {
          setFailed(false);
          void signOut().catch(() => setFailed(true));
        }}
      >
        ログアウト
      </Button>
    </main>
  );
}

function BootstrapRoute() {
  const { initialized } = useBootstrap();
  const navigate = useNavigate();
  if (initialized) return <Navigate to={routes.auth.signIn} replace />;
  return (
    <BootstrapPage
      onInitialized={() => navigate(routes.auth.signIn, { replace: true })}
    />
  );
}

function SessionRoutes() {
  const { isSessionRestoreFailed } = useAuth();
  return isSessionRestoreFailed ? <AppsScriptSignInPage /> : <Outlet />;
}

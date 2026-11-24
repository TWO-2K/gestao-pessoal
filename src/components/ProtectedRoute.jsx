import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUsuarioAtual } from "@/hooks/useUsuarioAtual";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AdminRoute() {
  const { usuario, isLoading } = useUsuarioAtual();

  if (isLoading) return <LoadingScreen />;
  if (usuario?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const { usuario, isLoading: usuarioLoading } = useUsuarioAtual();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (usuarioLoading) return <LoadingScreen />;

  if (usuario?.senha_provisoria && location.pathname !== "/trocar-senha") {
    return <Navigate to="/trocar-senha" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
